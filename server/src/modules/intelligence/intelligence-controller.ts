import { Request, Response } from 'express';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';
import { aiQueue, aiQueueEvents } from '../../config/queue';
import prisma from '../../config/database';
import { inventoryService } from '../inventories/inventory-service';

export class IntelligentDashboardController {
  // Save a meal plan
  async saveMealPlan(req: Request, res: Response) {
    try {
      const clerkId = req.auth?.userId;
      if (!clerkId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const { plan } = req.body;
      if (!plan) {
        return res.status(400).json({ error: 'Meal plan data is required' });
      }

      const savedPlan = await prisma.mealPlan.create({
        data: {
          userId: user.id,
          weekStartDate: new Date(),
          budget: plan.totalEstimatedCost || 0,
          meals: plan.meals,
          shoppingList: {},
          totalCost: plan.totalEstimatedCost || 0,
          nutritionSummary: {},
          status: 'active',
        },
      });

      res.json({
        success: true,
        data: savedPlan,
        message: 'Meal plan saved successfully',
      });
    } catch (error: any) {
      console.error('Save meal plan error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to save meal plan',
      });
    }
  }

  // Get saved meal plans
  async getSavedMealPlans(req: Request, res: Response) {
    try {
      const clerkId = req.auth?.userId;
      if (!clerkId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await prisma.user.findUnique({ where: { clerkId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const savedPlans = await prisma.mealPlan.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        success: true,
        data: savedPlans,
      });
    } catch (error: any) {
      console.error('Get saved plans error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch saved plans',
      });
    }
  }

  // Consume a meal from a plan
  async consumeMeal(req: Request, res: Response) {
    try {
      const clerkId = req.auth?.userId;
      if (!clerkId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { mealName, items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items list is required' });
      }

      const userInventories = await inventoryService.getUserInventories(clerkId);
      const inventoryId = userInventories[0]?.id;

      if (!inventoryId) {
        return res.status(400).json({ error: 'No inventory found to consume from' });
      }

      const results = [];
      for (const itemName of items) {
        const inventoryItems = await prisma.inventoryItem.findMany({
          where: {
            inventoryId,
            OR: [
              { customName: { contains: itemName, mode: 'insensitive' } },
              { foodItem: { name: { contains: itemName, mode: 'insensitive' } } }
            ]
          }
        });

        if (inventoryItems.length > 0) {
          const item = inventoryItems[0];
          // Log consumption for 1 unit (or some logic to determine amount)
          await inventoryService.logConsumption(clerkId, {
            inventoryId,
            inventoryItemId: item.id,
            itemName: item.customName || itemName,
            quantity: 1, // Defaulting to 1 for now
            unit: item.unit || 'pcs'
          });
          results.push({ item: itemName, status: 'consumed_from_inventory', inventoryItemId: item.id });
        } else {
          // MODIFIED: Log consumption even if not in inventory (Market Buy)
          await inventoryService.logConsumption(clerkId, {
            inventoryId,
            itemName: itemName,
            quantity: 1,
            unit: 'pcs' // Default for market items
          });
          results.push({ item: itemName, status: 'consumed_external' });
        }
      }

      res.json({
        success: true,
        data: results,
        message: `Processed consumption for ${mealName}. Logs generated for all items.`,
      });
    } catch (error: any) {
      console.error('Consume meal error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to consume meal',
      });
    }
  }

  // Get AI-powered dashboard insights
  async getDashboardInsights(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const insights = await aiAnalyticsService.getDashboardInsights(userId);

      res.json({
        success: true,
        data: insights,
        message: 'Dashboard insights generated successfully',
      });
    } catch (error: any) {
      console.error('Dashboard insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate dashboard insights',
      });
    }
  }

  // Chat with AI for personalized insights
  async chatWithAI(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { query } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          error: 'Query is required and must be a string',
        });
      }

      const response = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

      res.json({
        success: true,
        data: response,
        message: 'AI response generated successfully',
      });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate AI response',
      });
    }
  }

  // Get consumption pattern analysis
  async getConsumptionAnalysis(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { timeframe = '30days' } = req.query;

      const analysis = await aiAnalyticsService.getConsumptionAnalysis(
        userId,
        timeframe as string,
      );

      res.json({
        success: true,
        data: analysis,
        timeframe,
        message: 'Consumption analysis completed',
      });
    } catch (error: any) {
      console.error('Consumption analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze consumption patterns',
      });
    }
  }

  // Get waste prediction and prevention suggestions
  async getWastePrediction(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `Predict potential food waste in my current inventory. 
                     Show me items at risk and suggest prevention strategies.`;

      // Offload to BullMQ
      const job = await aiQueue.add('ANALYZE_WASTE', {
        userId,
        action: 'ANALYZE_WASTE',
        data: { query }
      });

      console.log(`🧠 [Controller] Queued Waste Analysis job: ${job.id}`);

      // Wait for result (timeout 30s)
      const prediction = await job.waitUntilFinished(aiQueueEvents, 30000);

      res.json({
        success: true,
        data: prediction,
        message: 'Waste prediction completed',
      });
    } catch (error: any) {
      console.error('Waste prediction error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to predict waste',
      });
    }
  }

  // Get optimized meal plan
  async getOptimizedMealPlan(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { budget, timePeriod, preferences } = req.body;

      let query = `Generate a price-smart meal plan for the period: ${timePeriod || 'one_day'}. `;
      if (budget) query += `The total budget for this entire period is ${budget} BDT. `;
      if (preferences)
        query += `Dietary preferences: ${JSON.stringify(preferences)}. `;
      query += `Use my inventory where possible. Return the result in the requested JSON format.`;

      const mealPlan = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

      if (!mealPlan.success) {
        throw new Error(mealPlan.error || 'Failed to generate meal plan');
      }

      res.json({
        success: true,
        data: mealPlan,
        message: 'Meal plan optimized successfully',
      });
    } catch (error: any) {
      console.error('Meal plan optimization error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to optimize meal plan',
      });
    }
  }

  // Get nutrition gap analysis
  async getNutritionAnalysis(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `Analyze my recent nutrition intake and identify any nutrient gaps. 
                     Provide specific recommendations to improve my diet balance.`;

      const nutritionAnalysis =
        await aiAnalyticsService.generateIntelligentInsights(userId, query);

      res.json({
        success: true,
        data: nutritionAnalysis,
        message: 'Nutrition analysis completed',
      });
    } catch (error: any) {
      console.error('Nutrition analysis error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze nutrition',
      });
    }
  }

  // Get environmental and financial impact
  async getImpactAnalytics(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `Generate my personalized impact analytics. 
                     Show environmental benefits, cost savings, and health improvements 
                     from using this app. Include achievements and future projections.`;

      const impact = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

      res.json({
        success: true,
        data: impact,
        message: 'Impact analytics generated successfully',
      });
    } catch (error: any) {
      console.error('Impact analytics error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate impact analytics',
      });
    }
  }

  // Get local food sharing opportunities
  async getSharingOpportunities(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { location } = req.query;

      let query = `Find local food sharing opportunities near me. `;
      if (location) query += `My location is: ${location}. `;
      query += `Show me ways to donate excess food and connect with my community.`;

      const opportunities =
        await aiAnalyticsService.generateIntelligentInsights(userId, query);

      res.json({
        success: true,
        data: opportunities,
        message: 'Sharing opportunities found successfully',
      });
    } catch (error: any) {
      console.error('Sharing opportunities error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to find sharing opportunities',
      });
    }
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `Based on my complete food management history, provide personalized 
                     recommendations for reducing waste, improving nutrition, saving money, 
                     and helping the environment. Make them specific and actionable.`;

      const recommendations =
        await aiAnalyticsService.generateIntelligentInsights(userId, query);

      res.json({
        success: true,
        data: recommendations,
        message: 'Personalized recommendations generated',
      });
    } catch (error: any) {
      console.error('Recommendations error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate recommendations',
      });
    }
  }

  // Get smart alerts
  async getSmartAlerts(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const query = `Generate smart alerts for me based on my current inventory and patterns. 
                     Alert me about items expiring soon, optimal shopping times, meal prep 
                     reminders, and achievement unlocks.`;

      const alerts = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

      res.json({
        success: true,
        data: alerts,
        message: 'Smart alerts generated successfully',
      });
    } catch (error: any) {
      console.error('Smart alerts error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate smart alerts',
      });
    }
  }

  // Get goal tracking and progress
  async getGoalProgress(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { goals } = req.body;

      let query = `Track my progress toward food waste reduction and health goals. `;
      if (goals) query += `My specific goals are: ${JSON.stringify(goals)}. `;
      query += `Show current progress, achievements, and next steps.`;

      const progress = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

      res.json({
        success: true,
        data: progress,
        message: 'Goal progress tracked successfully',
      });
    } catch (error: any) {
      console.error('Goal progress error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to track goal progress',
      });
    }
  }

  // Get seasonal insights and tips
  async getSeasonalInsights(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const currentMonth = new Date().toLocaleString('default', {
        month: 'long',
      });

      const query = `Provide seasonal insights and tips for ${currentMonth}. 
                     Include seasonal foods to focus on, preservation techniques, 
                     and relevant sustainability practices for this time of year.`;

      const seasonalInsights =
        await aiAnalyticsService.generateIntelligentInsights(userId, query);

      res.json({
        success: true,
        data: seasonalInsights,
        season: currentMonth,
        message: 'Seasonal insights generated successfully',
      });
    } catch (error: any) {
      console.error('Seasonal insights error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to generate seasonal insights',
      });
    }
  }
  // Estimate nutrition
  async estimateNutrition(req: Request, res: Response) {
    try {
      const {
        foodName,
        quantity,
        unit,
        nutritionPerUnit,
        nutritionUnit,
        nutritionBasis,
      } = req.body;
      if (!foodName || !quantity || !unit) {
        return res.status(400).json({
          error: 'foodName, quantity, and unit are required',
        });
      }

      const baseData =
        nutritionPerUnit && nutritionBasis
          ? { nutritionPerUnit, nutritionUnit, nutritionBasis }
          : undefined;

      const nutrition = await aiAnalyticsService.estimateNutrition(
        foodName,
        Number(quantity),
        unit,
        baseData,
      );

      res.json({
        success: true,
        data: nutrition,
        message: 'Nutrition estimated successfully',
      });
    } catch (error: any) {
      console.error('Nutrition estimation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to estimate nutrition',
      });
    }
  }

  // Estimate price
  async estimatePrice(req: Request, res: Response) {
    try {
      const {
        foodName,
        quantity,
        unit,
        basePrice,
        nutritionUnit,
        nutritionBasis,
      } = req.body;
      if (!foodName || !quantity || !unit) {
        return res.status(400).json({
          error: 'foodName, quantity, and unit are required',
        });
      }

      const baseData =
        basePrice && nutritionBasis
          ? { basePrice, nutritionUnit, nutritionBasis }
          : undefined;

      const price = await aiAnalyticsService.estimatePrice(
        foodName,
        Number(quantity),
        unit,
        baseData,
      );

      res.json({
        success: true,
        data: price,
        message: 'Price estimated successfully',
      });
    } catch (error: any) {
      console.error('Price estimation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to estimate price',
      });
    }
  }
  // Estimate item details
  async estimateItemDetails(req: Request, res: Response) {
    try {
      const { foodName, region } = req.body;
      if (!foodName) {
        return res.status(400).json({
          error: 'foodName is required',
        });
      }

      const details = await aiAnalyticsService.estimateItemDetails(
        foodName,
        region,
      );

      res.json({
        success: true,
        data: details,
        message: 'Item details estimated successfully',
      });
    } catch (error: any) {
      console.error('Item details estimation error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to estimate item details',
      });
    }
  }
}

export const intelligentDashboardController =
  new IntelligentDashboardController();
