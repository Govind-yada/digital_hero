import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config/env.js';
import authRoutes from './routes/authRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import charityRoutes from './routes/charityRoutes.js';
import scoreRoutes from './routes/scoreRoutes.js';
import drawRoutes from './routes/drawRoutes.js';
import winnerRoutes from './routes/winnerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowedOrigins = [
        config.clientUrl,
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173',
      ];
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
  })
);

// Logging in development
if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Special handling: Stripe webhooks require raw body for signature verification
app.use((req, res, next) => {
  if (req.originalUrl === '/api/subscriptions/webhook') {
    next();
  } else {
    express.json({ limit: '5mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Base health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'Digital Heroes API',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
  });
});

// Root API info endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to Digital Heroes API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      scores: '/api/scores',
      charities: '/api/charities',
      draws: '/api/draws',
      winners: '/api/winners',
      subscriptions: '/api/subscriptions',
      admin: '/api/admin',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/charities', charityRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/draws', drawRoutes);
app.use('/api/winners', winnerRoutes);
app.use('/api/admin', adminRoutes);

// Centralized error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Do not expose stack trace in production
  const response = {
    error: message,
  };
  if (config.nodeEnv === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

export default app;
