import { tokenService } from '../services/tokenService.js';
import db from '../db/index.js';

export const authenticateUser = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = tokenService.verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }

  const user = db.users.findById(decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User account not found.' });
  }

  // Attach safe user profile to request (without password hash)
  const { password_hash, ...safeUser } = user;
  req.user = safeUser;
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

export const requireSubscription = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Administrators bypass subscription check for testing and management
  if (req.user.role === 'ADMIN') {
    return next();
  }

  const sub = db.subscriptions.findByUserId(req.user.id);
  if (!sub || sub.status !== 'ACTIVE') {
    return res.status(403).json({
      error: 'An active subscription is required to access this feature.',
      code: 'SUBSCRIPTION_REQUIRED',
    });
  }

  req.subscription = sub;
  next();
};
