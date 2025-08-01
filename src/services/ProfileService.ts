import { injectable, inject } from "inversify";
import { UserProfile, Experience, Education } from "@prisma/client";
import { IProfileService } from "./IProfileService";
import { IProfileRepository } from "../repositories/IProfileRepository";
import { IUserProfile } from "../types/profile";
import TYPES from "../config/types";

@injectable()
export class ProfileService implements IProfileService {
  constructor(
    @inject(TYPES.IProfileRepository)
    private profileRepository: IProfileRepository
  ) {}

  async createProfile(
    userId: string,
    profileData: Partial<IUserProfile>
  ): Promise<UserProfile> {
    const existingProfile = await this.profileRepository.getUserProfile(userId);
    if (existingProfile) {
      throw new Error("User already has a profile");
    }

    return this.profileRepository.createProfile(userId, profileData);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.profileRepository.getUserProfile(userId);
  }

  async updateProfile(
    userId: string,
    profileData: Partial<IUserProfile>
  ): Promise<UserProfile> {
    const existingProfile = await this.profileRepository.getUserProfile(userId);
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    return this.profileRepository.updateUserProfile(userId, profileData);
  }

  async deleteProfile(userId: string): Promise<void> {
    const existingProfile = await this.profileRepository.getUserProfile(userId);
    if (!existingProfile) {
      throw new Error("Profile not found");
    }

    return this.profileRepository.deleteProfile(userId);
  }

  async getFullProfile(userId: string): Promise<
    | (UserProfile & {
        experience: Experience[];
        education: Education[];
      })
    | null
  > {
    return this.profileRepository.getFullProfile(userId);
  }

  async addExperience(
    userId: string,
    experienceData: Omit<
      Experience,
      "id" | "profileId" | "createdAt" | "updatedAt"
    >
  ): Promise<Experience> {
    const profile = await this.profileRepository.getUserProfile(userId);
    if (!profile) {
      throw new Error("User profile not found. Please create a profile first.");
    }

    return this.profileRepository.addExperience(profile.id, experienceData);
  }

  async updateExperience(
    userId: string,
    experienceId: string,
    experienceData: Partial<
      Omit<Experience, "id" | "profileId" | "createdAt" | "updatedAt">
    >
  ): Promise<Experience> {
    const profile = await this.profileRepository.getUserProfile(userId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    const fullProfile = await this.profileRepository.getFullProfile(userId);
    const experienceExists = fullProfile?.experience.some(
      (exp) => exp.id === experienceId
    );
    if (!experienceExists) {
      throw new Error("Experience not found or doesn't belong to this user");
    }

    return this.profileRepository.updateExperience(
      experienceId,
      experienceData
    );
  }

  async deleteExperience(userId: string, experienceId: string): Promise<void> {
    const profile = await this.profileRepository.getUserProfile(userId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    const fullProfile = await this.profileRepository.getFullProfile(userId);
    const experienceExists = fullProfile?.experience.some(
      (exp) => exp.id === experienceId
    );
    if (!experienceExists) {
      throw new Error("Experience not found or doesn't belong to this user");
    }

    return this.profileRepository.deleteExperience(experienceId);
  }

  async addEducation(
    userId: string,
    educationData: Omit<
      Education,
      "id" | "profileId" | "createdAt" | "updatedAt"
    >
  ): Promise<Education> {
    const profile = await this.profileRepository.getUserProfile(userId);
    if (!profile) {
      throw new Error("User profile not found. Please create a profile first.");
    }

    return this.profileRepository.addEducation(profile.id, educationData);
  }

  async updateEducation(
    userId: string,
    educationId: string,
    educationData: Partial<
      Omit<Education, "id" | "profileId" | "createdAt" | "updatedAt">
    >
  ): Promise<Education> {
    const profile = await this.profileRepository.getUserProfile(userId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    const fullProfile = await this.profileRepository.getFullProfile(userId);
    const educationExists = fullProfile?.education.some(
      (edu) => edu.id === educationId
    );
    if (!educationExists) {
      throw new Error("Education not found or doesn't belong to this user");
    }

    return this.profileRepository.updateEducation(educationId, educationData);
  }

  async deleteEducation(userId: string, educationId: string): Promise<void> {
    const profile = await this.profileRepository.getUserProfile(userId);
    if (!profile) {
      throw new Error("User profile not found");
    }

    const fullProfile = await this.profileRepository.getFullProfile(userId);
    const educationExists = fullProfile?.education.some(
      (edu) => edu.id === educationId
    );
    if (!educationExists) {
      throw new Error("Education not found or doesn't belong to this user");
    }

    return this.profileRepository.deleteEducation(educationId);
  }
}
