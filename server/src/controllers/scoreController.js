import db from '../db/index.js';
import { DRAW_CONSTANTS } from '../constants/drawConstants.js';

export const scoreController = {
  // Get latest 5 scores (reverse chronological order)
  getUserScores(req, res) {
    const scores = db.scores.findByUserId(req.user.id);
    res.json({
      scores,
      count: scores.length,
      maxStored: DRAW_CONSTANTS.MAX_STORED_SCORES,
    });
  },

  // Add a Stableford score
  addScore(req, res) {
    try {
      const { score, score_date } = req.body;

      if (score === undefined || !score_date) {
        return res.status(400).json({ error: 'Both score and score_date (YYYY-MM-DD) are required.' });
      }

      const numScore = parseInt(score, 10);
      if (
        isNaN(numScore) ||
        numScore < DRAW_CONSTANTS.MIN_STABLEFORD_SCORE ||
        numScore > DRAW_CONSTANTS.MAX_STABLEFORD_SCORE
      ) {
        return res.status(400).json({
          error: `Stableford score must be between ${DRAW_CONSTANTS.MIN_STABLEFORD_SCORE} and ${DRAW_CONSTANTS.MAX_STABLEFORD_SCORE}.`,
        });
      }

      // Validate date format YYYY-MM-DD
      if (!/^\d{4}-\d{2}-\d{2}$/.test(score_date)) {
        return res.status(400).json({ error: 'score_date must be in YYYY-MM-DD format.' });
      }

      const newScore = db.scores.addScore(req.user.id, numScore, score_date);
      const updatedScores = db.scores.findByUserId(req.user.id);

      // Auto-update draw ticket if an active draft draw exists
      const upcomingDraw = db.draws.findUpcoming();
      if (upcomingDraw && updatedScores.length === 5) {
        const ticketNumbers = updatedScores.map((s) => s.score);
        db.drawEntries.createOrUpdate(upcomingDraw.id, req.user.id, ticketNumbers);
      }

      res.status(201).json({
        message: 'Score recorded successfully.',
        score: newScore,
        currentScores: updatedScores,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Edit existing score
  updateScore(req, res) {
    try {
      const { id } = req.params;
      const { score, score_date } = req.body;

      const existing = db.scores.findById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Score record not found.' });
      }

      if (existing.user_id !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You do not have permission to edit this score.' });
      }

      const updates = {};
      if (score !== undefined) {
        const numScore = parseInt(score, 10);
        if (
          isNaN(numScore) ||
          numScore < DRAW_CONSTANTS.MIN_STABLEFORD_SCORE ||
          numScore > DRAW_CONSTANTS.MAX_STABLEFORD_SCORE
        ) {
          return res.status(400).json({
            error: `Stableford score must be between ${DRAW_CONSTANTS.MIN_STABLEFORD_SCORE} and ${DRAW_CONSTANTS.MAX_STABLEFORD_SCORE}.`,
          });
        }
        updates.score = numScore;
      }

      if (score_date !== undefined) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(score_date)) {
          return res.status(400).json({ error: 'score_date must be in YYYY-MM-DD format.' });
        }
        updates.score_date = score_date;
      }

      const updated = db.scores.updateScore(id, existing.user_id, updates);
      const updatedScores = db.scores.findByUserId(existing.user_id);

      // Keep draw entry in sync
      const upcomingDraw = db.draws.findUpcoming();
      if (upcomingDraw && updatedScores.length === 5) {
        const ticketNumbers = updatedScores.map((s) => s.score);
        db.drawEntries.createOrUpdate(upcomingDraw.id, existing.user_id, ticketNumbers);
      }

      res.json({
        message: 'Score updated successfully.',
        score: updated,
        currentScores: updatedScores,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Delete score
  deleteScore(req, res) {
    const { id } = req.params;
    const existing = db.scores.findById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Score record not found.' });
    }

    if (existing.user_id !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You do not have permission to delete this score.' });
    }

    db.scores.deleteScore(id, existing.user_id);
    const remainingScores = db.scores.findByUserId(existing.user_id);

    res.json({
      message: 'Score deleted successfully.',
      remainingScores,
    });
  },
};
