import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IAdminService } from "../services/IAdminService";
import { IUserService } from "../services/IUserService";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.IAdminService) private adminService: IAdminService,
    @inject(TYPES.IUserService) private userService: IUserService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { admin, token } = await this.adminService.login(email, password);
      res.cookie("admintoken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ admin });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async getAllUsers(req:Request, res:Response){
    try {
      const users = await this.adminService.getAllUsers()
      res.json(users);
     } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }

  async blockUser(req:Request, res:Response):Promise<void>{
    try {
      const {id} = req.params;
      const user = await this.userService.blockUser(id);
      res.json({message:"User blocked successfully",user})
    } catch (error: any) {
      res.status(500).json({error:error.message})
    }
  }

  async unblockUser(req:Request,res:Response):Promise<void>{
    try {
      const {id} = req.params;
      const user = await this.userService.unblockUser(id);
      res.json({message:"User unblocked successfully",user})
    } catch (error:any) {
      res.status(500).json({error:error.message})
    }
  }
  async logout(req:Request,res:Response):Promise<void>{
    res.clearCookie('admintoken',{
      httpOnly: true,
    secure: true, 
    sameSite: 'strict',
    path: '/',
    })
     res.status(200).json({ message: 'Logged out successfully' });
  }
  async me(req: Request, res: Response): Promise<void> {
    res.status(200).json({ admin: (req as any).user });
  }
}