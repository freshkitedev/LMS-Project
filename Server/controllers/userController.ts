import { Request, Response, NextFunction } from "express";
import userModel, { IUser } from "../models/userModel";
import Jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import { create } from "domain";
require("dotenv").config();
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt"
import { redis } from "../utils/redis";
import getUserById from "../services/user_services";
import cloudinary from "cloudinary";

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
  console.log("activate ");
  
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

//login user
interface ILoginRequest {
  email: string;
  password: string;
}

const loginUser = CatchAsyncError(async(req:Request,res:Response,next:NextFunction)=>{
  try {
    
    const {email,password} = req.body as ILoginRequest;
    if(!email || !password){
      return next(new ErrorHandler(" Please enter email and password",400))
    };

    const user = await userModel.findOne({email}).select("+password")

    
    if(!user){
      return next(new ErrorHandler("Invalid email or password",400))
    };

    const isPasswordMatch = await user.comparePassword(password);

    if(!isPasswordMatch){
      return next(new ErrorHandler("Invalid Email or Password", 400))
    };

    sendToken(user,200,res);

  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  };

})

// logout User
const logoutUser = CatchAsyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try {
    res.cookie("access_token", "", {maxAge: 1});
    res.cookie("refresh_token", "", {maxAge: 1});

    const userId = req.user?._id || "";
    console.log("userId",req.user);
    
    redis.del(userId);

    res.status(200).json({
      success:true,
      message: "Logged out successfully"
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

  // Update Access Token
const updateAccessToken = CatchAsyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = Jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;
    const message = "could not refresh token";

    if(!decoded){
      return next(new ErrorHandler(message,400));
    }

    const session = await redis.get(decoded.id as string);
    
    if(!session){
      return next(new ErrorHandler(message, 400));
    }

    const user = JSON.parse(session);
    const accessToken = Jwt.sign({id:user._id}, process.env.ACCESS_TOKEN as string,{
      expiresIn:"5m",
    });

    const refreshToken = Jwt.sign({id:user._id},process.env.REFRESH_TOKEN as string,{
      expiresIn: "3d",
    });

    req.user = user;
    
    res.cookie("access_token" , accessToken, accessTokenOptions)
    res.cookie("refresh_token" , refreshToken, refreshTokenOptions)

    res.status(200).json({
      status:"Success",
      accessToken,
    })

  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

  // Get User info
const getUserInfo = CatchAsyncError(async(req:Request, res:Response, next:NextFunction)=>{
  
  try {
    const userId = req.user?._id;
    getUserById(userId, res);
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400))
  }
})

interface ISocialAuthBody{
  name:string;
  email:string;
  avatar:string;
}

  // Social Auth
const socialAuth = CatchAsyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try {
    const { email, name, avatar } = req.body as ISocialAuthBody;
    const user = await userModel.findOne({email});

    if(!user){
      const newUser = await userModel.create({email, name, avatar});
      sendToken(newUser,200,res);
    }
    else{
      sendToken(user,200,res);
    }

  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
  }
})

  // Update User Info
  interface IUpdateUserInfo {
    name?:string;
    email?:string;
  }

  const updateUserInfo = CatchAsyncError(
    async(req:Request, res:Response, next:NextFunction) => {
    try {
      const {name, email} = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);

      if(email && user){
        const isEmailExist = await userModel.findOne({email});
        if(isEmailExist){
          return next(new ErrorHandler("Email Already Exist", 400));
        }
        user.email = email;
      }
      if(name && user){
        user.name = name;
      }
      await user?.save();
      await redis.set(userId, JSON.stringify(user));

      res.status(201).json({
        success:true,
        user,
      })
    } catch (error:any) {
      return next(new ErrorHandler(error.message, 400))
    }
  })

  // Update User password
  interface IUpdatePassword{
    oldPassword:string;
    newPassword:string;
  }

const UpdatePassword = CatchAsyncError( async(req:Request, res:Response, next:NextFunction)=>{
  try {
    const { oldPassword , newPassword} = req.body as IUpdatePassword;
    
    if(!oldPassword && !newPassword){
      return next(new ErrorHandler("Please Enter OldPassword and NewPassword",400))
    }
    
    if(!oldPassword){
      return next(new ErrorHandler("Please Enter OldPassword",400))
    }
    if(!newPassword){
      return next(new ErrorHandler("Please Enter NewPassword",400))
    }
    const user = await userModel.findById(req.user?._id).select("+password");

    if(user?.password === undefined){
      return next(new ErrorHandler("Invalid User", 400))
    }
    const isPasswordMatch = await user?.comparePassword(oldPassword);

    if(!isPasswordMatch){
      return next(new ErrorHandler("Invalid old password", 400))
    }

    user.password = newPassword;

    await user.save();

    await redis.set(req.user?._id,JSON.stringify(user))

    res.status(201).json({
      success:true,
      user,
    })
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400))
  }
});

  // Update Profile Image
  interface IUpdateProfilePicture{
    avatar:string,
  }

const UpdateProfilePicture = CatchAsyncError(async(req:Request, res:Response, next:NextFunction)=>{
  try {
    const {avatar} = req.body;
    const userId = req.user?._id;
    const user = await userModel.findById(userId);

    
    
    if(avatar && user){
      // if User have on avatar then call this If
      if(user?.avatar?.publicId){
        console.log("user",user,avatar,user?.avatar?.publicId);
        // first delete the old Image
        await cloudinary.v2.uploader.destroy(user?.avatar?.publicId);
        // upload the New Image
        const myCloud = await cloudinary.v2.uploader.upload(avatar,{
          folder:"avatars",
          width:150,
        });
        user.avatar = {
          publicId: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }
      else{
        const myCloud = await cloudinary.v2.uploader.upload(avatar,{
          folder:"avatars",
          width:150,
        });
        user.avatar = {
          publicId: myCloud.public_id,
          url: myCloud.secure_url,
        }
      }
    }

    await user?.save();
    await redis.set(userId, JSON.stringify(user));

    res.status(200).json({
      success:true,
      user,
    })
    
  } catch (error:any) {
    return next(new ErrorHandler(error.message, 400))
  }
})


const Activation = CatchAsyncError(ActivateUser);
export { userRegistration, Activation, loginUser, logoutUser, updateAccessToken, getUserInfo, socialAuth, updateUserInfo, UpdatePassword, UpdateProfilePicture};