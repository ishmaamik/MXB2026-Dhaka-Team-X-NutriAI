import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USERS = [
  {
    id: '55150f5d-e9b9-4b36-bade-ed6f701a1bf5',
    clerkId: 'user_35jvwpms1dqjFTrsEuqlFSMOboX',
    email: 'user1@example.com', // Placeholder email
  },
  {
    id: 'b03bf3ef-4a3e-4325-8a43-730aed998fd9',
    clerkId: 'user_35l9L2Kc7P0vY0IRe7p9e2O4crC',
    email: 'user2@example.com', // Placeholder email
  }
];

async function main() {
  console.log('Starting custom seeding for specific users...');

  // 1. Upsert Users
  for (const userData of USERS) {
    const user = await prisma.user.upsert({
      where: { clerkId: userData.clerkId },
      update: { id: userData.id }, // Ensure ID matches
      create: {
        id: userData.id,
        clerkId: userData.clerkId,
        email: userData.email,
      },
    });
    console.log(`User ${user.id} (${user.clerkId}) is ready.`);
    
    // Ensure profile exists
    await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: userData.clerkId.includes('jvwpms') ? 'John Doe' : 'Jane Smith',
      }
    });
  }

  // 2. Ensure some FoodItems exist in DB
  const foodItemsCount = await prisma.foodItem.count();
  if (foodItemsCount === 0) {
    console.log('No food items found, seeding basic ones...');
    await prisma.foodItem.createMany({
      data: [
        { name: 'Apple', unit: 'pcs', category: 'fruit', typicalExpirationDays: 7 },
        { name: 'Milk', unit: 'litre', category: 'dairy', typicalExpirationDays: 7 },
        { name: 'Bread', unit: 'pcs', category: 'grain', typicalExpirationDays: 5 },
        { name: 'Eggs', unit: 'dozen', category: 'dairy', typicalExpirationDays: 21 },
        { name: 'Chicken', unit: 'kg', category: 'protein', typicalExpirationDays: 3 },
      ]
    });
  }

  const foodItems = await prisma.foodItem.findMany();

  // 3. Seed Inventories for each user
  for (const userData of USERS) {
    const userId = userData.id;
    const userName = userData.clerkId.includes('jvwpms') ? "John" : "Jane";

    // Create 4 inventories for each user
    const totalInventories = 4;
    for (let i = 1; i <= totalInventories; i++) {
        const inventory = await prisma.inventory.create({
            data: {
                name: `${userName}'s Inventory ${i}`,
                description: `Expanded storage area #${i}`,
                isPrivate: false,
                createdById: userId,
                members: {
                    create: {
                        userId: userId,
                        role: 'admin',
                    }
                }
            }
        });

        console.log(`Created inventory: ${inventory.name} for ${userId}`);

        // Add exactly 20 items to each inventory
        const itemCount = 20;
        for (let j = 0; j < itemCount; j++) {
            const foodItem = foodItems[Math.floor(Math.random() * foodItems.length)];
            const initialQty = Math.floor(Math.random() * 20) + 10;
            
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + (foodItem.typicalExpirationDays || 7) + (Math.floor(Math.random() * 10) - 5));

            const inventoryItem = await prisma.inventoryItem.create({
                data: {
                    inventoryId: inventory.id,
                    foodItemId: foodItem.id,
                    customName: foodItem.name,
                    quantity: initialQty,
                    unit: foodItem.unit,
                    addedById: userId,
                    expiryDate: expiry,
                }
            });

            // Add extensive consumption logs for each item
            const logCount = Math.floor(Math.random() * 5) + 5;
            let remainingQty = initialQty;
            
            for (let l = 0; l < logCount; l++) {
                if (remainingQty <= 0) break;
                
                const consumedQty = Math.min(Math.floor(Math.random() * 3) + 1, remainingQty);
                remainingQty -= consumedQty;

                const consumedAt = new Date();
                consumedAt.setDate(consumedAt.getDate() - Math.floor(Math.random() * 30));

                await prisma.consumptionLog.create({
                    data: {
                        inventoryId: inventory.id,
                        inventoryItemId: inventoryItem.id,
                        foodItemId: foodItem.id,
                        itemName: foodItem.name,
                        quantity: consumedQty,
                        unit: foodItem.unit,
                        consumedAt: consumedAt,
                        notes: 'High-volume consumption log',
                    }
                });
            }
        }
    }
  }

  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
