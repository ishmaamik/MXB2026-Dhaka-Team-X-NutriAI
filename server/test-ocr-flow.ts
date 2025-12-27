
import { imageQueue } from './src/config/queue';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function testOCRFlow() {
  console.log('🧪 Testing OCR Job Flow...');
  
  // Get last 5 completed jobs
  const jobs = await imageQueue.getJobs(['completed'], 0, 5, true); 
  console.log(`\n🔍 Found ${jobs.length} completed jobs.`);

  for (const job of jobs) {
      console.log(`\nJob ID: ${job.id}`);
      console.log('Return Value:', JSON.stringify(job.returnvalue));
      
      const result = job.returnvalue;
      
      // Mimic Controller Logic (NEW):
      let safeResult = result;
      if (result && !result.data) {
          safeResult = { ...result, data: [] };
      }
      
      const apiResponse = {
        success: true,
        jobId: job.id,
        status: await job.getState(),
        result: safeResult, 
      };
      
      console.log('\n🔍 Simulated API Response (After Controller Fix):');
      console.log(JSON.stringify(apiResponse, null, 2));
      
      // Frontend Logic Check:
      if (apiResponse.result && Array.isArray(apiResponse.result.data)) {
          console.log(`✅ Frontend Safe! Items: ${apiResponse.result.data.length} (Empty array injected if missing)`);
      } else {
          console.log(`❌ Frontend WOULD CRASH (missing .data array)`);
      }
  }

  // Also check failed jobs
  const failedJobs = await imageQueue.getJobs(['failed'], 0, 5, true);
  if (failedJobs.length > 0) {
      console.log(`\n🚨 Found ${failedJobs.length} FAILED jobs:`);
      failedJobs.forEach(j => console.log(`Job ${j.id} failed: ${j.failedReason}`));
  }
  
  process.exit(0);
}

testOCRFlow();
