import express from "express";
import { editCourse, uploadCourse,getSingleCourse, getAllCourses,getCourseByUser } from "../controllers/courseController";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const courseRouter = express.Router();
import { CatchAsyncError } from "../middleware/CatchAsyncErrors";


courseRouter.post("/create-course",CatchAsyncError(uploadCourse))

courseRouter.put("/edit-course/:id",CatchAsyncError(editCourse))

courseRouter.get("/get-course/:id",CatchAsyncError(getSingleCourse))

courseRouter.get("/get-courses/",CatchAsyncError(getAllCourses))

courseRouter.get("/get-courses-content/:id",isAuthenticated,CatchAsyncError(getCourseByUser))


export default courseRouter;