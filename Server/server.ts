import {app} from "./app"
import connectDB from "./utils/db";
require("dotenv").config();

//listen to server
app.listen(process.env.PORT,()=>{
    console.log(`server is connected with ${process.env.PORT}`);
    connectDB();
})