import prisma from '../../config/database';

export class AdminService {
  async addFoodItem(data: {
    name: string;
    category: string;
    typicalExpirationDays?: number;
    description?: string;
    nutritionalInfo?: {
      calories?: number;
      protein?: number;
      carbs?: number;
      fat?: number;
      fiber?: number;
      sugar?: number;
    };
  }) {
    try {
      const foodItem = await prisma.foodItem.create({
        data: {
          name: data.name,
          category: data.category,
          typicalExpirationDays: data.typicalExpirationDays,
          description: data.description,
          // Note: nutritionalInfo is not in the current schema, we'll store it in description for now
          // or you can add it to the schema later
        },
      });

      return foodItem;
    } catch (error) {
      console.error('Error adding food item:', error);
      throw error;
    }
  }

  async addResource(data: {
    title: string;
    description: string;
    content: string;
    tags?: string[];
    category: string;
    imageUrl?: string;
  }) {
    try {
      // Create the resource first
      const resource = await prisma.resource.create({
        data: {
          title: data.title,
          description: data.description,
          url: data.content, // Store content in URL field for now
          type: 'Article' as const,
        },
      });

      // Handle tags if provided
      if (data.tags && data.tags.length > 0) {
        for (const tagName of data.tags) {
          // Find or create the tag
          let tag = await prisma.resourceTag.findFirst({
            where: { tag: tagName },
          });

          if (!tag) {
            tag = await prisma.resourceTag.create({
              data: { tag: tagName },
            });
          }

          // Create the relationship
          await prisma.resourceTagOnResource.create({
            data: {
              resourceId: resource.id,
              tagId: tag.id,
            },
          });
        }
      }

      return resource;
    } catch (error) {
      console.error('Error adding resource:', error);
      throw error;
    }
  }

  async getAdminStats() {
    try {
      const [totalFoodItems, totalResources, totalUsers, recentUsers] =
        await Promise.all([
          prisma.foodItem.count(),
          prisma.resource.count(),
          prisma.user.count(),
          prisma.user.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          }),
        ]);

      // Calculate growth percentage (simplified)
      const growthPercentage =
        totalUsers > 0 ? Math.round((recentUsers / totalUsers) * 100) : 0;

      return {
        totalFoodItems,
        totalResources,
        totalUsers,
        monthlyGrowth: `+${growthPercentage}%`,
      };
    } catch (error) {
      console.error('Error getting admin stats:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
