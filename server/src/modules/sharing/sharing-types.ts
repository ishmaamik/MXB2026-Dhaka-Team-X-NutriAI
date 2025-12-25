// Base types (will be replaced after Prisma generation)
export enum ListingStatus {
  AVAILABLE = 'AVAILABLE',
  CLAIMED = 'CLAIMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export type FoodListing = {
  id: string;
  inventoryItemId: string;
  listerId: string;
  title: string;
  description: string | null;
  quantity: number;
  unit: string | null;
  pickupLocation: string | null;
  availableUntil: Date | null;
  status: ListingStatus;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
};

export type SharingLog = {
  id: string;
  listingId: string;
  claimerId: string | null;
  claimerName: string | null;
  claimedAt: Date | null;
  completedAt: Date | null;
  notes: string | null;
  quantityClaimed: number | null;
  status: string;
  createdAt: Date;
  isDeleted: boolean;
  deletedAt: Date | null;
};

// Extended types with relations
export type FoodListingWithDetails = FoodListing & {
  inventoryItem: {
    id: string;
    customName: string | null;
    quantity: number;
    unit: string | null;
    expiryDate: Date | null;
    foodItem: {
      id: string;
      name: string;
      category: string | null;
    } | null;
    inventory: {
      id: string;
      name: string;
    };
  };
  lister: {
    id: string;
    clerkId: string;
    profile: {
      fullName: string | null;
      location: string | null;
    } | null;
  };
  sharingLogs: SharingLog[];
};

export type SharingLogWithDetails = SharingLog & {
  listing: {
    id: string;
    title: string;
    inventoryItem: {
      customName: string | null;
      foodItem: {
        name: string;
      } | null;
    };
  };
  claimer: {
    id: string;
    clerkId: string;
    profile: {
      fullName: string | null;
    } | null;
  } | null;
};

// Request types
export type CreateListingRequest = {
  inventoryItemId: string;
  title: string;
  description?: string;
  quantity?: number;
  pickupLocation?: string;
  availableUntil?: Date;
};

export type UpdateListingRequest = {
  title?: string;
  description?: string;
  quantity?: number;
  pickupLocation?: string;
  availableUntil?: Date;
  status?: ListingStatus;
};

export type ClaimListingRequest = {
  claimerName?: string;
  notes?: string;
  quantityClaimed?: number;
};

export type CompleteListingRequest = {
  notes?: string;
};

// Filter types
export type ListingFilters = {
  status?: ListingStatus;
  location?: string;
  category?: string;
  search?: string;
  excludeOwnListings?: boolean;
};

export type SharingLogFilters = {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  listingId?: string;
  userId?: string;
};

// Analytics types
export type SharingStats = {
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
    date: Date;
    count: number;
  }>;
};