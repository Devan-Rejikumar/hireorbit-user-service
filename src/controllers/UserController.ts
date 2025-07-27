import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { UserService } from "../services/UserService";
import { IUserService } from "../services/IUserService";

@injectable()
export class UserController {
  constructor(
    @inject(TYPES.IUserService) private userService: IUserService
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;
      const user = await this.userService.register(email, password, name, role);
      res.status(201).json({ user });
    } catch (err: any) {
      if (err.message === "Email already in use") {
        res.status(400).json({ error: err.message });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const { user, token } = await this.userService.login(email, password);
    
    console.log('Generated token:', token.substring(0, 20) + '...'); // Debug log
    console.log('Setting cookie with token'); // Debug log
    
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({ user });
  } catch (err: any) {
    console.error('Login error:', err); // Debug log
    res.status(500).json({ error: err.message });
  }
}
  async generateOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const result = await this.userService.generateOTP(email);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(400).json({ error: "Email and OTP are required" });
        return;
      }
      const result = await this.userService.verifyOTP(email, parseInt(otp));
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ error: "Email is required" });
        return;
      }
      const result = await this.userService.resendOTP(email);
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }


  async getMe(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const { id, name, email } = user;
    res.json({ id, name, email });
  }

  logout(req: Request, res: Response): void {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    res.json({ message: "Logged out successfully" });
  }

  async forgotPassword(req:Request,res:Response):Promise<void>{
    try {
      const {email} = req.body;
      await this.userService.forgotPassword(email);
      res.status(200).json({message:"Password reset OTP sent successfully"});
    } catch (error:any) {
      res.status(400).json({error:error.message});
    }
  }

  async verifyPasswordResetOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      await this.userService.verifyPasswordResetOTP(email, otp);
      res.status(200).json({ message: "OTP verified successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, newPassword, confirmPassword } = req.body;
      if (!email || !newPassword || !confirmPassword) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }
      if (newPassword !== confirmPassword) {
        res.status(400).json({ error: "Passwords do not match" });
        return;
      }
      await this.userService.resetPassword(email, newPassword);
      res.status(200).json({ message: "Password reset successful" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}