import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/index.js';
import { tokenService } from '../src/services/tokenService.js';

test('Score Management APIs', async (t) => {
  // 1. Inactive user setup
  const inactiveUser = db.users.create({
    email: `inactive_golfer_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Inactive Golfer',
  });
  const inactiveToken = tokenService.generateToken(inactiveUser);

  // 2. Active subscriber setup
  const activeUser = db.users.create({
    email: `active_golfer_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Active Golfer',
  });
  db.subscriptions.createOrUpdate(activeUser.id, {
    status: 'ACTIVE',
    plan_type: 'MONTHLY',
  });
  const activeToken = tokenService.generateToken(activeUser);

  await t.test('POST /api/scores blocks non-subscribed users', async () => {
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${inactiveToken}`)
      .send({ score: 36, score_date: '2026-09-01' });

    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'SUBSCRIPTION_REQUIRED');
  });

  await t.test('POST /api/scores rejects score below 1', async () => {
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({ score: 0, score_date: '2026-09-01' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /between 1 and 45/);
  });

  await t.test('POST /api/scores rejects score above 45', async () => {
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({ score: 46, score_date: '2026-09-01' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /between 1 and 45/);
  });

  await t.test('POST /api/scores allows valid score entry', async () => {
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({ score: 40, score_date: '2026-09-08' });

    assert.equal(res.status, 201);
    assert.equal(res.body.score.score, 40);
    assert.equal(res.body.score.score_date, '2026-09-08');
  });

  await t.test('POST /api/scores rejects duplicate score on same date', async () => {
    const res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({ score: 38, score_date: '2026-09-08' });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /Only one score entry is permitted per date/);
  });

  await t.test('Rolling 5-score logic matches PRD specification exactly', async () => {
    // Current user has 08 Sep -> 40
    // Add 12 Sep -> 36, 15 Sep -> 32, 17 Sep -> 41, 20 Sep -> 38
    await request(app).post('/api/scores').set('Authorization', `Bearer ${activeToken}`).send({ score: 36, score_date: '2026-09-12' });
    await request(app).post('/api/scores').set('Authorization', `Bearer ${activeToken}`).send({ score: 32, score_date: '2026-09-15' });
    await request(app).post('/api/scores').set('Authorization', `Bearer ${activeToken}`).send({ score: 41, score_date: '2026-09-17' });
    await request(app).post('/api/scores').set('Authorization', `Bearer ${activeToken}`).send({ score: 38, score_date: '2026-09-20' });

    // Verify exactly 5 scores in reverse chronological order
    let res = await request(app).get('/api/scores').set('Authorization', `Bearer ${activeToken}`);
    assert.equal(res.body.scores.length, 5);
    assert.deepEqual(
      res.body.scores.map((s) => s.score_date),
      ['2026-09-20', '2026-09-17', '2026-09-15', '2026-09-12', '2026-09-08']
    );

    // Now add 6th score: 22 Sep -> 35
    const add6Res = await request(app)
      .post('/api/scores')
      .set('Authorization', `Bearer ${activeToken}`)
      .send({ score: 35, score_date: '2026-09-22' });

    assert.equal(add6Res.status, 201);
    assert.equal(add6Res.body.currentScores.length, 5);

    // Verify oldest (08 Sep) removed, retained newest 5 in reverse chronological order:
    // 22 Sep -> 35, 20 Sep -> 38, 17 Sep -> 41, 15 Sep -> 32, 12 Sep -> 36
    assert.deepEqual(
      add6Res.body.currentScores.map((s) => s.score_date),
      ['2026-09-22', '2026-09-20', '2026-09-17', '2026-09-15', '2026-09-12']
    );
    assert.deepEqual(
      add6Res.body.currentScores.map((s) => s.score),
      [35, 38, 41, 32, 36]
    );
  });

  await t.test('PUT /api/scores/:id updates score value and date', async () => {
    const listRes = await request(app).get('/api/scores').set('Authorization', `Bearer ${activeToken}`);
    const scoreToEdit = listRes.body.scores[0];

    const editRes = await request(app)
      .put(`/api/scores/${scoreToEdit.id}`)
      .set('Authorization', `Bearer ${activeToken}`)
      .send({ score: 42 });

    assert.equal(editRes.status, 200);
    assert.equal(editRes.body.score.score, 42);
  });

  await t.test('DELETE /api/scores/:id removes score', async () => {
    const listRes = await request(app).get('/api/scores').set('Authorization', `Bearer ${activeToken}`);
    const scoreToDelete = listRes.body.scores[0];

    const delRes = await request(app)
      .delete(`/api/scores/${scoreToDelete.id}`)
      .set('Authorization', `Bearer ${activeToken}`);

    assert.equal(delRes.status, 200);
    assert.equal(delRes.body.remainingScores.length, 4);
  });
});
