import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/index.js';
import { tokenService } from '../src/services/tokenService.js';

test('Subscription & Payment APIs', async (t) => {
  // Create a test user with charity for subscription testing
  const charity = db.charities.find()[0];
  const testUser = db.users.create({
    email: `sub_test_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Sub Tester',
    selected_charity_id: charity.id,
    charity_percentage: 20.0,
  });
  const token = tokenService.generateToken(testUser);

  await t.test('GET /api/subscriptions/plans returns monthly and yearly plans', async () => {
    const res = await request(app).get('/api/subscriptions/plans');
    assert.equal(res.status, 200);
    assert.equal(res.body.plans.length, 2);
    assert.equal(res.body.plans[0].id, 'MONTHLY');
    assert.equal(res.body.plans[1].id, 'YEARLY');
  });

  await t.test('GET /api/subscriptions/current returns INACTIVE for new user', async () => {
    const res = await request(app)
      .get('/api/subscriptions/current')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.subscription.status, 'INACTIVE');
  });

  await t.test('POST /api/subscriptions/create-checkout-session creates session', async () => {
    const res = await request(app)
      .post('/api/subscriptions/create-checkout-session')
      .set('Authorization', `Bearer ${token}`)
      .send({ planType: 'MONTHLY' });
    assert.equal(res.status, 200);
    assert.ok(res.body.sessionId);
    assert.ok(res.body.url);
  });

  await t.test('POST /api/subscriptions/simulate-toggle updates subscription to ACTIVE', async () => {
    const res = await request(app)
      .post('/api/subscriptions/simulate-toggle')
      .set('Authorization', `Bearer ${token}`)
      .send({ planType: 'MONTHLY', status: 'ACTIVE' });
    assert.equal(res.status, 200);
    assert.equal(res.body.subscription.status, 'ACTIVE');

    // Verify charity contribution was logged (20% of $29 = $5.80)
    const contributions = db.charityContributions.findByUserId(testUser.id);
    assert.ok(contributions.length > 0);
    assert.equal(contributions[0].amount, 5.8);
  });

  await t.test('POST /api/subscriptions/cancel cancels subscription', async () => {
    const res = await request(app)
      .post('/api/subscriptions/cancel')
      .set('Authorization', `Bearer ${token}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.subscription.status, 'CANCELLED');
  });

  await t.test('Webhook checkout.session.completed updates subscription & charity ledger', async () => {
    const webhookUser = db.users.create({
      email: `webhook_user_${Date.now()}@example.com`,
      password_hash: 'hash',
      name: 'Webhook User',
      selected_charity_id: charity.id,
      charity_percentage: 15.0,
    });

    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          client_reference_id: webhookUser.id,
          customer: 'cus_webhook_test',
          subscription: 'sub_webhook_test',
          metadata: {
            userId: webhookUser.id,
            planType: 'YEARLY',
          },
        },
      },
    };

    const res = await request(app)
      .post('/api/subscriptions/webhook')
      .set('Content-Type', 'application/json')
      .send(mockEvent);

    assert.equal(res.status, 200);
    assert.equal(res.body.received, true);

    const sub = db.subscriptions.findByUserId(webhookUser.id);
    assert.equal(sub.status, 'ACTIVE');
    assert.equal(sub.plan_type, 'YEARLY');

    // 15% of $290 = $43.50
    const contributions = db.charityContributions.findByUserId(webhookUser.id);
    assert.ok(contributions.length > 0);
    assert.equal(contributions[0].amount, 43.5);
  });
});
