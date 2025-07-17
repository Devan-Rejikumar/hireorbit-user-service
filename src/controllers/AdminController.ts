import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { AdminService } from "../services/AdminService";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.AdminService) private adminService: AdminService
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
}