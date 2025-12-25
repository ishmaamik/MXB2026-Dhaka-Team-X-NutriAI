import { Request, Response } from 'express';
import { aiAnalyticsService } from '../../services/aiAnalyticsService';

export class IntelligentDashboardController {
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

      // Use direct consumption analysis method
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

      const prediction = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

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

      const { budget, preferences } = req.body;

      let query = `Create an optimized weekly meal plan using my current inventory. `;
      if (budget) query += `My weekly budget is $${budget}. `;
      if (preferences)
        query += `My dietary preferences: ${JSON.stringify(preferences)}. `;
      query += `Focus on minimizing waste and maximizing nutrition.`;

      const mealPlan = await aiAnalyticsService.generateIntelligentInsights(
        userId,
        query,
      );

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
}

export const intelligentDashboardController =
  new IntelligentDashboardController();
