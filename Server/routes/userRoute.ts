import express from "express";
import { Activation, loginUser, logoutUser, userRegistration } from "../controllers/userController";
const router = express.Router();

router.post("/registration", userRegistration);

router.post("/activateCode", Activation);

router.post("/loginUser", loginUser);

router.get("/logoutUser", logoutUser);

export default router;
