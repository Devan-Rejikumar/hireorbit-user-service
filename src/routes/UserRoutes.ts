import { Router } from "express";
import container from "../config/inversify.config";
import TYPES from "../config/types";
import { UserController } from "../controllers/UserController";
import { authenticateUserJWT } from "../middleware/auth";

const router = Router();
const userController = container.get<UserController>(TYPES.UserController);

router.post("/register", (req, res) => userController.register(req, res));
router.post("/login", (req, res) => userController.login(req, res));
router.post("/generate-otp", (req, res) => userController.generateOTP(req, res));
router.post("/verify-otp", (req, res) => userController.verifyOTP(req, res));
router.post("/resend-otp", (req, res) => userController.resendOTP(req, res));
router.get("/me", authenticateUserJWT, (req, res) => userController.getMe(req, res));
router.post("/logout", (req, res) => userController.logout(req, res));

export default router;