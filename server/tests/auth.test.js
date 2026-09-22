import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/index.js';

test('Authentication & RBAC APIs', async (t) => {
  const testEmail = `user_${Date.now()}@example.com`;
  let authToken = null;

  await t.test('POST /api/auth/register rejects password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'shortpass@example.com',
        password: 'short',
        name: 'Short Pass User',
      });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /at least 8 characters/);
  });

  await t.test('POST /api/auth/register rejects charity percentage < 10%', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'lowcharity@example.com',
        password: 'ValidPassword123!',
        name: 'Low Charity User',
        charity_percentage: 5,
      });
    assert.equal(res.status, 400);
    assert.match(res.body.error, /between 10% and 100%/);
  });

  await t.test('POST /api/auth/register successfully creates user and returns token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'ValidPassword123!',
        name: 'Jane Golfer',
        charity_percentage: 15,
      });
    assert.equal(res.status, 201);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmail);
    assert.equal(res.body.user.name, 'Jane Golfer');
    assert.equal(res.body.user.role, 'USER');
    assert.equal(res.body.user.charity_percentage, 15);
    authToken = res.body.token;
  });

  await t.test('POST /api/auth/register rejects duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: testEmail,
        password: 'AnotherPassword123!',
        name: 'Duplicate Jane',
      });
    assert.equal(res.status, 409);
    assert.match(res.body.error, /already exists/);
  });

  await t.test('POST /api/auth/login succeeds with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'ValidPassword123!',
      });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.email, testEmail);
  });

  await t.test('POST /api/auth/login fails with invalid password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword!',
      });
    assert.equal(res.status, 401);
    assert.match(res.body.error, /Invalid email or password/);
  });

  await t.test('GET /api/auth/me rejects without token', async () => {
    const res = await request(app).get('/api/auth/me');
    assert.equal(res.status, 401);
  });

  await t.test('GET /api/auth/me succeeds with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.user.email, testEmail);
    assert.ok(res.body.subscription);
  });
});
