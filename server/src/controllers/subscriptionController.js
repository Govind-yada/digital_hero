import Stripe from 'stripe';
import { stripeService } from '../services/stripeService.js';
import { PLANS } from '../config/plans.js';
import { config } from '../config/env.js';
import db from '../db/index.js';

export const subscriptionController = {
  getPlans(req, res) {
    res.json({ plans: Object.values(PLANS) });
  },

  getCurrentSubscription(req, res) {
    const sub = db.subscriptions.findByUserId(req.user.id);
    if (!sub) {
      return res.json({
        subscription: {
          status: 'INACTIVE',
          plan_type: null,
          current_period_end: null,
        },
      });
    }

    res.json({
      subscription: {
        ...sub,
        plan_details: PLANS[sub.plan_type] || null,
        is_active: sub.status === 'ACTIVE',
      },
    });
  },

  async createCheckoutSession(req, res) {
    try {
      const { planType = 'MONTHLY' } = req.body;
      const successUrl = `${config.clientUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${config.clientUrl}/pricing?payment=cancelled`;

      const session = await stripeService.createCheckoutSession({
        userId: req.user.id,
        userEmail: req.user.email,
        planType,
        successUrl,
        cancelUrl,
      });

      res.json(session);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  cancelSubscription(req, res) {
    const sub = db.subscriptions.findByUserId(req.user.id);
    if (!sub || sub.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'No active subscription found to cancel.' });
    }

    const updated = db.subscriptions.createOrUpdate(req.user.id, {
      cancel_at_period_end: true,
      status: 'CANCELLED',
    });

    res.json({
      message: 'Subscription will not renew at the end of the current billing cycle.',
      subscription: updated,
    });
  },

  // Evaluator helper endpoint
  simulateToggle(req, res) {
    try {
      const { planType = 'MONTHLY', status = 'ACTIVE' } = req.body;
      const sub = stripeService.activateSimulation(req.user.id, planType, status);
      res.json({
        message: `Subscription successfully updated to ${status} (${planType}) for testing.`,
        subscription: sub,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Webhook handler
  async handleWebhook(req, res) {
    const sig = req.headers['stripe-signature'];
    let event;

    if (config.stripe.webhookSecret && sig) {
      try {
        const stripe = new Stripe(config.stripe.secretKey);
        event = stripe.webhooks.constructEvent(req.body, sig, config.stripe.webhookSecret);
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // Direct event fallback in test mode
      if (Buffer.isBuffer(req.body)) {
        event = JSON.parse(req.body.toString('utf-8'));
      } else if (typeof req.body === 'string') {
        event = JSON.parse(req.body);
      } else {
        event = req.body;
      }
    }

    try {
      await stripeService.handleWebhookEvent(event);
      res.json({ received: true });
    } catch (err) {
      console.error('Webhook processing error:', err.message);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  },
};
