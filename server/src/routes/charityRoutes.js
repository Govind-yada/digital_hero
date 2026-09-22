import express from 'express';
import { charityController } from '../controllers/charityController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', charityController.listCharities);
router.get('/featured', charityController.getFeaturedCharities);
router.get('/:id', charityController.getCharityById);
router.post('/:id/donate', charityController.directDonate);

// Authenticated user route
router.put('/user/select', authenticateUser, charityController.updateUserCharity);

// Admin routes
router.post('/', authenticateUser, requireAdmin, charityController.adminCreate);
router.put('/:id', authenticateUser, requireAdmin, charityController.adminUpdate);
router.delete('/:id', authenticateUser, requireAdmin, charityController.adminDelete);

export default router;
