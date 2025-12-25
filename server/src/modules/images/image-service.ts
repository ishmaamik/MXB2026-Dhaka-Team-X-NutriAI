import { UploadedFile } from 'express-fileupload';
import prisma from '../../config/database';
import { ocrService } from '../../services/ocr-service';
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from '../../utils/uploadImage';

export class ImageService {
  async uploadImage(
    file: UploadedFile,
    clerkUserId: string, // This is the Clerk ID, not database ID
    metadata?: {
      inventoryId?: string;
      inventoryItemId?: string;
      foodItemId?: string;
    },
  ) {
    try {
      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/jpg',
        'image/webp',
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          'Invalid file type. Only JPEG, PNG, and WebP are allowed.',
        );
      }

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file);

      // Get the database user ID from Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found in database');
      }

      // Save to database with the correct database user ID
      const savedFile = await prisma.file.create({
        data: {
          userId: user.id, // Use database ID, not Clerk ID
          url: imageUrl,
          filename: file.name,
          mimeType: file.mimetype,
          size: file.size,
          foodItemId: metadata?.foodItemId,
          inventoryId: metadata?.inventoryId,
          inventoryItemId: metadata?.inventoryItemId,
        },
      });

      return savedFile;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async deleteImage(fileId: string, clerkUserId: string) {
    try {
      // Get the database user ID from Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found in database');
      }

      const file = await prisma.file.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new Error('File not found');
      }

      if (file.userId !== user.id) {
        // Compare with database ID
        throw new Error('Unauthorized to delete this file');
      }

      // Delete from Cloudinary
      await deleteFromCloudinary(file.url);

      // Soft delete from database
      await prisma.file.update({
        where: { id: fileId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async uploadImageWithOCR(
    file: UploadedFile,
    clerkUserId: string,
    metadata?: {
      inventoryId?: string;
      inventoryItemId?: string;
      foodItemId?: string;
      extractItems?: boolean; // Flag to enable/disable OCR
    },
  ) {
    try {
      // Upload image first
      const savedFile = await this.uploadImage(file, clerkUserId, metadata);

      // If OCR is requested, extract text and items
      if (metadata?.extractItems) {
        console.log('🔍 [ImageService] Starting OCR extraction...');
        const ocrResult = await ocrService.extractTextFromImage(savedFile.url);

        return {
          file: savedFile,
          ocr: {
            text: ocrResult.text,
            confidence: ocrResult.confidence,
            extractedItems: ocrResult.extractedItems,
          },
        };
      }

      return { file: savedFile };
    } catch (error) {
      console.error('Error uploading image with OCR:', error);
      throw error;
    }
  }

  async getImagesByUser(clerkUserId: string) {
    try {
      // Get the database user ID from Clerk ID
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found in database');
      }

      return prisma.file.findMany({
        where: {
          userId: user.id, // Use database ID
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      console.error('Error getting user images:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService();
