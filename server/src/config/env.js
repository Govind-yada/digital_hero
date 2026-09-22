import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_digital_heroes_secret_key_12345',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  db: {
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/digital_heroes',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly_sample',
    yearlyPriceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly_sample',
  },
  prizePoolContributionPercent: parseInt(process.env.PRIZE_POOL_CONTRIBUTION_PERCENT || '50', 10),
  minCharityPercent: parseInt(process.env.MIN_CHARITY_CONTRIBUTION_PERCENT || '10', 10),
};
