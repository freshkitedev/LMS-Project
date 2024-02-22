import express from "express";
import { Activation, userRegistration } from "../controllers/userController";
const router = express.Router();

router.post("/registration", userRegistration);

router.post("/activateCode", Activation);

export default router;
