
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the correct location
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { imageQueue, aiQueue, auditQueue } from '../src/config/queue';

const checkQueue = async (name: string, queue: any) => {
  const counts = await queue.getJobCounts();
  console.log(`\n📊 Queue: ${name}`);
  console.log('------------------------');
  console.log(`Waiting:   ${counts.waiting}`);
  console.log(`Active:    ${counts.active}`);
  console.log(`Completed: ${counts.completed}`);
  console.log(`Failed:    ${counts.failed}`);
  console.log(`Delayed:   ${counts.delayed}`);
};

const main = async () => {
  console.log('Checking BullMQ Status...');
  
  try {
    await checkQueue('Audit Queue', auditQueue);
    await checkQueue('Image Queue', imageQueue);
    await checkQueue('AI Queue', aiQueue);
    
    // Allow time for output flush
    await new Promise(resolve => setTimeout(resolve, 500));
    process.exit(0);
  } catch (error) {
    console.error('Error checking queues:', error);
    process.exit(1);
  }
};

main();
