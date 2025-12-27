
import * as dotenv from 'dotenv';
import path from 'path';
import { aiAnalyticsService } from './src/services/aiAnalyticsService';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function verifyStandardEstimation() {
  console.log('🧪 Verifying Standardized Estimation...');
  
  const testItems = ['Chicken Breast', 'Egg', 'Milk', 'Rice'];
  
  for (const item of testItems) {
      console.log(`\n🔍 Estimating details for: ${item}`);
      try {
          const result = await aiAnalyticsService.estimateItemDetails(item);
          console.log('✅ Result:', JSON.stringify(result, null, 2));
          
          if (!result.nutritionUnit || !result.nutritionBasis || result.basePrice === undefined) {
               console.error('❌ Failed: Missing standardized fields');
          } else {
               console.log(`info: Basis: ${result.nutritionBasis} ${result.nutritionUnit}, Price: ${result.basePrice} BDT`);
          }
      } catch (e: any) {
          console.error(`❌ Error for ${item}:`, e.message);
      }
  }
}

verifyStandardEstimation();
