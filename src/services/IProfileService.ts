import { UserProfile, Experience, Education } from "@prisma/client";

export interface IProfileService {
  // Profile operations
  createProfile(userId: string, profileData: any): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | null>;
  updateProfile(userId: string, profileData: any): Promise<UserProfile>;
  deleteProfile(userId: string): Promise<void>;
  getFullProfile(userId: string): Promise<UserProfile & {
    experience: Experience[];
    education: Education[];
  } | null>;

  // Experience operations
  addExperience(userId: string, experienceData: any): Promise<Experience>;
  updateExperience(userId: string, experienceId: string, experienceData: any): Promise<Experience>;
  deleteExperience(userId: string, experienceId: string): Promise<void>;

  // Education operations
  addEducation(userId: string, educationData: any): Promise<Education>;
  updateEducation(userId: string, educationId: string, educationData: any): Promise<Education>;
  deleteEducation(userId: string, educationId: string): Promise<void>;
}