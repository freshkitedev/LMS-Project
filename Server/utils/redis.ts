import { Redis } from "ioredis";
require("dotenv").config();

const redisClient = () =>{
    if(process.env.REDIS){
        console.log("Connected to redis");
    }
    throw new Error("Redis Connection failed")
}
export const redis = new Redis(redisClient());