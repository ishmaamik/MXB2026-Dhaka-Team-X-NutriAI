import { Request, Response } from 'express';
import { adminService } from './admin-service';

export class AdminController {
  async addFoodItem(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        name,
        category,
        typicalExpirationDays,
        description,
        nutritionalInfo,
      } = req.body;

      if (!name || !category) {
        return res
          .status(400)
          .json({ error: 'Name and category are required' });
      }

      const foodItem = await adminService.addFoodItem({
        name,
        category,
        typicalExpirationDays,
        description,
        nutritionalInfo,
      });

      res.status(201).json({
        success: true,
        data: foodItem,
        message: 'Food item added successfully',
      });
    } catch (error: any) {
      console.error('Add food item error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add food item',
      });
    }
  }

  async addResource(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { title, description, content, tags, category, imageUrl } =
        req.body;

      if (!title || !description || !content || !category) {
        return res.status(400).json({
          error: 'Title, description, content, and category are required',
        });
      }

      const resource = await adminService.addResource({
        title,
        description,
        content,
        tags,
        category,
        imageUrl,
      });

      res.status(201).json({
        success: true,
        data: resource,
        message: 'Resource added successfully',
      });
    } catch (error: any) {
      console.error('Add resource error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add resource',
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      const userId = req.auth?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const stats = await adminService.getAdminStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Get admin stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get stats',
      });
    }
  }
}

export const adminController = new AdminController();
