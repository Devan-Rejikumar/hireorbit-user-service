import { injectable } from "inversify";
import { prisma } from "../prisma/client";
import { User, Otp } from "@prisma/client";
import { IUserRepository } from "./IUserRepository";

@injectable()
export class UserRepository implements IUserRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { email } });
  }

  async createUser(data: {
    email: string;
    password: string;
    name: string;
    profilePicture?: string;
    isGoogleUser?: boolean;
  }): Promise<User> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        name: data.name, 
        role: "jobseeker", 
        isVerified: data.isGoogleUser || false, 
      },
    });

   
    if (data.profilePicture) {
      await prisma.userProfile.create({
        data: {
          userId: user.id,
          profilePicture: data.profilePicture,
        },
      });
    }

    return user;
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  }

  async saveOTP(email: string, otp: number): Promise<Otp> {
    return prisma.otp.create({
      data: {
        email,
        otp,
      },
    });
  }

  async findOTP(email: string): Promise<Otp | null> {
    return prisma.otp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
    });
  }

  async deleteOTP(email: string): Promise<void> {
    await prisma.otp.deleteMany({
      where: { email },
    });
  }
  async getAllUsers() {
    return prisma.user.findMany({ where: { role: "jobseeker" } });
  }
  async blockUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isBlocked: true },
    });
  }

  async unblockUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { isBlocked: false },
    });
  }

  async savePasswordResetOTP(
    email: string,
    role: string,
    otp: string,
    expiresAt: Date
  ) {
    await prisma.passwordReset.deleteMany({ where: { email, role } });
    return prisma.passwordReset.create({
      data: { email, role, otp, expiresAt },
    });
  }

  async findPasswordResetOTP(email: string, otp: string): Promise<any> {
    return prisma.passwordReset.findFirst({
      where: { email, otp },
    });
  }

  async deletePasswordResetOTP(email: string, otp: string) {
    await prisma.passwordReset.deleteMany({ where: { email, otp } });
  }
  async updateUserPassword(
    email: string,
    hashedPassword: string
  ): Promise<void> {
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
  }

  async updateUserName(userId: string, name: string): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }
}
