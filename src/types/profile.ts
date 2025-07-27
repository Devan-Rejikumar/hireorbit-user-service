export interface IEducation {
    id: string;
    institutuion: string;
    degree: string;
    startDate: Date;
    endDate?: Date;
}

export interface IExperience {
  id: string;
  title: string;
  company: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  isCurrentRole: boolean;
}

export interface IUserProfile {
  id: string;
  userId: string;
  headline?: string;
  about?: string;
  profilePicture?: string;
  location?: string;
  phone?: string;
  experience: IExperience[];
  education: IEducation[];
  skills: string[];
  createdAt: Date;
  updatedAt: Date;
}