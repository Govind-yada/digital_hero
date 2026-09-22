import { test } from 'node:test';
import assert from 'node:assert/strict';
import db from '../src/db/index.js';

test('Database Rules & Constraints', async (t) => {
  await t.test('enforces minimum 10% charity contribution at creation and update', () => {
    const uniqueEmail1 = `invalid_${Date.now()}@example.com`;
    const uniqueEmail2 = `valid_${Date.now()}@example.com`;

    // Rejects below 10%
    assert.throws(
      () => {
        db.users.create({
          email: uniqueEmail1,
          name: 'Invalid Charity',
          password_hash: 'hash',
          charity_percentage: 9.99,
        });
      },
      /must be at least 10%/
    );

    // Accepts 10% or higher
    const validUser = db.users.create({
      email: uniqueEmail2,
      name: 'Valid Charity',
      password_hash: 'hash',
      charity_percentage: 10.0,
    });
    assert.equal(validUser.charity_percentage, 10.0);

    // Rejects update below 10%
    assert.throws(
      () => {
        db.users.update(validUser.id, { charity_percentage: 5.0 });
      },
      /must be at least 10%/
    );
  });

  await t.test('enforces Stableford score range between 1 and 45', () => {
    const userId = `range_user_${Date.now()}`;

    // Reject below 1
    assert.throws(
      () => {
        db.scores.addScore(userId, 0, '2026-09-01');
      },
      /between 1 and 45/
    );

    // Reject above 45
    assert.throws(
      () => {
        db.scores.addScore(userId, 46, '2026-09-02');
      },
      /between 1 and 45/
    );

    // Accept boundary values 1 and 45
    const score1 = db.scores.addScore(userId, 1, '2026-09-01');
    assert.equal(score1.score, 1);

    const score45 = db.scores.addScore(userId, 45, '2026-09-02');
    assert.equal(score45.score, 45);
  });

  await t.test('prevents duplicate score entries on the same date for the same user', () => {
    const userId = `date_user_${Date.now()}`;
    db.scores.addScore(userId, 36, '2026-09-10');

    // Attempting same date should throw
    assert.throws(
      () => {
        db.scores.addScore(userId, 40, '2026-09-10');
      },
      /Only one score entry is permitted per date/
    );
  });

  await t.test('strictly retains only the latest 5 scores in reverse chronological order', () => {
    const userId = `rolling_user_${Date.now()}`;

    // Add initial 5 scores with dates from PRD example:
    // 08 Sep -> 40
    // 12 Sep -> 36
    // 15 Sep -> 32
    // 17 Sep -> 41
    // 20 Sep -> 38
    db.scores.addScore(userId, 40, '2026-09-08');
    db.scores.addScore(userId, 36, '2026-09-12');
    db.scores.addScore(userId, 32, '2026-09-15');
    db.scores.addScore(userId, 41, '2026-09-17');
    db.scores.addScore(userId, 38, '2026-09-20');

    let currentScores = db.scores.findByUserId(userId);
    assert.equal(currentScores.length, 5);
    // Reverse chronological order: 20 Sep, 17 Sep, 15 Sep, 12 Sep, 08 Sep
    assert.deepEqual(
      currentScores.map((s) => s.score_date),
      ['2026-09-20', '2026-09-17', '2026-09-15', '2026-09-12', '2026-09-08']
    );

    // Now add 6th score: 22 Sep -> 35
    db.scores.addScore(userId, 35, '2026-09-22');

    currentScores = db.scores.findByUserId(userId);
    assert.equal(currentScores.length, 5, 'Must strictly retain exactly 5 scores');

    // Oldest (08 Sep -> 40) must be dropped
    // Remaining must be: 22 Sep -> 35, 20 Sep -> 38, 17 Sep -> 41, 15 Sep -> 32, 12 Sep -> 36
    assert.deepEqual(
      currentScores.map((s) => s.score_date),
      ['2026-09-22', '2026-09-20', '2026-09-17', '2026-09-15', '2026-09-12']
    );
    assert.deepEqual(
      currentScores.map((s) => s.score),
      [35, 38, 41, 32, 36]
    );
  });
});
