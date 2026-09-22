import Stripe from 'stripe';
import { config } from '../config/env.js';
import { PLANS } from '../config/plans.js';
import db from '../db/index.js';

const stripe = config.stripe.secretKey && !config.stripe.secretKey.includes('test_your')
  ? new Stripe(config.stripe.secretKey)
  : null;

export const stripeService = {
  get isConfigured() {
    return !!stripe;
  },

  async createCheckoutSession({ userId, userEmail, planType = 'MONTHLY', successUrl, cancelUrl }) {
    const selectedPlan = PLANS[planType.toUpperCase()] || PLANS.MONTHLY;

    if (!stripe) {
      // In development / demo when Stripe live API keys aren't set, return mock session
      return {
        sessionId: `cs_mock_${Date.now()}`,
        url: `${successUrl}?mock_session_id=cs_mock_${Date.now()}&plan=${selectedPlan.id}`,
        isMock: true,
      };
    }

    // Stripe checkout session creation
    const priceId = planType.toUpperCase() === 'YEARLY'
      ? config.stripe.yearlyPriceId
      : config.stripe.monthlyPriceId;

    const sessionPayload = {
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: userEmail,
      client_reference_id: userId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        planType: selectedPlan.id,
      },
    };

    // Use price ID if valid, or line items with price data
    if (priceId && priceId.startsWith('price_')) {
      sessionPayload.line_items = [{ price: priceId, quantity: 1 }];
    } else {
      sessionPayload.line_items = [
        {
          price_data: {
            currency: selectedPlan.currency,
            product_data: {
              name: selectedPlan.name,
              description: `Digital Heroes ${selectedPlan.id} Subscription`,
            },
            unit_amount: selectedPlan.priceCents,
            recurring: {
              interval: selectedPlan.interval,
            },
          },
          quantity: 1,
        },
      ];
    }

    const session = await stripe.checkout.sessions.create(sessionPayload);
    return {
      sessionId: session.id,
      url: session.url,
      isMock: false,
    };
  },

  async handleWebhookEvent(event) {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planType = session.metadata?.planType || 'MONTHLY';
        const plan = PLANS[planType.toUpperCase()] || PLANS.MONTHLY;

        if (userId) {
          const user = db.users.findById(userId);
          const periodEnd = new Date(Date.now() + (plan.interval === 'year' ? 365 : 30) * 86400000);

          const sub = db.subscriptions.createOrUpdate(userId, {
            stripe_customer_id: session.customer,
            stripe_subscription_id: session.subscription,
            plan_type: plan.id,
            status: 'ACTIVE',
            amount: plan.price,
            current_period_start: new Date().toISOString(),
            current_period_end: periodEnd.toISOString(),
            cancel_at_period_end: false,
          });

          // Log charity contribution from this subscription payment
          if (user && user.selected_charity_id) {
            const charityCut = (plan.price * (user.charity_percentage / 100));
            db.charityContributions.create({
              user_id: user.id,
              charity_id: user.selected_charity_id,
              subscription_id: sub.id,
              amount: parseFloat(charityCut.toFixed(2)),
              contribution_percentage: user.charity_percentage,
              contribution_type: 'SUBSCRIPTION_SHARE',
            });
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const subRecord = db.subscriptions.findByStripeSubId(subscription.id);
        if (subRecord) {
          let status = 'ACTIVE';
          if (subscription.status === 'past_due' || subscription.status === 'unpaid') {
            status = 'LAPSED';
          } else if (subscription.status === 'canceled') {
            status = 'CANCELLED';
          }

          db.subscriptions.createOrUpdate(subRecord.user_id, {
            status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const subRecord = db.subscriptions.findByStripeSubId(subscription.id);
        if (subRecord) {
          db.subscriptions.createOrUpdate(subRecord.user_id, {
            status: 'CANCELLED',
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        if (invoice.subscription) {
          const subRecord = db.subscriptions.findByStripeSubId(invoice.subscription);
          if (subRecord) {
            db.subscriptions.createOrUpdate(subRecord.user_id, {
              status: 'LAPSED',
            });
          }
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  },

  // Manual toggle for evaluation / testing
  activateSimulation(userId, planType = 'MONTHLY', status = 'ACTIVE') {
    const plan = PLANS[planType.toUpperCase()] || PLANS.MONTHLY;
    const user = db.users.findById(userId);
    if (!user) throw new Error('User not found');

    const periodEnd = new Date(Date.now() + (plan.interval === 'year' ? 365 : 30) * 86400000);

    const sub = db.subscriptions.createOrUpdate(userId, {
      plan_type: plan.id,
      status,
      amount: plan.price,
      stripe_customer_id: `cus_sim_${Date.now()}`,
      stripe_subscription_id: `sub_sim_${Date.now()}`,
      current_period_start: new Date().toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
    });

    if (status === 'ACTIVE' && user.selected_charity_id) {
      const charityCut = plan.price * (user.charity_percentage / 100);
      db.charityContributions.create({
        user_id: user.id,
        charity_id: user.selected_charity_id,
        subscription_id: sub.id,
        amount: parseFloat(charityCut.toFixed(2)),
        contribution_percentage: user.charity_percentage,
        contribution_type: 'SUBSCRIPTION_SHARE',
      });
    }

    return sub;
  },
};
