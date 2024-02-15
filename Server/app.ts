import express, { NextFunction,Response,Request } from "express"
import cors from "cors"
import cookieParser from "cookie-parser";
import {ErrorMiddleware} from "./middleware/error"
require("dotenv").config();
import userRouter from "./routes/user.route"
export const app = express();

//body parser
app.use(express.json({limit:"50mb"}))
//middleware 
app.use(cookieParser())
//cors -> cors origin resource sharing
app.use(cors({origin:process.env.ORIGIN}))

app.use("/user",userRouter);
//test api
app.get("/hello",(req:Request,res:Response,next:NextFunction)=>{
    res.json({
        status:500,
        message:"Working"
    })
})

app.all("*/:id",(req:Request,res:Response,next:NextFunction)=>{
    console.log("id",req.params.id);
    
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 400;      
    console.log("er:",err)
    next(err)
})

app.use((req, res, next) => {
    console.log("Check bala");
     


})

app.use(ErrorMiddleware)
