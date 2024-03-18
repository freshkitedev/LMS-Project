import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import { createCourse } from "../services/course.service";
import CourseModel from "../models/courseModel";
import { redis } from "../utils/redis";
import { isElementAccessExpression } from "typescript";
//upload course

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log("Uplaod course called");

    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const thumbnail = data.thumbnail;

      if (thumbnail) {
        await cloudinary.v2.uploader.destroy(thumbnail.public_id);

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });

        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const courseId = req.params.id;

      const course = await CourseModel.findByIdAndUpdate(
        courseId,
        { $set: data },
        { new: true }
      );

      res.status(201).json({
        success: true,
        course,
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 500));
    }
  }
);

//get single course - without purchasing

export const getSingleCourse = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const courseId = req.params.id;

    const isCacheExist = await redis.get(courseId);

    if (isCacheExist) {
      const course = JSON.parse(isCacheExist);

      res.status(200).json({
        success: true,
        course,
      });
      return;
    }

    const course = await CourseModel.findById(req.params.id).select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

      await redis.set(courseId, JSON.stringify(course));

      res.status(200).json({
        success: true,
        course,
      });
    
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};

//get All courses - without purchasing

export const getAllCourses = async (req: Request,res: Response,next: NextFunction) => {
  try {
    const isCacheExist = await redis.get("allCourses");

    if (isCacheExist) {
      const courses = JSON.parse(isCacheExist);
      res.status(200).json({
        success: true,
        courses,
      });
      return;
    } 
      const course = await CourseModel.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

      await redis.set("allCourses", JSON.stringify(course));
      res.status(200).json({
        success: true,
        course,
      });
    
  } catch (error: any) {
    return next(new ErrorHandler(error.message, 500));
  }
};
