
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

const checkUser = async () => {
  const clerkId = 'user_35l9L2Kc7P0vY0IRe7p9e2O4crC';
  console.log(`Checking for user: ${clerkId}`);

  const user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (user) {
    console.log('✅ User found:', user.id, user.email);
  } else {
    console.log('❌ User NOT found in database.');
    
    // Attempt to list all users to see what we have
    const allUsers = await prisma.user.findMany();
    console.log(`Total users in DB: ${allUsers.length}`);
    allUsers.forEach(u => console.log(`- ${u.clerkId} (${u.email})`));
  }
};

checkUser()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
