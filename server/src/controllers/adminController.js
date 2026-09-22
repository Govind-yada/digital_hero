import db from '../db/index.js';

export const adminController = {
  getOverview(req, res) {
    const users = db.users.find();
    const activeSubs = db.subscriptions.countActive();
    const draws = db.draws.find();
    const publishedDraws = draws.filter((d) => d.status === 'PUBLISHED' || d.status === 'COMPLETED');
    const winners = db.winners.find();
    const totalCharityRaised = db.charityContributions.totalAmount();

    // Calculate total prize pool value across all draws
    const totalPrizePools = draws.reduce((sum, d) => {
      const pool = db.prizePools.findByDrawId(d.id);
      return sum + parseFloat(pool?.total_pool || 0);
    }, 0);

    const totalPaidOut = winners
      .filter((w) => w.payment_status === 'PAID')
      .reduce((sum, w) => sum + parseFloat(w.prize_amount || 0), 0);

    const activeDraw = db.draws.findUpcoming();

    res.json({
      metrics: {
        totalUsers: users.length,
        activeSubscribers: activeSubs,
        totalPrizePool: parseFloat(totalPrizePools.toFixed(2)),
        totalPaidOut: parseFloat(totalPaidOut.toFixed(2)),
        totalCharityContributed: parseFloat(totalCharityRaised.toFixed(2)),
        totalDraws: draws.length,
        publishedDrawsCount: publishedDraws.length,
        pendingProofCount: winners.filter((w) => w.verification_status === 'PENDING_REVIEW').length,
      },
      activeDraw: activeDraw
        ? {
            ...activeDraw,
            prizePool: db.prizePools.findByDrawId(activeDraw.id),
            entriesCount: db.drawEntries.findByDrawId(activeDraw.id).length,
          }
        : null,
    });
  },

  listUsers(req, res) {
    const { search, role, status } = req.query;
    let users = db.users.find();

    if (role) users = users.filter((u) => u.role === role);

    const enriched = users.map((u) => {
      const { password_hash: _, ...safeUser } = u;
      const sub = db.subscriptions.findByUserId(u.id);
      const scores = db.scores.findByUserId(u.id);
      const charity = u.selected_charity_id ? db.charities.findById(u.selected_charity_id) : null;
      return {
        ...safeUser,
        subscription: sub || { status: 'INACTIVE', plan_type: null },
        scoresCount: scores.length,
        charityName: charity?.name || 'None',
      };
    });

    let results = enriched;
    if (status) {
      results = results.filter((u) => u.subscription.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      results = results.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    res.json({ users: results });
  },

  updateUser(req, res) {
    try {
      const { id } = req.params;
      const { role, subscription_status, plan_type } = req.body;

      const user = db.users.findById(id);
      if (!user) return res.status(404).json({ error: 'User not found.' });

      if (role && ['USER', 'ADMIN'].includes(role)) {
        db.users.update(id, { role });
      }

      if (subscription_status) {
        db.subscriptions.createOrUpdate(id, {
          status: subscription_status,
          plan_type: plan_type || 'MONTHLY',
        });
      }

      const updatedUser = db.users.findById(id);
      const { password_hash: _, ...safeUser } = updatedUser;
      const sub = db.subscriptions.findByUserId(id);

      res.json({
        message: 'User updated successfully.',
        user: { ...safeUser, subscription: sub },
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  getUserScores(req, res) {
    const { id } = req.params;
    const scores = db.scores.findByUserId(id);
    res.json({ scores });
  },
};
