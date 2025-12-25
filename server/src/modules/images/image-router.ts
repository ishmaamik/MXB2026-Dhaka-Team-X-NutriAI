import express from 'express';
import { imageController } from './image-controller';
import { requireAuth } from '../../middleware/auth';
import { fileUploadMiddleware } from '../../middleware/fileUpload';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// Upload image
router.post('/', fileUploadMiddleware, imageController.uploadImage);

// Get user images
router.get('/', imageController.getUserImages);

// Delete image
router.delete('/:fileId', imageController.deleteImage);

export { router as imageRouter };