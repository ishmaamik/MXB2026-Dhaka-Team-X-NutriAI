import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { imageService } from './image-service';

export class ImageController {
  async uploadImage(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Check if file exists
      if (!req.files || !req.files.image) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      const imageFile = req.files.image as UploadedFile;
      const { inventoryId, inventoryItemId, foodItemId } = req.body;

      const savedFile = await imageService.uploadImage(imageFile, userId, {
        inventoryId,
        inventoryItemId,
        foodItemId,
      });

      res.status(201).json({
        success: true,
        data: savedFile,
        message: 'Image uploaded successfully',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload image',
      });
    }
  }

  async deleteImage(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { fileId } = req.params;
      await imageService.deleteImage(fileId, userId);

      res.json({
        success: true,
        message: 'Image deleted successfully',
      });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete image',
      });
    }
  }

  async getUserImages(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const images = await imageService.getImagesByUser(userId);

      res.json({
        success: true,
        data: images,
      });
    } catch (error: any) {
      console.error('Get images error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get images',
      });
    }
  }
}

export const imageController = new ImageController();
