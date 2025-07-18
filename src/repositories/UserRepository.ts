import { injectable } from "inversify";
import { prisma } from '../prisma/client';
import { User, Otp } from '@prisma/client';
import { IUserRepository } from "./IUserRepository";

@injectable()
export class UserRepository implements IUserRepository {
    async findByEmail(email:string): Promise<User | null> {
        return prisma.user.findUnique({where: {email}});
    }

    async createUser(data : {email:string;password:string;name:string;role:string}): Promise<User>{
        return prisma.user.create({data});
    }
    
    async findById(id:string):Promise<User | null> {
        return prisma.user.findUnique({where:{id}});
    }

    async saveOTP(email: string, otp: number): Promise<Otp> {
        return prisma.otp.create({
            data: {
                email,
                otp
            }
        });
    }

    async findOTP(email: string): Promise<Otp | null> {
        return prisma.otp.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' }
        });
    }

    async deleteOTP(email: string): Promise<void> {
        await prisma.otp.deleteMany({
            where: { email }
        });
    }
    async getAllUsers() {
        return prisma.user.findMany({where:{role:'jobseeker'}});
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
      
}
