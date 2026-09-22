import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/index.js';
import { tokenService } from '../src/services/tokenService.js';

test('Charity System APIs', async (t) => {
  const charities = db.charities.find();
  assert.ok(charities.length >= 2, 'Pre-seeded charities should exist');
  const targetCharity = charities[0];

  const testUser = db.users.create({
    email: `charity_user_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Charity Tester',
    selected_charity_id: targetCharity.id,
    charity_percentage: 10.0,
  });
  const userToken = tokenService.generateToken(testUser);

  const adminUser = db.users.create({
    email: `admin_charity_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Admin Charity Tester',
    role: 'ADMIN',
    selected_charity_id: targetCharity.id,
    charity_percentage: 10.0,
  });
  const adminToken = tokenService.generateToken(adminUser);

  await t.test('GET /api/charities returns public directory with metrics', async () => {
    const res = await request(app).get('/api/charities');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.charities));
    assert.ok(res.body.charities.length >= 2);
    assert.ok(res.body.charities[0].name);
    assert.ok(res.body.charities[0].totalRaised !== undefined);
  });

  await t.test('GET /api/charities/featured returns only featured charities', async () => {
    const res = await request(app).get('/api/charities/featured');
    assert.equal(res.status, 200);
    assert.ok(res.body.charities.every((c) => c.is_featured === true));
  });

  await t.test('GET /api/charities/:id returns specific charity profile', async () => {
    const res = await request(app).get(`/api/charities/${targetCharity.id}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.charity.id, targetCharity.id);
  });

  await t.test('PUT /api/charities/user/select updates user charity and contribution %', async () => {
    const nextCharity = charities[1];
    const res = await request(app)
      .put('/api/charities/user/select')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        charity_id: nextCharity.id,
        charity_percentage: 25.0,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.charity_percentage, 25.0);
    assert.equal(res.body.selected_charity.id, nextCharity.id);
  });

  await t.test('PUT /api/charities/user/select rejects contribution % < 10%', async () => {
    const res = await request(app)
      .put('/api/charities/user/select')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        charity_percentage: 8.5,
      });

    assert.equal(res.status, 400);
    assert.match(res.body.error, /between 10% and 100%/);
  });

  await t.test('POST /api/charities/:id/donate records independent direct donation', async () => {
    const res = await request(app)
      .post(`/api/charities/${targetCharity.id}/donate`)
      .send({
        amount: 50.0,
        donor_name: 'Kind Golfer',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.contribution.amount, 50.0);
    assert.equal(res.body.contribution.contribution_type, 'DIRECT_DONATION');
  });

  await t.test('Admin CRUD: create, update, delete charity', async () => {
    // Create
    const createRes = await request(app)
      .post('/api/charities')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Junior Fairway Initiative',
        description: 'Mentoring young junior athletes',
        category: 'Youth',
        is_featured: true,
      });
    assert.equal(createRes.status, 201);
    const newId = createRes.body.charity.id;

    // Update
    const updateRes = await request(app)
      .put(`/api/charities/${newId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ is_featured: false });
    assert.equal(updateRes.status, 200);
    assert.equal(updateRes.body.charity.is_featured, false);

    // Delete
    const deleteRes = await request(app)
      .delete(`/api/charities/${newId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(deleteRes.status, 200);
  });
});
