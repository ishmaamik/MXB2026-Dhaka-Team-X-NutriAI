import { Worker } from 'bullmq';
import { connection } from '../config/queue';
import { imageService } from '../modules/images/image-service';
import { InventoryService } from '../modules/inventories/inventory-service';
import prisma from '../config/database';

const inventoryService = new InventoryService();

export const imageWorker = new Worker(
  'image-queue',
  async (job) => {
    console.log(`🖼️ [Image Worker] Processing job ${job.id}:`, job.name);

    try {
      const { userId: clerkId, file, metadata, type } = job.data;

      // Resolve internal User ID
      const user = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true }
      });

      if (!user) {
        throw new Error(`User not found for Clerk ID: ${clerkId}`);
      }
      const userId = user.id;

      // NOTE: 'file' here will likely be different than express UploadedFile
      // We might need to handle file paths or buffers if passing from controller
      // For now assuming we pass necessary data to reconstruct or fetch the file
      
      // Since passing actual Buffers to Redis is bad practice (size limits),
      // for this implementation we might need to assume the file is temporarily saved
      // or we handle the Cloudinary upload in the controller and only doing OCR here?
      
      // Strategy:
      // 1. Controller uploads to Cloudinary (fast-ish) OR saves to temp disk
      // 2. Worker does the OCR (slow)
      
      if (type === 'process-ocr') {
         console.log('🔍 [Image Worker] Starting OCR for inventory:', metadata.inventoryId);
         
         // We assume the image is already uploaded or path is provided
         // If we passed the Cloudinary URL:
         if (!metadata.imageUrl) {
             throw new Error('Image URL required for background OCR');
         }

         // Perform OCR on the URL
         // usage: imageService.ocrService.extractTextFromImage(url)
         // But imageService access is private/protected usually?
         // Let's check imageService.uploadImageWithOCR structure.
         // It combines upload + OCR.
         
         // Better approach for Async:
         // 1. Pass the URL of the uploaded image (already in DB?)
         // 2. Run logic similar to addItemsFromImage
         
         // Let's reimplement the addItemsFromImage logic here for the worker
         const { ocrService } = require('../services/ocr-service');
         const result = await ocrService.extractTextFromImage(metadata.imageUrl);
         
         if (result && result.extractedItems) {
             console.log(`✅ [Image Worker] Extracted ${result.extractedItems.length} items from OCR`);
             
             // Auto-add items to inventory
             const addedItems = [];
             for (const item of result.extractedItems) {
                 try {
                     const newItem = await inventoryService.addInventoryItem(
                         clerkId, // Service expects Clerk ID
                         metadata.inventoryId,
                         {
                             customName: item.name,
                             quantity: item.quantity || 1,
                             unit: item.unit || 'pcs',
                             notes: `Auto-added from Background OCR (${Math.round((item.confidence || 0) * 100)}%)`
                         }
                     );
                     addedItems.push(newItem);
                 } catch (err) {
                     console.error('Failed to add OCR item:', item.name, err);
                 }
             }
             
             // Optional: Notify user (via socket/push) that "X items were added"
             // await notificationService.notify(userId, ` processed! Added ${addedItems.length} items.`);
             
             // Log to Audit
             await prisma.auditLog.create({
                 data: {
                     userId,
                     action: 'OCR_PROCESSED',
                     details: {
                         jobId: job.id,
                         itemsAdded: addedItems.length,
                         inventoryId: metadata.inventoryId
                     }
                 }
             });
         }
      }

      return { success: true };
    } catch (error) {
      console.error(`❌ [Image Worker] Job ${job.id} failed:`, error);
      throw error;
    }
  },
  { connection }
);

imageWorker.on('completed', (job) => {
  console.log(`✅ [Image Worker] Job ${job.id} completed`);
});

imageWorker.on('failed', (job, err) => {
  console.error(`❌ [Image Worker] Job ${job?.id} failed: ${err.message}`);
});
