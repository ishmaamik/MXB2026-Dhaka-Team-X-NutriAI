export interface CreateUserDTO {
  clerkId: string;
  email: string;
  fullName?: string;
  dietaryPreference?: string;
  location?: string;
  budgetRange?: number;
}

export interface UpdateUserProfileDTO {
  fullName?: string;
  dietaryPreference?: string;
  location?: string;
  budgetRange?: number;
  height?: number;
  weight?: number;
  weightPreference?: string;
  allergies?: string;
}

export interface UserResponse {
  id: string;
  clerkId: string;
  email: string | null;
  createdAt: Date;
  updatedAt: Date;
  profile: {
    id: string;
    fullName: string | null;
    dietaryPreference: string | null;
    location: string | null;
    budgetRange: number | null;
    height: number | null;
    weight: number | null;
    weightPreference: string | null;
    allergies: string | null;
  } | null;
}