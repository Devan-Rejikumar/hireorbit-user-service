import { Router } from "express";
import container from "../config/inversify.config";
import TYPES from "../config/types";
import { AdminController } from "../controllers/AdminController";
import { UserController } from "../controllers/UserController";
import { authenticateAdminJWT } from "../middleware/auth";

const router = Router();
const adminController = container.get<AdminController>(TYPES.AdminController);


router.post("/login", (req, res) => adminController.login(req, res));
router.get("/users",(req,res)=>adminController.getAllUsers(req,res));
router.patch('/users/:id/block',(req,res)=>adminController.blockUser(req,res));
router.patch('/users/:id/unblock',(req,res)=>adminController.unblockUser(req,res));
router.post('/logout',(req,res)=>adminController.logout(req,res))
router.get('/me',authenticateAdminJWT,(req,res)=>adminController.me(req,res))
export default router;