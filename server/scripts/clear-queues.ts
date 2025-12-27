
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { imageQueue, aiQueue, auditQueue } from '../src/config/queue';

const clearQueue = async (name: string, queue: any) => {
  console.log(`🧹 Clearing ${name}...`);
  await queue.obliterate({ force: true });
  console.log(`✅ ${name} cleared.`);
};

const main = async () => {
  console.log('🗑️  Clearing All Queues...');
  try {
    await clearQueue('Audit Queue', auditQueue);
    await clearQueue('Image Queue', imageQueue);
    await clearQueue('AI Queue', aiQueue);
    
    console.log('\n✨ All queues cleared successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing queues:', error);
    process.exit(1);
  }
};

main();
