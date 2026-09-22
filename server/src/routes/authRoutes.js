import express from 'express';
import { authController } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticateUser, authController.getMe);
router.post('/logout', authenticateUser, authController.logout);

export default router;
