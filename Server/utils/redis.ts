import { Redis } from "ioredis";
require("dotenv").config();

const redisClient = () => {
    if (process.env.REDIS) {
        console.log("Redis connected");
        return process.env.REDIS;
    }
    throw new Error("Redis connection failed");
} 

// Create a new instance of Redis client
export const redis = new Redis(redisClient());

// Handle connection errors
redis.on("error", (error) => {
    console.error("Redis connection error:", error);
});

