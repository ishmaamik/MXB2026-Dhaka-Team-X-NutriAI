import prisma from '../config/database';

interface UserAnalytics {
    wasteReductionPercentage: number;
    averageDailySpending: number;
    averageWeeklySpending: number;
    budgetRange: number | null;
    dietaryPreference: string | null;
    allergies: string | null;
    healthConditions: string | null;
    topFoodCategories: string[];
    inventoryItemCount: number;
    consumptionFrequency: number; // items consumed per week
    spendingTier: 'budget-conscious' | 'moderate' | 'flexible';
    primaryConcerns: string[]; // e.g., ['budget', 'waste-reduction', 'nutrition']
    location: string | null;
}

interface RecommendationKeywords {
    primary: string[];
    secondary: string[];
    dietary: string[];
    categorySpecific: string[];
}

export class UserAnalyticsService {
    /**
     * Calculate comprehensive user analytics for personalized recommendations
     */
    async getUserAnalytics(userId: string): Promise<UserAnalytics> {
        // Fetch user profile
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                profile: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Calculate waste reduction percentage
        const wasteReductionPercentage = await this.calculateWasteReduction(userId);

        // Calculate spending patterns
        const { averageDailySpending, averageWeeklySpending } = await this.calculateSpendingPatterns(userId);

        // Get inventory composition
        const { topCategories, itemCount } = await this.analyzeInventoryComposition(userId);

        // Calculate consumption frequency
        const consumptionFrequency = await this.calculateConsumptionFrequency(userId);

        // Determine spending tier
        const spendingTier = this.determineSpendingTier(
            user.profile?.budgetRange || null,
            averageWeeklySpending
        );

        // Identify primary concerns
        const primaryConcerns = this.identifyPrimaryConcerns(
            wasteReductionPercentage,
            spendingTier,
            user.profile?.budgetRange || null
        );

        return {
            wasteReductionPercentage,
            averageDailySpending,
            averageWeeklySpending,
            budgetRange: user.profile?.budgetRange || null,
            dietaryPreference: user.profile?.dietaryPreference || null,
            allergies: user.profile?.allergies || null,
            healthConditions: user.profile?.healthConditions || null,
            topFoodCategories: topCategories,
            inventoryItemCount: itemCount,
            consumptionFrequency,
            spendingTier,
            primaryConcerns,
            location: user.profile?.location || null,
        };
    }

    /**
     * Calculate waste reduction percentage based on consumption logs
     * Formula: (consumed items / (consumed + expired items)) * 100
     */
    private async calculateWasteReduction(userId: string): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get user's inventories
        const userInventories = await prisma.inventory.findMany({
            where: {
                OR: [
                    { createdById: userId },
                    { members: { some: { userId } } },
                ],
            },
            select: { id: true },
        });

        const inventoryIds = userInventories.map(inv => inv.id);

        if (inventoryIds.length === 0) {
            return 100; // Default to 100% if no data
        }

        // Count consumed items
        const consumedCount = await prisma.consumptionLog.count({
            where: {
                inventoryId: { in: inventoryIds },
                consumedAt: { gte: thirtyDaysAgo },
            },
        });

        // Count expired/wasted items (items that expired without being consumed)
        const expiredItems = await prisma.inventoryItem.count({
            where: {
                inventoryId: { in: inventoryIds },
                expiryDate: {
                    gte: thirtyDaysAgo,
                    lte: new Date(),
                },
                removed: false,
                consumptionLogs: {
                    none: {},
                },
            },
        });

        const totalItems = consumedCount + expiredItems;
        if (totalItems === 0) {
            return 100;
        }

        return Math.round((consumedCount / totalItems) * 100);
    }

    /**
     * Calculate average daily and weekly spending from consumption logs
     */
    private async calculateSpendingPatterns(userId: string): Promise<{
        averageDailySpending: number;
        averageWeeklySpending: number;
    }> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get user's inventories
        const userInventories = await prisma.inventory.findMany({
            where: {
                OR: [
                    { createdById: userId },
                    { members: { some: { userId } } },
                ],
            },
            select: { id: true },
        });

        const inventoryIds = userInventories.map(inv => inv.id);

        if (inventoryIds.length === 0) {
            return { averageDailySpending: 0, averageWeeklySpending: 0 };
        }

        // Sum total costs from consumption logs
        const consumptionLogs = await prisma.consumptionLog.findMany({
            where: {
                inventoryId: { in: inventoryIds },
                consumedAt: { gte: thirtyDaysAgo },
                cost: { not: null },
            },
            select: {
                cost: true,
            },
        });

        const totalSpending = consumptionLogs.reduce((sum, log) => sum + (log.cost || 0), 0);
        const averageDailySpending = totalSpending / 30;
        const averageWeeklySpending = (totalSpending / 30) * 7;

        return {
            averageDailySpending: Math.round(averageDailySpending * 100) / 100,
            averageWeeklySpending: Math.round(averageWeeklySpending * 100) / 100,
        };
    }

    /**
     * Analyze inventory composition to identify top food categories
     */
    private async analyzeInventoryComposition(userId: string): Promise<{
        topCategories: string[];
        itemCount: number;
    }> {
        // Get user's inventories
        const userInventories = await prisma.inventory.findMany({
            where: {
                OR: [
                    { createdById: userId },
                    { members: { some: { userId } } },
                ],
            },
            select: { id: true },
        });

        const inventoryIds = userInventories.map(inv => inv.id);

        if (inventoryIds.length === 0) {
            return { topCategories: [], itemCount: 0 };
        }

        // Get current inventory items with their food item categories
        const inventoryItems = await prisma.inventoryItem.findMany({
            where: {
                inventoryId: { in: inventoryIds },
                removed: false,
                isDeleted: false,
            },
            include: {
                foodItem: {
                    select: {
                        category: true,
                    },
                },
            },
        });

        const itemCount = inventoryItems.length;

        // Count categories
        const categoryCount: Record<string, number> = {};
        inventoryItems.forEach(item => {
            const category = item.foodItem?.category;
            if (category) {
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            }
        });

        // Sort by count and get top 3
        const topCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([category]) => category);

        return { topCategories, itemCount };
    }

    /**
     * Calculate how many items user consumes per week on average
     */
    private async calculateConsumptionFrequency(userId: string): Promise<number> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get user's inventories
        const userInventories = await prisma.inventory.findMany({
            where: {
                OR: [
                    { createdById: userId },
                    { members: { some: { userId } } },
                ],
            },
            select: { id: true },
        });

        const inventoryIds = userInventories.map(inv => inv.id);

        if (inventoryIds.length === 0) {
            return 0;
        }

        const consumptionCount = await prisma.consumptionLog.count({
            where: {
                inventoryId: { in: inventoryIds },
                consumedAt: { gte: thirtyDaysAgo },
            },
        });

        // Convert to weekly average
        return Math.round((consumptionCount / 30) * 7 * 10) / 10;
    }

    /**
     * Determine user's spending tier based on budget and actual spending
     */
    private determineSpendingTier(
        budgetRange: number | null,
        averageWeeklySpending: number
    ): 'budget-conscious' | 'moderate' | 'flexible' {
        // If budget is set and spending is close to or exceeds it, user is budget-conscious
        if (budgetRange !== null) {
            const monthlyBudget = budgetRange;
            const weeklyBudget = monthlyBudget / 4;

            if (averageWeeklySpending >= weeklyBudget * 0.8) {
                return 'budget-conscious';
            }
            if (averageWeeklySpending >= weeklyBudget * 0.5) {
                return 'moderate';
            }
            return 'flexible';
        }

        // If no budget set, categorize by spending amount (in BDT)
        if (averageWeeklySpending < 1500) {
            return 'budget-conscious';
        }
        if (averageWeeklySpending < 3000) {
            return 'moderate';
        }
        return 'flexible';
    }

    /**
     * Identify user's primary concerns for targeted recommendations
     */
    private identifyPrimaryConcerns(
        wasteReductionPercentage: number,
        spendingTier: string,
        budgetRange: number | null
    ): string[] {
        const concerns: string[] = [];

        // Budget is a concern if user has set a budget or is budget-conscious
        if (budgetRange !== null || spendingTier === 'budget-conscious') {
            concerns.push('budget');
        }

        // Waste reduction is a concern if percentage is below 80%
        if (wasteReductionPercentage < 80) {
            concerns.push('waste-reduction');
        }

        // Nutrition is always a secondary concern
        concerns.push('nutrition');

        return concerns;
    }

    /**
     * Generate recommendation keywords based on user profile and consumption
     */
    async generateRecommendationKeywords(userId: string): Promise<{
        primary: string[];
        secondary: string[];
        dietary: string[];
        categorySpecific: string[];
        consumptionBased: string[];
    }> {
        const analytics = await this.getUserAnalytics(userId);
        const keywords = {
            primary: [] as string[],
            secondary: [] as string[],
            dietary: [] as string[],
            categorySpecific: [] as string[],
            consumptionBased: [] as string[],
        };

        // Primary keywords based on main concerns
        if (analytics.primaryConcerns.includes('budget')) {
            keywords.primary.push('budget meal planning', 'affordable recipes', 'cheap healthy food');
        }
        if (analytics.primaryConcerns.includes('waste-reduction')) {
            keywords.primary.push('reduce food waste', 'leftover recipes', 'zero waste cooking');
        }
        if (analytics.primaryConcerns.includes('nutrition')) {
            keywords.primary.push('healthy eating', 'nutritious meals', 'balanced diet');
        }

        // Secondary keywords based on spending tier
        if (analytics.spendingTier === 'budget-conscious') {
            keywords.secondary.push('budget cooking tips', 'meal prep on a budget', 'frugal meals');
        } else if (analytics.spendingTier === 'flexible') {
            keywords.secondary.push('gourmet recipes', 'premium ingredients', 'fine dining at home');
        } else {
            keywords.secondary.push('everyday meals', 'family recipes', 'simple cooking');
        }

        // Dietary preference keywords
        if (analytics.dietaryPreference) {
            const pref = analytics.dietaryPreference.toLowerCase();
            if (pref.includes('vegetarian')) {
                keywords.dietary.push('vegetarian recipes', 'plant-based meals', 'meatless cooking');
            }
            if (pref.includes('vegan')) {
                keywords.dietary.push('vegan recipes', 'vegan nutrition', 'plant-based diet');
            }
            if (pref.includes('keto')) {
                keywords.dietary.push('keto recipes', 'low carb meals', 'ketogenic diet');
            }
            if (pref.includes('paleo')) {
                keywords.dietary.push('paleo recipes', 'paleo diet', 'whole food cooking');
            }
        }

        // Health condition keywords
        if (analytics.healthConditions) {
            const conditions = analytics.healthConditions.toLowerCase();
            if (conditions.includes('diabetes')) {
                keywords.dietary.push('diabetic-friendly recipes', 'low sugar meals', 'blood sugar control');
            }
            if (conditions.includes('hypertension') || conditions.includes('high blood pressure')) {
                keywords.dietary.push('low sodium recipes', 'heart-healthy meals', 'DASH diet');
            }
        }

        // Category-specific keywords from inventory
        analytics.topFoodCategories.forEach((category: string) => {
            const categoryLower = category.toLowerCase();
            keywords.categorySpecific.push(
                `${category} recipes`,
                `how to cook ${category}`,
                `${category} storage tips`
            );
        });

        // NEW: Consumption-based keywords from ALL consumption logs
        const consumptionKeywords = await this.getConsumptionBasedKeywords(userId);
        keywords.consumptionBased.push(...consumptionKeywords);

        // NEW: Regional cuisine keywords based on location
        if (analytics.location) {
            const loc = analytics.location.toLowerCase();
            if (loc.includes('bangladesh') || loc.includes('dhaka') || loc.includes('chittagong')) {
                keywords.categorySpecific.push('bangladeshi recipes', 'bengali cuisine', 'bangladeshi street food');
                // Also add to primary to ensure some visibility
                keywords.primary.push('bangladeshi recipes');
            } else if (loc.includes('india') || loc.includes('kolkata')) { // Example logic for other regions
                keywords.categorySpecific.push('indian recipes', 'bengali cuisine');
            }
        }

        console.log(`🎯 Recommendation keywords for user ${userId}:`);
        console.log(`  Primary (${keywords.primary.length}):`, keywords.primary);
        console.log(`  Consumption-based (${keywords.consumptionBased.length}):`, keywords.consumptionBased);
        console.log(`  Dietary (${keywords.dietary.length}):`, keywords.dietary);
        console.log(`  Category-specific (${keywords.categorySpecific.length}):`, keywords.categorySpecific);
        console.log(`  Secondary (${keywords.secondary.length}):`, keywords.secondary);

        return keywords;
    }

    /**
     * Get keywords from user's consumption history
     */
    private async getConsumptionBasedKeywords(userId: string): Promise<string[]> {
        try {
            // Get all consumption logs for the user (last 90 days)
            const ninetyDaysAgo = new Date();
            ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

            console.log(`🔍 Fetching consumption logs for user ${userId} since ${ninetyDaysAgo.toISOString()}`);

            const consumptionLogs = await prisma.consumptionLog.findMany({
                where: {
                    OR: [
                        {
                            inventory: {
                                createdById: userId,
                            },
                        },
                        {
                            inventory: {
                                members: {
                                    some: {
                                        userId: userId,
                                    },
                                },
                            },
                        },
                    ],
                    consumedAt: {
                        gte: ninetyDaysAgo,
                    },
                    isDeleted: false,
                },
                select: {
                    itemName: true,
                    foodItem: {
                        select: {
                            name: true,
                            category: true,
                        },
                    },
                },
                orderBy: {
                    consumedAt: 'desc',
                },
                take: 100, // Last 100 consumption items
            });

            console.log(`📦 Found ${consumptionLogs.length} consumption logs`);
            if (consumptionLogs.length > 0) {
                console.log(`📦 Sample consumption log:`, {
                    itemName: consumptionLogs[0].itemName,
                    foodItemName: consumptionLogs[0].foodItem?.name,
                    foodItemCategory: consumptionLogs[0].foodItem?.category,
                });
            }

            const keywords = new Set<string>();

            // Extract food names and categories
            consumptionLogs.forEach(log => {
                // Add item name
                if (log.itemName) {
                    const cleanName = log.itemName.toLowerCase().trim();
                    keywords.add(`${cleanName} recipes`);
                    keywords.add(`how to cook ${cleanName}`);
                }

                // Add food item name and category
                if (log.foodItem) {
                    if (log.foodItem.name) {
                        const cleanName = log.foodItem.name.toLowerCase().trim();
                        keywords.add(`${cleanName} recipes`);
                    }
                    if (log.foodItem.category) {
                        const cleanCategory = log.foodItem.category.toLowerCase().trim();
                        keywords.add(`${cleanCategory} recipes`);
                        keywords.add(`${cleanCategory} meal ideas`);
                    }
                }
            });

            // Return top 20 most relevant keywords
            const keywordArray = Array.from(keywords).slice(0, 20);
            console.log(`📊 Generated ${keywordArray.length} consumption-based keywords for user ${userId}:`, keywordArray);
            return keywordArray;
        } catch (error) {
            console.error('Error getting consumption-based keywords:', error);
            return [];
        }
    }
}

export const userAnalyticsService = new UserAnalyticsService();
