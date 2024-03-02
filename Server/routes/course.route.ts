import express from "express";
import { editCourse, uploadCourse } from "../controllers/course.controller";
const courseRouter = express.Router();


courseRouter.post("/create-course",uploadCourse)

courseRouter.put("/edit-course/:id",editCourse)

export default courseRouter;