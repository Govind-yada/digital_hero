import bcrypt from 'bcryptjs';
import db from '../db/index.js';
import { tokenService } from '../services/tokenService.js';

export const authController = {
  async register(req, res) {
    try {
      const { email, password, name, selected_charity_id, charity_percentage } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const existingUser = db.users.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      // Check charity if provided
      let charityId = selected_charity_id;
      if (charityId) {
        const charity = db.charities.findById(charityId);
        if (!charity) {
          return res.status(400).json({ error: 'Selected charity does not exist.' });
        }
      } else {
        // Default to first active featured charity if none provided
        const defaultCharity = db.charities.find({ is_active: true })[0];
        charityId = defaultCharity ? defaultCharity.id : null;
      }

      // Enforce minimum 10% charity contribution
      const percent = parseFloat(charity_percentage ?? 10.0);
      if (isNaN(percent) || percent < 10.0 || percent > 100.0) {
        return res.status(400).json({
          error: 'Charity contribution percentage must be between 10% and 100%.',
        });
      }

      const password_hash = await bcrypt.hash(password, 10);

      const newUser = db.users.create({
        email,
        password_hash,
        name,
        role: 'USER',
        selected_charity_id: charityId,
        charity_percentage: percent,
      });

      // Initialize default inactive subscription record
      db.subscriptions.createOrUpdate(newUser.id, {
        plan_type: 'MONTHLY',
        status: 'INACTIVE',
      });

      const token = tokenService.generateToken(newUser);
      const { password_hash: _, ...safeUser } = newUser;

      res.status(201).json({
        message: 'Account created successfully.',
        token,
        user: safeUser,
        subscription: { status: 'INACTIVE' },
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = db.users.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = tokenService.generateToken(user);
      const { password_hash: _, ...safeUser } = user;

      // Fetch subscription status
      const subscription = db.subscriptions.findByUserId(user.id);
      const charity = user.selected_charity_id ? db.charities.findById(user.selected_charity_id) : null;

      res.status(200).json({
        message: 'Login successful.',
        token,
        user: {
          ...safeUser,
          charity,
        },
        subscription: subscription || { status: 'INACTIVE' },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async getMe(req, res) {
    try {
      const user = db.users.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const { password_hash: _, ...safeUser } = user;
      const subscription = db.subscriptions.findByUserId(user.id);
      const charity = user.selected_charity_id ? db.charities.findById(user.selected_charity_id) : null;
      const scores = db.scores.findByUserId(user.id);

      res.status(200).json({
        user: {
          ...safeUser,
          charity,
          scoresCount: scores.length,
        },
        subscription: subscription || { status: 'INACTIVE' },
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  logout(req, res) {
    res.status(200).json({ message: 'Logged out successfully.' });
  },
};
