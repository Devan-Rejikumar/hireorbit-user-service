import { Router } from "express";
import container from "../config/inversify.config";
import TYPES from "../config/types";
import { AdminController } from "../controllers/AdminController";
import { UserController } from "../controllers/UserController";

const router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);


router.post("/login", (req, res) => adminController.login(req, res));
router.get("/users",(req,res)=>adminController.getAllUsers(req,res));

export default router;