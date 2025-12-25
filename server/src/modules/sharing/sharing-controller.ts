import { Request, Response } from 'express';
import { SharingService } from './sharing-service';
import {
  CreateListingRequest,
  UpdateListingRequest,
  ClaimListingRequest,
  CompleteListingRequest,
  ListingFilters,
  SharingLogFilters,
  ListingStatus,
} from './sharing-types';

export class SharingController {
  private sharingService: SharingService;

  constructor() {
    this.sharingService = new SharingService();
  }

  // Create a new food listing
  createListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const {
        inventoryItemId,
        title,
        description,
        quantity,
        pickupLocation,
        availableUntil,
      }: CreateListingRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!inventoryItemId || !title) {
        res.status(400).json({ 
          error: 'Inventory item ID and title are required' 
        });
        return;
      }

      const listing = await this.sharingService.createListing(userId, {
        inventoryItemId,
        title,
        description,
        quantity,
        pickupLocation,
        availableUntil: availableUntil ? new Date(availableUntil) : undefined,
      });

      res.status(201).json({ listing });
    } catch (error) {
      console.error('Error creating listing:', error);
      if (
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('already listed'))
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Get all listings with optional filters
  getListings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const {
        status,
        location,
        category,
        search,
        excludeOwnListings,
      } = req.query;

      const filters: ListingFilters = {};

      if (status) {
        filters.status = status as ListingStatus;
      }
      if (location) {
        filters.location = location as string;
      }
      if (category) {
        filters.category = category as string;
      }
      if (search) {
        filters.search = search as string;
      }
      if (excludeOwnListings === 'true') {
        filters.excludeOwnListings = true;
      }

      const listings = await this.sharingService.getListings(filters, userId);

      res.status(200).json({ listings });
    } catch (error) {
      console.error('Error getting listings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get a specific listing by ID
  getListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { listingId } = req.params;

      if (!listingId) {
        res.status(400).json({ error: 'Listing ID is required' });
        return;
      }

      const listing = await this.sharingService.getListingById(listingId);

      if (!listing) {
        res.status(404).json({ error: 'Listing not found' });
        return;
      }

      res.status(200).json({ listing });
    } catch (error) {
      console.error('Error getting listing:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Update a listing
  updateListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { listingId } = req.params;
      const {
        title,
        description,
        quantity,
        pickupLocation,
        availableUntil,
        status,
      }: UpdateListingRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!listingId) {
        res.status(400).json({ error: 'Listing ID is required' });
        return;
      }

      const updatedListing = await this.sharingService.updateListing(
        listingId,
        userId,
        {
          title,
          description,
          quantity,
          pickupLocation,
          availableUntil: availableUntil ? new Date(availableUntil) : undefined,
          status,
        },
      );

      res.status(200).json({ listing: updatedListing });
    } catch (error) {
      console.error('Error updating listing:', error);
      if (
        error instanceof Error &&
        error.message.includes('not found')
      ) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Delete a listing
  deleteListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { listingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!listingId) {
        res.status(400).json({ error: 'Listing ID is required' });
        return;
      }

      await this.sharingService.deleteListing(listingId, userId);

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting listing:', error);
      if (
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('active claims'))
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Claim a listing
  claimListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { listingId } = req.params;
      const {
        claimerName,
        notes,
        quantityClaimed,
      }: ClaimListingRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!listingId) {
        res.status(400).json({ error: 'Listing ID is required' });
        return;
      }

      const sharingLog = await this.sharingService.claimListing(
        listingId,
        userId,
        {
          claimerName,
          notes,
          quantityClaimed,
        },
      );

      res.status(201).json({ sharingLog });
    } catch (error) {
      console.error('Error claiming listing:', error);
      if (
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('not available') ||
          error.message.includes('own listing') ||
          error.message.includes('already claimed'))
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Complete a listing
  completeListing = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { listingId } = req.params;
      const { notes }: CompleteListingRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      if (!listingId) {
        res.status(400).json({ error: 'Listing ID is required' });
        return;
      }

      const result = await this.sharingService.completeListing(
        listingId,
        userId,
        { notes },
      );

      res.status(200).json(result);
    } catch (error) {
      console.error('Error completing listing:', error);
      if (
        error instanceof Error &&
        (error.message.includes('not found') ||
          error.message.includes('not authorized'))
      ) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Get user's own listings
  getUserListings = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { status } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const listings = await this.sharingService.getUserListings(
        userId,
        status as ListingStatus,
      );

      res.status(200).json({ listings });
    } catch (error) {
      console.error('Error getting user listings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get sharing logs
  getSharingLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        startDate,
        endDate,
        status,
        listingId,
      } = req.query;

      const filters: SharingLogFilters = {};

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }
      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }
      if (status) {
        filters.status = status as string;
      }
      if (listingId) {
        filters.listingId = listingId as string;
      }

      const sharingLogs = await this.sharingService.getSharingLogs(filters);

      res.status(200).json({ sharingLogs });
    } catch (error) {
      console.error('Error getting sharing logs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get sharing statistics
  getSharingStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;

      const stats = await this.sharingService.getSharingStats(userId);

      res.status(200).json({ stats });
    } catch (error) {
      console.error('Error getting sharing stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Singleton instance
export const sharingController = new SharingController();