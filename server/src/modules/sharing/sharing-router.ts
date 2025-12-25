import express from 'express';
import { ensureUserExists, requireAuth } from '../../middleware/auth';
import { sharingController } from './sharing-controller';

const router = express.Router();

// Apply authentication and user existence middleware to all routes
router.use(requireAuth);
router.use(ensureUserExists);

// Listing routes
router.get('/', sharingController.getListings);
router.post('/', sharingController.createListing);
router.get('/my-listings', sharingController.getUserListings);
router.get('/:listingId', sharingController.getListing);
router.put('/:listingId', sharingController.updateListing);
router.delete('/:listingId', sharingController.deleteListing);

// Sharing action routes
router.post('/:listingId/claim', sharingController.claimListing);
router.post('/:listingId/complete', sharingController.completeListing);

// Analytics and logs
router.get('/logs/sharing', sharingController.getSharingLogs);
router.get('/analytics/stats', sharingController.getSharingStats);

export { router as sharingRouter };