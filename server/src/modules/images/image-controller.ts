import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { imageService } from './image-service';
import { imageQueue } from '../../config/queue';

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
  async getJobStatus(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { jobId } = req.params;
      if (!jobId) {
        return res.status(400).json({ error: 'Job ID is required' });
      }

      const job = await imageQueue.getJob(jobId);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Check if job belongs to user (security check)
      if (job.data.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access to job' });
      }

      const state = await job.getState();
      const result = job.returnvalue;

      // Ensure data array exists for frontend compatibility
      let safeResult = result;
      if (state === 'completed' && result && !result.data) {
          safeResult = { ...result, data: [] };
      }

      const responseData = {
        success: true,
        jobId,
        status: state,
        inventoryId: job.data?.metadata?.inventoryId, // Return inventoryId
        result: state === 'completed' ? safeResult : null,
        error: state === 'failed' ? job.failedReason : null,
      };

      console.log('Sending Job Status Response:', JSON.stringify(responseData));
      res.json(responseData);
    } catch (error: any) {
      console.error('Job status error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get job status',
      });
    }
  }
}

export const imageController = new ImageController();
