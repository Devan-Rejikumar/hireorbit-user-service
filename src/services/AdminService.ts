import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IAdminRepository } from "../repositories/IAdminRepository";
import { ICompanyApiRepository } from "../repositories/CompanyApiRepository";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "@prisma/client";
import { IAdminService } from "./IAdminService";
import { IUserService } from "./IUserService";
import { Company, CompanyApprovalResponse } from "../types/company";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

@injectable()
export class AdminService implements IAdminService {
  constructor(
    @inject(TYPES.IAdminRepository) private adminRepository: IAdminRepository,
    @inject(TYPES.IUserService) private userService: IUserService,
    @inject(TYPES.ICompanyApiRepository) private companyApiRepository: ICompanyApiRepository
  ) {}

 
  async login(email: string, password: string): Promise<{ admin: User; token: string }> {
    const admin = await this.adminRepository.findByEmail(email);
    if (!admin) throw new Error("Invalid credentials");
    const valid = await bcrypt.compare(password, admin.password);
    if (!valid) throw new Error("Invalid credentials");
    const token = jwt.sign({ userId: admin.id, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: "1d" });
    return { admin, token };
  }

  async getAllUsers(): Promise<User[]> {
    return this.userService.getAllUsers();
  }


  async getPendingCompanies(): Promise<Company[]> {
    return this.companyApiRepository.getPendingCompanies();
  }

  async approveCompany(companyId: string, adminId: string): Promise<CompanyApprovalResponse> {
    return this.companyApiRepository.approveCompany(companyId, adminId);
  }

  async rejectCompany(companyId: string, reason: string, adminId: string): Promise<CompanyApprovalResponse> {
    return this.companyApiRepository.rejectCompany(companyId, reason, adminId);
  }
}
