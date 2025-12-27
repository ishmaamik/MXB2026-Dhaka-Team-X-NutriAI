
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { imageQueue } from '../src/config/queue';

const debugImageFailure = async () => {
    
  const failedCount = await imageQueue.getJobCountByTypes('failed');
  let output = '🔍 Inspecting Latest Image Queue Failure...\n';

  if (failedCount === 0) {
    output += '✅ No failed jobs.\n';
  } else {
    const failedJobs = await imageQueue.getJobs(['failed'], 0, 1);
    const job = failedJobs[0];

    output += `\n--- Job ID: ${job.id} ---\n`;
    output += `Data: ${JSON.stringify(job.data, null, 2)}\n`;
    output += `Failed Reason: ${job.failedReason}\n`;
    output += `Stacktrace: ${job.stacktrace ? job.stacktrace[0] : 'None'}\n`;
  }
  
  fs.writeFileSync('image_failure.txt', output);
  process.exit(0);
};

debugImageFailure().catch((err) => {
  fs.writeFileSync('image_failure.txt', `Error: ${err}`);
  process.exit(1);
});
