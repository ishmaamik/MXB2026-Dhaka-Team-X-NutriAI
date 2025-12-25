import { clerkClient } from '@clerk/clerk-sdk-node';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { adminController } from './admin-controller';

const router = Router();

// Middleware to check admin role
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user data from Clerk to check role
    const user = await clerkClient.users.getUser(userId);

    // Check if user has admin role in public metadata
    if (user.publicMetadata?.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied. Admin role required.',
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Apply auth middleware to all admin routes
router.use(requireAuth);
router.use(requireAdmin);

// Admin routes
router.post('/foods', adminController.addFoodItem);
router.post('/resources', adminController.addResource);
router.get('/stats', adminController.getStats);

export default router;
