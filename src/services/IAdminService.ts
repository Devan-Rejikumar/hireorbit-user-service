import {  User } from "@prisma/client";
import { CompanyApprovalResponse, Company } from "../types/company";

export interface IAdminService{
    login(email:string,password:string):Promise<{admin:User;token:string}>;
    getAllUsers():Promise<User[]>;
    getPendingCompanies(): Promise<Company[]>;
  approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse>;
  rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse>;
}
