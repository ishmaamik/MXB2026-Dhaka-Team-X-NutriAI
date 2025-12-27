
import * as dotenv from 'dotenv';
import path from 'path';
import { InventoryService } from './src/modules/inventories/inventory-service';
import prisma from './src/config/database';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function verifyRefactor() {
  console.log('🧪 Verifying Nutrition Refactor...');
  const service = new InventoryService();
  
  // 1. Create a dummy user and food item if possible, OR just check if the logic holds syntactically 
  // and try to dry-run logic.
  // Since we don't want to pollute DB easily, we can try to verify the math logic by mocking... 
  // but we can't mock in this integration script easily without a mocking lib.
  
  // Let's just create a dummy FoodItem, test on it, and delete it.
  
  try {
      // Find a user or create dummy
      const user = await prisma.user.findFirst();
      if (!user) {
          console.log('⚠️ No user found, skipping integration test.');
          return;
      }
      console.log('👤 Using user:', user.id);
      
      // Create Dummy Food Item
      const foodItem = await prisma.foodItem.create({
          data: {
              name: 'Test Auto-Cache Apple ' + Date.now(),
              category: 'Test',
              createdById: user.id
          }
      });
      console.log('🍎 Created Test FoodItem:', foodItem.id);
      
      // Step 1: Log Consumption WITH Nutrients (Should Cache)
      console.log('👉 Logging consumption (200g) with nutrients...');
      await service.logConsumption(user.clerkId, {
          foodItemId: foodItem.id,
          itemName: foodItem.name,
          quantity: 200,
          unit: 'g',
          calories: 100, // So 50 cal/100g
          protein: 10,   // So 5g/100g
      });
      
      // Check if FoodItem updated
      const updatedFood = await prisma.foodItem.findUnique({ where: { id: foodItem.id } });
      const nutrients = updatedFood?.nutritionPerUnit as any;
      console.log('🔍 Updated FoodItem Nutrients (Expect ~50 cal, ~5g protein):', nutrients);
      console.log('🔍 Nutrition Basis:', updatedFood?.nutritionBasis);
      
      if (Math.abs(nutrients.calories - 50) < 1) {
          console.log('✅ Caching Logic Passed: Calories normalized correctly.');
      } else {
          console.error('❌ Caching Logic Failed!');
      }
      
      // Step 2: Log Consumption WITHOUT Nutrients (Should Calculate)
      console.log('👉 Logging consumption (300g) WITHOUT nutrients...');
      const log2 = await service.logConsumption(user.clerkId, {
          foodItemId: foodItem.id,
          itemName: foodItem.name,
          quantity: 300,
          unit: 'g'
      });
      
      console.log('🔍 Calculated Log Nutrients (Expect 150 cal):', log2.calories);
      
      if (Math.abs((log2.calories || 0) - 150) < 1) {
          console.log('✅ Calculation Logic Passed: Calories calculated correctly from cache.');
      } else {
          console.error('❌ Calculation Logic Failed!');
      }
      
      // Cleanup
      await prisma.consumptionLog.deleteMany({ where: { foodItemId: foodItem.id } });
      await prisma.foodItem.delete({ where: { id: foodItem.id } });
      console.log('🧹 Cleanup done.');
      
  } catch (e) {
      console.error('❌ Verification failed:', e);
  }
}

verifyRefactor();
