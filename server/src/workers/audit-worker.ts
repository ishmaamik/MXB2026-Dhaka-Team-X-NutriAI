import { Worker } from 'bullmq';
import { connection } from '../config/queue';
import { InventoryService } from '../modules/inventories/inventory-service';
import prisma from '../config/database';

const inventoryService = new InventoryService();

export const auditWorker = new Worker(
  'audit-queue',
  async (job) => {
    console.log(`📝 [Audit Worker] Processing job ${job.id}:`, job.name);
    
    try {
      const { userId: clerkId, action, details } = job.data;
      
      console.log(`Processing audit log [${action}] for user:`, clerkId);

      // Resolve internal User ID from Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });

      if (!user) {
        throw new Error(`User not found for Clerk ID: ${clerkId}`);
      }
      
      // Create AuditLog entry using internal UUID
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          details,
        },
      });
      
      console.log(`✅ [Audit Worker] Audit log created: ${auditLog.id}`);
      return auditLog;
    } catch (error) {
      console.error(`❌ [Audit Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection }
);

auditWorker.on('completed', (job) => {
  console.log(`✅ [Audit Worker] Job ${job.id} completed successfully`);
});

auditWorker.on('failed', (job, err) => {
  console.error(`❌ [Audit Worker] Job ${job?.id} failed with error ${err.message}`);
});
