import { Worker } from 'bullmq';
import { connection } from '../config/queue';
import { imageService } from '../modules/images/image-service';
import { InventoryService } from '../modules/inventories/inventory-service';
import prisma from '../config/database';

const inventoryService = new InventoryService();

export const imageWorker = new Worker(
  'image-queue',
  async (job) => {
    console.log(`🖼️ [Image Worker v2] Processing job ${job.id}:`, job.name);

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
             
             // WE do NOT auto-add items anymore. We return them for user review.
             // This is part of the interactive flow refactor.
             
             // Log to Audit that we PROCESSED the OCR, but didn't Add
             await prisma.auditLog.create({
                 data: {
                     userId,
                     action: 'OCR_PROCESSED',
                     details: {
                         jobId: job.id,
                         itemsFound: result.extractedItems.length,
                         inventoryId: metadata.inventoryId
                     }
                 }
             });

             // Return the items as the job result
             return {
               success: true,
               data: result.extractedItems
             };
         }
      }

      console.log('⚠️ [Image Worker] No items extracted or not an OCR job');
      return { success: true, data: [] }; // Always return data array
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
