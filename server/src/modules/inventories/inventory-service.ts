import prisma from '../../config/database';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
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
      // 1. First, try to find a PRIVATE food item created by THIS user
      let matchingFoodItem = await prisma.foodItem.findFirst({
        where: {
          name: {
            equals: data.customName.trim(),
            mode: 'insensitive',
          },
          createdById: user.id, // Scoped to user
          isDeleted: false,
        },
      });

      // 2. If NO private item found, and we have custom data (nutrition/price), FORCE CREATE NEW PRIVATE ITEM
      // This ensures we don't accidentally link to a generic item when the user has specific OCR data.
      if (!matchingFoodItem) {
          try {
             let itemData = {
                nutritionPerUnit: data.nutritionPerUnit,
                nutritionUnit: data.nutritionUnit || data.unit,
                nutritionBasis: data.nutritionBasis || (['g', 'ml'].includes(data.unit || '') ? 100 : 1),
                basePrice: data.basePrice,
                category: 'Uncategorized'
             };

             // If price is missing, try to estimate it using AI
             if (!itemData.basePrice) {
                 console.log(`🤖 Estimating details for new item: ${data.customName}`);
                 try {
                    const estimated = await aiAnalyticsService.estimateItemDetails(data.customName!);
                    if (estimated && estimated.basePrice) {
                        console.log(`✅ AI Estimated price: ${estimated.basePrice}`);
                        itemData.basePrice = estimated.basePrice;
                        if (estimated.category) itemData.category = estimated.category;

                        // Also fill nutrition if missing
                        if (!itemData.nutritionPerUnit) {
                             itemData.nutritionPerUnit = estimated.nutritionPerUnit;
                             itemData.nutritionUnit = estimated.nutritionUnit;
                             itemData.nutritionBasis = estimated.nutritionBasis;
                        }
                    }
                 } catch (e) {
                     console.warn('Failed to estimate item details:', e);
                 }
             }

            // Only create if we have at least some data (price or nutrition), otherwise fall through to global search
            if (itemData.basePrice || itemData.nutritionPerUnit) {
                const newFoodItem = await prisma.foodItem.create({
                    data: {
                        name: data.customName?.trim() || 'Unknown Item',
                        category: itemData.category,
                        unit: data.unit,
                        nutritionPerUnit: itemData.nutritionPerUnit || {},
                        nutritionUnit: itemData.nutritionUnit,
                        nutritionBasis: itemData.nutritionBasis,
                        basePrice: itemData.basePrice,
                        createdById: user.id
                    }
                });
                console.log('Creates new PRIVATE FoodItem from OCR:', newFoodItem.name);
                matchingFoodItem = newFoodItem;
            }
         } catch (err) {
             console.error('Failed to create Private FoodItem:', err);
         }
      }


      // 3. If STILL no item found (meaning no private existing, and no custom data provided),
      // Try to find a GLOBAL food item (createdById: null)
      if (!matchingFoodItem) {
          matchingFoodItem = await prisma.foodItem.findFirst({
            where: {
              name: {
                equals: data.customName.trim(),
                mode: 'insensitive',
              },
              createdById: null, // Global item
              isDeleted: false,
            },
          });
      }

      // Final Assignment
      if (matchingFoodItem) {
        finalFoodItemId = matchingFoodItem.id;
        finalCustomName = matchingFoodItem.name;
        finalUnit = data.unit || matchingFoodItem.unit || undefined;
      } 
      // If still no match, finalFoodItemId remains null -> it's a raw custom inventory item.
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
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      throw new Error('User not found in database');
    }

    // Verify inventory only if inventoryId is provided
    let inventoryItem: any = null;

    if (data.inventoryId) {
      const inventory = await prisma.inventory.findFirst({
        where: { id: data.inventoryId, createdById: user.id, isDeleted: false },
      });

      if (!inventory) {
        throw new Error('Inventory not found or does not belong to user');
      }

      if (data.inventoryItemId && !data.inventoryItemId.startsWith('temp-')) {
        inventoryItem = await prisma.inventoryItem.findFirst({
          where: {
            id: data.inventoryItemId,
            inventoryId: data.inventoryId,
            isDeleted: false,
          },
        });

        if (!inventoryItem) throw new Error('Inventory item not found');
      }
    }

    // Handle Nutrition Logic
    let logNutrients = {
      calories: data.calories,
      protein: data.protein,
      carbohydrates: data.carbohydrates,
      fat: data.fat,
      fiber: data.fiber,
      sugar: data.sugar,
      sodium: data.sodium,
    };

    if (data.foodItemId) {
      const foodItem = await prisma.foodItem.findFirst({
        where: { id: data.foodItemId, isDeleted: false },
      });

      if (!foodItem) throw new Error('Food item not found');

      // 1. If FoodItem has base nutrition, CALCULATE
      const foodItemAny = foodItem as any;
      if (foodItemAny.nutritionPerUnit && foodItemAny.nutritionBasis) {
        const base = foodItemAny.nutritionPerUnit;
        const basis = foodItemAny.nutritionBasis; // e.g. 100 (g)
        const ratio = data.quantity / basis; // e.g. 200g / 100g = 2

        logNutrients = {
          calories: (base.calories || 0) * ratio,
          protein: (base.protein || 0) * ratio,
          carbohydrates: (base.carbohydrates || 0) * ratio,
          fat: (base.fat || 0) * ratio,
          fiber: (base.fiber || 0) * ratio,
          sugar: (base.sugar || 0) * ratio,
          sodium: (base.sodium || 0) * ratio,
        };
      }
      // 2. If FoodItem has NO base nutrition but we have incoming AI data, CACHE IT
      else if (data.calories !== undefined) {
        // Assume incoming data is for the consumed quantity.
        // We'll standardize to 100 units as a convention if unit is 'g'/'ml', or 1 unit otherwise.
        const isWeight = ['g', 'ml', 'gram', 'grams', 'kg', 'kilogram'].includes(
          (data.unit || '').toLowerCase(),
        );
        const quantityInBase = isWeight ? data.quantity : data.quantity; // If kg, we might need conversion, but for now assume matching unit families.
        
        // Actually, if unit is 'kg', we should probably normalize to 'g' or keep 'kg'. 
        // Let's stick to the prompt's simplicity: "standardize" means calculate per 1 unit or per 100 units of the SAME unit type.
        // If user logged 200g, we store per 100g.
        // If user logged 2 pieces, we store per 1 piece.
        
        // Simple heuristic: Weight/Volume -> 100 basis. Count -> 1 basis.
        const isStandardizable = ['g', 'ml', 'gram', 'grams', 'milliliter', 'milliliters'].includes((data.unit || '').toLowerCase());
        const standardBasis = isStandardizable ? 100 : 1;
        
        const ratio = standardBasis / (data.quantity || 1);

        const baseNutrition = {
          calories: (data.calories || 0) * ratio,
          protein: (data.protein || 0) * ratio,
          carbohydrates: (data.carbohydrates || 0) * ratio,
          fat: (data.fat || 0) * ratio,
          fiber: (data.fiber || 0) * ratio,
          sugar: (data.sugar || 0) * ratio,
          sodium: (data.sodium || 0) * ratio,
        };

        // Update FoodItem (Source of Truth)
        await prisma.foodItem.update({
          where: { id: foodItem.id },
          data: {
            nutritionPerUnit: baseNutrition,
            nutritionBasis: standardBasis,
            nutritionUnit: data.unit,
          } as any,
        });
      }
    }

    // Create the consumption log
    const consumptionLogData = {
      inventoryId: data.inventoryId || null,
      inventoryItemId: data.inventoryItemId?.startsWith('temp-')
        ? null
        : data.inventoryItemId,
      foodItemId: data.foodItemId,
      itemName: data.itemName,
      quantity: data.quantity,
      unit: data.unit,
      consumedAt: data.consumedAt || new Date(),
      notes: data.notes,
      ...logNutrients,
    };

    const consumptionLog = await prisma.consumptionLog.create({
      data: consumptionLogData as any,
    });

    // Update inventory quantity
    if (inventoryItem && inventoryItem.quantity >= data.quantity) {
      const newQuantity = inventoryItem.quantity - data.quantity;
      if (newQuantity <= 0) {
        await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: 0, removed: true, updatedAt: new Date() },
        });
      } else {
        await prisma.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: newQuantity, updatedAt: new Date() },
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
    const byTime: Record<
      string,
      { timePeriod: string; consumptionCount: number }
    > = {};
    const dailyNutrition: Record<
      string,
      {
        date: string;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
        sugar: number;
        sodium: number;
      }
    > = {};
    const dailyCost: Record<string, { date: string; cost: number }> = {};

    for (const log of consumptionLogs) {
      const category = log.foodItem?.category || 'Uncategorized';
      const dateKey = log.consumedAt.toISOString().split('T')[0];

      // 1. Category Aggregation
      if (!byCategory[category]) {
        byCategory[category] = {
          category,
          consumptionCount: 0,
          quantityConsumed: 0,
        };
      }
      byCategory[category].consumptionCount += 1;
      byCategory[category].quantityConsumed += log.quantity;

      // 2. Time Aggregation (Count)
      if (!byTime[dateKey]) {
        byTime[dateKey] = {
          timePeriod: dateKey,
          consumptionCount: 0,
        };
      }
      byTime[dateKey].consumptionCount += 1;

      // 3. Daily Nutrition Aggregation
      if (!dailyNutrition[dateKey]) {
        dailyNutrition[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbohydrates: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        };
      }
      // Cast to any to access potentially missing types if generation hasn't run
      const l = log as any;
      dailyNutrition[dateKey].calories += l.calories || 0;
      dailyNutrition[dateKey].protein += l.protein || 0;
      dailyNutrition[dateKey].carbohydrates += l.carbohydrates || 0;
      dailyNutrition[dateKey].fat += l.fat || 0;
      dailyNutrition[dateKey].fiber += l.fiber || 0;
      dailyNutrition[dateKey].sugar += l.sugar || 0;
      dailyNutrition[dateKey].sodium += l.sodium || 0;

      // 4. Daily Cost Aggregation
      if (!dailyCost[dateKey]) {
        dailyCost[dateKey] = { date: dateKey, cost: 0 };
      }
      
      const pricePerUnit = log.foodItem && (log.foodItem as any).basePrice ? (log.foodItem as any).basePrice : 0;
      
      let cost = 0;
      if (pricePerUnit > 0) {
           const basis = (log.foodItem as any).nutritionBasis || 1;
           const ratio = log.quantity / basis;
           cost = pricePerUnit * ratio;
      }
      
      dailyCost[dateKey].cost += cost;
    }

    return {
      byCategory: Object.values(byCategory),
      byTime: Object.values(byTime),
      dailyNutrition: Object.values(dailyNutrition).sort((a, b) => a.date.localeCompare(b.date)),
      dailyCost: Object.values(dailyCost).sort((a, b) => a.date.localeCompare(b.date)),
      wasteReduction: {
        wastePrevented: consumptionLogs.length * 0.5,
        wasteReductionPercentage: 15,
      },
    };
  }
}

export const inventoryService = new InventoryService();
