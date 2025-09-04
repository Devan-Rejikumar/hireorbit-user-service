import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import TYPES from "../config/types";
import { IProfileService } from "../services/IProfileService";
import { UserProfile } from "@prisma/client";
import { error, profile } from "console";
import { HttpStatusCode, ValidationStatusCode } from "../enums/StatusCodes";
import { EducationSchema, ExperienceSchema, UpdateProfileSchema } from "../dto/schemas/profile.schema";
import { buildErrorResponse, buildSuccessResponse } from "shared-dto";
import cloudinary from "../config/cloudinary";

@injectable()
export class ProfileController {
  constructor(
    @inject(TYPES.IProfileService) private profileService: IProfileService
  ) {}

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse("User not authenticated")
        );
        return;
      }
      const validationResult = UpdateProfileSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const profileData = validationResult.data;
      const profile = await this.profileService.createProfile(userId, profileData);
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ profile }, "Profile created successfully")
      );
    } catch (error: any) {
      if (error.message === "Profile already exists") {
        res.status(HttpStatusCode.CONFLICT).json(
          buildErrorResponse(error.message)
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(error.message)
        );
      }
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
  
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse("User not authenticated")
        );
        return;
      }
  
      const profile = await this.profileService.getProfile(userId);
      
      if (!profile) {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse("Profile not found")
        );
        return;
      }
  
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ profile }, "Profile retrieved successfully")
      );
    } catch (error: any) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        buildErrorResponse(error.message)
      );
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }
      console.log(' ProfileController: updateProfile called');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Content-Type:', req.headers['content-type']);


    
    
    let formData: any = {};
    
    if (req.headers['content-type']?.includes('multipart/form-data')) {
     
      let profilePictureUrl: string | undefined;
      
      if (req.file) {
        try {
       
          const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'user-profiles',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' }
            ],
            resource_type: 'image'
          });
          profilePictureUrl = result.secure_url;
          console.log('🔍 Cloudinary upload successful:', result.secure_url);
        } catch (cloudinaryError) {
          console.error('Cloudinary upload error:', cloudinaryError);
          res.status(500).json(
            buildErrorResponse('Failed to upload image to Cloudinary', 'Image upload failed')
          );
          return;
        }
      }
      
      formData = {
        headline: req.body?.headline || undefined,
        about: req.body?.about || undefined,
        location: req.body?.location || undefined,
        phone: req.body?.phone || undefined,
        skills: req.body?.skills ? JSON.parse(req.body.skills) : undefined,
        profilePicture: profilePictureUrl
      };
    } else {
      console.log('Processing JSON data, req.body:', req.body);
      if (!req.body && req.headers['content-type']?.includes('application/json')) {
        console.log('req.body is undefined, but Content-Type is JSON. This might be a parsing issue.');
        res.status(400).json({
          error: 'Request body parsing failed. Please ensure Content-Type is set to application/json and body contains valid JSON.'
        });
        return;
      }
      
      let profilePictureUrl: string | undefined;
      
    
      console.log('profileImage type:', typeof req.body?.profileImage);
      console.log('profileImage value:', req.body?.profileImage);
      console.log('Cloudinary config check:', {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Missing',
        apiKey: process.env.CLOUDINARY_API_KEY ? 'Set' : 'Missing',
        apiSecret: process.env.CLOUDINARY_API_SECRET ? 'Set' : 'Missing'
      });
      
      if (req.body?.profileImage && typeof req.body.profileImage === 'string' && req.body.profileImage.startsWith('data:image/')) {
        try {
         
          const result = await cloudinary.uploader.upload(req.body.profileImage, {
            folder: 'user-profiles',
            transformation: [
              { width: 500, height: 500, crop: 'limit' },
              { quality: 'auto' }
            ],
            resource_type: 'image'
          });
          profilePictureUrl = result.secure_url;
          console.log('Cloudinary base64 upload successful:', result.secure_url);
        } catch (cloudinaryError) {
          console.error('Cloudinary base64 upload error:', cloudinaryError);
          res.status(500).json(
            buildErrorResponse('Failed to upload image to Cloudinary', 'Image upload failed')
          );
          return;
        }
      } else if (req.body?.profileImage && typeof req.body.profileImage === 'object' && Object.keys(req.body.profileImage).length === 0) {
        
        console.log('profileImage is an empty object - no image to upload');
        profilePictureUrl = undefined;
      } else if (req.body?.profilePicture) {
        
        profilePictureUrl = req.body.profilePicture;
      }
      
      formData = {
        headline: req.body?.headline || undefined,
        about: req.body?.about || undefined,
        location: req.body?.location || undefined,
        phone: req.body?.phone || undefined,
        skills: req.body?.skills || undefined,
        profilePicture: profilePictureUrl
      };
    }
    
          console.log(' Processed form data:', formData);
      console.log('Form data keys:', Object.keys(formData));
      console.log(' Form data values:', Object.values(formData));

       const cleanedFormData = Object.entries(formData).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);


    
     const validationResult = UpdateProfileSchema.safeParse(cleanedFormData);
          if (!validationResult.success) {
        console.log('Validation failed:', validationResult.error);
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const profileData = validationResult.data;
      console.log('About to call profileService.updateProfile with:', { userId, profileData });
      
      const updatedProfile = await this.profileService.updateProfile(userId, profileData);
      console.log('ProfileService returned:', updatedProfile);
      
      console.log(' Sending response to frontend:', { 
        success: true,
        data: { profile: updatedProfile },
        message: 'Profile updated successfully'
      });
      
      res.status(HttpStatusCode.OK).json({ 
        success: true,
        data: { profile: updatedProfile },
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      console.log('ProfileController error:', error);
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json({ error: error.message });
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json({ error: error.message });
      }
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;

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
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json({ error: "User not authenticated" });
        return;
      }

    
      const container = require("../config/inversify.config").default;
      const TYPES = require("../config/types").default;
      const userService = container.get(TYPES.IUserService);
      const userData = await userService.findById(userId);

      let fullProfile = await this.profileService.getFullProfile(userId);

    
      if (!fullProfile) {
        const emptyProfile = await this.profileService.createProfile(userId, {});
        fullProfile = await this.profileService.getFullProfile(userId);
      }

      const completionPercentage = this.calculateCompletionPercentage(fullProfile);

      res.status(HttpStatusCode.OK).json({
        profile: fullProfile,
        user: {
          id: userId,
          username: userData?.name || req.headers['x-user-email'] as string,
          email: req.headers['x-user-email'] as string,
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
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse("User not authenticated")
        );
        return;
      }

      const validationResult = ExperienceSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const experienceData = validationResult.data;
      const experience = await this.profileService.addExperience(userId, experienceData);
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ experience }, "Experience added successfully")
      );
    } catch (error: any) {
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse("Profile not found. Please create a profile first.")
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(error.message)
        );
      }
    }
  }

  async updateExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const experienceId = req.params.id;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse("User not authenticated")
        );
        return;
      }
  
      if (!experienceId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse("Experience ID is required")
        );
        return;
      }
  
 
      const validationResult = ExperienceSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const experienceData = validationResult.data;
      const updatedExperience = await this.profileService.updateExperience(
        userId,
        experienceId,
        experienceData
      );
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ experience: updatedExperience }, "Experience updated successfully")
      );
    } catch (error: any) {
      if (error.message === "Experience not found") {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse(error.message)
        );
      } else if (error.message === "Unauthorized") {
        res.status(HttpStatusCode.FORBIDDEN).json(
          buildErrorResponse("You can only update your own experience")
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(error.message)
        );
      }
    }
  }

  async deleteExperience(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
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
      const userId = req.headers['x-user-id'] as string;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse("User not authenticated")
        );
        return;
      }
  
     
      const validationResult = EducationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const educationData = validationResult.data;
      const education = await this.profileService.addEducation(userId, educationData);
      res.status(HttpStatusCode.CREATED).json(
        buildSuccessResponse({ education }, "Education added successfully")
      );
    } catch (error: any) {
      if (error.message === "Profile not found") {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse("Profile not found. Please create a profile first.")
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(error.message)
        );
      }
    }
  }

  async updateEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
      const educationId = req.params.id;
      
      if (!userId) {
        res.status(HttpStatusCode.UNAUTHORIZED).json(
          buildErrorResponse("User not authenticated")
        );
        return;
      }
  
      if (!educationId) {
        res.status(ValidationStatusCode.MISSING_REQUIRED_FIELDS).json(
          buildErrorResponse("Education ID is required")
        );
        return;
      }
  

      const validationResult = EducationSchema.safeParse(req.body);
      if (!validationResult.success) {
        res.status(ValidationStatusCode.VALIDATION_ERROR).json(
          buildErrorResponse('Validation failed', validationResult.error.message)
        );
        return;
      }
  
      const educationData = validationResult.data;
      const updatedEducation = await this.profileService.updateEducation(
        userId,
        educationId,
        educationData
      );
      res.status(HttpStatusCode.OK).json(
        buildSuccessResponse({ education: updatedEducation }, "Education updated successfully")
      );
    } catch (error: any) {
      if (error.message === "Education not found") {
        res.status(HttpStatusCode.NOT_FOUND).json(
          buildErrorResponse(error.message)
        );
      } else if (error.message === "Unauthorized") {
        res.status(HttpStatusCode.FORBIDDEN).json(
          buildErrorResponse("You can only update your own education")
        );
      } else {
        res.status(HttpStatusCode.BAD_REQUEST).json(
          buildErrorResponse(error.message)
        );
      }
    }
  }

  async deleteEducation(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.headers['x-user-id'] as string;
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