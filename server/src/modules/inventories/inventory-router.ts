import express from 'express';
import { ensureUserExists, requireAuth } from '../../middleware/auth';
import { fileUploadMiddleware } from '../../middleware/fileUpload';
import { inventoryController } from './inventory-controller';

const router = express.Router();

// Apply authentication and user existence middleware to all routes
router.use(requireAuth);
router.use(ensureUserExists);

// Consumption routes - put before parameterized routes
router.post('/consumption', inventoryController.logConsumption);
router.get('/consumption', inventoryController.getConsumptionLogs);

// Analytics routes - put before parameterized routes
router.get(
  '/analytics/inventory-trends',
  inventoryController.getInventoryTrends,
);
router.get(
  '/analytics/consumption-patterns',
  inventoryController.getConsumptionPatterns,
);

// Inventory routes
router.get('/', inventoryController.getInventories);
router.post('/', inventoryController.createInventory);
router.get('/:inventoryId', inventoryController.getInventory);
router.put('/:inventoryId', inventoryController.updateInventory);
router.delete('/:inventoryId', inventoryController.deleteInventory);

// Inventory items routes
router.get('/:inventoryId/items', inventoryController.getInventoryItems);
router.post('/:inventoryId/items', inventoryController.addInventoryItem);
router.post(
  '/:inventoryId/items/from-image',
  fileUploadMiddleware,
  inventoryController.addItemsFromImage,
); // New OCR route
router.put(
  '/:inventoryId/items/:itemId',
  inventoryController.updateInventoryItem,
);
router.delete(
  '/:inventoryId/items/:itemId',
  inventoryController.removeInventoryItem,
);

export { router as inventoryRouter };
