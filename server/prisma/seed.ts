import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample FoodItem entries with categories
  const foodItems = await prisma.foodItem.createMany({
    data: [
      // Fruits
      {
        name: 'Apple',
        unit: 'pcs',
        category: 'fruit',
        typicalExpirationDays: 7,
        sampleCostPerUnit: 0.5,
        description: 'Fresh red apples'
      },
      {
        name: 'Banana',
        unit: 'pcs',
        category: 'fruit',
        typicalExpirationDays: 5,
        sampleCostPerUnit: 0.3,
        description: 'Ripe yellow bananas'
      },
      {
        name: 'Orange',
        unit: 'pcs',
        category: 'fruit',
        typicalExpirationDays: 14,
        sampleCostPerUnit: 0.6,
        description: 'Fresh oranges'
      },
      {
        name: 'Grapes',
        unit: 'kg',
        category: 'fruit',
        typicalExpirationDays: 5,
        sampleCostPerUnit: 3.0,
        description: 'Green seedless grapes'
      },
      {
        name: 'Strawberries',
        unit: 'kg',
        category: 'fruit',
        typicalExpirationDays: 3,
        sampleCostPerUnit: 4.5,
        description: 'Fresh strawberries'
      },
      {
        name: 'Mango',
        unit: 'pcs',
        category: 'fruit',
        typicalExpirationDays: 7,
        sampleCostPerUnit: 1.5,
        description: 'Fresh mangoes'
      },

      // Vegetables
      {
        name: 'Carrots',
        unit: 'kg',
        category: 'vegetable',
        typicalExpirationDays: 21,
        sampleCostPerUnit: 1.2,
        description: 'Fresh carrots'
      },
      {
        name: 'Lettuce',
        unit: 'pcs',
        category: 'vegetable',
        typicalExpirationDays: 7,
        sampleCostPerUnit: 1.5,
        description: 'Fresh lettuce'
      },
      {
        name: 'Tomato',
        unit: 'kg',
        category: 'vegetable',
        typicalExpirationDays: 5,
        sampleCostPerUnit: 2.0,
        description: 'Fresh tomatoes'
      },
      {
        name: 'Potato',
        unit: 'kg',
        category: 'vegetable',
        typicalExpirationDays: 30,
        sampleCostPerUnit: 0.8,
        description: 'White potatoes'
      },
      {
        name: 'Onion',
        unit: 'kg',
        category: 'vegetable',
        typicalExpirationDays: 60,
        sampleCostPerUnit: 0.6,
        description: 'Yellow onions'
      },

      // Dairy
      {
        name: 'Milk',
        unit: 'litre',
        category: 'dairy',
        typicalExpirationDays: 7,
        sampleCostPerUnit: 1.2,
        description: 'Whole milk, 1L'
      },
      {
        name: 'Cheese',
        unit: 'kg',
        category: 'dairy',
        typicalExpirationDays: 21,
        sampleCostPerUnit: 8.0,
        description: 'Cheddar cheese'
      },
      {
        name: 'Eggs',
        unit: 'dozen',
        category: 'dairy',
        typicalExpirationDays: 28,
        sampleCostPerUnit: 2.5,
        description: 'Large white eggs'
      },

      // Grains
      {
        name: 'Bread',
        unit: 'pcs',
        category: 'grain',
        typicalExpirationDays: 5,
        sampleCostPerUnit: 2.5,
        description: 'Whole wheat bread'
      },
      {
        name: 'Rice',
        unit: 'kg',
        category: 'grain',
        typicalExpirationDays: 365,
        sampleCostPerUnit: 1.8,
        description: 'Long grain white rice'
      },
      {
        name: 'Pasta',
        unit: 'kg',
        category: 'grain',
        typicalExpirationDays: 365,
        sampleCostPerUnit: 1.2,
        description: 'Spaghetti pasta'
      },

      // Proteins
      {
        name: 'Chicken Breast',
        unit: 'kg',
        category: 'protein',
        typicalExpirationDays: 2,
        sampleCostPerUnit: 8.0,
        description: 'Fresh chicken breast'
      },
      {
        name: 'Ground Beef',
        unit: 'kg',
        category: 'protein',
        typicalExpirationDays: 2,
        sampleCostPerUnit: 10.0,
        description: 'Lean ground beef'
      },

      // Pantry
      {
        name: 'Olive Oil',
        unit: 'litre',
        category: 'pantry',
        typicalExpirationDays: 365,
        sampleCostPerUnit: 12.0,
        description: 'Extra virgin olive oil'
      },
      {
        name: 'Honey',
        unit: 'kg',
        category: 'pantry',
        typicalExpirationDays: 730,
        sampleCostPerUnit: 8.0,
        description: 'Pure honey'
      }
    ],
    skipDuplicates: true,
  });

  console.log(`Seeded ${foodItems.count} food items`);

  // Create sample Resource entries with type and tags
  const resourcesData = [
    {
      title: 'Food Storage Tips',
      description: 'Best practices for storing food to reduce waste',
      url: 'https://example.com/food-storage-tips',
      type: 'Article',
      tags: ['storage', 'waste reduction', 'pantry']
    },
    {
      title: 'Meal Planning Guide',
      description: 'How to plan meals effectively to minimize waste',
      url: 'https://example.com/meal-planning',
      type: 'Article',
      tags: ['meal planning', 'waste reduction', 'budget']
    },
    {
      title: 'Waste Reduction Techniques',
      description: 'Methods to reduce food waste at home',
      url: 'https://example.com/waste-reduction',
      type: 'Article',
      tags: ['waste reduction', 'techniques']
    },
    {
      title: 'How to Store Milk',
      description: 'Video guide for storing milk safely',
      url: 'https://example.com/store-milk',
      type: 'Video',
      tags: ['storage', 'dairy']
    },
    {
      title: 'Budget-Friendly Meal Planning',
      description: 'Create nutritious meals for your family while staying within your food budget.',
      url: 'https://example.com/budget-meals',
      type: 'Article',
      tags: ['budget', 'meal planning', 'nutrition']
    },
    {
      title: 'Composting Kitchen Scraps',
      description: 'Turn your food waste into nutrient-rich soil for your garden.',
      url: 'https://example.com/composting',
      type: 'Video',
      tags: ['waste reduction', 'composting', 'sustainability']
    },
    {
      title: 'Freezing Food Guide',
      description: 'Complete guide to freezing different types of food to extend their usability.',
      url: 'https://example.com/freezing-guide',
      type: 'Article',
      tags: ['storage', 'freezing', 'pantry']
    },
    {
      title: 'Portion Control Tips',
      description: 'Learn how to serve appropriate portion sizes to reduce waste and maintain health.',
      url: 'https://example.com/portions',
      type: 'Article',
      tags: ['waste reduction', 'nutrition', 'portion control']
    },
    {
      title: 'Shopping on a Budget',
      description: 'Smart strategies for grocery shopping that save money without sacrificing nutrition.',
      url: 'https://example.com/smart-shopping',
      type: 'Article',
      tags: ['budget', 'shopping', 'nutrition']
    },
    {
      title: 'Leftover Recipe Ideas',
      description: 'Creative ways to use leftover food and reduce waste in your kitchen.',
      url: 'https://example.com/leftovers',
      type: 'Video',
      tags: ['waste reduction', 'leftovers', 'meal planning']
    },
    {
      title: 'Grain Storage Best Practices',
      description: 'How to store rice, pasta, and other grains for maximum shelf life.',
      url: 'https://example.com/grain-storage',
      type: 'Article',
      tags: ['storage', 'grain', 'pantry']
    },
    {
      title: 'Seasonal Eating Guide',
      description: 'Save money and eat sustainably by choosing seasonal produce.',
      url: 'https://example.com/seasonal-eating',
      type: 'Article',
      tags: ['budget', 'seasonal', 'nutrition']
    },
    {
      title: 'Protein Storage Safety',
      description: 'Critical information about safely storing meat, fish, and poultry.',
      url: 'https://example.com/protein-storage',
      type: 'Article',
      tags: ['storage', 'protein', 'safety']
    },
    {
      title: 'Meal Prep for Beginners',
      description: 'Learn how to prepare meals in advance to save time and reduce waste.',
      url: 'https://example.com/meal-prep',
      type: 'Video',
      tags: ['budget', 'meal prep', 'waste reduction']
    },
    {
      title: 'Zero Waste Kitchen Tips',
      description: '50 practical tips to minimize food waste in your daily cooking.',
      url: 'https://example.com/zero-waste',
      type: 'Article',
      tags: ['waste reduction', 'zero waste', 'sustainability']
    },
    {
      title: 'First In, First Out Method',
      description: 'Organize your pantry using the FIFO method to prevent food spoilage.',
      url: 'https://example.com/fifo-method',
      type: 'Article',
      tags: ['storage', 'pantry', 'safety']
    },
    {
      title: 'Budget-Friendly Proteins',
      description: 'Affordable protein sources that are nutritious and sustainable.',
      url: 'https://example.com/cheap-proteins',
      type: 'Article',
      tags: ['budget', 'protein', 'nutrition']
    },
    {
      title: 'Food Waste Tracking',
      description: 'How to track and analyze your food waste to identify improvement areas.',
      url: 'https://example.com/waste-tracking',
      type: 'Video',
      tags: ['waste reduction', 'tracking', 'sustainability']
    },
    {
      title: 'Herb Storage Techniques',
      description: 'Keep fresh herbs fresh longer with these simple storage methods.',
      url: 'https://example.com/herb-storage',
      type: 'Article',
      tags: ['storage', 'herbs', 'pantry']
    },
    {
      title: 'Grocery List Planning',
      description: 'Create effective grocery lists that prevent overbuying and waste.',
      url: 'https://example.com/grocery-lists',
      type: 'Article',
      tags: ['budget', 'grocery shopping', 'waste reduction']
    },
    {
      title: 'Sustainable Food Choices',
      description: 'Make environmentally conscious food choices without breaking the bank.',
      url: 'https://example.com/sustainable-food',
      type: 'Video',
      tags: ['waste reduction', 'sustainability', 'nutrition']
    },
    {
      title: 'Smart Fridge Organization',
      description: 'How to organize your fridge for maximum freshness and minimal waste.',
      url: 'https://example.com/fridge-organization',
      type: 'Article',
      tags: ['storage', 'pantry', 'waste reduction']
    },
    {
      title: 'Understanding Expiration Dates',
      description: 'Decode food labels and learn which dates really matter for food safety.',
      url: 'https://example.com/expiry-dates',
      type: 'Article',
      tags: ['storage', 'safety', 'pantry']
    },
    {
      title: 'Composting for Beginners',
      description: 'A beginner’s guide to composting food scraps at home.',
      url: 'https://example.com/composting-beginners',
      type: 'Video',
      tags: ['waste reduction', 'composting', 'sustainability']
    },
    {
      title: 'Reducing Plastic in the Kitchen',
      description: 'Tips for minimizing plastic use in food storage and prep.',
      url: 'https://example.com/reduce-plastic',
      type: 'Article',
      tags: ['sustainability', 'storage', 'pantry']
    },
    {
      title: 'Affordable Healthy Snacks',
      description: 'Ideas for healthy snacks that are budget-friendly.',
      url: 'https://example.com/healthy-snacks',
      type: 'Article',
      tags: ['budget', 'nutrition', 'snacks']
    },
    {
      title: 'Batch Cooking for Busy Families',
      description: 'How to batch cook meals to save time and reduce waste.',
      url: 'https://example.com/batch-cooking',
      type: 'Video',
      tags: ['meal planning', 'waste reduction', 'budget']
    },
    {
      title: 'Storing Fresh Produce',
      description: 'Best ways to store fruits and vegetables for longer freshness.',
      url: 'https://example.com/store-produce',
      type: 'Article',
      tags: ['storage', 'fruit', 'vegetable']
    },
    {
      title: 'Pantry Staples for Sustainability',
      description: 'Essential pantry items for a sustainable kitchen.',
      url: 'https://example.com/pantry-staples',
      type: 'Article',
      tags: ['pantry', 'sustainability', 'storage']
    }
  ];

  // Seed tags first (deduplicated)
  const allTags = Array.from(new Set(resourcesData.flatMap(r => r.tags)));
  // Create tags using the join table only, do not create ResourceTag directly
  // Instead, create tags when linking to resources below

  // Fetch all tags with their IDs for linking (if any exist)
  const tagMap: Record<string, string> = {};
  const allTagObjs = await prisma.resourceTag.findMany();
  allTagObjs.forEach(t => { tagMap[t.tag] = t.id; });

  // Seed resources and link tags
  for (const resource of resourcesData) {
    // Ensure tags exist before linking
    const tagIds: string[] = [];
    for (const tag of resource.tags) {
      let tagId = tagMap[tag];
      if (!tagId) {
        const createdTag = await prisma.resourceTag.create({ data: { tag } });
        tagId = createdTag.id;
        tagMap[tag] = tagId;
      }
      tagIds.push(tagId);
    }
    const createdResource = await prisma.resource.create({
      data: {
        title: resource.title,
        description: resource.description,
        url: resource.url,
        type: resource.type === 'Article' ? 'Article' : 'Video',
        tags: {
          create: tagIds.map(tagId => ({
            tag: {
              connect: { id: tagId }
            }
          }))
        }
      }
    });
    console.log(`Seeded resource with ID: ${createdResource.id}`);
  }

  // Fetch actual users from DB
  const users = await prisma.user.findMany();
  if (users.length === 0) {
    console.log('No users found in database. Please seed users first.');
    return;
  }
  console.log(`Fetched users: ${users.map(u => u.id).join(', ')}`);

  // Get all food items for inventory seeding
  const foodItemsDb = await prisma.foodItem.findMany();

  // For each user, create 2-3 inventories, each with 15-20 items
  for (const user of users) {
    const inventoryCount = Math.floor(Math.random() * 2) + 2; // 2 or 3
    for (let i = 0; i < inventoryCount; i++) {
      const inventory = await prisma.inventory.create({
        data: {
          name: `Inventory ${i + 1}`,
          description: `Auto-seeded inventory #${i + 1}`,
          isPrivate: false,
          createdById: user.id,
        },
      });
      console.log(`Seeded inventory ${inventory.name} for user ${user.email}`);

      // Create inventory members for this inventory
      const inventoryMembers = [];
      
      // Add the inventory creator as an admin member
      const creatorMember = await prisma.inventoryMember.create({
        data: {
          inventoryId: inventory.id,
          userId: user.id,
          role: 'admin',
          addedById: user.id,
        },
      });
      inventoryMembers.push(creatorMember);

      // Optionally add 1-2 additional members (could be other users or guest members)
      const additionalMemberCount = Math.floor(Math.random() * 3); // 0-2 additional members
      for (let m = 0; m < additionalMemberCount; m++) {
        // Try to get another user, or create a guest member
        const otherUsers = users.filter(u => u.id !== user.id);
        if (otherUsers.length > 0 && Math.random() < 0.7) {
          // 70% chance to add another user as member
          const otherUser = otherUsers[Math.floor(Math.random() * otherUsers.length)];
          const memberExists = inventoryMembers.some(im => im.userId === otherUser.id);
          if (!memberExists) {
            const userMember = await prisma.inventoryMember.create({
              data: {
                inventoryId: inventory.id,
                userId: otherUser.id,
                role: 'member',
                addedById: user.id,
              },
            });
            inventoryMembers.push(userMember);
          }
        } else {
          // Create a guest member
          const guestMember = await prisma.inventoryMember.create({
            data: {
              inventoryId: inventory.id,
              memberName: `Guest Member ${m + 1}`,
              role: 'member',
              addedById: user.id,
            },
          });
          inventoryMembers.push(guestMember);
        }
      }

      // Add 15-20 inventory items
      const itemCount = Math.floor(Math.random() * 6) + 15; // 15-20
      const usedFoodItems = new Set<string>();
      for (let j = 0; j < itemCount; j++) {
        // Pick a random food item not already used in this inventory
        let foodItem;
        do {
          foodItem = foodItemsDb[Math.floor(Math.random() * foodItemsDb.length)];
        } while (usedFoodItems.has(foodItem.id));
        usedFoodItems.add(foodItem.id);

        const quantity = Math.floor(Math.random() * 10) + 1;
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + (foodItem.typicalExpirationDays || 7));

        const inventoryItem = await prisma.inventoryItem.create({
          data: {
            inventoryId: inventory.id,
            foodItemId: foodItem.id,
            customName: foodItem.name,
            quantity,
            unit: foodItem.unit,
            expiryDate,
            addedById: user.id,
          },
        });

        // Seed consumption log for this item
        if (Math.random() < 0.7) { // 70% chance to log consumption
          const consumedQty = Math.floor(Math.random() * quantity) + 1;
          // Pick a random inventory member for consumption
          const randomMember = inventoryMembers[Math.floor(Math.random() * inventoryMembers.length)];
          
          await prisma.consumptionLog.create({
            data: {
              inventoryId: inventory.id,
              inventoryItemId: inventoryItem.id,
              consumedById: randomMember.id,
              foodItemId: foodItem.id,
              itemName: foodItem.name,
              quantity: consumedQty,
              unit: foodItem.unit,
              consumedAt: new Date(),
              notes: 'Auto-seeded consumption',
            },
          });
        }
      }
    }
  }

  console.log('Database seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });