import express, { NextFunction,Response,Request } from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import {ErrorMiddleware} from "./middleware/error"
require("dotenv").config();
import userRouter from "./routes/userRoute"
export const app = express();

//body parser
app.use(express.json({limit:"50mb"}))
//middleware 
app.use(cookieParser())
//cors -> cors origin resource sharing
app.use(cors({origin:process.env.ORIGIN}))

app.use("/user",userRouter);

app.all("*",(req:Request,res:Response,next:NextFunction)=>{
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 400;      
    console.log("er:",err)
    next(err)
})
console.log("hello");
app.use(ErrorMiddleware)
