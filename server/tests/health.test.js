import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/health returns 200 and ok status', async () => {
  const res = await request(app).get('/api/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
  assert.equal(res.body.app, 'Digital Heroes API');
});

test('GET /api returns 200 and API endpoint index', async () => {
  const res = await request(app).get('/api');
  assert.equal(res.status, 200);
  assert.ok(res.body.endpoints);
});
