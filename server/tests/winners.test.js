import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/index.js';
import { tokenService } from '../src/services/tokenService.js';

test('Winner Verification & Payout System', async (t) => {
  // Create test user and winner record
  const user = db.users.create({
    email: `winner_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Lucky Golfer',
  });
  const userToken = tokenService.generateToken(user);

  const adminUser = db.users.create({
    email: `admin_winner_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Admin Winner Reviewer',
    role: 'ADMIN',
  });
  const adminToken = tokenService.generateToken(adminUser);

  const draw = db.draws.find()[0];
  const winner = db.winners.create({
    draw_id: draw.id,
    user_id: user.id,
    match_tier: 4,
    prize_amount: 1750.0,
    verification_status: 'PENDING_PROOF',
    payment_status: 'PENDING',
  });

  await t.test('GET /api/winners/my-winnings returns user winning record', async () => {
    const res = await request(app)
      .get('/api/winners/my-winnings')
      .set('Authorization', `Bearer ${userToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.winnings.length, 1);
    assert.equal(res.body.winnings[0].prize_amount, 1750.0);
    assert.equal(res.body.winnings[0].verification_status, 'PENDING_PROOF');
    assert.equal(res.body.totalWon, 1750.0);
  });

  await t.test('POST /api/winners/:id/proof uploads screenshot and updates status to PENDING_REVIEW', async () => {
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    const res = await request(app)
      .post(`/api/winners/${winner.id}/proof`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('proof', pngBuffer, 'scorecard.png');

    assert.equal(res.status, 200);
    assert.equal(res.body.winner.verification_status, 'PENDING_REVIEW');
    assert.ok(res.body.winner.proof_image_url);
  });

  await t.test('Admin lists winners with verification filters', async () => {
    const res = await request(app)
      .get('/api/winners/admin/all?verification_status=PENDING_REVIEW')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.ok(res.body.winners.some((w) => w.id === winner.id));
  });

  await t.test('Admin reviews proof: rejects with reason', async () => {
    const res = await request(app)
      .post(`/api/winners/admin/${winner.id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'REJECT',
        reason: 'Scorecard image is blurry and missing date stamp.',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.winner.verification_status, 'REJECTED');
    assert.equal(res.body.winner.rejection_reason, 'Scorecard image is blurry and missing date stamp.');
  });

  await t.test('Admin reviews proof: approves valid proof', async () => {
    const res = await request(app)
      .post(`/api/winners/admin/${winner.id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ action: 'APPROVE' });

    assert.equal(res.status, 200);
    assert.equal(res.body.winner.verification_status, 'APPROVED');
    assert.ok(res.body.winner.verified_at);
  });

  await t.test('Admin marks payout completed with transaction reference', async () => {
    const res = await request(app)
      .post(`/api/winners/admin/${winner.id}/payout`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ payment_reference: 'WIRE-HEROES-9921' });

    assert.equal(res.status, 200);
    assert.equal(res.body.winner.payment_status, 'PAID');
    assert.equal(res.body.winner.payment_reference, 'WIRE-HEROES-9921');
    assert.ok(res.body.winner.paid_at);
  });
});
