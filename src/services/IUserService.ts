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
}