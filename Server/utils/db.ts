import mongoose from "mongoose"
require("dotenv").config();

const dbUrl:string = process.env.DBURL || " "
const connectDB = async() =>{
    try{
        await mongoose.connect(dbUrl).then((data:any)=>{
          console.log(`Database connected`);
    })
    }catch(error:any){
       console.log(error.message);      
       setTimeout(connectDB,5000);
    }
}

export default connectDB;