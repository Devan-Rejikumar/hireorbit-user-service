import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IUserRepository } from "../repositories/IUserRepository";
import { EmailService } from "./EmailService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { IUserService } from "./IUserService";
import { prisma } from "../prisma/client";


const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

@injectable()
export class UserService implements IUserService{
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.EmailService) private emailService: EmailService
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    role: string = "jobseeker"
  ): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already in use");
    const hashed = await bcrypt.hash(password, 10);
    return this.userRepository.createUser({ email, password: hashed, name, role });
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error("Invalid credentials");
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");
    if (user.isBlocked) throw new Error("Account is blocked");
    console.log('Signing token with secret:', JWT_SECRET.substring(0, 10) + '...');
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: "1d" }
    );
    return { user, token };
  }

  async generateOTP(email: string): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already registered");
    const otp = Math.floor(100000 + Math.random() * 900000);
    await this.userRepository.saveOTP(email, otp);
    await this.emailService.sendOTP(email, otp);
    return { message: "OTP sent successfully" };
  }

  async verifyOTP(email: string, otp: number): Promise<{ message: string }> {
    const otpRecord = await this.userRepository.findOTP(email);
    if (!otpRecord) {
      throw new Error("No OTP found for this email");
    }
    const now = new Date();
    const otpTime = new Date(otpRecord.createdAt);
    const timeDiff = now.getTime() - otpTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    if (minutesDiff > 5) {
      await this.userRepository.deleteOTP(email);
      throw new Error("OTP has expired");
    }
    if (otpRecord.otp !== otp) {
      throw new Error("Invalid OTP");
    }
    await this.userRepository.deleteOTP(email);
    return { message: "OTP verified successfully" };
  }

  async resendOTP(email: string): Promise<{ message: string }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new Error("Email already registered");
    await this.userRepository.deleteOTP(email);
    return this.generateOTP(email);
  }

  async getAllUsers(): Promise<User[]>{
    return this.userRepository.getAllUsers();
  }

  async blockUser(id: string): Promise<User> {
    const blockedUser = await this.userRepository.blockUser(id);
    return blockedUser
  }

  async unblockUser(id: string): Promise<User> {
    const unblockUser = await this.userRepository.unblockUser(id);
    return unblockUser;
  }

 async forgotPassword(email:string):Promise<{message:string}>{
  const existingUser = await this.userRepository.findByEmail(email);
  if(!existingUser) throw new Error("User not found");
  const otp = Math.floor(100000 + Math.random() * 900000);
  const role = existingUser.role;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5  await this.emailService.sendOTP(email,otp);
  return {message:"Password reset OTP sent successfully"};
 }

 async verifyPasswordResetOTP(email: string, otp: string): Promise<{ message: string }> {
  const otpRecord = await this.userRepository.findPasswordResetOTP(email, otp);
  if (!otpRecord) throw new Error("No OTP found for this email");
  const now = new Date();
  const expiresAt = new Date(otpRecord.expiresAt);
  if (now > expiresAt) {
    await this.userRepository.deletePasswordResetOTP(email,otp);
    throw new Error("OTP has expired");
  }

  if (otpRecord.otp !== otp) throw new Error("Invalid OTP");

  await this.userRepository.deletePasswordResetOTP(email,otp);
  return { message: "OTP verified successfully" };
}

async resetPassword(email: string, newPassword: string): Promise<{ message: string }> {
  const user = await this.userRepository.findByEmail(email);
  if (!user) throw new Error("User not found");
  const hashed = await bcrypt.hash(newPassword, 10);
  await this.userRepository.updateUserPassword(email, hashed);
  return { message: "Password reset successful" };
}
}
