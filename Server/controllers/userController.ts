import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/userModel";
import Jwt, { Secret } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { create } from "domain";
require("dotenv").config();

//create new user
interface ICreationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

async function userRegistrationHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, email, password } = req.body;
    const isEmailExist = await userModel.findOne({ email });
    if (isEmailExist) {
      return next(new ErrorHandler("Email already exists", 400));
    }
    const user: ICreationBody = { name, email, password };
    const activationToken = createActivationToken(user);
    const activationCode = activationToken.activationCode;
    const data = { user: { name: user.name }, activationCode };
    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        template: "activation-mail.ejs",
        data,
      });
      res.status(201).json({
        success: true,
        message: `Please check your email ${user.email} to activate your account`,
        activationToken: activationToken.token,
      });
    } catch {
      return next(
        new ErrorHandler(
          "Unable to register please fill again with correct format",
          400
        )
      );
    }
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
}

const userRegistration = CatchAsyncError(userRegistrationHandler);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = Jwt.sign(
    {
      user,
      activationCode,
    },
    process.env.ACTIVATION_SECRET as Secret,
    {
      expiresIn: "5m",
    }
  );
  return { token, activationCode };
};

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

async function ActivateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { activation_token, activation_code } = req.body;
    const newUser: { user: IUser; activationCode: String } = Jwt.verify(
      activation_token,
      process.env.ACTIVATION_SECRET as Secret
    ) as { user: IUser; activationCode: String };

    if (newUser.activationCode != activation_code) {
      return next(new ErrorHandler("Invalid Activation Code", 400));
    }
    const { name, password, email } = newUser.user;
    const existUser = await userModel.findOne({ email });
    if (existUser) {
      return next(new ErrorHandler("Email is already exist", 400));
    }
    await userModel.create({
      name,
      password,
      email,
    });
    res.status(200).json({ Success: true });
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
  }
}

const Activation = CatchAsyncError(ActivateUser);
export { userRegistration, Activation };
