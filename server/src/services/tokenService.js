import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';

export const tokenService = {
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      return null;
    }
  },
};
