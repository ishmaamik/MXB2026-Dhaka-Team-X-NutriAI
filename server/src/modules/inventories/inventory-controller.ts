import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { imageService } from '../images/image-service';
import { InventoryService } from './inventory-service';
import {
  ConsumptionLogFilters,
  ConsumptionLogRequest,
  InventoryItemFilters,
  InventoryItemRequest,
  InventoryRequest,
  UpdateInventoryItemRequest,
  UpdateInventoryRequest,
} from './inventory-types';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  // Get all inventories for the authenticated user
  getInventories = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const inventories = await this.inventoryService.getUserInventories(
        userId,
      );
      res.status(200).json({ inventories });
    } catch (error) {
      console.error('Error getting inventories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get a specific inventory with its items
  getInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      const inventory = await this.inventoryService.getInventoryById(
        inventoryId,
        userId,
      );
      if (!inventory) {
        res.status(404).json({ error: 'Inventory not found' });
        return;
      }

      res.status(200).json(inventory);
    } catch (error) {
      console.error('Error getting inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Create a new inventory
  createInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { name, description, isPrivate }: InventoryRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!name || name.trim().length === 0) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const newInventory = await this.inventoryService.createInventory(userId, {
        name,
        description,
        isPrivate,
      });

      res.status(201).json(newInventory);
    } catch (error) {
      console.error('Error creating inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Update an existing inventory
  updateInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId } = req.params;
      const { name, description, isPrivate }: UpdateInventoryRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      const updatedInventory = await this.inventoryService.updateInventory(
        inventoryId,
        userId,
        { name, description, isPrivate },
      );

      res.status(200).json(updatedInventory);
    } catch (error) {
      console.error('Error updating inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Delete an inventory (soft delete)
  deleteInventory = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      await this.inventoryService.deleteInventory(inventoryId, userId);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting inventory:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Add an item to an inventory
  addInventoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId } = req.params;
      const {
        foodItemId,
        customName,
        quantity,
        unit,
        expiryDate,
        notes,
      }: InventoryItemRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      // Validate required fields
      if (!quantity || quantity <= 0) {
        res
          .status(400)
          .json({ error: 'Quantity is required and must be greater than 0' });
        return;
      }

      // If no foodItemId is provided, customName is required
      if (!foodItemId && (!customName || customName.trim().length === 0)) {
        res
          .status(400)
          .json({ error: 'Either foodItemId or customName is required' });
        return;
      }

      const newItem = await this.inventoryService.addInventoryItem(
        userId,
        inventoryId,
        {
          foodItemId,
          customName,
          quantity,
          unit,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          notes,
        },
      );

      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error adding inventory item:', error);
      if (
        error instanceof Error &&
        error.message.includes('Inventory not found')
      ) {
        res.status(404).json({ error: error.message });
      } else if (
        error instanceof Error &&
        error.message.includes('Food item not found')
      ) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Add items to inventory from image using OCR
  addItemsFromImage = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      // Check if image file is provided
      if (!req.files || !req.files.image) {
        res.status(400).json({ error: 'No image file provided' });
        return;
      }

      const imageFile = req.files.image as UploadedFile;

      // Upload image and extract text using OCR
      console.log(
        '🖼️ [Controller] Processing image for inventory:',
        inventoryId,
      );
      const result = await imageService.uploadImageWithOCR(imageFile, userId, {
        inventoryId,
        extractItems: true,
      });

      if (!result.ocr) {
        res.status(500).json({ error: 'Failed to extract text from image' });
        return;
      }

      // Add extracted items to inventory
      const addedItems = [];
      const errors = [];

      for (const extractedItem of result.ocr.extractedItems) {
        try {
          console.log(
            '➕ [Controller] Adding item to inventory:',
            extractedItem.name,
          );

          const newItem = await this.inventoryService.addInventoryItem(
            userId,
            inventoryId,
            {
              customName: extractedItem.name,
              quantity: extractedItem.quantity || 1,
              unit: extractedItem.unit || 'pcs',
              notes: `Added from image OCR (confidence: ${Math.round(
                (extractedItem.confidence || 0.6) * 100,
              )}%)`,
            },
          );

          addedItems.push({
            ...newItem,
            originalOCR: extractedItem,
          });
        } catch (error) {
          console.error(
            '❌ [Controller] Error adding item:',
            extractedItem.name,
            error,
          );
          errors.push({
            item: extractedItem.name,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully processed image. Added ${addedItems.length} items.`,
        data: {
          image: result.file,
          ocrText: result.ocr.text,
          ocrConfidence: result.ocr.confidence,
          addedItems,
          errors: errors.length > 0 ? errors : undefined,
          summary: {
            totalExtracted: result.ocr.extractedItems.length,
            successfullyAdded: addedItems.length,
            failed: errors.length,
          },
        },
      });
    } catch (error) {
      console.error('Error processing image for inventory:', error);
      res.status(500).json({
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Update an inventory item
  updateInventoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId, itemId } = req.params;
      const { quantity, unit, expiryDate, notes }: UpdateInventoryItemRequest =
        req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId || !itemId) {
        res
          .status(400)
          .json({ error: 'Inventory ID and Item ID are required' });
        return;
      }

      // Validate quantity if provided
      if (quantity !== undefined && quantity < 0) {
        res.status(400).json({ error: 'Quantity cannot be negative' });
        return;
      }

      const updatedItem = await this.inventoryService.updateInventoryItem(
        userId,
        inventoryId,
        itemId,
        {
          quantity,
          unit,
          expiryDate: expiryDate ? new Date(expiryDate) : undefined,
          notes,
        },
      );

      res.status(200).json(updatedItem);
    } catch (error) {
      console.error('Error updating inventory item:', error);
      if (
        error instanceof Error &&
        error.message.includes('Inventory item not found')
      ) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Remove an inventory item (soft delete)
  removeInventoryItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId, itemId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId || !itemId) {
        res
          .status(400)
          .json({ error: 'Inventory ID and Item ID are required' });
        return;
      }

      await this.inventoryService.removeInventoryItem(
        userId,
        inventoryId,
        itemId,
      );
      res.status(204).send();
    } catch (error) {
      console.error('Error removing inventory item:', error);
      if (
        error instanceof Error &&
        error.message.includes('Inventory item not found')
      ) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Get inventory items with filtering
  getInventoryItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { inventoryId } = req.params;
      const { category, expiringSoon } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      const filters: InventoryItemFilters = {
        inventoryId,
      };

      if (category) {
        filters.category = category as string;
      }

      if (expiringSoon !== undefined) {
        filters.expiringSoon = expiringSoon === 'true' || expiringSoon === '1';
      }

      const items = await this.inventoryService.getInventoryItems(filters);
      res.status(200).json({ items });
    } catch (error) {
      console.error('Error getting inventory items:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Log a consumption event
  logConsumption = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const {
        inventoryId,
        inventoryItemId,
        foodItemId,
        itemName,
        quantity,
        unit,
        consumedAt,
        notes,
      }: ConsumptionLogRequest = req.body;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate required fields
      if (!inventoryId) {
        res.status(400).json({ error: 'Inventory ID is required' });
        return;
      }

      if (!itemName || itemName.trim().length === 0) {
        res.status(400).json({ error: 'Item name is required' });
        return;
      }

      if (!quantity || quantity <= 0) {
        res
          .status(400)
          .json({ error: 'Quantity is required and must be greater than 0' });
        return;
      }

      const consumptionLog = await this.inventoryService.logConsumption(
        userId,
        {
          inventoryId,
          inventoryItemId,
          foodItemId,
          itemName,
          quantity,
          unit,
          consumedAt: consumedAt ? new Date(consumedAt) : undefined,
          notes,
        },
      );

      res.status(201).json(consumptionLog);
    } catch (error) {
      console.error('Error logging consumption:', error);
      if (error instanceof Error) {
        if (error.message.includes('Inventory not found')) {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes('Inventory item not found')) {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes('Food item not found')) {
          res.status(404).json({ error: error.message });
        } else if (error.message.includes('Insufficient quantity')) {
          res.status(400).json({ error: error.message });
        } else {
          res.status(500).json({ error: error.message });
        }
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };

  // Get consumption logs with filtering
  getConsumptionLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { startDate, endDate, inventoryId } = req.query;

      console.log('=== CONSUMPTION LOGS CONTROLLER ===');
      console.log('User ID:', userId);
      console.log('Filters:', { startDate, endDate, inventoryId });

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const filters: ConsumptionLogFilters = {};

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      if (inventoryId) {
        filters.inventoryId = inventoryId as string;
      }

      const consumptionLogs = await this.inventoryService.getConsumptionLogs(
        userId,
        filters,
      );
      console.log('Returning', consumptionLogs.length, 'consumption logs');
      console.log('=== END CONTROLLER ===');

      res.status(200).json({ consumptionLogs });
    } catch (error) {
      console.error('ERROR in getConsumptionLogs controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get inventory trends for analytics
  getInventoryTrends = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { startDate, endDate, inventoryId } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const trends = await this.inventoryService.getInventoryTrends(
        userId,
        new Date(startDate as string),
        new Date(endDate as string),
        inventoryId as string,
      );

      res.status(200).json({ trends });
    } catch (error) {
      console.error('Error getting inventory trends:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Get consumption patterns for analytics
  getConsumptionPatterns = async (
    req: Request,
    res: Response,
  ): Promise<void> => {
    try {
      const userId = req.auth?.userId;
      const { startDate, endDate } = req.query;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json({ error: 'Start date and end date are required' });
        return;
      }

      const patterns = await this.inventoryService.getConsumptionPatterns(
        userId,
        new Date(startDate as string),
        new Date(endDate as string),
      );

      res.status(200).json({ patterns });
    } catch (error) {
      console.error('Error getting consumption patterns:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Singleton instance
export const inventoryController = new InventoryController();
