import Groq from 'groq-sdk';
import prisma from '../config/database';
import { inventoryService } from '../modules/inventories/inventory-service';


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

      // Analyze patterns (Legacy Logic for Time of Day & Category)
      const categoryBreakdown: Record<string, number> = {};
      const timePatterns: Record<string, number> = {};

      // Calculate category consumption
      consumptionLogs.forEach(log => {
        const category = log.inventoryItem?.foodItem?.category || 'Unknown';
        categoryBreakdown[category] =
          (categoryBreakdown[category] || 0) + (log.quantity || 1);
      });

      // Calculate time patterns (meal timing)
      consumptionLogs.forEach(log => {
        const hour = log.consumedAt.getHours();
        const timeSlot =
          hour < 10 ? 'Morning' : hour < 15 ? 'Afternoon' : 'Evening';
        timePatterns[timeSlot] = (timePatterns[timeSlot] || 0) + 1;
      });

      // Calculate consistency score
      const daysCovered = new Set(
        consumptionLogs.map(log => log.consumedAt.toISOString().split('T')[0]),
      ).size;
      const consistencyScore = Math.round((daysCovered / daysAgo) * 100);

      // Fetch new Analytics Data (Daily Nutrition & Cost)
      const analyticsData = await inventoryService.getConsumptionPatterns(
        data.userId,
        startDate,
        new Date(),
      );

      const patterns = {
        totalItems: consumptionLogs.length,
        categoryBreakdown,
        timePatterns,
        consistencyScore,
        favoriteCategories: Object.entries(categoryBreakdown)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category]) => category),
        // Add new fields
        dailyNutrition: analyticsData.dailyNutrition,
        dailyCost: analyticsData.dailyCost
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

      // Get user first
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
      suggestions.push(
        'Use immediately',
        'Consider freezing if possible',
        'Share with neighbors',
      );
    } else if (daysUntilExpiry <= 3) {
      suggestions.push(
        'Plan meals around this item',
        'Prepare in advance',
        'Consider preserving',
      );
    } else {
      suggestions.push('Monitor closely', 'Use in weekly meal plan');
    }

    return suggestions;
  }

  private async generateImpactAnalytics(data: {
    userId: string;
  }): Promise<string> {
    try {
      // Get user first
      const user = await prisma.user.findUnique({
        where: { clerkId: data.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get user's consumption data
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

      // Calculate environmental impact
      const totalItemsConsumed = recentLogs.length;
      const estimatedWastePrevented = totalItemsConsumed * 0.15; // 15% typical waste rate
      const co2Saved = estimatedWastePrevented * 2.5; // kg CO2 per item
      const waterSaved = estimatedWastePrevented * 150; // liters per item
      const moneySaved = estimatedWastePrevented * 3; // average cost per item

      // Calculate nutrition diversity score
      const uniqueCategories = new Set(
        recentLogs.map(log => log.inventoryItem?.foodItem?.category),
      ).size;
      const diversityScore = Math.min(
        Math.round((uniqueCategories / 10) * 100),
        100,
      );

      // Calculate consistency metrics
      const daysWithLogs = new Set(
        recentLogs.map(log => log.consumedAt.toISOString().split('T')[0]),
      ).size;
      const consistencyScore = Math.round((daysWithLogs / 30) * 100);

      const achievements: string[] = [];
      const recommendations: string[] = [];

      // Add achievements
      if (consistencyScore > 80) achievements.push('Consistency Champion');
      if (diversityScore > 70) achievements.push('Nutrition Explorer');
      if (totalItemsConsumed > 50) achievements.push('Tracking Master');
      if (co2Saved > 10) achievements.push('Eco Warrior');

      // Add recommendations
      if (diversityScore < 60) {
        recommendations.push(
          'Try adding more variety to your diet from different food categories',
        );
      }
      if (consistencyScore < 70) {
        recommendations.push(
          'Try to log your meals more regularly for better insights',
        );
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

  // Main orchestration method
  async generateIntelligentInsights(
    userId: string,
    query: string,
  ): Promise<any> {
    const tools = {
      analyze_consumption_patterns: this.analyzeConsumptionPatterns.bind(this),
      predict_waste: this.predictWaste.bind(this),
      generate_impact_analytics: this.generateImpactAnalytics.bind(this),
    };

    const messages: any[] = [
      {
        role: 'system',
        content: `You are an AI assistant for a food waste management app. You help users by:
        - Analyzing consumption patterns and providing insights
        - Predicting potential food waste and suggesting prevention
        - Generating environmental and financial impact analytics

        IMPORTANT: The user ID is already provided as "${userId}". Always use the available tools to gather actual data from the user's account.
        When the user asks for analysis, consumption patterns, waste prediction, or impact analytics, immediately use the appropriate tools.
        
        Use the provided tools to gather data and provide comprehensive, actionable insights.
        Always be helpful, encouraging, and focused on reducing food waste while improving nutrition.`,
      },
      {
        role: 'user',
        content: query,
      },
    ];

    const maxIterations = 3;
    let iteration = 0;

    while (iteration < maxIterations) {
      try {
        const response = await this.groqClient.chat.completions.create({
          model: 'moonshotai/kimi-k2-instruct-0905',
          messages: messages,
          tools: this.getToolSchemas(),
          tool_choice: 'auto',
          temperature: 0.3,
          max_tokens: 2048,
        });

        const responseMessage = response.choices[0].message;

        // If no tool calls, return final response
        if (!responseMessage.tool_calls) {
          return {
            success: true,
            response: responseMessage.content,
            insights: 'Direct response without tool usage',
          };
        }

        // Add assistant message to conversation
        messages.push(responseMessage);

        // Execute tool calls
        for (const toolCall of responseMessage.tool_calls) {
          try {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);

            // Ensure userId is included in tool calls
            if (!functionArgs.userId) {
              functionArgs.userId = userId;
            }

            const toolFunction = tools[functionName as keyof typeof tools];
            if (!toolFunction) {
              throw new Error(`Unknown tool: ${functionName}`);
            }

            const result = await toolFunction(functionArgs);

            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: functionName,
              content: result,
            });
          } catch (error: any) {
            // Add error result
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify({
                success: false,
                error: error.message,
              }),
            });
          }
        }

        iteration++;
      } catch (error: any) {
        return {
          success: false,
          error: `AI service error: ${error.message}`,
          fallback:
            "I'm having trouble accessing your data right now. Please try again later.",
        };
      }
    }

    // Get final response after tool execution
    try {
      const finalResponse = await this.groqClient.chat.completions.create({
        model: 'moonshotai/kimi-k2-instruct-0905',
        messages: messages,
        temperature: 0.3,
        max_tokens: 1024,
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
        error: `Final response error: ${error.message}`,
        fallback: 'Analysis completed but unable to generate final summary.',
      };
    }
  }

  // Direct consumption analysis that always uses tools
  async getConsumptionAnalysis(
    userId: string,
    timeframe: string = '30days',
  ): Promise<any> {
    try {
      // Force tool execution for consumption analysis
      const consumptionData = await this.analyzeConsumptionPatterns({
        userId,
        timeframe,
      });
      const parsedData = JSON.parse(consumptionData);

      if (!parsedData.success) {
        return {
          success: false,
          error: parsedData.error,
          fallback: 'Unable to analyze consumption patterns at this time.',
        };
      }

      // Generate AI interpretation of the data
      const interpretation = await this.groqClient.chat.completions.create({
        model: 'moonshotai/kimi-k2-instruct-0905',
        messages: [
          {
            role: 'system',
            content: `You are a personalized nutrition and financial advisor. Analyze the user's consumption data with a STRONG focus on:
            1. Nutritional Quality: Macronutrient balance, calorie intake trends, and health implications.
            2. Financial Impact: Spending trends, cost-per-meal efficiency, and food budget optimization.
            
            Do NOT focus heavily on "variety of categories" or "diversity score" unless it directly impacts nutrition.
            
            Provide specific, actionable advice to help the user save money and eat healthier.
            Be encouraging but data-driven.`,
          },
          {
            role: 'user',
            content: `Here is my consumption data for the last ${timeframe}: ${JSON.stringify(
              parsedData.patterns,
            )}`,
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
      return {
        success: false,
        error: error.message,
        fallback: 'Unable to analyze consumption patterns at this time.',
      };
    }
  }

  // Quick insights for dashboard
  async getDashboardInsights(userId: string): Promise<any> {
    try {
      const insights = await Promise.all([
        this.analyzeConsumptionPatterns({ userId, timeframe: '7days' }),
        this.generateImpactAnalytics({ userId }),
        this.predictWaste({
          userId,
          items: await this.getCurrentInventoryItems(userId),
        }),
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
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private async getCurrentInventoryItems(userId: string) {
    // Get user first
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return [];
    }

    const items = await prisma.inventoryItem.findMany({
      where: {
        inventory: {
          createdBy: {
            clerkId: userId,
          },
        },
        quantity: { gt: 0 },
      },
      include: { foodItem: true },
      take: 50,
    });

    return items;
  }

  // Estimate nutrition for a food item
  async estimateNutrition(
    foodName: string,
    quantity: number,
    unit: string,
    baseData?: {
      nutritionPerUnit?: any;
      nutritionUnit?: string;
      nutritionBasis?: number;
    },
  ): Promise<any> {
    try {
      let systemContent = `You are a nutrition expert. Estimate the nutritional values for the given food item.
            Return ONLY a JSON object with this exact schema (all values are numbers):
            {
              "calories": number, // kcal
              "protein": number, // grams
              "carbohydrates": number, // grams
              "fat": number, // grams
              "fiber": number, // grams
              "sugar": number, // grams
              "sodium": number // mg
            }
            Do not include any explanation or markdown formatting.`;

      if (baseData?.nutritionPerUnit && baseData?.nutritionBasis) {
        systemContent += `\n\nKNOWN BASE DATA:
        - Nutrition Basis: ${baseData.nutritionBasis} ${baseData.nutritionUnit}
        - Nutrition Values: ${JSON.stringify(baseData.nutritionPerUnit)}
        
        INSTRUCTION: Use this KNOWN BASE DATA to calculate the values for the requested quantity. Perform the unit conversion and math precisely.`;
      }

      const completion = await this.groqClient.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemContent,
          },
          {
            role: 'user',
            content: `Estimate nutrition for: ${quantity} ${unit} of ${foodName}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error: any) {
      console.error('Nutrition estimation error:', error);
      throw new Error(`Failed to estimate nutrition: ${error.message}`);
    }
  }

  // Estimate price for a food item
  async estimatePrice(
    foodName: string,
    quantity: number,
    unit: string,
    baseData?: {
      basePrice?: number;
      nutritionUnit?: string;
      nutritionBasis?: number;
    },
  ): Promise<any> {
    try {
      let systemContent = `You are a grocery pricing expert. Estimate the market price for the given food item.
            Return ONLY a JSON object with this exact schema (all values are numbers):
            {
              "sampleCostPerUnit": number, // Cost for 1 unit of this item (e.g. 1 kg, 1 piece)
              "estimatedPrice": number // Total price for the requested quantity (in BDT)
            }
            Do not include any explanation or markdown formatting.`;

      if (baseData?.basePrice && baseData?.nutritionBasis) {
        systemContent += `\n\nKNOWN BASE DATA:
        - Base Price: ${baseData.basePrice} BDT per ${baseData.nutritionBasis} ${baseData.nutritionUnit}
        
        INSTRUCTION: Use this KNOWN BASE DATA to calculate the estimated price. Perform the math precisely.`;
      }

      const completion = await this.groqClient.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: systemContent,
          },
          {
            role: 'user',
            content: `Estimate price for: ${quantity} ${unit} of ${foodName}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error: any) {
      console.error('Price estimation error:', error);
      throw new Error(`Failed to estimate price: ${error.message}`);
    }
  }

  // Estimate standardized item details (nutrition + base price)
  async estimateItemDetails(
    foodName: string,
    region: string = 'Bangladesh',
  ): Promise<any> {
    try {
      const completion = await this.groqClient.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition and pricing expert for food in ${region}.
            Your goal is to provide STANDARD "Per Unit" data for a food item.
            
            RULES:
            1. Identify if the item is typically measured by weight/volume (e.g. Rice, Milk, Chicken) or count (e.g. Egg, Apple, Burger).
            2. If Weight/Volume: Standardize to 100 GRAMS or 100 ML. Set nutritionBasis = 100. Set nutritionUnit = 'g' or 'ml'.
            3. If Count: Standardize to 1 PIECE/UNIT. Set nutritionBasis = 1. Set nutritionUnit = 'piece'.
            4. Estimate the "basePrice" in BDT (Bangladeshi Taka) for that specific nutritionBasis amount (e.g. Price for 100g, or Price for 1 piece).
            5. Provide nutrition values for that specific nutritionBasis.
            6. Assign a high-level "category" (e.g. Vegetables, Fruits, Meat, Dairy, Grains, Snacks, Beverages, Spices, Other).

            Return JSON ONLY:
            {
              "nutritionPerUnit": { 
                  "calories": number, 
                  "protein": number, 
                  "carbohydrates": number, 
                  "fat": number, 
                  "fiber": number, 
                  "sugar": number, 
                  "sodium": number 
              },
              "nutritionUnit": string, // 'g', 'ml', 'piece'
              "nutritionBasis": number, // 100 or 1
              "basePrice": number, // Price in BDT for the basis amount
              "category": string // One of: "Vegetables", "Fruits", "Meat", "Dairy", "Grains", "Snacks", "Beverages", "Spices", "Other"
            }
            Do not include any explanation or markdown formatting.`,
          },
          {
            role: 'user',
            content: `Provide standard details for: ${foodName}`,
          },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      });

      return JSON.parse(completion.choices[0].message.content || '{}');
    } catch (error: any) {
      console.error('Item details estimation error:', error);
      throw new Error(`Failed to estimate item details: ${error.message}`);
    }
  }
}

export const aiAnalyticsService = new AIAnalyticsService();
