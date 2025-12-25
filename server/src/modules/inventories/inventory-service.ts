import prisma from '../../config/database';
import {
  ConsumptionLogRequest,
  InventoryItemFilters,
  InventoryItemRequest,
  InventoryRequest,
  UpdateInventoryItemRequest,
  UpdateInventoryRequest,
} from './inventory-types';

export class InventoryService {
  /**
   * Get all inventories for a user
   */
  async getUserInventories(userId: string) {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });
    console.log('Clerk userId:', userId, 'DB user:', user);
    if (!user) {
      throw new Error('User not found in database');
    }
    const inventories = await prisma.inventory.findMany({
      where: {
        createdById: user.id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log('Inventories found:', inventories);
    return inventories;
  }

  /**
   * Get a specific inventory by ID
   */
  async getInventoryById(inventoryId: string, userId: string) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    return await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        createdById: user.id,
        isDeleted: false,
      },
      include: {
        items: {
          where: {
            isDeleted: false,
            removed: false,
          },
          select: {
            id: true,
            foodItemId: true,
            customName: true,
            quantity: true,
            unit: true,
            addedAt: true,
            expiryDate: true,
            notes: true,
            foodItem: {
              select: {
                id: true,
                name: true,
                category: true,
                unit: true,
                typicalExpirationDays: true,
                description: true,
              },
            },
          },
          orderBy: {
            addedAt: 'desc',
          },
        },
      },
    });
  }

  /**
   * Create a new inventory
   */
  async createInventory(userId: string, data: InventoryRequest) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    return await prisma.inventory.create({
      data: {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate ?? true,
        createdById: user.id,
      },
    });
  }

  /**
   * Update an inventory
   */
  async updateInventory(
    inventoryId: string,
    userId: string,
    data: UpdateInventoryRequest,
  ) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    return await prisma.inventory.update({
      where: {
        id: inventoryId,
        createdById: user.id,
      },
      data: {
        name: data.name,
        description: data.description,
        isPrivate: data.isPrivate,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Delete an inventory (soft delete)
   */
  async deleteInventory(inventoryId: string, userId: string) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    return await prisma.inventory.update({
      where: {
        id: inventoryId,
        createdById: user.id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Add an item to an inventory
   */
  async addInventoryItem(
    userId: string,
    inventoryId: string,
    data: InventoryItemRequest,
  ) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify that the inventory belongs to the user
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: inventoryId,
        createdById: user.id,
        isDeleted: false,
      },
    });

    if (!inventory) {
      throw new Error('Inventory not found or does not belong to user');
    }

    // Handle food item lookup logic
    let finalFoodItemId = data.foodItemId;
    let finalCustomName = data.customName;
    let finalUnit = data.unit;

    if (data.foodItemId) {
      // If a foodItemId is provided, verify it exists
      const foodItem = await prisma.foodItem.findFirst({
        where: {
          id: data.foodItemId,
          isDeleted: false,
        },
      });

      if (!foodItem) {
        throw new Error('Food item not found');
      }
    } else if (data.customName) {
      // If no foodItemId but customName provided, try to find matching food item
      const matchingFoodItem = await prisma.foodItem.findFirst({
        where: {
          name: {
            equals: data.customName.trim(),
            mode: 'insensitive',
          },
          isDeleted: false,
        },
      });

      if (matchingFoodItem) {
        // Found matching food item, use it instead of creating custom item
        finalFoodItemId = matchingFoodItem.id;
        finalCustomName = matchingFoodItem.name; // Use the exact name from DB
        finalUnit = data.unit || matchingFoodItem.unit || undefined; // Prefer provided unit, fallback to food item unit
      }
      // If no matching food item found, keep as custom item (finalFoodItemId remains null)
    }

    return await prisma.inventoryItem.create({
      data: {
        inventoryId,
        foodItemId: finalFoodItemId,
        customName: finalCustomName,
        quantity: data.quantity,
        unit: finalUnit,
        expiryDate: data.expiryDate,
        notes: data.notes,
        addedById: user.id,
      },
      include: {
        foodItem: {
          select: {
            id: true,
            name: true,
            category: true,
            unit: true,
            typicalExpirationDays: true,
            description: true,
          },
        },
      },
    });
  }

  /**
   * Update an inventory item
   */
  async updateInventoryItem(
    userId: string,
    inventoryId: string,
    itemId: string,
    data: UpdateInventoryItemRequest,
  ) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify that the inventory belongs to the user and the item belongs to that inventory
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        inventoryId: inventoryId,
        inventory: {
          createdById: user.id,
        },
        isDeleted: false,
      },
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found or does not belong to user');
    }

    return await prisma.inventoryItem.update({
      where: {
        id: itemId,
      },
      data: {
        quantity: data.quantity,
        unit: data.unit,
        expiryDate: data.expiryDate,
        notes: data.notes,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Remove an item from an inventory (soft delete)
   */
  async removeInventoryItem(
    userId: string,
    inventoryId: string,
    itemId: string,
  ) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify that the inventory belongs to the user and the item belongs to that inventory
    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        id: itemId,
        inventoryId: inventoryId,
        inventory: {
          createdById: user.id,
        },
        isDeleted: false,
      },
    });

    if (!inventoryItem) {
      throw new Error('Inventory item not found or does not belong to user');
    }

    return await prisma.inventoryItem.update({
      where: {
        id: itemId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Get inventory items with optional filtering
   */
  async getInventoryItems(filters: InventoryItemFilters) {
    const whereClause: any = {
      inventoryId: filters.inventoryId,
      isDeleted: false,
      removed: false,
    };

    // Add category filter if specified
    if (filters.category) {
      whereClause.foodItem = {
        category: filters.category,
      };
    }

    // Add expiring soon filter if specified
    if (filters.expiringSoon) {
      const today = new Date();
      const next7Days = new Date();
      next7Days.setDate(today.getDate() + 7);

      whereClause.expiryDate = {
        gte: today,
        lte: next7Days,
      };
    }

    return await prisma.inventoryItem.findMany({
      where: whereClause,
      include: {
        foodItem: {
          select: {
            name: true,
            category: true,
            typicalExpirationDays: true,
          },
        },
      },
      orderBy: {
        addedAt: 'desc',
      },
    });
  }

  /**
   * Log a consumption event
   */
  async logConsumption(userId: string, data: ConsumptionLogRequest) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify that the inventory belongs to the user
    const inventory = await prisma.inventory.findFirst({
      where: {
        id: data.inventoryId,
        createdById: user.id,
        isDeleted: false,
      },
    });

    if (!inventory) {
      throw new Error('Inventory not found or does not belong to user');
    }

    // If an inventoryItemId is provided, verify it exists and belongs to the inventory
    let inventoryItem: any = null;
    if (data.inventoryItemId && !data.inventoryItemId.startsWith('temp-')) {
      inventoryItem = await prisma.inventoryItem.findFirst({
        where: {
          id: data.inventoryItemId,
          inventoryId: data.inventoryId,
          isDeleted: false,
        },
      });

      if (!inventoryItem) {
        throw new Error(
          'Inventory item not found or does not belong to the specified inventory',
        );
      }
    }

    // If a foodItemId is provided, verify it exists
    if (data.foodItemId) {
      const foodItem = await prisma.foodItem.findFirst({
        where: {
          id: data.foodItemId,
          isDeleted: false,
        },
      });

      if (!foodItem) {
        throw new Error('Food item not found');
      }
    }

    // Create the consumption log
    const consumptionLogData = {
      inventoryId: data.inventoryId,
      inventoryItemId: data.inventoryItemId?.startsWith('temp-')
        ? null
        : data.inventoryItemId,
      foodItemId: data.foodItemId,
      itemName: data.itemName,
      quantity: data.quantity,
      unit: data.unit,
      consumedAt: data.consumedAt || new Date(),
      notes: data.notes,
    };

    const consumptionLog = await prisma.consumptionLog.create({
      data: consumptionLogData,
    });

    // Update inventory quantity if an inventory item was consumed
    if (inventoryItem && inventoryItem.quantity >= data.quantity) {
      const newQuantity = inventoryItem.quantity - data.quantity;

      if (newQuantity <= 0) {
        // Automatically remove item when quantity reaches zero
        await prisma.inventoryItem.update({
          where: {
            id: inventoryItem.id,
          },
          data: {
            quantity: 0,
            removed: true,
            updatedAt: new Date(),
          },
        });
      } else {
        // Update quantity if still remaining
        await prisma.inventoryItem.update({
          where: {
            id: inventoryItem.id,
          },
          data: {
            quantity: newQuantity,
            updatedAt: new Date(),
          },
        });
      }
    } else if (inventoryItem) {
      throw new Error('Insufficient quantity in inventory to consume');
    }

    return consumptionLog;
  }

  /**
   * Get consumption logs with optional filtering
   */
  async getConsumptionLogs(
    userId: string,
    filters: {
      startDate?: Date;
      endDate?: Date;
      inventoryId?: string;
    } = {},
  ) {
    console.log(
      '🔍 [getConsumptionLogs] === STARTING CONSUMPTION LOGS FETCH ===',
    );
    console.log('🔍 [getConsumptionLogs] User Clerk ID:', userId);
    console.log('🔍 [getConsumptionLogs] Filters received:', {
      startDate: filters?.startDate?.toISOString?.() || filters?.startDate,
      endDate: filters?.endDate?.toISOString?.() || filters?.endDate,
      inventoryId: filters?.inventoryId,
    });

    try {
      // First, find the application user by their Clerk ID
      console.log('🔍 [getConsumptionLogs] Looking up user by Clerk ID...');
      const user = await prisma.user.findUnique({
        where: { clerkId: userId },
      });

      console.log(
        '🔍 [getConsumptionLogs] Database user found:',
        user ? { id: user.id, clerkId: user.clerkId } : 'NULL',
      );

      if (!user) {
        console.error(
          '❌ [getConsumptionLogs] User not found in database for Clerk ID:',
          userId,
        );
        throw new Error('User not found in database');
      }

      // Check user's inventories
      console.log('🔍 [getConsumptionLogs] Fetching user inventories...');
      const userInventories = await prisma.inventory.findMany({
        where: {
          createdById: user.id,
          isDeleted: false,
        },
        select: { id: true, name: true },
      });

      console.log(
        '🔍 [getConsumptionLogs] User inventories found:',
        userInventories.length,
      );
      console.log('🔍 [getConsumptionLogs] User inventories:', userInventories);

      // Initialize whereClause first
      const whereClause: any = {
        inventory: {
          createdById: user.id,
          isDeleted: false,
        },
        isDeleted: false,
      };

      console.log('🔍 [getConsumptionLogs] Building where clause...');

      // Add inventory filter if specified
      if (filters.inventoryId) {
        console.log(
          '🔍 [getConsumptionLogs] Filtering by specific inventory ID:',
          filters.inventoryId,
        );
        const hasAccess = userInventories.some(
          inv => inv.id === filters.inventoryId,
        );
        console.log(
          '🔍 [getConsumptionLogs] User has access to this inventory:',
          hasAccess,
        );
        if (!hasAccess) {
          console.log(
            '⚠️ [getConsumptionLogs] User does not have access to inventory:',
            filters.inventoryId,
          );
          console.log(
            '⚠️ [getConsumptionLogs] Returning empty array instead of error',
          );
          return []; // Return empty array instead of throwing error
        }
        whereClause.inventoryId = filters.inventoryId;
      } else {
        console.log(
          '🔍 [getConsumptionLogs] No specific inventory filter - will fetch from all user inventories',
        );
      }

      // Add date range filters if specified
      if (filters.startDate) {
        console.log(
          '🔍 [getConsumptionLogs] Adding startDate filter:',
          filters.startDate,
        );
        whereClause.consumedAt = {
          ...whereClause.consumedAt,
          gte: filters.startDate,
        };
      }

      if (filters.endDate) {
        console.log(
          '🔍 [getConsumptionLogs] Adding endDate filter:',
          filters.endDate,
        );
        whereClause.consumedAt = {
          ...whereClause.consumedAt,
          lte: filters.endDate,
        };
      }

      console.log(
        '🔍 [getConsumptionLogs] Final where clause:',
        JSON.stringify(whereClause, null, 2),
      );

      console.log('🔍 [getConsumptionLogs] Executing database query...');
      const consumptionLogs = await prisma.consumptionLog.findMany({
        where: whereClause,
        include: {
          foodItem: {
            select: {
              name: true,
              category: true,
            },
          },
          inventoryItem: {
            select: {
              customName: true,
            },
          },
          inventory: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          consumedAt: 'desc',
        },
      });

      console.log(
        '🔍 [getConsumptionLogs] Found consumption logs count:',
        consumptionLogs.length,
      );
      console.log('🔍 [getConsumptionLogs] === END CONSUMPTION LOGS DEBUG ===');

      return consumptionLogs;
    } catch (error) {
      console.error(
        '❌ [getConsumptionLogs] Error in getConsumptionLogs:',
        error,
      );
      if (error instanceof Error) {
        console.error('❌ [getConsumptionLogs] Error stack:', error.stack);
        console.error('❌ [getConsumptionLogs] Error message:', error.message);
      }
      throw error;
    }
  }

  /**
   * Get inventory trends for analytics
   */
  async getInventoryTrends(
    userId: string,
    startDate: Date,
    endDate: Date,
    inventoryId?: string,
  ) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    const whereClause: any = {
      inventory: {
        createdById: user.id,
      },
      addedAt: {
        gte: startDate,
        lte: endDate,
      },
      isDeleted: false,
    };

    if (inventoryId) {
      whereClause.inventoryId = inventoryId;
    }

    // Get inventory items added during the period
    const itemsAdded = await prisma.inventoryItem.findMany({
      where: whereClause,
      select: {
        addedAt: true,
        expiryDate: true,
      },
    });

    // Count items by date
    const itemsByDate: Record<
      string,
      {
        date: Date;
        totalItems: number;
        expiringItems: number;
        newlyAdded: number;
      }
    > = {};

    for (const item of itemsAdded) {
      const dateKey = item.addedAt.toISOString().split('T')[0];
      if (!itemsByDate[dateKey]) {
        itemsByDate[dateKey] = {
          date: item.addedAt,
          totalItems: 0,
          expiringItems: 0,
          newlyAdded: 0,
        };
      }
      itemsByDate[dateKey].newlyAdded += 1;

      // Check if item is expiring soon
      if (item.expiryDate && item.expiryDate <= new Date()) {
        itemsByDate[dateKey].expiringItems += 1;
      }
    }

    // Calculate total items in inventory at each date
    const inventoryItems = await prisma.inventoryItem.findMany({
      where: {
        inventory: {
          createdById: user.id,
        },
        addedAt: {
          lte: endDate,
        },
        isDeleted: false,
        removed: false,
      },
      select: {
        addedAt: true,
        expiryDate: true,
        removed: true,
      },
    });

    // Group by date and calculate totals
    const allDates = new Set([...Object.keys(itemsByDate)]);
    const dateArray = Array.from(allDates).sort();

    const trends = await Promise.all(
      dateArray.map(async date => {
        const dateObj = new Date(date);
        const itemsInDateRange = inventoryItems.filter(
          item => item.addedAt <= dateObj,
        );

        const totalItems = itemsInDateRange.length;
        const expiringItems = itemsInDateRange.filter(
          item =>
            item.expiryDate && item.expiryDate <= new Date() && !item.removed,
        ).length;

        return {
          date: dateObj,
          totalItems,
          expiringItems,
          newlyAdded: itemsByDate[date]?.newlyAdded || 0,
          consumedItems: 0, // Placeholder - would need consumption logs
        };
      }),
    );

    return trends;
  }

  /**
   * Get consumption patterns for analytics
   */
  async getConsumptionPatterns(userId: string, startDate: Date, endDate: Date) {
    // First, find the application user by their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    const consumptionLogs = await prisma.consumptionLog.findMany({
      where: {
        inventory: {
          createdById: user.id,
        },
        consumedAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      include: {
        foodItem: {
          select: {
            category: true,
          },
        },
      },
    });

    // Group by category
    const byCategory: Record<
      string,
      { category: string; consumptionCount: number; quantityConsumed: number }
    > = {};
    for (const log of consumptionLogs) {
      const category = log.foodItem?.category || 'Uncategorized';
      if (!byCategory[category]) {
        byCategory[category] = {
          category,
          consumptionCount: 0,
          quantityConsumed: 0,
        };
      }
      byCategory[category].consumptionCount += 1;
      byCategory[category].quantityConsumed += log.quantity;
    }

    // Group by time period (daily)
    const byTime: Record<
      string,
      { timePeriod: string; consumptionCount: number }
    > = {};
    for (const log of consumptionLogs) {
      const dateKey = log.consumedAt.toISOString().split('T')[0];
      if (!byTime[dateKey]) {
        byTime[dateKey] = {
          timePeriod: dateKey,
          consumptionCount: 0,
        };
      }
      byTime[dateKey].consumptionCount += 1;
    }

    // Calculate waste reduction (simplified for now)
    const wastePrevented = consumptionLogs.length * 0.5; // Placeholder calculation
    const wasteReductionPercentage = 15; // Placeholder

    return {
      byCategory: Object.values(byCategory),
      byTime: Object.values(byTime),
      wasteReduction: {
        wastePrevented,
        wasteReductionPercentage,
      },
    };
  }
}
