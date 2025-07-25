import { User,Otp } from "@prisma/client";
export interface IUserRepository{
    findByEmail(email:string):Promise<User|null>;
    createUser(data:{email:string;password:string;name:string;role:string}):Promise<User>;
    findById(id:string):Promise<User|null>;
    saveOTP(email:string,otp:number):Promise<Otp>;
    findOTP(email:string):Promise<Otp|null>;
    deleteOTP(email:string):Promise<void>;
    getAllUsers():Promise<User[]>;
    blockUser(id:string):Promise<User>;
    unblockUser(id:string):Promise<User>;
}