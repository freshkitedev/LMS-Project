require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    publicId: string;
    url: string;
  };
  role: string;
  isVerified: boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  SignAccessToken: ()=> String;
  SignRefreshToken: ()=> String;

}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "please enter your name"],
    },
    email: {
      type: String,
      required: [true, "please enter your email"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "please enter a valid email",
      },
      unique: true,
    },
    password: {
      type: String,
      minlength: [6, "Password must be atleast 6 character"],
      select: false,
    },
    avatar: {
      publicId: String,
      url: String,
    },
    role: {
      type: String,
      default: "User",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

//hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// sign access token
userSchema.methods.SignAccessToken = function(){
  return jwt.sign({id: this._id}, process.env.ACCESS_TOKEN  || "", {
    expiresIn:"5m",
  });
}

// sign refresh token
userSchema.methods.SignRefreshToken = function(){
  return jwt.sign({id:this._id}, process.env.REFRESH_TOKEN || "",{
    expiresIn: "3d",
  });
}

//compare password
userSchema.methods.comparePassword = async function (
  enteredpassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredpassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);
export default userModel;
