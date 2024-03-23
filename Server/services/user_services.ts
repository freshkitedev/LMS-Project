import { Response } from "express";
import userModel from "../models/userModel";

  // Get user by id
const getUserById = async (id:string, res:Response)=>{
    const user = await userModel.findById(id);
    res.status(200).json({
        success:true,
        user,
    })
}

export default getUserById;