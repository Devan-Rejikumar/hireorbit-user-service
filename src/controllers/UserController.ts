import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { UserService } from "../services/UserService";
import { IUserService } from "../services/IUserService";
import admin from "firebase-admin";
import jwt from "jsonwebtoken";
import path from "path";
import { HttpStatusCode,AuthStatusCode, ValidationStatusCode } from "../enums/StatusCodes";
import { error } from "console";


if (!admin.apps.length) {
  const serviceAccountPath = path.join(
    __dirname,
    "../../firebase-service-account.json"
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    projectId: "hireorbit-d4744",
  });
}

@injectable()
export class UserController {
  constructor(@inject(TYPES.IUserService) private userService: IUserService) {}

  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name, role } = req.body;
      const user = await this.userService.register(email, password, name, role);
      res.status(AuthStatusCode.REGISTRATION_SUCCESS).json({ user });
    } catch (err: any) {
      if (err.message === "Email already in use") {
        res.status(AuthStatusCode.EMAIL_ALREADY_EXISTS).json({ error: err.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if(!email || !password){
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({error:"Email and password are required"});
        return
      }
      const { user, token } = await this.userService.login(email, password);

      console.log("Generated token:", token.substring(0, 20) + "...");
      console.log("Setting cookie with token");

      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 24 * 60 * 60 * 1000,
        })
        .status(AuthStatusCode.LOGIN_SUCCESS)
        .json({ user });
    } catch (err: any) {
      console.error("Login error:", err);
      if(err.message==='Invalid credentials' || err.message==='Usder not found'){
        res.status(AuthStatusCode.INVALID_CREDENTIALS).json({error:"Invalid email or password"});
      }else if(err.message==="Account blocked"){
        res.status(AuthStatusCode.ACCOUNT_BLOCKED).json({error:err.message})
      }else {
         res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
     
    }
  }
  async generateOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ error: "Email is required" });
        return;
      }
      const result = await this.userService.generateOTP(email);
      res.status(HttpStatusCode.OK).json(result);
    } catch (err: any) {
      if(err.message==="Email alredy registered"){
        res.status(AuthStatusCode.EMAIL_ALREADY_EXISTS).json({error:err.message})
      }else{
        res.status(HttpStatusCode.BAD_REQUEST).json({error: err.message})
      }
    }
  }

  async verifyOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ error: "Email and OTP are required" });
        return;
      }
      const result = await this.userService.verifyOTP(email, parseInt(otp));
      res.status(HttpStatusCode.OK).json(result);
    } catch (err: any) {
      if(err.message === 'OTP has expired'){
        res.status(AuthStatusCode.OTP_EXPIRED).json({error:err.message});
      }else if (err.message=== 'Invalid OTP'){
        res.status(HttpStatusCode.BAD_REQUEST).json({error:err.message});
      } else{
        res.status(HttpStatusCode.BAD_REQUEST).json({error:err.message});
      }
    }
  }

  async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ error: "Email is required" });
        return;
      }
      const result = await this.userService.resendOTP(email);
      res.status(HttpStatusCode.OK).json(result);
    } catch (err: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: err.message });
    }
  }

  async getMe(req: Request, res: Response): Promise<void> {
    const user = (req as any).user;
    if (!user) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Unauthorized" });
      return;
    }
    const { id, name, email } = user;
    res.status(HttpStatusCode.OK).json({id, name, email});
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie("token", { httpOnly: true, sameSite: "lax" });
    res.status(HttpStatusCode.OK).json({message:"Logged out successsfully"});
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if(!email){
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({error:"Email is required"});
        return
      }
      await this.userService.forgotPassword(email);
      res.status(HttpStatusCode.OK).json({ message: "Password reset OTP sent successfully" });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async verifyPasswordResetOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      if(!email || !otp){
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({error:" Email and Otp are required"})
      }
      await this.userService.verifyPasswordResetOTP(email, otp);
      res.status(HttpStatusCode.OK).json({ message: "OTP verified successfully" });
    } catch (error: any) {
      if (error.message === "Invalid or expired OTP") {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, newPassword, confirmPassword } = req.body;
      if (!email || !newPassword || !confirmPassword) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ error: "All fields are required" });
        return;
      }
      if (newPassword !== confirmPassword) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json({ error: "Passwords do not match" });
        return;
      }
      await this.userService.resetPassword(email, newPassword);
      res.status(HttpStatusCode.OK).json({ message: "Password reset successful" });
    } catch (error: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
    }
  }

  async updateName(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const { name } = req.body;

      if (!name || name.trim() === "") {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ error: "Name is required" });
        return;
      }

      const updatedUser = await this.userService.updateUserName(
        userId,
        name.trim()
      );
      res.status(HttpStatusCode.OK).json({ user: updatedUser });
    } catch (error: any) {
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
    }
  }

  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const { idToken, email, name, photoURL } = req.body;
      
      if (!idToken || !email) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "ID token and email are required" 
        });
        return;
      }

      const decodedToken = await admin.auth().verifyIdToken(idToken);
      
      if (decodedToken.email !== email) {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: "Invalid token" });
        return;
      }

      let user = await this.userService.findByEmail(email);
      let isNewUser = false;

      if (!user) {
        user = await this.userService.createGoogleUser({
          email,
          fullName: name || email.split("@")[0],
          profilePicture: photoURL,
        });
        isNewUser = true;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: "jobseeker" },
        process.env.JWT_SECRET || "supersecret",
        { expiresIn: "24h" }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(isNewUser ? AuthStatusCode.REGISTRATION_SUCCESS : AuthStatusCode.LOGIN_SUCCESS)
         .json({ user, token, isNewUser });
    } catch (error: any) {
      console.error('Google auth error:', error);
      res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
    }
  }
}