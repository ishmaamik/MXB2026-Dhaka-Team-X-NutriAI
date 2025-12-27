

import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000/api';
// Use the user/inventory IDs from previous context or hardcode for dev
// From logs: InventoryId: dc348a4a-d111-4f1c-b291-11d64ca1b090
const INVENTORY_ID = 'dc348a4a-d111-4f1c-b291-11d64ca1b090'; 
// Token from logs (might be expired, but we can try or mock auth if in dev mode with disabled auth? 
// Actually, `npm run dev` usually runs with Clerk. 
// I'll use the `inventoryService` directly to avoid Auth issues for this test script, 
// similar to how `test-ai-estimator.ts` might work if it imports service.
// BUT `inventory-service.ts` needs DB connection.
// Let's use axios and assume I can grab a token or disable auth?
// No, let's use the Service class directly like in `verify-refactor.ts`.

import { PrismaClient } from '@prisma/client';
import { InventoryService } from './src/modules/inventories/inventory-service';

const prisma = new PrismaClient();
const inventoryService = new InventoryService();

async function runTest() {
  try {
    // 1. Get a test user
    const user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');
    console.log('👤 Testing as user:', user.clerkId);

    // 2. Get/Create Inventory
    let inventory = await prisma.inventory.findFirst({ where: { createdById: user.id } });
    if (!inventory) {
        inventory = await prisma.inventory.create({
            data: { name: 'Test Inv', createdById: user.id }
        });
    }
    console.log('📦 Using Inventory:', inventory.id);

    // 3. Define Batch Items (Mocking OCR Output)
    const itemsToAdd = [
        {
            customName: `Test Item A ${Date.now()}`,
            quantity: 1,
            unit: 'piece',
            nutritionPerUnit: { calories: 100, protein: 10 },
            nutritionUnit: 'piece',
            nutritionBasis: 1,
            basePrice: 50
        },
        {
            customName: `Test Item B ${Date.now()}`,
            quantity: 200,
            unit: 'g',
            nutritionPerUnit: { calories: 200 }, // per 100g
            nutritionUnit: 'g',
            nutritionBasis: 100,
            basePrice: 20
        }
    ];

    console.log('🚀 Adding items...');

    for (const item of itemsToAdd) {
        console.log(`\nAdding ${item.customName}...`);
        const result = await inventoryService.addInventoryItem(user.clerkId, inventory.id, item);
        
        console.log(`✅ Added Item ID: ${result.id}`);
        console.log(`   FoodItem ID: ${result.foodItemId}`);
        
        if (result.foodItemId) {
            const foodItem = await prisma.foodItem.findUnique({ where: { id: result.foodItemId } });
            console.log(`   Linked FoodItem: ${foodItem?.name} (CreatedBy: ${foodItem?.createdById})`);
            console.log(`   Nutrition:`, foodItem?.nutritionPerUnit);
        } else {
            console.error('❌ ERROR: foodItemId is NULL! Controller/Service logic failed to create/link FoodItem.');
        }
    }

  } catch (error) {
    console.error('Test Failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
