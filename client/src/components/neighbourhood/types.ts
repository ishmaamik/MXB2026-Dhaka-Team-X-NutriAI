// Shared types for food sharing feature
export const ListingStatus = {
  AVAILABLE: 'AVAILABLE',
  CLAIMED: 'CLAIMED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
} as const;

export type ListingStatus = typeof ListingStatus[keyof typeof ListingStatus];

export interface FoodListing {
  id: string;
  inventoryItemId: string;
  listerId: string;
  title: string;
  description?: string;
  quantity: number;
  unit?: string;
  pickupLocation?: string;
  availableUntil?: string;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  inventoryItem: {
    id: string;
    customName?: string;
    quantity: number;
    unit?: string;
    expiryDate?: string;
    foodItem?: {
      id: string;
      name: string;
      category?: string;
    };
    inventory: {
      id: string;
      name: string;
    };
  };
  lister: {
    id: string;
    clerkId: string;
    profile?: {
      fullName?: string;
      location?: string;
    };
  };
  sharingLogs: SharingLog[];
}

export interface SharingLog {
  id: string;
  listingId: string;
  claimerId?: string;
  claimerName?: string;
  claimedAt?: string;
  completedAt?: string;
  notes?: string;
  quantityClaimed?: number;
  status: string;
  createdAt: string;
}

export interface CreateListingRequest {
  inventoryItemId: string;
  title: string;
  description?: string;
  quantity?: number;
  pickupLocation?: string;
  availableUntil?: Date;
}

export interface UpdateListingRequest {
  title?: string;
  description?: string;
  quantity?: number;
  pickupLocation?: string;
  availableUntil?: Date;
  status?: ListingStatus;
}

export interface ClaimListingRequest {
  claimerName?: string;
  notes?: string;
  quantityClaimed?: number;
}

export interface ListingFilters {
  status?: ListingStatus;
  location?: string;
  category?: string;
  search?: string;
  excludeOwnListings?: boolean;
}

export interface SharingStats {
  totalListings: number;
  activeListings: number;
  completedShares: number;
  totalQuantityShared: number;
  topCategories: Array<{
    category: string;
    count: number;
    quantityShared: number;
  }>;
  recentActivity: Array<{
    type: 'LISTED' | 'CLAIMED' | 'COMPLETED';
    date: string;
    count: number;
  }>;
}