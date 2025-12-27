
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { auditQueue } from '../src/config/queue';

import fs from 'fs';

const showLatestFailure = async () => {
  const failedCount = await auditQueue.getJobCountByTypes('failed');
  let output = '🔍 Inspecting Latest Audit Queue Failure...\n';

  if (failedCount === 0) {
    output += '✅ No failed jobs.\n';
  } else {
    const failedJobs = await auditQueue.getJobs(['failed'], 0, 1);
    const job = failedJobs[0];

    output += `\n--- Job ID: ${job.id} ---\n`;
    output += `Data: ${JSON.stringify(job.data, null, 2)}\n`;
    output += `Failed Reason: ${job.failedReason}\n`;
    output += `Stacktrace: ${job.stacktrace ? job.stacktrace[0] : 'None'}\n`;
  }
  
  fs.writeFileSync('latest_failure.txt', output);
  process.exit(0);
};

showLatestFailure().catch((err) => {
  fs.writeFileSync('latest_failure.txt', `Error: ${err}`);
  process.exit(1);
});
