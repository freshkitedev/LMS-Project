import express from "express";
import { Activation, loginUser, logoutUser, userRegistration } from "../controllers/userController";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const router = express.Router();

router.post("/registration", userRegistration);

router.post("/activateCode", Activation);

router.post("/loginUser", loginUser);

router.get("/logoutUser", isAuthenticated, logoutUser);

export default router;
