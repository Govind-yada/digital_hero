import express from 'express';
import multer from 'multer';
import { winnerController } from '../controllers/winnerController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Authenticated user routes
router.get('/my-winnings', authenticateUser, winnerController.getMyWinnings);
router.post('/:id/proof', authenticateUser, upload.single('proof'), winnerController.uploadProof);

// Static proof file viewer
router.get('/proof-file/:filename', winnerController.getProofFile);

// Admin routes
router.get('/admin/all', authenticateUser, requireAdmin, winnerController.adminListWinners);
router.post('/admin/:id/review', authenticateUser, requireAdmin, winnerController.adminReviewProof);
router.post('/admin/:id/payout', authenticateUser, requireAdmin, winnerController.adminMarkPayout);

export default router;
