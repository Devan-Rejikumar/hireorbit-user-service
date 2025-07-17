import { injectable } from "inversify";
import { prisma } from "../prisma/client";
import { User } from "@prisma/client";

@injectable()
export class AdminRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findFirst({ where: { email, role: 'admin' } });
  }
}