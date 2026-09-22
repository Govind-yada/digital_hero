import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/db/index.js';
import { drawEngine } from '../src/services/drawEngine.js';
import { prizePoolService } from '../src/services/prizePoolService.js';
import { tokenService } from '../src/services/tokenService.js';

test('Draw Engine, Simulation & Prize Pool', async (t) => {
  const adminUser = db.users.create({
    email: `admin_draw_${Date.now()}@example.com`,
    password_hash: 'hash',
    name: 'Admin Draw Tester',
    role: 'ADMIN',
    charity_percentage: 10.0,
  });
  const adminToken = tokenService.generateToken(adminUser);

  await t.test('Random draw generates 5 unique sorted numbers between 1 and 45', () => {
    const numbers = drawEngine.generateRandomNumbers();
    assert.equal(numbers.length, 5);
    // All unique
    assert.equal(new Set(numbers).size, 5);
    // In range [1, 45]
    for (const num of numbers) {
      assert.ok(num >= 1 && num <= 45);
    }
    // Sorted ascending
    assert.deepEqual(numbers, [...numbers].sort((a, b) => a - b));
  });

  await t.test('Algorithmic draw weights by score frequency with metadata', () => {
    // Seed sample entries heavily skewed towards [36, 38, 40, 42, 44]
    const entries = [
      { numbers: [36, 38, 40, 42, 44] },
      { numbers: [36, 38, 40, 42, 44] },
      { numbers: [36, 38, 40, 42, 44] },
    ];
    const res = drawEngine.generateAlgorithmicNumbers(entries);
    assert.equal(res.winningNumbers.length, 5);
    assert.equal(new Set(res.winningNumbers).size, 5);
    assert.ok(res.metadata.topFrequencies.length > 0);
  });

  await t.test('calculateMatches accurately counts matching numbers', () => {
    const winning = [10, 20, 30, 40, 45];
    assert.equal(drawEngine.calculateMatches(winning, [10, 20, 30, 40, 45]), 5);
    assert.equal(drawEngine.calculateMatches(winning, [10, 20, 30, 40, 1]), 4);
    assert.equal(drawEngine.calculateMatches(winning, [10, 20, 30, 2, 1]), 3);
    assert.equal(drawEngine.calculateMatches(winning, [10, 20, 3, 2, 1]), 2);
    assert.equal(drawEngine.calculateMatches(winning, [9, 8, 7, 6, 5]), 0);
  });

  await t.test('Prize pool splits tiers (40% Tier 5, 35% Tier 4, 25% Tier 3) + Rollover', () => {
    // 100 subscribers * $29 = $2,900 revenue. 50% base pool = $1,450.
    // Rollover from previous = $500.
    // Total pool = $1,450 + $500 = $1,950.
    // Tier 5 = ($1,450 * 0.40) + $500 = $580 + $500 = $1,080.
    // Tier 4 = $1,450 * 0.35 = $507.50.
    // Tier 3 = $1,450 * 0.25 = $362.50.
    const pool = prizePoolService.calculatePoolStructure(100, 500.0, 29.0);
    assert.equal(pool.totalRevenue, 2900.0);
    assert.equal(pool.basePoolShare, 1450.0);
    assert.equal(pool.totalPool, 1950.0);
    assert.equal(pool.tier5Pool, 1080.0);
    assert.equal(pool.tier4Pool, 507.5);
    assert.equal(pool.tier3Pool, 362.5);
  });

  await t.test('Multiple winners in the same tier split prize equally', () => {
    const pool = {
      tier5Pool: 10000.0,
      tier4Pool: 3500.0,
      tier3Pool: 2500.0,
    };

    // 2 winners in Tier 5 ($10,000 / 2 = $5,000 each)
    const matches = [
      { userId: 'u1', entryId: 'e1', matchCount: 5, matchedNumbers: [1, 2, 3, 4, 5] },
      { userId: 'u2', entryId: 'e2', matchCount: 5, matchedNumbers: [1, 2, 3, 4, 5] },
      { userId: 'u3', entryId: 'e3', matchCount: 4, matchedNumbers: [1, 2, 3, 4] },
    ];

    const dist = prizePoolService.distributePrizes(pool, matches);
    assert.equal(dist.tier5.winnersCount, 2);
    assert.equal(dist.tier5.prizePerWinner, 5000.0);
    assert.equal(dist.tier5.rolledOverToNext, 0);

    assert.equal(dist.tier4.winnersCount, 1);
    assert.equal(dist.tier4.prizePerWinner, 3500.0);

    // 0 winners in Tier 3 -> stays in reserve, totalRolledOver is 0 for tier 3
    assert.equal(dist.tier3.winnersCount, 0);
    assert.equal(dist.tier3.unclaimedReserve, 2500.0);
  });

  await t.test('Zero 5-match winners causes Tier 5 jackpot to roll over completely', () => {
    const pool = {
      tier5Pool: 6000.0,
      tier4Pool: 3500.0,
      tier3Pool: 2500.0,
    };

    // Only tier 4 and tier 3 winners, 0 tier 5 winners
    const matches = [
      { userId: 'u3', entryId: 'e3', matchCount: 4, matchedNumbers: [1, 2, 3, 4] },
      { userId: 'u4', entryId: 'e4', matchCount: 3, matchedNumbers: [1, 2, 3] },
    ];

    const dist = prizePoolService.distributePrizes(pool, matches);
    assert.equal(dist.tier5.winnersCount, 0);
    assert.equal(dist.tier5.rolledOverToNext, 6000.0);
    assert.equal(dist.totalRolledOver, 6000.0);
  });

  await t.test('Admin Full Draw Flow: Create -> Generate -> Simulate -> Publish', async () => {
    // 1. Create draw
    const createRes = await request(app)
      .post('/api/draws/admin/create')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        draw_code: `TEST-DRAW-${Date.now()}`,
        draw_month: '2026-10-31',
        draw_type: 'ALGORITHMIC',
      });
    assert.equal(createRes.status, 201);
    const drawId = createRes.body.draw.id;
    assert.equal(createRes.body.draw.status, 'DRAFT');

    // 2. Generate numbers
    const genRes = await request(app)
      .post(`/api/draws/admin/${drawId}/generate-numbers`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ draw_type: 'ALGORITHMIC' });
    assert.equal(genRes.status, 200);
    assert.equal(genRes.body.draw.winning_numbers.length, 5);

    // 3. Simulate
    const simRes = await request(app)
      .post(`/api/draws/admin/${drawId}/simulate`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(simRes.status, 200);
    assert.ok(simRes.body.matchesSummary);

    // 4. Publish
    const pubRes = await request(app)
      .post(`/api/draws/admin/${drawId}/publish`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(pubRes.status, 200);
    assert.equal(pubRes.body.draw.status, 'PUBLISHED');

    // 5. Verify published draw cannot be casually modified
    const reGenRes = await request(app)
      .post(`/api/draws/admin/${drawId}/generate-numbers`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ draw_type: 'RANDOM' });
    assert.equal(reGenRes.status, 400);
    assert.match(reGenRes.body.error, /Cannot modify/);
  });
});
