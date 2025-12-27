
import * as dotenv from 'dotenv';
import path from 'path';
import { aiAnalyticsService } from './src/services/aiAnalyticsService';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testAiEstimator() {
    console.log('🧪 Starting AI Estimator Tests...\n');

    try {
        console.log('📋 Test Case 1: Estimate Nutrition for "1 Apple"');
        try {
            const nutrition = await aiAnalyticsService.estimateNutrition('Apple', 1, 'piece');
            console.log('✅ Nutrition Result:', JSON.stringify(nutrition, null, 2));
            
            // Basic validation
            if (nutrition.calories > 0) console.log('   Validation: Calories > 0 (Pass)');
            else console.log('   Validation: Calories invalid (Fail)');
        } catch (error: any) {
            console.error('❌ Test 1 Failed:', error.message);
        }

        console.log('\n-----------------------------------\n');

        console.log('📋 Test Case 2: Estimate Price for "1kg Chicken Breast"');
        try {
            const price = await aiAnalyticsService.estimatePrice('Chicken Breast', 1, 'kg');
            console.log('✅ Price Result:', JSON.stringify(price, null, 2));

             // Basic validation
             if (price.estimatedPrice > 0) console.log('   Validation: Price > 0 (Pass)');
             else console.log('   Validation: Price invalid (Fail)');
        } catch (error: any) {
             console.error('❌ Test 2 Failed:', error.message);
        }

    } catch (error: any) {
        console.error('Failed to load service or run tests:', error);
    }
}

testAiEstimator();
