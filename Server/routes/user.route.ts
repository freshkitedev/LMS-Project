import express from "express";
import { CreationUser } from "../controllers/user.controller";
const router = express.Router();

router.post("/registration", CreationUser);

export default router;
