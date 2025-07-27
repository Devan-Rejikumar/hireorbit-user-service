import { UserProfile, Education, Experience } from "@prisma/client";
import { IUserProfile, IEducation, IExperience } from "../types/profile";

export interface IProfileRepository {
    createProfile(userId: string, profileData: Partial<IUserProfile>): Promise<UserProfile>;
    getUserProfile(userId: string): Promise<UserProfile | null>;
    updateUserProfile(userId: string, profileData: Partial<IUserProfile>): Promise<UserProfile>;
    deleteProfile(userId: string): Promise<void>;
    getFullProfile(userId: string): Promise<UserProfile & {
        experience: Experience[];
        education: Education[];
    } | null>;

    addExperience(profileId: string, experienceData: Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>): Promise<Experience>;
    updateExperience(experienceId: string, experienceData: Partial<Omit<Experience, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>): Promise<Experience>;
    deleteExperience(experienceId: string): Promise<void>;

    addEducation(profileId: string, educationData: Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>): Promise<Education>;
    updateEducation(educationId: string, educationData: Partial<Omit<Education, 'id' | 'profileId' | 'createdAt' | 'updatedAt'>>): Promise<Education>;
    deleteEducation(educationId: string): Promise<void>;
}