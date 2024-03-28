import express from "express";
import { Activation, UpdatePassword, UpdateProfilePicture, getUserInfo, loginUser, logoutUser, socialAuth, updateAccessToken, updateUserInfo, userRegistration } from "../controllers/userController";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const router = express.Router();

router.post("/registration", userRegistration);

router.post("/activateCode", Activation);

router.post("/loginUser", loginUser);

router.get("/logoutUser", isAuthenticated, logoutUser);

router.get("/refresh", updateAccessToken);

router.get("/getUser", isAuthenticated, getUserInfo);

router.post("/socialAuth", socialAuth);

router.put("/updateUserInfo", isAuthenticated, updateUserInfo);

router.put("/updatePassword", isAuthenticated, UpdatePassword);

router.put("/updateUserAvatar", isAuthenticated, UpdateProfilePicture);

export default router;
