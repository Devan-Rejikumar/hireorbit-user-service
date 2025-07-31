import { User } from "@prisma/client";

export interface IUserService{
    register(email:string,
        password:string,
        name:string,
        role?:string
    ):Promise<User>;

    login(email:string,
        password:string
    ):Promise<{user:User;token:string}>;

    generateOTP(email:string):Promise<{message:string}>
    verifyOTP(email:string,otp:number):Promise<{message:string}>
    resendOTP(email:string):Promise<{message:string}>
    getAllUsers():Promise<User[]>;
    blockUser(id:string):Promise<User>;
    unblockUser(id:string):Promise<User>;
    verifyPasswordResetOTP(email: string, otp: string): Promise<{ message: string }>;
    forgotPassword(email:string):Promise<{message:string}>
    resetPassword(email: string, newPassword: string): Promise<{ message: string }>;
    updateUserName(userId: string, name: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
  createGoogleUser(userData: {
    email: string;
    fullName: string;
    profilePicture?: string;
  }): Promise<User>;
  findById(id: string): Promise<User | null>;
}