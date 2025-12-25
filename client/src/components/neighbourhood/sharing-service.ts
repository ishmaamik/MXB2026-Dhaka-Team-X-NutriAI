import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import type { 
  FoodListing, 
  CreateListingRequest, 
  UpdateListingRequest, 
  ClaimListingRequest, 
  ListingFilters, 
  SharingStats,
  ListingStatus 
} from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class SharingService {
  private async makeRequest(endpoint: string, options: RequestInit = {}, token: string) {
    const response = await fetch(`${BASE_URL}/sharing${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getListings(filters?: ListingFilters, token?: string): Promise<{ listings: FoodListing[] }> {
    if (!token) throw new Error('Authentication token required');
    
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.location) params.append('location', filters.location);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.excludeOwnListings) params.append('excludeOwnListings', 'true');
    
    const queryString = params.toString();
    return this.makeRequest(queryString ? `?${queryString}` : '', {}, token);
  }

  async getListing(id: string, token: string): Promise<{ listing: FoodListing }> {
    return this.makeRequest(`/${id}`, {}, token);
  }

  async createListing(data: CreateListingRequest, token: string): Promise<{ listing: FoodListing }> {
    return this.makeRequest('', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async updateListing(id: string, data: UpdateListingRequest, token: string): Promise<{ listing: FoodListing }> {
    return this.makeRequest(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  async deleteListing(id: string, token: string): Promise<void> {
    return this.makeRequest(`/${id}`, {
      method: 'DELETE',
    }, token);
  }

  async claimListing(id: string, data: ClaimListingRequest, token: string): Promise<any> {
    return this.makeRequest(`/${id}/claim`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  async completeListing(id: string, notes: string | undefined, token: string): Promise<any> {
    return this.makeRequest(`/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    }, token);
  }

  async getUserListings(status: ListingStatus | undefined, token: string): Promise<{ listings: FoodListing[] }> {
    const params = status ? `?status=${status}` : '';
    return this.makeRequest(`/my-listings${params}`, {}, token);
  }

  async getSharingStats(token: string): Promise<{ stats: SharingStats }> {
    return this.makeRequest('/analytics/stats', {}, token);
  }
}

const sharingService = new SharingService();

// React Query hooks
export const useListings = (filters?: ListingFilters) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['listings', filters],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.getListings(filters, token);
    },
    select: (data) => data.listings,
  });
};

export const useListing = (id: string) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['listing', id],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.getListing(id, token);
    },
    select: (data) => data.listing,
    enabled: !!id,
  });
};

export const useUserListings = (status?: ListingStatus) => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['user-listings', status],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.getUserListings(status, token);
    },
    select: (data) => data.listings,
  });
};

export const useSharingStats = () => {
  const { getToken } = useAuth();
  
  return useQuery({
    queryKey: ['sharing-stats'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.getSharingStats(token);
    },
    select: (data) => data.stats,
  });
};

export const useCreateListing = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async (data: CreateListingRequest) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.createListing(data, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      queryClient.invalidateQueries({ queryKey: ['sharing-stats'] });
    },
  });
};

export const useUpdateListing = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateListingRequest }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.updateListing(id, data, token);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
    },
  });
};

export const useDeleteListing = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.deleteListing(id, token);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      queryClient.invalidateQueries({ queryKey: ['sharing-stats'] });
    },
  });
};

export const useClaimListing = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ClaimListingRequest }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.claimListing(id, data, token);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['sharing-stats'] });
    },
  });
};

export const useCompleteListing = () => {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return sharingService.completeListing(id, notes, token);
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listings'] });
      queryClient.invalidateQueries({ queryKey: ['listing', id] });
      queryClient.invalidateQueries({ queryKey: ['user-listings'] });
      queryClient.invalidateQueries({ queryKey: ['sharing-stats'] });
    },
  });
};