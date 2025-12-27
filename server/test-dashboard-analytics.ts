
import { aiAnalyticsService } from './src/services/aiAnalyticsService';
import Prisma from './src/config/database';

async function testAnalytics() {
  const user = await Prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }
  console.log('Testing for user:', user.clerkId);

  try {
    const result = await aiAnalyticsService.getDashboardInsights(user.clerkId);
    if(result.success && result.insights.consumption) {
       console.log('Consumption Patterns Keys:', Object.keys(result.insights.consumption.patterns));
       
       const patterns = result.insights.consumption.patterns;
       if(patterns.dailyNutrition) {
           console.log('Daily Nutrition Data Found:', patterns.dailyNutrition.length, 'entries');
           console.log('Sample:', patterns.dailyNutrition[0]);
       } else {
           console.error('MISSING dailyNutrition');
       }

       if(patterns.dailyCost) {
           console.log('Daily Cost Data Found:', patterns.dailyCost.length, 'entries');
           console.log('Sample:', patterns.dailyCost[0]);
       } else {
           console.error('MISSING dailyCost');
       }
    } else {
        console.error('Failed to get insights', result);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
      await Prisma.$disconnect();
  }
}

testAnalytics();
