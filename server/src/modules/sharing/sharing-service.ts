import prisma from '../../config/database';
import {
  CreateListingRequest,
  UpdateListingRequest,
  ClaimListingRequest,
  CompleteListingRequest,
  ListingFilters,
  SharingLogFilters,
  ListingStatus,
  SharingStats,
  FoodListingWithDetails,
  SharingLogWithDetails,
} from './sharing-types';

export class SharingService {
  /**
   * Create a new food listing
   */
  async createListing(userId: string, data: CreateListingRequest) {
    // Find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify that the inventory item exists and belongs to the user
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: data.inventoryItemId,
        inventory: {
          createdById: user.id,
        },
        isDeleted: false,
        removed: false,
      },
      include: {
        inventory: true,
        foodItem: true,
      },
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found or does not belong to user');
    }

    // Check if item is already listed
    const existingListing = await prisma.foodListing.findFirst({
      where: {
        inventoryItemId: data.inventoryItemId,
        status: ListingStatus.AVAILABLE,
        isDeleted: false,
      },
    });

    if (existingListing) {
      throw new Error('This item is already listed for sharing');
    }

    // Create the listing
    const listing = await prisma.foodListing.create({
      data: {
        inventoryItemId: data.inventoryItemId,
        listerId: user.id,
        title: data.title,
        description: data.description,
        quantity: data.quantity || inventoryItem.quantity,
        unit: inventoryItem.unit,
        pickupLocation: data.pickupLocation,
        availableUntil: data.availableUntil,
        status: ListingStatus.AVAILABLE,
      },
      include: {
        inventoryItem: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lister: {
          include: {
            profile: {
              select: {
                fullName: true,
                location: true,
              },
            },
          },
        },
        sharingLogs: true,
      },
    });

    return listing;
  }

  /**
   * Get all available food listings with filters
   */
  async getListings(filters: ListingFilters = {}, userId?: string) {
    const whereClause: any = {
      isDeleted: false,
      status: filters.status || ListingStatus.AVAILABLE,
    };

    // Exclude own listings if requested
    if (filters.excludeOwnListings && userId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });
      if (user) {
        whereClause.listerId = {
          not: user.id,
        };
      }
    }

    // Add category filter
    if (filters.category) {
      whereClause.inventoryItem = {
        foodItem: {
          category: filters.category,
        },
      };
    }

    // Add location filter (simple string contains)
    if (filters.location) {
      whereClause.pickupLocation = {
        contains: filters.location,
        mode: 'insensitive',
      };
    }

    // Add search filter (title and description)
    if (filters.search) {
      whereClause.OR = [
        {
          title: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          inventoryItem: {
            customName: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          inventoryItem: {
            foodItem: {
              name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          },
        },
      ];
    }

    const listings = await prisma.foodListing.findMany({
      where: whereClause,
      include: {
        inventoryItem: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lister: {
          include: {
            profile: {
              select: {
                fullName: true,
                location: true,
              },
            },
          },
        },
        sharingLogs: {
          where: {
            isDeleted: false,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return listings as FoodListingWithDetails[];
  }

  /**
   * Get a specific listing by ID
   */
  async getListingById(listingId: string): Promise<FoodListingWithDetails | null> {
    const listing = await prisma.foodListing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      include: {
        inventoryItem: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lister: {
          include: {
            profile: {
              select: {
                fullName: true,
                location: true,
              },
            },
          },
        },
        sharingLogs: {
          where: {
            isDeleted: false,
          },
          include: {
            claimer: {
              include: {
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return listing as FoodListingWithDetails | null;
  }

  /**
   * Update a listing (only by the lister)
   */
  async updateListing(
    listingId: string,
    userId: string,
    data: UpdateListingRequest,
  ) {
    // Find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify listing exists and belongs to user
    const listing = await prisma.foodListing.findFirst({
      where: {
        id: listingId,
        listerId: user.id,
        isDeleted: false,
      },
    });

    if (!listing) {
      throw new Error('Listing not found or does not belong to user');
    }

    // Update the listing
    const updatedListing = await prisma.foodListing.update({
      where: {
        id: listingId,
      },
      data: {
        title: data.title,
        description: data.description,
        quantity: data.quantity,
        pickupLocation: data.pickupLocation,
        availableUntil: data.availableUntil,
        status: data.status,
        updatedAt: new Date(),
      },
      include: {
        inventoryItem: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lister: {
          include: {
            profile: {
              select: {
                fullName: true,
                location: true,
              },
            },
          },
        },
        sharingLogs: true,
      },
    });

    return updatedListing;
  }

  /**
   * Delete a listing (only by the lister)
   */
  async deleteListing(listingId: string, userId: string) {
    // Find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify listing exists and belongs to user
    const listing = await prisma.foodListing.findFirst({
      where: {
        id: listingId,
        listerId: user.id,
        isDeleted: false,
      },
    });

    if (!listing) {
      throw new Error('Listing not found or does not belong to user');
    }

    // Check if listing has active claims
    const activeClaims = await prisma.sharingLog.findMany({
      where: {
        listingId,
        status: 'CLAIMED',
        isDeleted: false,
      },
    });

    if (activeClaims.length > 0) {
      throw new Error('Cannot delete listing with active claims');
    }

    // Soft delete the listing
    const deletedListing = await prisma.foodListing.update({
      where: {
        id: listingId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: ListingStatus.CANCELLED,
      },
    });

    return deletedListing;
  }

  /**
   * Claim a listing
   */
  async claimListing(
    listingId: string,
    userId: string,
    data: ClaimListingRequest,
  ) {
    // Find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify listing exists and is available
    const listing = await prisma.foodListing.findFirst({
      where: {
        id: listingId,
        status: ListingStatus.AVAILABLE,
        isDeleted: false,
      },
      include: {
        inventoryItem: true,
      },
    });

    if (!listing) {
      throw new Error('Listing not found or not available');
    }

    // Check if user is trying to claim their own listing
    if (listing.listerId === user.id) {
      throw new Error('Cannot claim your own listing');
    }

    // Check if user has already claimed this listing
    const existingClaim = await prisma.sharingLog.findFirst({
      where: {
        listingId,
        claimerId: user.id,
        status: 'CLAIMED',
        isDeleted: false,
      },
    });

    if (existingClaim) {
      throw new Error('You have already claimed this listing');
    }

    // Create sharing log
    const sharingLog = await prisma.sharingLog.create({
      data: {
        listingId,
        claimerId: user.id,
        claimerName: data.claimerName,
        claimedAt: new Date(),
        notes: data.notes,
        quantityClaimed: data.quantityClaimed || listing.quantity,
        status: 'CLAIMED',
      },
      include: {
        listing: {
          include: {
            inventoryItem: {
              include: {
                foodItem: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        claimer: {
          include: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Update listing status
    await prisma.foodListing.update({
      where: {
        id: listingId,
      },
      data: {
        status: ListingStatus.CLAIMED,
        updatedAt: new Date(),
      },
    });

    return sharingLog as SharingLogWithDetails;
  }

  /**
   * Complete a sharing (mark as completed)
   */
  async completeListing(
    listingId: string,
    userId: string,
    data: CompleteListingRequest,
  ) {
    // Find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify listing exists and belongs to user or is claimed by user
    const listing = await prisma.foodListing.findFirst({
      where: {
        id: listingId,
        isDeleted: false,
      },
      include: {
        sharingLogs: {
          where: {
            status: 'CLAIMED',
            isDeleted: false,
          },
        },
      },
    });

    if (!listing) {
      throw new Error('Listing not found');
    }

    const isLister = listing.listerId === user.id;
    const isClaimer = listing.sharingLogs.some(log => log.claimerId === user.id);

    if (!isLister && !isClaimer) {
      throw new Error('You are not authorized to complete this listing');
    }

    // Update listing status
    await prisma.foodListing.update({
      where: {
        id: listingId,
      },
      data: {
        status: ListingStatus.COMPLETED,
        updatedAt: new Date(),
      },
    });

    // Update sharing logs
    const updatedLogs = await prisma.sharingLog.updateMany({
      where: {
        listingId,
        status: 'CLAIMED',
        isDeleted: false,
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        notes: data.notes,
      },
    });

    return { listing, updatedLogsCount: updatedLogs.count };
  }

  /**
   * Get user's own listings
   */
  async getUserListings(userId: string, status?: ListingStatus) {
    // Find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    const whereClause: any = {
      listerId: user.id,
      isDeleted: false,
    };

    if (status) {
      whereClause.status = status;
    }

    const listings = await prisma.foodListing.findMany({
      where: whereClause,
      include: {
        inventoryItem: {
          include: {
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            inventory: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        lister: {
          include: {
            profile: {
              select: {
                fullName: true,
                location: true,
              },
            },
          },
        },
        sharingLogs: {
          where: {
            isDeleted: false,
          },
          include: {
            claimer: {
              include: {
                profile: {
                  select: {
                    fullName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return listings as FoodListingWithDetails[];
  }

  /**
   * Get sharing logs with filters
   */
  async getSharingLogs(filters: SharingLogFilters = {}) {
    const whereClause: any = {
      isDeleted: false,
    };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.listingId) {
      whereClause.listingId = filters.listingId;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.createdAt = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const logs = await prisma.sharingLog.findMany({
      where: whereClause,
      include: {
        listing: {
          include: {
            inventoryItem: {
              include: {
                foodItem: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        claimer: {
          include: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return logs as SharingLogWithDetails[];
  }

  /**
   * Get sharing statistics
   */
  async getSharingStats(userId?: string): Promise<SharingStats> {
    // Get total listings
    const totalListings = await prisma.foodListing.count({
      where: {
        isDeleted: false,
      },
    });

    // Get active listings
    const activeListings = await prisma.foodListing.count({
      where: {
        status: ListingStatus.AVAILABLE,
        isDeleted: false,
      },
    });

    // Get completed shares
    const completedShares = await prisma.sharingLog.count({
      where: {
        status: 'COMPLETED',
        isDeleted: false,
      },
    });

    // Get total quantity shared
    const quantityResult = await prisma.sharingLog.aggregate({
      where: {
        status: 'COMPLETED',
        isDeleted: false,
      },
      _sum: {
        quantityClaimed: true,
      },
    });

    const totalQuantityShared = quantityResult._sum.quantityClaimed || 0;

    // Get top categories - get completed listings with categories
    const completedListingsWithCategories = await prisma.foodListing.findMany({
      where: {
        status: ListingStatus.COMPLETED,
        isDeleted: false,
        inventoryItem: {
          foodItem: {
            isNot: null,
          },
        },
      },
      include: {
        inventoryItem: {
          include: {
            foodItem: {
              select: {
                category: true,
              },
            },
          },
        },
        sharingLogs: {
          where: {
            status: 'COMPLETED',
            isDeleted: false,
          },
          select: {
            quantityClaimed: true,
          },
        },
      },
    });

    // Process top categories manually
    const categoryMap = new Map<string, { count: number; quantityShared: number }>();
    
    completedListingsWithCategories.forEach(listing => {
      const category = listing.inventoryItem.foodItem?.category || 'Uncategorized';
      const quantityShared = listing.sharingLogs.reduce((sum, log) => sum + (log.quantityClaimed || 0), 0);
      
      if (categoryMap.has(category)) {
        const existing = categoryMap.get(category)!;
        categoryMap.set(category, {
          count: existing.count + 1,
          quantityShared: existing.quantityShared + quantityShared,
        });
      } else {
        categoryMap.set(category, {
          count: 1,
          quantityShared: quantityShared,
        });
      }
    });

    const topCategories = Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        count: data.count,
        quantityShared: data.quantityShared,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentListings = await prisma.foodListing.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
        isDeleted: false,
      },
    });

    const recentClaims = await prisma.sharingLog.count({
      where: {
        claimedAt: {
          gte: thirtyDaysAgo,
        },
        isDeleted: false,
      },
    });

    const recentCompletions = await prisma.sharingLog.count({
      where: {
        completedAt: {
          gte: thirtyDaysAgo,
        },
        status: 'COMPLETED',
        isDeleted: false,
      },
    });

    return {
      totalListings,
      activeListings,
      completedShares,
      totalQuantityShared: Number(totalQuantityShared),
      topCategories,
      recentActivity: [
        { type: 'LISTED', date: new Date(), count: recentListings },
        { type: 'CLAIMED', date: new Date(), count: recentClaims },
        { type: 'COMPLETED', date: new Date(), count: recentCompletions },
      ],
    };
  }
}