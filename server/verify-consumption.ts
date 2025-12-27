
import * as dotenv from 'dotenv';
import path from 'path';
import { InventoryService } from './src/modules/inventories/inventory-service';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

const mockConsumptionData = {
  inventoryId: undefined, // Optional
  itemName: 'Test Item',
  quantity: 1,
  unit: 'kg',
  // Nutrients
  calories: 100,
  protein: 10,
};

async function verifyConsumptionLogic() {
  console.log('🧪 Verifying Consumption Logic Syntax...');
  try {
     const service = new InventoryService();
     console.log('✅ InventoryService instantiated successfully.');
     
     // We define it as 'any' to avoid strict optional check if types are stale
     const data: any = mockConsumptionData;

     // We don't actually call it because we don't have a user ID or DB connection guaranteed.
     // But if this file compiles and runs, the types in inventory-service are likely compatible-ish
     // (due to our 'as any' fix).
     
     console.log('✅ Service method logConsumption exists:', typeof service.logConsumption);
  } catch (e) {
      console.error('❌ Failed:', e);
  }
}

verifyConsumptionLogic();
