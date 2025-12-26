import Groq from 'groq-sdk';
import prisma from '../config/database';

class AIAnalyticsService {
  private groqClient: Groq;

  constructor() {
    this.groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  // Tool Schemas for Groq
  private getToolSchemas() {
    return [
      {
        type: 'function' as const,
        function: {
          name: 'analyze_consumption_patterns',
          description:
            "Analyzes user's food consumption patterns to identify trends, preferences, and habits",
          parameters: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: "The user's unique identifier",
              },
              timeframe: {
                type: 'string',
                description: 'Analysis timeframe (7days, 30days, 90days)',
                enum: ['7days', '30days', '90days'],
              },
            },
            required: ['userId'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'predict_waste',
          description:
            'Predicts potential food waste based on current inventory and consumption patterns',
          parameters: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: "The user's unique identifier",
              },
              items: {
                type: 'array',
                description:
                  'Current inventory items to analyze for waste prediction',
              },
            },
            required: ['userId', 'items'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'generate_impact_analytics',
          description:
            'Generates personalized environmental and financial impact analytics',
          parameters: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: "The user's unique identifier",
              },
            },
            required: ['userId'],
          },
        },
      },
      {
        type: 'function' as const,
        function: {
          name: 'generate_price_smart_meal_plan',
          description: 'Generates a budget-friendly and health-conscious meal plan considering market prices and inventory',
          parameters: {
            type: 'object',
            properties: {
              userId: { type: 'string' },
              timePeriod: {
                type: 'string',
                enum: ['breakfast', 'lunch', 'dinner', 'one_day', 'one_week'],
                description: 'The period to plan for (single meals or full days/week)'
              },
              budget: { type: 'number', description: 'Budget in BDT' }
            },
            required: ['userId', 'timePeriod', 'budget']
          }
        }
      }
    ];
  }

  // Tool Implementations
  private async analyzeConsumptionPatterns(data: {
    userId: string;
    timeframe?: string;
  }): Promise<string> {
    try {
      const timeframe = data.timeframe || '30days';
      const daysAgo =
        timeframe === '7days' ? 7 : timeframe === '30days' ? 30 : 90;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Get user by clerkId first
      const user = await prisma.user.findUnique({
        where: { clerkId: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const consumptionLogs = await prisma.consumptionLog.findMany({
        where: {
          inventory: {
            createdBy: {
              clerkId: data.userId,
            },
          },
          consumedAt: {
            gte: startDate,
          },
        },
        include: {
          inventoryItem: {
            include: {
              foodItem: true,
            },
          },
        },
        orderBy: {
          consumedAt: 'desc',
        },
      });

      // Analyze patterns
      const categoryBreakdown: Record<string, number> = {};
      const timePatterns: Record<string, number> = {};

      consumptionLogs.forEach(log => {
        const category = log.inventoryItem?.foodItem?.category || 'Unknown';
        categoryBreakdown[category] =
          (categoryBreakdown[category] || 0) + (log.quantity || 1);
      });

      consumptionLogs.forEach(log => {
        const hour = log.consumedAt.getHours();
        const timeSlot =
          hour < 10 ? 'Morning' : hour < 15 ? 'Afternoon' : 'Evening';
        timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1;
      });

      const daysCovered = new Set(
        consumptionLogs.map(log => log.consumedAt.toISOString().split('T')[0]),
      ).size;
      const consistencyScore = Math.round((daysCovered / daysAgo) * 100);

      const patterns = {
        totalItems: consumptionLogs.length,
        categoryBreakdown,
        timePatterns,
        consistencyScore,
        favoriteCategories: Object.entries(categoryBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category),
      };

      return JSON.stringify({
        success: true,
        timeframe,
        patterns,
        insights: [
          `You've consumed ${patterns.totalItems} items in the last ${daysAgo} days`,
          `Your consistency score is ${patterns.consistencyScore}%`,
          `Top food category: ${patterns.favoriteCategories[0] || 'N/A'}`,
        ],
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Unable to analyze consumption patterns at this time.',
      });
    }
  }

  private async predictWaste(data: {
    userId: string;
    items: any[];
  }): Promise<string> {
    try {
      const currentDate = new Date();
      const user = await prisma.user.findUnique({
        where: { clerkId: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const wasteRiskItems: Array<{
        id: string;
        name: string;
        quantity: number;
        expiryDate: Date | null;
        daysUntilExpiry: number;
        wasteRisk: 'High' | 'Medium' | 'Low';
        estimatedValue: number;
        suggestions: string[];
      }> = [];

      let totalWasteValue = 0;
      let co2Impact = 0;

      for (const item of data.items) {
        if (!item.expiryDate) continue;

        const expiryDate = new Date(item.expiryDate);
        const daysUntilExpiry = Math.ceil(
          (expiryDate.getTime() - currentDate.getTime()) /
          (1000 * 60 * 60 * 24),
        );

        const wasteRisk: 'High' | 'Medium' | 'Low' =
          daysUntilExpiry <= 2
            ? 'High'
            : daysUntilExpiry <= 5
              ? 'Medium'
              : 'Low';

        if (wasteRisk !== 'Low') {
          const estimatedWasteValue =
            (item.sampleCostPerUnit || 2) * (item.quantity || 1);
          totalWasteValue += estimatedWasteValue;
          co2Impact += estimatedWasteValue * 2.5;

          wasteRiskItems.push({
            id: item.id,
            name: item.customName || item.foodItem?.name || 'Unknown Item',
            quantity: item.quantity,
            expiryDate: item.expiryDate,
            daysUntilExpiry,
            wasteRisk,
            estimatedValue: estimatedWasteValue,
            suggestions: this.getWastePrevention(daysUntilExpiry),
          });
        }
      }

      return JSON.stringify({
        success: true,
        wasteRiskItems,
        totalPotentialWasteValue: Math.round(totalWasteValue * 100) / 100,
        estimatedCO2Impact: Math.round(co2Impact * 100) / 100,
        summary: {
          highRisk: wasteRiskItems.filter(item => item.wasteRisk === 'High')
            .length,
          mediumRisk: wasteRiskItems.filter(item => item.wasteRisk === 'Medium')
            .length,
          totalAtRisk: wasteRiskItems.length,
        },
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Unable to predict waste at this time.',
      });
    }
  }

  private getWastePrevention(daysUntilExpiry: number): string[] {
    const suggestions: string[] = [];
    if (daysUntilExpiry <= 1) {
      suggestions.push('Use immediately', 'Consider freezing if possible', 'Share with neighbors');
    } else if (daysUntilExpiry <= 3) {
      suggestions.push('Plan meals around this item', 'Prepare in advance', 'Consider preserving');
    } else {
      suggestions.push('Monitor closely', 'Use in weekly meal plan');
    }
    return suggestions;
  }

  private async generateImpactAnalytics(data: {
    userId: string;
  }): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const consumptionLogs = await prisma.consumptionLog.findMany({
        where: {
          inventory: {
            createdBy: {
              clerkId: data.userId,
            },
          },
        },
        include: {
          inventoryItem: {
            include: { foodItem: true },
          },
        },
      });

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLogs = consumptionLogs.filter(
        log => log.consumedAt >= thirtyDaysAgo,
      );

      const totalItemsConsumed = recentLogs.length;
      const estimatedWastePrevented = totalItemsConsumed * 0.15;
      const co2Saved = estimatedWastePrevented * 2.5;
      const waterSaved = estimatedWastePrevented * 150;
      const moneySaved = estimatedWastePrevented * 3;

      const uniqueCategories = new Set(
        recentLogs.map(log => log.inventoryItem?.foodItem?.category),
      ).size;
      const diversityScore = Math.min(
        Math.round((uniqueCategories / 10) * 100),
        100,
      );

      const daysWithLogs = new Set(
        recentLogs.map(log => log.consumedAt.toISOString().split('T')[0]),
      ).size;
      const consistencyScore = Math.round((daysWithLogs / 30) * 100);

      const achievements: string[] = [];
      const recommendations: string[] = [];

      if (consistencyScore > 80) achievements.push('Consistency Champion');
      if (diversityScore > 70) achievements.push('Nutrition Explorer');
      if (totalItemsConsumed > 50) achievements.push('Tracking Master');
      if (co2Saved > 10) achievements.push('Eco Warrior');

      if (diversityScore < 60) {
        recommendations.push('Try adding more variety to your diet from different food categories');
      }
      if (consistencyScore < 70) {
        recommendations.push('Try to log your meals more regularly for better insights');
      }

      const impact = {
        environmental: {
          co2Saved: Math.round(co2Saved * 100) / 100,
          waterSaved: Math.round(waterSaved),
          wastePrevented: Math.round(estimatedWastePrevented * 100) / 100,
        },
        financial: {
          moneySaved: Math.round(moneySaved * 100) / 100,
          avgSavingsPerDay: Math.round((moneySaved / 30) * 100) / 100,
        },
        health: {
          diversityScore,
          consistencyScore,
          totalItemsTracked: totalItemsConsumed,
        },
        achievements,
        recommendations,
      };

      return JSON.stringify({
        success: true,
        period: 'Last 30 days',
        impact,
        projectedAnnualImpact: {
          co2Saved: Math.round(co2Saved * 12 * 100) / 100,
          waterSaved: Math.round(waterSaved * 12),
          moneySaved: Math.round(moneySaved * 12 * 100) / 100,
        },
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message,
        fallback: 'Unable to generate impact analytics at this time.',
      });
    }
  }

  private async getMarketPrices() {
    return {
      proteins: [
        { name: 'Broiler Chicken', price: 280, unit: 'kg', trend: 'up' },
        { name: 'Layer Chicken', price: 350, unit: 'kg', trend: 'stable' },
        { name: 'Beef', price: 780, unit: 'kg', trend: 'up' },
        { name: 'Mutton', price: 1100, unit: 'kg', trend: 'stable' },
        { name: 'Pangas Fish', price: 180, unit: 'kg', trend: 'down' },
        { name: 'Tilapia Fish', price: 220, unit: 'kg', trend: 'stable' },
        { name: 'Ruhi Fish', price: 350, unit: 'kg', trend: 'up' },
        { name: 'Eggs', price: 145, unit: 'dozen', trend: 'stable' },
        { name: 'Lentils (Masur Dal)', price: 140, unit: 'kg', trend: 'stable' }
      ],
      vegetables: [
        { name: 'Potato', price: 55, unit: 'kg', trend: 'up' },
        { name: 'Onion', price: 120, unit: 'kg', trend: 'up' },
        { name: 'Green Chili', price: 200, unit: 'kg', trend: 'up' },
        { name: 'Tomato', price: 100, unit: 'kg', trend: 'down' },
        { name: 'Brinjal', price: 80, unit: 'kg', trend: 'stable' },
        { name: 'Spinach', price: 20, unit: 'bunch', trend: 'stable' }
      ],
      grains: [
        { name: 'Miniket Rice', price: 72, unit: 'kg', trend: 'stable' },
        { name: 'Nazirshail Rice', price: 85, unit: 'kg', trend: 'up' },
        { name: 'Atta (Flour)', price: 55, unit: 'kg', trend: 'stable' }
      ],
      lastUpdated: new Date().toISOString()
    };
  }

  private async generatePriceSmartMealPlan(data: {
    userId: string;
    timePeriod: 'breakfast' | 'lunch' | 'dinner' | 'one_day' | 'one_week';
    budget: number;
  }): Promise<string> {
    try {
      const user = await prisma.user.findUnique({
        where: { clerkId: data.userId },
        include: { profile: true }
      });

      if (!user) throw new Error('User not found');

      const inventory = await this.getCurrentInventoryItems(data.userId);
      const marketPrices = await this.getMarketPrices();

      return JSON.stringify({
        success: true,
        userProfile: {
          height: (user.profile as any)?.height,
          weight: (user.profile as any)?.weight,
          preference: (user.profile as any)?.weightPreference,
          allergies: (user.profile as any)?.allergies,
          dietaryPreference: user.profile?.dietaryPreference
        },
        inventory: inventory.map(i => ({
          name: i.customName || i.foodItem?.name,
          quantity: i.quantity,
          unit: i.unit,
          expiry: i.expiryDate
        })),
        marketPrices,
        request: {
          timePeriod: data.timePeriod,
          budget: data.budget
        }
      });
    } catch (error: any) {
      return JSON.stringify({
        success: false,
        error: error.message
      });
    }
  }

  async generateIntelligentInsights(userId: string, query: string): Promise<any> {
    const tools = {
      analyze_consumption_patterns: this.analyzeConsumptionPatterns.bind(this),
      predict_waste: this.predictWaste.bind(this),
      generate_impact_analytics: this.generateImpactAnalytics.bind(this),
      generate_price_smart_meal_plan: this.generatePriceSmartMealPlan.bind(this),
    };

    const systemPrompt = `You are an AI assistant for a food waste management app. You help users by:
        - Analyzing consumption patterns and providing insights
        - Predicting potential food waste and suggesting prevention
        - Generating environmental and financial impact analytics
        - Generating Price-Smart Meal Plans considering market prices in Bangladesh and user inventory

        IMPORTANT: For "Price-Smart Meal Plans", follow these rules:
        1. Consider the user's health metrics and allergies.
        2. Calculate the required nutrition based on their profile.
        3. For EACH meal, provide TWO distinct options:
           - Option 1 (Inventory-Based): Use ingredients from the user's currently available inventory.
           - Option 2 (Market-Based): Suggest a health-conscious and budget-friendly option.
        4. Respect the BDT budget strictly for the ENTIRE period.
        5. For single meals, 1 meal. For one day, 5 meals. For one week, 21 meals.
        6. Always state if inventory ingredients are insufficient. 
        7. MANDATORY: For meal plans, you MUST return a structured JSON object as your ONLY response.
        8. REQUIRED JSON STRUCTURE:
           {
             "isMealPlan": true,
             "summary": "Nutrition/budget summary",
             "meals": [
               {
                 "type": "Breakfast/Lunch/Dinner",
                 "name": "Dish Name",
                 "nutrition": { "calories": 400, "protein": "20g", "carbs": "50g", "fat": "15g" },
                 "option1": { "name": "Inventory Version", "items": ["item1"], "cost": 0 },
                 "option2": { "name": "Market Version", "items": ["item2"], "cost": 150 }
               }
             ],
             "totalEstimatedCost": 1200
           }
        9. Avoid conversational preamble. Output strictly the JSON if a meal plan is requested.
        10. Strictly adhere to the BDT budget.

        User ID is "${userId}". Always use the tools to get data.`;

    const messages: any[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      { role: 'user', content: query },
    ];

    const maxIterations = 3;
    let iteration = 0;

    while (iteration < maxIterations) {
      try {
        const response = await this.groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: messages,
          tools: this.getToolSchemas(),
          tool_choice: 'auto',
          temperature: 0.1,
          max_tokens: 4096,
        });

        const responseMessage = response.choices[0].message;
        if (!responseMessage.tool_calls) {
          return {
            success: true,
            response: responseMessage.content,
            insights: 'Direct response without tool usage',
          };
        }

        messages.push(responseMessage);

        for (const toolCall of responseMessage.tool_calls) {
          try {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            if (!functionArgs.userId) functionArgs.userId = userId;

            const toolFunction = tools[functionName as keyof typeof tools];
            if (!toolFunction) throw new Error(`Unknown tool: ${functionName}`);

            const result = await toolFunction(functionArgs);
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: result,
            });
          } catch (error: any) {
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({ success: false, error: error.message }),
            });
          }
        }
        iteration++;
      } catch (error: any) {
        return {
          success: false,
          error: `AI service error: ${error.message}`,
          fallback: "I'm having trouble accessing your data right now. Please try again later.",
        };
      }
    }

    try {
      const finalResponse = await this.groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: messages,
        temperature: 0.1,
        max_tokens: 4000,
      });

      return {
        success: true,
        response: finalResponse.choices[0].message.content,
        toolsUsed: iteration,
        insights: 'Generated using AI analysis tools',
      };
    } catch (error: any) {
      return {
        success: false,
        error: `Final response generation error: ${error.message}`,
      };
    }
  }
  async getConsumptionAnalysis(userId: string, timeframe: string = '30days'): Promise<any> {
    try {
      const consumptionData = await this.analyzeConsumptionPatterns({ userId, timeframe });
      const parsedData = JSON.parse(consumptionData);

      if (!parsedData.success) {
        return {
          success: false,
          error: parsedData.error,
          fallback: 'Unable to analyze consumption patterns at this time.',
        };
      }

      const interpretation = await this.groqClient.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are a food waste management expert. Analyze the following consumption data and provide insights, recommendations, and encouragement to the user.`,
          },
          {
            role: 'user',
            content: `Here is my consumption data for the last ${timeframe}: ${JSON.stringify(parsedData.patterns)}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      });

      return {
        success: true,
        rawData: parsedData,
        aiInsights: interpretation.choices[0].message.content,
        timeframe,
        summary: {
          totalItems: parsedData.patterns.totalItems,
          consistencyScore: parsedData.patterns.consistencyScore,
          topCategories: parsedData.patterns.favoriteCategories,
          patterns: parsedData.patterns.timePatterns,
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message, fallback: 'Unable to analyze consumption patterns at this time.' };
    }
  }

  async getDashboardInsights(userId: string): Promise<any> {
    try {
      const insights = await Promise.all([
        this.analyzeConsumptionPatterns({ userId, timeframe: '7days' }),
        this.generateImpactAnalytics({ userId }),
        this.predictWaste({ userId, items: await this.getCurrentInventoryItems(userId) }),
      ]);

      return {
        success: true,
        insights: {
          consumption: JSON.parse(insights[0]),
          impact: JSON.parse(insights[1]),
          waste: JSON.parse(insights[2]),
        },
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async getCurrentInventoryItems(userId: string) {
    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return [];

    const items = await prisma.inventoryItem.findMany({
      where: {
        inventory: { createdBy: { clerkId: userId } },
        quantity: { gt: 0 },
      },
      include: { foodItem: true },
      take: 50,
    });
    return items;
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
