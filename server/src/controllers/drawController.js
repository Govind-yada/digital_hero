import db from '../db/index.js';
import { drawEngine } from '../services/drawEngine.js';
import { prizePoolService } from '../services/prizePoolService.js';

export const drawController = {
  // Public / User: Get current upcoming or active draw
  getUpcomingDraw(req, res) {
    const draw = db.draws.findUpcoming();
    if (!draw) {
      return res.status(404).json({ error: 'No active draw found.' });
    }

    const prizePool = db.prizePools.findByDrawId(draw.id);

    // If user is authenticated, attach their draw entry and current scores
    let userEntry = null;
    if (req.user) {
      userEntry = db.drawEntries.findByDrawAndUser(draw.id, req.user.id);
      if (!userEntry) {
        // Derive ticket from their 5 latest scores if they have 5
        const userScores = db.scores.findByUserId(req.user.id);
        if (userScores.length === 5) {
          const numbers = userScores.map((s) => s.score);
          userEntry = db.drawEntries.createOrUpdate(draw.id, req.user.id, numbers);
        }
      }
    }

    res.json({
      draw,
      prizePool,
      userEntry,
    });
  },

  // Public: List past published draws
  getDrawHistory(req, res) {
    const draws = db.draws.find().filter((d) => d.status === 'PUBLISHED' || d.status === 'COMPLETED');

    const history = draws.map((d) => {
      const pool = db.prizePools.findByDrawId(d.id);
      const winners = db.winners.find({ draw_id: d.id });
      return {
        ...d,
        prizePool: pool,
        winnersCount: winners.length,
        tier5Winners: winners.filter((w) => w.match_tier === 5).length,
        tier4Winners: winners.filter((w) => w.match_tier === 4).length,
        tier3Winners: winners.filter((w) => w.match_tier === 3).length,
      };
    });

    res.json({ history });
  },

  // Public: Get specific draw details and winner list
  getDrawById(req, res) {
    const draw = db.draws.findById(req.params.id);
    if (!draw) {
      return res.status(404).json({ error: 'Draw not found.' });
    }

    const prizePool = db.prizePools.findByDrawId(draw.id);
    const winners = db.winners.find({ draw_id: draw.id });

    // Sanitize winner identities for public display (e.g. Alex M.)
    const sanitizedWinners = winners.map((w) => {
      const user = db.users.findById(w.user_id);
      const charity = user?.selected_charity_id ? db.charities.findById(user.selected_charity_id) : null;
      const initial = user?.name ? `${user.name.split(' ')[0]} ${user.name.split(' ')[1]?.[0] || ''}.` : 'Anonymous';
      return {
        ...w,
        userName: initial,
        charityName: charity?.name || 'Community Impact',
      };
    });

    res.json({
      draw,
      prizePool,
      winners: sanitizedWinners,
    });
  },

  // Authenticated user: View their draw entries history
  getUserEntries(req, res) {
    const entries = db.drawEntries.findByUserId(req.user.id);
    const enriched = entries.map((entry) => {
      const draw = db.draws.findById(entry.draw_id);
      const winnerRecord = db.winners
        .find({ draw_id: entry.draw_id, user_id: req.user.id })[0] || null;
      return {
        ...entry,
        draw,
        winnerRecord,
      };
    });

    res.json({ entries: enriched });
  },

  // ================= ADMIN OPERATIONS =================

  // Admin: List all draws
  adminListDraws(req, res) {
    const draws = db.draws.find().map((d) => {
      const pool = db.prizePools.findByDrawId(d.id);
      const entries = db.drawEntries.findByDrawId(d.id);
      const winners = db.winners.find({ draw_id: d.id });
      return {
        ...d,
        prizePool: pool,
        totalEntries: entries.length,
        winnersCount: winners.length,
      };
    });
    res.json({ draws });
  },

  // Admin: Create a new draw draft
  adminCreateDraw(req, res) {
    try {
      const { draw_code, draw_month, draw_type = 'RANDOM' } = req.body;

      if (!draw_code || !draw_month) {
        return res.status(400).json({ error: 'draw_code and draw_month are required.' });
      }

      // Check rollover from the most recent published draw
      const pastPublished = db.draws
        .find()
        .filter((d) => d.status === 'PUBLISHED' || d.status === 'COMPLETED');
      let rollover = 0;
      if (pastPublished.length > 0) {
        const lastPool = db.prizePools.findByDrawId(pastPublished[0].id);
        if (lastPool) {
          rollover = parseFloat(lastPool.rolled_over_amount || 0);
        }
      }

      const activeSubCount = db.subscriptions.countActive();
      const poolCalc = prizePoolService.calculatePoolStructure(activeSubCount, rollover);

      const draw = db.draws.create({
        draw_code,
        draw_month,
        draw_type,
        winning_numbers: [],
        status: 'DRAFT',
        rollover_from_previous: rollover,
      });

      const prizePool = db.prizePools.createOrUpdate(draw.id, {
        total_revenue: poolCalc.totalRevenue,
        total_pool: poolCalc.totalPool,
        tier_5_pool: poolCalc.tier5Pool,
        tier_4_pool: poolCalc.tier4Pool,
        tier_3_pool: poolCalc.tier3Pool,
        rolled_over_amount: 0.0,
        total_eligible_subscribers: activeSubCount,
      });

      // Auto-enroll active subscribers who have 5 scores
      const activeUsers = db.users.find().filter((u) => {
        const sub = db.subscriptions.findByUserId(u.id);
        return sub && sub.status === 'ACTIVE';
      });

      for (const u of activeUsers) {
        const scores = db.scores.findByUserId(u.id);
        if (scores.length === 5) {
          db.drawEntries.createOrUpdate(
            draw.id,
            u.id,
            scores.map((s) => s.score)
          );
        }
      }

      res.status(201).json({
        message: 'Draw draft created successfully.',
        draw,
        prizePool,
        enrolledSubscribers: db.drawEntries.findByDrawId(draw.id).length,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Admin: Generate winning numbers (RANDOM or ALGORITHMIC)
  adminGenerateNumbers(req, res) {
    const { id } = req.params;
    const { draw_type } = req.body;

    const draw = db.draws.findById(id);
    if (!draw) return res.status(404).json({ error: 'Draw not found.' });

    if (draw.status === 'PUBLISHED' || draw.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot modify winning numbers of a published draw.' });
    }

    const type = draw_type || draw.draw_type || 'RANDOM';
    let winningNumbers = [];
    let algorithmMetadata = {};

    if (type === 'ALGORITHMIC') {
      const entries = db.drawEntries.findByDrawId(draw.id);
      const result = drawEngine.generateAlgorithmicNumbers(entries);
      winningNumbers = result.winningNumbers;
      algorithmMetadata = result.metadata;
    } else {
      winningNumbers = drawEngine.generateRandomNumbers();
      algorithmMetadata = { mode: 'UNIFORM_RANDOM' };
    }

    const updated = db.draws.update(draw.id, {
      draw_type: type,
      winning_numbers: winningNumbers,
      algorithm_metadata: algorithmMetadata,
    });

    res.json({
      message: `Generated 5 winning numbers using ${type} mode.`,
      draw: updated,
    });
  },

  // Admin: Simulate results against subscriber entries without publishing
  adminSimulate(req, res) {
    const { id } = req.params;
    const draw = db.draws.findById(id);
    if (!draw) return res.status(404).json({ error: 'Draw not found.' });

    if (draw.status === 'PUBLISHED' || draw.status === 'COMPLETED') {
      return res.status(400).json({ error: 'This draw has already been published.' });
    }

    if (!draw.winning_numbers || draw.winning_numbers.length !== 5) {
      return res.status(400).json({ error: 'Winning numbers must be generated before running simulation.' });
    }

    // Recalculate pool with current active subscribers
    const activeSubCount = db.subscriptions.countActive();
    const poolStructure = prizePoolService.calculatePoolStructure(activeSubCount, parseFloat(draw.rollover_from_previous || 0));

    // Ensure all active subscribers with 5 scores have draw tickets
    const activeUsers = db.users.find().filter((u) => {
      const sub = db.subscriptions.findByUserId(u.id);
      return sub && sub.status === 'ACTIVE';
    });

    for (const u of activeUsers) {
      const scores = db.scores.findByUserId(u.id);
      if (scores.length === 5) {
        db.drawEntries.createOrUpdate(
          draw.id,
          u.id,
          scores.map((s) => s.score)
        );
      }
    }

    // Match each entry
    const entries = db.drawEntries.findByDrawId(draw.id);
    const matches = [];

    for (const entry of entries) {
      const matchCount = drawEngine.calculateMatches(draw.winning_numbers, entry.numbers);
      db.drawEntries.updateMatchCount(entry.id, matchCount);

      const winningSet = new Set(draw.winning_numbers);
      const matchedNumbers = entry.numbers.filter((n) => winningSet.has(n));

      matches.push({
        entryId: entry.id,
        userId: entry.user_id,
        user: db.users.findById(entry.user_id)?.name || 'Unknown',
        numbers: entry.numbers,
        matchCount,
        matchedNumbers,
      });
    }

    const distribution = prizePoolService.distributePrizes(poolStructure, matches);

    db.draws.update(draw.id, {
      status: 'SIMULATED',
      simulated_at: new Date().toISOString(),
    });

    db.prizePools.createOrUpdate(draw.id, {
      total_revenue: poolStructure.totalRevenue,
      total_pool: poolStructure.totalPool,
      tier_5_pool: poolStructure.tier5Pool,
      tier_4_pool: poolStructure.tier4Pool,
      tier_3_pool: poolStructure.tier3Pool,
      rolled_over_amount: distribution.totalRolledOver,
      total_eligible_subscribers: activeSubCount,
    });

    res.json({
      message: 'Simulation completed successfully.',
      drawId: draw.id,
      winningNumbers: draw.winning_numbers,
      poolStructure,
      distribution,
      totalEntries: entries.length,
      matchesSummary: {
        fiveMatchCount: matches.filter((m) => m.matchCount === 5).length,
        fourMatchCount: matches.filter((m) => m.matchCount === 4).length,
        threeMatchCount: matches.filter((m) => m.matchCount === 3).length,
        twoMatchCount: matches.filter((m) => m.matchCount === 2).length,
        oneMatchCount: matches.filter((m) => m.matchCount === 1).length,
        zeroMatchCount: matches.filter((m) => m.matchCount === 0).length,
      },
    });
  },

  // Admin: Publish the simulated draw
  adminPublish(req, res) {
    const { id } = req.params;
    const draw = db.draws.findById(id);
    if (!draw) return res.status(404).json({ error: 'Draw not found.' });

    if (draw.status === 'PUBLISHED' || draw.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Draw has already been published.' });
    }

    if (draw.status !== 'SIMULATED' || !draw.winning_numbers?.length) {
      return res.status(400).json({ error: 'Draw must be simulated before publishing.' });
    }

    const entries = db.drawEntries.findByDrawId(draw.id);
    const activeSubCount = db.subscriptions.countActive();
    const poolStructure = prizePoolService.calculatePoolStructure(activeSubCount, parseFloat(draw.rollover_from_previous || 0));

    const matches = [];
    for (const entry of entries) {
      const matchCount = drawEngine.calculateMatches(draw.winning_numbers, entry.numbers);
      const winningSet = new Set(draw.winning_numbers);
      matches.push({
        entryId: entry.id,
        userId: entry.user_id,
        matchCount,
        matchedNumbers: entry.numbers.filter((n) => winningSet.has(n)),
      });
    }

    const distribution = prizePoolService.distributePrizes(poolStructure, matches);

    // Clear any previous mock winners and save official winners
    db.winners.clearByDrawId(draw.id);
    for (const award of distribution.awards) {
      db.winners.create({
        draw_id: draw.id,
        user_id: award.userId,
        entry_id: award.entryId,
        match_tier: award.matchTier,
        prize_amount: award.prizeAmount,
        verification_status: 'PENDING_PROOF',
        payment_status: 'PENDING',
      });
    }

    // Freeze draw as PUBLISHED
    const published = db.draws.update(draw.id, {
      status: 'PUBLISHED',
      published_at: new Date().toISOString(),
    });

    db.prizePools.createOrUpdate(draw.id, {
      total_revenue: poolStructure.totalRevenue,
      total_pool: poolStructure.totalPool,
      tier_5_pool: poolStructure.tier5Pool,
      tier_4_pool: poolStructure.tier4Pool,
      tier_3_pool: poolStructure.tier3Pool,
      rolled_over_amount: distribution.totalRolledOver,
      total_eligible_subscribers: activeSubCount,
    });

    res.json({
      message: `Draw ${draw.draw_code} has been officially published.`,
      draw: published,
      officialWinnersCount: distribution.awards.length,
      jackpotRolledOver: distribution.totalRolledOver,
    });
  },
};
