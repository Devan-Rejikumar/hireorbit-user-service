import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IAdminService } from "../services/IAdminService";
import { IUserService } from "../services/IUserService";
import { HttpStatusCode, AuthStatusCode, ValidationStatusCode } from "../enums/StatusCodes";

@injectable()
export class AdminController {
  constructor(
    @inject(TYPES.IAdminService) private adminService: IAdminService,
    @inject(TYPES.IUserService) private userService: IUserService
  ) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      console.log(`[AdminController] 2. Attempting login for email: ${email}`);

      if (!email || !password) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Email and password are required" 
        });
        return;
      }

      const { admin, token } = await this.adminService.login(email, password);
      console.log(`[AdminController] 3. Token generated successfully: ${token.substring(0, 20)}...`);
      
      res.cookie("admintoken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });

  
      console.log('[AdminController] 3a. Response headers prepared in user-service:', res.getHeaders());

      res.status(AuthStatusCode.LOGIN_SUCCESS).json({ admin });

    } catch (err: any) {
      if (err.message === "Invalid credentials" || err.message === "Admin not found") {
        res.status(AuthStatusCode.INVALID_CREDENTIALS).json({ error: "Invalid email or password" });
      } else if (err.message === "Account blocked") {
        res.status(AuthStatusCode.ACCOUNT_BLOCKED).json({ error: err.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: err.message });
      }
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;
      
      if (!adminId || adminRole !== 'admin') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin authentication required" });
        return;
      }

      const users = await this.adminService.getAllUsers();
      res.status(HttpStatusCode.OK).json({ users });
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: "Failed to fetch users" });
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;

      if (!adminId || adminRole !== 'admin') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin authentication required" });
        return;
      }

      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "User ID is required" 
        });
        return;
      }

      const user = await this.userService.blockUser(id);
      res.status(HttpStatusCode.OK).json({ 
        message: "User blocked successfully", 
        user 
      });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "User already blocked") {
        res.status(HttpStatusCode.CONFLICT).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
      }
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;

      if (!adminId || adminRole !== 'admin') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin authentication required" });
        return;
      }

      if (!id) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "User ID is required" 
        });
        return;
      }

      const user = await this.userService.unblockUser(id);
      res.status(HttpStatusCode.OK).json({ 
        message: "User unblocked successfully", 
        user 
      });
    } catch (error: any) {
      if (error.message === "User not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "User not blocked") {
        res.status(HttpStatusCode.CONFLICT).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
      }
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('admintoken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: 'lax',
      path: '/',
    });
    res.status(HttpStatusCode.OK).json({ message: 'Logged out successfully' });
  }

  async me(req: Request, res: Response): Promise<void> {
    const adminId = req.headers['x-user-id'] as string;
    const adminEmail = req.headers['x-user-email'] as string;
    const adminRole = req.headers['x-user-role'] as string;
    
    if (!adminId || adminRole !== 'admin') {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin not authenticated" });
      return;
    }

    const admin = {
      id: adminId,
      email: adminEmail,
      role: adminRole
    };

    res.status(HttpStatusCode.OK).json({ admin });
  }

  async getPendingCompanies(req: Request, res: Response): Promise<void> {
    try {
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;
      
      if (!adminId || adminRole !== 'admin') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin authentication required" });
        return;
      }

      const companies = await this.adminService.getPendingCompanies();
      res.status(HttpStatusCode.OK).json({ companies });
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  async approveCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id: companyId } = req.params;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;

      if (!adminId || adminRole !== 'admin') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin not authenticated" });
        return;
      }

      if (!companyId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Company ID is required" 
        });
        return;
      }

      const result = await this.adminService.approveCompany(companyId, adminId);
      res.status(HttpStatusCode.OK).json({
        message: "Company approved successfully",
        result
      });
    } catch (error: any) {
      if (error.message === "Company not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "Company already approved") {
        res.status(HttpStatusCode.CONFLICT).json({ error: error.message });
      } else if (error.message === "Company profile not completed") {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async rejectCompany(req: Request, res: Response): Promise<void> {
    try {
      const { id: companyId } = req.params;
      const { reason } = req.body;
      const adminId = req.headers['x-user-id'] as string;
      const adminRole = req.headers['x-user-role'] as string;

      if (!adminId || adminRole !== 'admin') {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "Admin not authenticated" });
        return;
      }

      if (!companyId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Company ID is required" 
        });
        return;
      }

      if (!reason || !reason.trim()) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Rejection reason is required" 
        });
        return;
      }

      if (reason.trim().length < 10) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json({ 
          error: "Rejection reason must be at least 10 characters long" 
        });
        return;
      }

      const result = await this.adminService.rejectCompany(companyId, reason.trim(), adminId);
      res.status(HttpStatusCode.OK).json({
        message: "Company rejected successfully",
        result
      });
    } catch (error: any) {
      if (error.message === "Company not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "Company already processed") {
        res.status(HttpStatusCode.CONFLICT).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }
}
