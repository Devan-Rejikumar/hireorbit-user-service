import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IUserRepository } from "../repositories/IUserRepository";
import { EmailService } from "./EmailService";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { IUserService } from "./IUserService";


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
}
