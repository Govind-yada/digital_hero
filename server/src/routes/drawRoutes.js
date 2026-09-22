import express from 'express';
import { drawController } from '../controllers/drawController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Optional auth helper to attach user if token present without throwing 401
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateUser(req, res, next);
  }
  next();
};

// Public / User routes
router.get('/upcoming', optionalAuth, drawController.getUpcomingDraw);
router.get('/history', drawController.getDrawHistory);
router.get('/user/entries', authenticateUser, drawController.getUserEntries);
router.get('/:id', drawController.getDrawById);

// Admin draw management routes
router.get('/admin/all', authenticateUser, requireAdmin, drawController.adminListDraws);
router.post('/admin/create', authenticateUser, requireAdmin, drawController.adminCreateDraw);
router.post('/admin/:id/generate-numbers', authenticateUser, requireAdmin, drawController.adminGenerateNumbers);
router.post('/admin/:id/simulate', authenticateUser, requireAdmin, drawController.adminSimulate);
router.post('/admin/:id/publish', authenticateUser, requireAdmin, drawController.adminPublish);

export default router;
