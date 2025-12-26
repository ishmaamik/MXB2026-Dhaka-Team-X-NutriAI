import { useAuth } from '@clerk/clerk-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Export the interface
export interface UserProfile {
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

export interface UpdateProfileData {
  fullName?: string;
  dietaryPreference?: string;
  location?: string;
  budgetRange?: number;
  height?: number;
  weight?: number;
  weightPreference?: string;
  allergies?: string;
}

// Custom hook for authenticated API calls
export function useApi() {
  const { getToken } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();

    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API request failed');
    }

    return response.json();
  };

  return {
    // User endpoints
    getCurrentUser: () => fetchWithAuth('/users/me'),
    getProfile: () => fetchWithAuth('/users/profile'),
    updateProfile: (data: UpdateProfileData) =>
      fetchWithAuth('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    getOptimizedMealPlan: (data: { budget?: number; timePeriod?: string; preferences?: any }) =>
      fetchWithAuth('/intelligence/meal-plan', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    saveMealPlan: (plan: any) =>
      fetchWithAuth('/intelligence/meal-plans/save', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),
    getSavedMealPlans: () => fetchWithAuth('/intelligence/meal-plans/saved'),
    consumeMeal: (mealName: string, items: string[]) =>
      fetchWithAuth('/intelligence/meal-plans/consume', {
        method: 'POST',
        body: JSON.stringify({ mealName, items }),
      }),
  };
}