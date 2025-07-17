import { Router } from "express";
import container from "../config/inversify.config";
import TYPES from "../config/types";
import { AdminController } from "../controllers/AdminController";

const router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);

router.post("/login", (req, res) => adminController.login(req, res));

export default router;