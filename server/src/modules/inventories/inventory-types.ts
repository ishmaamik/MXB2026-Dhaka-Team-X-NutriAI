import { Inventory, InventoryItem, ConsumptionLog } from '@prisma/client';

// Extending the Prisma-generated types with additional properties as needed
export type InventoryWithItems = Inventory & {
  items: InventoryItem[];
};

export type InventoryRequest = {
  name: string;
  description?: string;
  isPrivate?: boolean;
};

export type UpdateInventoryRequest = {
  name?: string;
  description?: string;
  isPrivate?: boolean;
};

export type InventoryItemRequest = {
  foodItemId?: string;
  customName?: string;
  quantity: number;
  unit?: string;
  expiryDate?: Date;
  notes?: string;
  // Nutrition Data (for creating FoodItem on the fly)
  nutritionPerUnit?: any;
  nutritionUnit?: string;
  nutritionBasis?: number;
  basePrice?: number;
};

export type UpdateInventoryItemRequest = {
  quantity?: number;
  unit?: string;
  expiryDate?: Date;
  notes?: string;
};

export type ConsumptionLogRequest = {
  inventoryId?: string; // Optional
  inventoryItemId?: string;
  foodItemId?: string;
  itemName: string;
  quantity: number;
  unit?: string;
  consumedAt?: Date;
  notes?: string;
  // Nutrients
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export type ConsumptionLogFilters = {
  startDate?: Date;
  endDate?: Date;
  inventoryId?: string;
};

export type InventoryFilters = {
  userId: string;
};

export type InventoryItemFilters = {
  inventoryId: string;
  category?: string;
  expiringSoon?: boolean;
};

export interface DailyNutrition {
  date: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface DailyCost {
  date: string;
  cost: number;
}

export interface ConsumptionAnalytics {
  byCategory: Record<
    string,
    { category: string; consumptionCount: number; quantityConsumed: number }
  >;
  byTime: Record<string, { timePeriod: string; consumptionCount: number }>;
  dailyNutrition: DailyNutrition[];
  dailyCost: DailyCost[];
}
