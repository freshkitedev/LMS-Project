import ErrorHandler from "../utils/ErrorHandler"
import { Response, Request, NextFunction } from "express";

export const ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.log("errorm:",err);
  console.log("error.ts reqestparms:",req.params.id);
  
  
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  //Mongodb id error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //Duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.KeyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  //wrong jwt
  if (err.name === "JsonWebTokenError") {
    const message = `Json web token is invalid, try again`;
    err = new ErrorHandler(message, 400);
  }

  // expired jwt
  if (err.name === "TokenExpiredError") {
    const message = `Json web token is expired, try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    Success: false,
    Message: err.message,
  });
};
