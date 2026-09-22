import express from 'express';
import { scoreController } from '../controllers/scoreController.js';
import { authenticateUser, requireSubscription } from '../middleware/auth.js';

const router = express.Router();

// All score endpoints require authentication and active subscription
router.use(authenticateUser, requireSubscription);

router.get('/', scoreController.getUserScores);
router.post('/', scoreController.addScore);
router.put('/:id', scoreController.updateScore);
router.delete('/:id', scoreController.deleteScore);

export default router;
