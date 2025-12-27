import { Router } from 'express';
import { ensureUserExists, requireAuth } from '../../middleware/auth';
import { intelligentDashboardController } from './intelligence-controller';

const router = Router();

// Apply authentication and user existence middleware to all intelligence routes
router.use(requireAuth);
router.use(ensureUserExists);

// Dashboard insights
router.get('/dashboard', intelligentDashboardController.getDashboardInsights);

// AI Chat
router.post('/chat', intelligentDashboardController.chatWithAI);

// Consumption analysis
router.get(
  '/consumption-analysis',
  intelligentDashboardController.getConsumptionAnalysis,
);

// Waste prediction
router.get(
  '/waste-prediction',
  intelligentDashboardController.getWastePrediction,
);

// Meal plan optimization
router.post('/meal-plan', intelligentDashboardController.getOptimizedMealPlan);

// Nutrition analysis
router.get(
  '/nutrition-analysis',
  intelligentDashboardController.getNutritionAnalysis,
);

// Impact analytics
router.get(
  '/impact-analytics',
  intelligentDashboardController.getImpactAnalytics,
);

// Sharing opportunities
router.get(
  '/sharing-opportunities',
  intelligentDashboardController.getSharingOpportunities,
);

// Personalized recommendations
router.get(
  '/recommendations',
  intelligentDashboardController.getPersonalizedRecommendations,
);

// Smart alerts
router.get('/alerts', intelligentDashboardController.getSmartAlerts);

// Goal tracking
router.post('/goal-progress', intelligentDashboardController.getGoalProgress);

// Seasonal insights
router.get(
  '/seasonal-insights',
  intelligentDashboardController.getSeasonalInsights,
);

// Estimate nutrition
router.post(
  '/estimate-nutrition',
  intelligentDashboardController.estimateNutrition,
);

// Estimate price
router.post('/estimate-price', intelligentDashboardController.estimatePrice);

// Estimate item details
router.post(
  '/estimate-details',
  intelligentDashboardController.estimateItemDetails,
);

export { router as intelligenceRouter };
