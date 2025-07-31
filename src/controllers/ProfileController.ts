import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IProfileService } from "../services/IProfileService";
import { UserProfile } from "@prisma/client";
import { error, profile } from "console";
import { HttpStatusCode, ValidationStatusCode } from "../enums/StatusCodes";

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.IProfileService) private profileService: IProfileService
  ) {}

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const profileData = req.body;
      if(!userId){
        res.status(HttpStatusCode.UNAUTHORIZED).json({error:"User not authenticated"})
      }
      const profile = await this.profileService.createProfile(
        userId,
        profileData
      );
      res.status(HttpStatusCode.CREATED).json({ profile });
    } catch (error: any) {
            if (error.message === "Profile already exists") {
        res.status(HttpStatusCode.CONFLICT).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }

    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      const profile = await this.profileService.getProfile(userId);
      
      if (!profile) {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: "Profile not found" });
        return;
      }

      res.status(HttpStatusCode.OK).json({ profile });
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const profileData = req.body;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      if (!profileData || Object.keys(profileData).length === 0) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json({ 
          error: "Profile data is required" 
        });
        return;
      }

      const updatedProfile = await this.profileService.updateProfile(userId, profileData);
      res.status(HttpStatusCode.OK).json({ profile: updatedProfile });
    } catch (error: any) {
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      await this.profileService.deleteProfile(userId);
      res.status(HttpStatusCode.OK).json({ message: "Profile deleted successfully" });
    } catch (error: any) {
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async getFullProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const user = (req as any).user;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      let fullProfile = await this.profileService.getFullProfile(userId);

      // If no profile exists, create an empty one
      if (!fullProfile) {
        const emptyProfile = await this.profileService.createProfile(userId, {});
        fullProfile = await this.profileService.getFullProfile(userId);
      }

      const completionPercentage = this.calculateCompletionPercentage(fullProfile);

      res.status(HttpStatusCode.OK).json({
        profile: fullProfile,
        user: {
          id: user.id,
          username: user.name,
          email: user.email,
        },
        completionPercentage,
      });
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({ error: error.message });
    }
  }

  private calculateCompletionPercentage(profile: any): number {
    let completed = 0;
    const total = 6;

    if (profile.headline) completed++;
    if (profile.about) completed++;
    if (profile.location) completed++;
    if (profile.phone) completed++;
    if (profile.experience && profile.experience.length > 0) completed++;
    if (profile.education && profile.education.length > 0) completed++;

    return Math.round((completed / total) * 100);
  }

  async addExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const experienceData = req.body;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      // Validate required fields
      if (!experienceData.title || !experienceData.company) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Title and company are required" 
        });
        return;
      }

      const experience = await this.profileService.addExperience(userId, experienceData);
      res.status(HttpStatusCode.CREATED).json({ experience });
    } catch (error: any) {
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: "Profile not found. Please create a profile first." });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async updateExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const experienceId = req.params.id;
      const experienceData = req.body;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      if (!experienceId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Experience ID is required" 
        });
        return;
      }

      const updatedExperience = await this.profileService.updateExperience(
        userId,
        experienceId,
        experienceData
      );
      res.status(HttpStatusCode.OK).json({ experience: updatedExperience });
    } catch (error: any) {
      if (error.message === "Experience not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "Unauthorized") {
        res.status(HttpStatusCode.FORBIDDEN).json({ error: "You can only update your own experience" });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async deleteExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const experienceId = req.params.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      if (!experienceId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Experience ID is required" 
        });
        return;
      }

      await this.profileService.deleteExperience(userId, experienceId);
      res.status(HttpStatusCode.OK).json({ message: "Experience deleted successfully" });
    } catch (error: any) {
      if (error.message === "Experience not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "Unauthorized") {
        res.status(HttpStatusCode.FORBIDDEN).json({ error: "You can only delete your own experience" });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async addEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const educationData = req.body;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      // Validate required fields
      if (!educationData.institutuion || !educationData.degree) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Institution and degree are required" 
        });
        return;
      }

      const education = await this.profileService.addEducation(userId, educationData);
      res.status(HttpStatusCode.CREATED).json({ education });
    } catch (error: any) {
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: "Profile not found. Please create a profile first." });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async updateEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const educationId = req.params.id;
      const educationData = req.body;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      if (!educationId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Education ID is required" 
        });
        return;
      }

      const updatedEducation = await this.profileService.updateEducation(
        userId,
        educationId,
        educationData
      );
      res.status(HttpStatusCode.OK).json({ education: updatedEducation });
    } catch (error: any) {
      if (error.message === "Education not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "Unauthorized") {
        res.status(HttpStatusCode.FORBIDDEN).json({ error: "You can only update your own education" });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async deleteEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const educationId = req.params.id;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

      if (!educationId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json({ 
          error: "Education ID is required" 
        });
        return;
      }

      await this.profileService.deleteEducation(userId, educationId);
      res.status(HttpStatusCode.OK).json({ message: "Education deleted successfully" });
    } catch (error: any) {
      if (error.message === "Education not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else if (error.message === "Unauthorized") {
        res.status(HttpStatusCode.FORBIDDEN).json({ error: "You can only delete your own education" });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }
}