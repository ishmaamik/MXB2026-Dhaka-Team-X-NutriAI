import { Request, Response } from 'express';
import { userService } from './users-service';
import { clerkClient } from '@clerk/clerk-sdk-node';

export class UserController {
  async getCurrentUser(req: Request, res: Response) {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const clerkUser = await clerkClient.users.getUser(clerkId);

      const user = await userService.syncUserFromClerk(
        clerkId,
        clerkUser.emailAddresses[0]?.emailAddress || ''
      );

      res.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      console.error('Error getting current user:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get user',
      });
    }
  }

  async updateProfile(req: Request, res: Response) {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const {
        fullName,
        dietaryPreference,
        location,
        budgetRange,
        height,
        weight,
        weightPreference,
        allergies,
      } = req.body;

      if (budgetRange !== undefined && (budgetRange < 0 || isNaN(budgetRange))) {
        return res.status(400).json({
          success: false,
          error: 'Budget range must be a positive number',
        });
      }

      const updatedUser = await userService.updateUserProfile(clerkId, {
        fullName,
        dietaryPreference,
        location,
        budgetRange: budgetRange ? parseFloat(budgetRange) : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        weightPreference,
        allergies,
      });

      res.json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update profile',
      });
    }
  }

  async getProfile(req: Request, res: Response) {
    try {
      const clerkId = req.auth?.userId;

      if (!clerkId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await userService.getUserByClerkId(clerkId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user.profile,
      });
    } catch (error: any) {
      console.error('Error getting profile:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to get profile',
      });
    }
  }
}

export const userController = new UserController();