import express from 'express';
import { adminController } from '../controllers/adminController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateUser, requireAdmin);

router.get('/overview', adminController.getOverview);
router.get('/users', adminController.listUsers);
router.put('/users/:id', adminController.updateUser);
router.get('/users/:id/scores', adminController.getUserScores);

export default router;
