import express from 'express';
import { imageController } from './image-controller';
import { ensureUserExists, requireAuth } from '../../middleware/auth';
import { fileUploadMiddleware } from '../../middleware/fileUpload';

const router = express.Router();

// All routes require authentication and user existence check
router.use(requireAuth);
router.use(ensureUserExists);

// Upload image
router.post('/', fileUploadMiddleware, imageController.uploadImage);

// Get user images
router.get('/', imageController.getUserImages);

// Get job status
router.get('/job/:jobId', imageController.getJobStatus);

// Delete image
router.delete('/:fileId', imageController.deleteImage);

export { router as imageRouter };