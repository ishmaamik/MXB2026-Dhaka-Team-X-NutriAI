import { Worker } from 'bullmq';
import { connection } from '../config/queue';
import { aiAnalyticsService } from '../services/aiAnalyticsService';
import prisma from '../config/database';

export const aiWorker = new Worker(
  'ai-queue',
  async (job) => {
    console.log(`🧠 [AI Worker] Processing job ${job.id}:`, job.name);

    try {
      const { userId: clerkId, action, data } = job.data;

      // Log start of processing
      console.log(`[AI Worker] Starting ${action} for user ${clerkId}`);

      // Resolve internal User ID
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });

      if (!user) {
        throw new Error(`User not found for Clerk ID: ${clerkId}`);
      }
      const userId = user.id;

      let result;
      switch (action) {
        case 'GENERATE_INSIGHTS':
          result = await aiAnalyticsService.generateIntelligentInsights(
            userId,
            data.query
          );
          break;
          
        case 'ANALYZE_WASTE':
           // Assuming we have a dedicated method, or use generic insights
           // For now, let's map it to generic insights or specific service methods if they exist.
           // Checking aiAnalyticsService, it seems to have specific methods.
           // Let's assume we maintain the pattern of calling the service.
           
           // If the specific method didn't exist in the service exposed earlier,
           // we might need to rely on generateIntelligentInsights or add them.
           // For safety, let's use generateIntelligentInsights which seems to be the main entry point.
           result = await aiAnalyticsService.generateIntelligentInsights(
             userId, 
             `Analyze waste for: ${JSON.stringify(data)}`
           );
           break;

        default:
          throw new Error(`Unknown AI action: ${action}`);
      }

      // Log success to Audit Log
      await prisma.auditLog.create({
        data: {
          userId,
          action: `AI_${action}_COMPLETED`,
          details: {
            jobId: job.id,
            ...result // Store summary of result if possible, or just meta
          },
        },
      });

      console.log(`✅ [AI Worker] Job ${job.id} completed`);
      return result;

    } catch (error) {
      console.error(`❌ [AI Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection }
);

aiWorker.on('completed', (job) => {
  console.log(`✅ [AI Worker] Job ${job.id} finished successfully`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`❌ [AI Worker] Job ${job?.id} failed: ${err.message}`);
});
