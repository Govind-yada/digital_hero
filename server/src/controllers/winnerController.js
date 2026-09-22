import path from 'path';
import db from '../db/index.js';
import { storageService } from '../services/storageService.js';

export const winnerController = {
  // Current authenticated user's winnings
  getMyWinnings(req, res) {
    const userWinners = db.winners.find({ user_id: req.user.id });

    const enriched = userWinners.map((w) => {
      const draw = db.draws.findById(w.draw_id);
      const entry = w.entry_id ? db.drawEntries.findByUserId(w.user_id).find((e) => e.id === w.entry_id) : null;
      return {
        ...w,
        drawCode: draw?.draw_code || 'Draw',
        drawMonth: draw?.draw_month || null,
        winningNumbers: draw?.winning_numbers || [],
        entryNumbers: entry?.numbers || [],
      };
    });

    const totalWon = enriched.reduce((sum, item) => sum + parseFloat(item.prize_amount || 0), 0);
    const paidOut = enriched
      .filter((w) => w.payment_status === 'PAID')
      .reduce((sum, item) => sum + parseFloat(item.prize_amount || 0), 0);

    res.json({
      winnings: enriched,
      totalWon: parseFloat(totalWon.toFixed(2)),
      paidOut: parseFloat(paidOut.toFixed(2)),
      pendingPayout: parseFloat((totalWon - paidOut).toFixed(2)),
    });
  },

  // Winner uploads proof screenshot
  async uploadProof(req, res) {
    try {
      const { id } = req.params;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: 'Scorecard screenshot file is required.' });
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'Only PNG, JPEG, and WebP image files are allowed.' });
      }

      const winnerRecord = db.winners.findById(id);
      if (!winnerRecord) {
        return res.status(404).json({ error: 'Winning record not found.' });
      }

      if (winnerRecord.user_id !== req.user.id && req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'You are not authorized to upload proof for this prize.' });
      }

      if (winnerRecord.payment_status === 'PAID') {
        return res.status(400).json({ error: 'This prize has already been paid out.' });
      }

      const proofUrl = await storageService.uploadWinnerProof(file.buffer, file.originalname, file.mimetype);

      const updated = db.winners.update(id, {
        proof_image_url: proofUrl,
        verification_status: 'PENDING_REVIEW',
        rejection_reason: null,
      });

      res.json({
        message: 'Proof uploaded successfully. Admin will review your submission.',
        winner: updated,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  // Safe file download / view endpoint for uploaded proof images
  getProofFile(req, res) {
    const { filename } = req.params;
    const filePath = storageService.getLocalFilePath(filename);
    if (!filePath) {
      return res.status(404).json({ error: 'File not found.' });
    }
    res.sendFile(filePath);
  },

  // ================= ADMIN OPERATIONS =================

  // Admin: List all winners across draws
  adminListWinners(req, res) {
    const { draw_id, verification_status, payment_status } = req.query;
    let winners = db.winners.find();

    if (draw_id) winners = winners.filter((w) => w.draw_id === draw_id);
    if (verification_status) winners = winners.filter((w) => w.verification_status === verification_status);
    if (payment_status) winners = winners.filter((w) => w.payment_status === payment_status);

    const enriched = winners.map((w) => {
      const user = db.users.findById(w.user_id);
      const draw = db.draws.findById(w.draw_id);
      const charity = user?.selected_charity_id ? db.charities.findById(user.selected_charity_id) : null;
      return {
        ...w,
        userName: user?.name || 'Unknown',
        userEmail: user?.email || 'Unknown',
        drawCode: draw?.draw_code || 'Draw',
        drawMonth: draw?.draw_month || null,
        charityName: charity?.name || 'None',
      };
    });

    res.json({ winners: enriched });
  },

  // Admin: Review proof (Approve / Reject)
  adminReviewProof(req, res) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body; // action: 'APPROVE' or 'REJECT'

      if (!action || !['APPROVE', 'REJECT'].includes(action.toUpperCase())) {
        return res.status(400).json({ error: "Action must be either 'APPROVE' or 'REJECT'." });
      }

      const winner = db.winners.findById(id);
      if (!winner) {
        return res.status(404).json({ error: 'Winner record not found.' });
      }

      if (action.toUpperCase() === 'REJECT' && !reason) {
        return res.status(400).json({ error: 'A rejection reason is required when rejecting proof.' });
      }

      const updates = {
        verification_status: action.toUpperCase() === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        rejection_reason: action.toUpperCase() === 'REJECT' ? reason : null,
        verified_at: new Date().toISOString(),
      };

      const updated = db.winners.update(id, updates);

      res.json({
        message: `Winner proof has been ${action.toUpperCase() === 'APPROVE' ? 'approved' : 'rejected'}.`,
        winner: updated,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Admin: Mark prize payout completed
  adminMarkPayout(req, res) {
    try {
      const { id } = req.params;
      const { payment_reference } = req.body;

      const winner = db.winners.findById(id);
      if (!winner) {
        return res.status(404).json({ error: 'Winner record not found.' });
      }

      if (winner.verification_status !== 'APPROVED') {
        return res.status(400).json({ error: 'Winner proof must be approved before marking payout as paid.' });
      }

      const updated = db.winners.update(id, {
        payment_status: 'PAID',
        payment_reference: payment_reference || `TXN-${Date.now()}`,
        paid_at: new Date().toISOString(),
      });

      res.json({
        message: 'Payout marked as paid successfully.',
        winner: updated,
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },
};
