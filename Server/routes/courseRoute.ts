import express from "express";
import { editCourse, uploadCourse,getSingleCourse, getAllCourses } from "../controllers/courseController";
const courseRouter = express.Router();
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";


courseRouter.post("/create-course",CatchAsyncError(uploadCourse))

courseRouter.put("/edit-course/:id",CatchAsyncError(editCourse))

courseRouter.get("/get-course/:id",CatchAsyncError(getSingleCourse))

courseRouter.get("/get-courses/",CatchAsyncError(getAllCourses))

export default courseRouter;