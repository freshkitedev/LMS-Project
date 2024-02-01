import { NextFunction ,Response,Request} from "express";

export const CatchAsyncError = (thefun:any) =>(req:Request,res:Response,next:NextFunction) =>{
        Promise.resolve(thefun(req,res,next).catch(next));
}