import { IProfileRepository } from "./IProfileRepository";
import { UserProfile, Education, Experience } from "@prisma/client";
import { prisma } from "../prisma/client";
import { injectable } from "inversify";
import { IUserProfile, IEducation, IExperience } from "../types/profile";

@injectable()
export class ProfileRepository implements IProfileRepository {
  async createProfile(
    userId: string,
    profileData: Partial<IUserProfile>
  ): Promise<UserProfile> {
    const {
      experience,
      education,
      id,
      createdAt,
      updatedAt,
      ...cleanProfileData
    } = profileData;

    return prisma.userProfile.create({
      data: {
        userId,
        ...cleanProfileData,
      },
    });
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return prisma.userProfile.findUnique({ where: { userId } });
  }

  async updateUserProfile(
    userId: string,
    profileData: Partial<IUserProfile>
  ): Promise<UserProfile> {
    const {
      experience,
      education,
      id,
      createdAt,
      updatedAt,
      ...cleanProfileData
    } = profileData;
    return prisma.userProfile.update({
      where: { userId },
      data: {
        ...cleanProfileData,
      },
    });
  }

  async deleteProfile(userId: string): Promise<void> {
    await prisma.userProfile.delete({
      where: { userId },
    });
  }

  async getFullProfile(
    userId: string
  ): Promise<
    (UserProfile & { experience: Experience[]; education: Education[] }) | null
  > {
    return prisma.userProfile.findUnique({
      where: { userId },
      include: {
        experience: true,
        education: true,
      },
    });
  }

  async addExperience(
    profileId: string,
    experienceData: Omit<
      Experience,
      "id" | "profileId" | "createdAt" | "updatedAt"
    >
  ): Promise<Experience> {
    return prisma.experience.create({
      data: {
        profileId,
        ...experienceData,
      },
    });
  }

  async updateExperience(
    experienceId: string,
    experienceData: Partial<
      Omit<Experience, "id" | "profileId" | "createdAt" | "updatedAt">
    >
  ): Promise<Experience> {
    return prisma.experience.update({
      where: { id: experienceId },
      data: { ...experienceData },
    });
  }

  async deleteExperience(experienceId: string): Promise<void> {
    await prisma.experience.delete({
      where: { id: experienceId },
    });
  }

  async addEducation(
    profileId: string,
    educationData: Omit<
      Education,
      "id" | "profileId" | "createdAt" | "updatedAt"
    >
  ): Promise<Education> {
    return prisma.education.create({
      data: {
        profileId,
        ...educationData,
      },
    });
  }

  async updateEducation(
    educationId: string,
    educationData: Partial<
      Omit<Education, "id" | "profileId" | "createdAt" | "updatedAt">
    >
  ): Promise<Education> {
    return prisma.education.update({
      where: { id: educationId },
      data: { ...educationData },
    });
  }

  async deleteEducation(educationId: string): Promise<void> {
    await prisma.education.delete({
      where: { id: educationId },
    });
  }
}
