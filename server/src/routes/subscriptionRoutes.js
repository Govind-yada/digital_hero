import express from 'express';
import { subscriptionController } from '../controllers/subscriptionController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Public plans
router.get('/plans', subscriptionController.getPlans);

// Authenticated subscription endpoints
router.get('/current', authenticateUser, subscriptionController.getCurrentSubscription);
router.post('/create-checkout-session', authenticateUser, subscriptionController.createCheckoutSession);
router.post('/cancel', authenticateUser, subscriptionController.cancelSubscription);
router.post('/simulate-toggle', authenticateUser, subscriptionController.simulateToggle);

// Public webhook
router.post('/webhook', express.raw({ type: 'application/json' }), subscriptionController.handleWebhook);

export default router;
