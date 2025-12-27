
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the correct location
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { imageQueue, aiQueue, auditQueue } from '../src/config/queue';

import fs from 'fs';

const logFailedJobs = async (name: string, queue: any) => {
  const failedCount = await queue.getJobCountByTypes('failed');
  let output = `\nQueue: ${name}\n`;
  
  if (failedCount === 0) {
    output += `✅ No failed jobs.\n`;
  } else {
    output += `❌ ${failedCount} failed jobs found.\n`;
    const failedJobs = await queue.getJobs(['failed'], 0, 5); // Get last 5 failed
    
    for (const job of failedJobs) {
      output += `\n--- Job ID: ${job.id} ---\n`;
      output += `Data: ${JSON.stringify(job.data, null, 2)}\n`;
      output += `Reason: ${job.failedReason}\n`;
      output += `Stack: ${job.stacktrace ? job.stacktrace[0] : 'No stacktrace'}\n`;
    }
  }
  
  fs.appendFileSync('debug_log.txt', output);
};

const main = async () => {
  fs.writeFileSync('debug_log.txt', '🔍 Inspecting Failed BullMQ Jobs...\n');
  
  try {
    await logFailedJobs('Audit Queue', auditQueue);
    await logFailedJobs('Image Queue', imageQueue);
    await logFailedJobs('AI Queue', aiQueue);
    
    process.exit(0);
  } catch (error) {
    fs.appendFileSync('debug_log.txt', `Error: ${error}`);
    process.exit(1);
  }
};

main();
