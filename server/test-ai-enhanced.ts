
import * as dotenv from 'dotenv';
import path from 'path';
import { aiAnalyticsService } from './src/services/aiAnalyticsService';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function verifyEnhancedEstimation() {
  console.log('🧪 Verifying Enhanced Estimation (Base Data Injection)...');
  
  // Test Data
  const baseNutrition = {
      calories: 100,
      protein: 10,
      carbohydrates: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0
  };
  const baseBasis = 100;
  const baseUnit = 'g';
  const basePrice = 200; // 200 BDT per 100g (Expensive!)

  console.log('\n--- Scenario 1: Estimate Nutrition for 200g (Should be 2x Base) ---');
  try {
      const result = await aiAnalyticsService.estimateNutrition(
          'Magic Food',
          200,
          'g',
          {
              nutritionPerUnit: baseNutrition,
              nutritionUnit: baseUnit,
              nutritionBasis: baseBasis
          }
      );
      console.log('✅ Result:', JSON.stringify(result, null, 2));
      
      if (Math.abs(result.calories - 200) < 5) {
          console.log('✅ Success: Calories correctly calculated as 200 (2x 100).');
      } else {
          console.error(`❌ Failure: Expected ~200 calories, got ${result.calories}`);
      }
  } catch (e: any) {
      console.error('❌ Error:', e.message);
  }

  console.log('\n--- Scenario 2: Estimate Price for 50g (Should be 0.5x Base) ---');
  try {
      const result = await aiAnalyticsService.estimatePrice(
          'Magic Food',
          50,
          'g',
          {
              basePrice: basePrice,
              nutritionUnit: baseUnit,
              nutritionBasis: baseBasis
          }
      );
      console.log('✅ Result:', JSON.stringify(result, null, 2));
      
      if (Math.abs(result.estimatedPrice - 100) < 5) {
          console.log('✅ Success: Price correctly calculated as 100 (0.5x 200).');
      } else {
          console.error(`❌ Failure: Expected ~100 BDT, got ${result.estimatedPrice}`);
      }
  } catch (e: any) {
      console.error('❌ Error:', e.message);
  }
}

verifyEnhancedEstimation();
