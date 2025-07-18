import { User } from "@prisma/client";

export interface IAdminService{
    login(email:string,password:string):Promise<{admin:User;token:string}>
}
