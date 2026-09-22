-- ==========================================================
-- DIGITAL HEROES POSTGRESQL SCHEMA (SUPABASE / POSTGRESQL 15+)
-- ==========================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------
-- 1. CHARITIES TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'Youth & Community',
  logo_url TEXT,
  cover_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  upcoming_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_charities_active_featured ON charities (is_active, is_featured);

-- ----------------------------------------------------------
-- 2. USERS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  selected_charity_id UUID REFERENCES charities(id) ON DELETE SET NULL,
  charity_percentage NUMERIC(5, 2) DEFAULT 10.00 CHECK (charity_percentage >= 10.00 AND charity_percentage <= 100.00),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_charity ON users (selected_charity_id);

-- ----------------------------------------------------------
-- 3. SUBSCRIPTIONS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  plan_type VARCHAR(50) DEFAULT 'MONTHLY' CHECK (plan_type IN ('MONTHLY', 'YEARLY')),
  status VARCHAR(50) DEFAULT 'INACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'LAPSED', 'CANCELLED')),
  amount NUMERIC(10, 2) DEFAULT 29.00,
  currency VARCHAR(10) DEFAULT 'usd',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions (status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub ON subscriptions (stripe_subscription_id);

-- ----------------------------------------------------------
-- 4. SCORES TABLE (STABLEFORD FORMAT, MAX 5 PER USER, UNIQUE DATE)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_score_date UNIQUE (user_id, score_date)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_date ON scores (user_id, score_date DESC);

-- ----------------------------------------------------------
-- 5. DRAWS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_code VARCHAR(50) UNIQUE NOT NULL,
  draw_month DATE NOT NULL,
  draw_type VARCHAR(50) DEFAULT 'RANDOM' CHECK (draw_type IN ('RANDOM', 'ALGORITHMIC')),
  winning_numbers INTEGER[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SIMULATED', 'PUBLISHED', 'COMPLETED')),
  rollover_from_previous NUMERIC(12, 2) DEFAULT 0.00,
  algorithm_metadata JSONB DEFAULT '{}'::jsonb,
  simulated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_draws_status_month ON draws (status, draw_month DESC);

-- ----------------------------------------------------------
-- 6. PRIZE POOLS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS prize_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID UNIQUE NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  total_revenue NUMERIC(12, 2) DEFAULT 0.00,
  total_pool NUMERIC(12, 2) DEFAULT 0.00,
  tier_5_pool NUMERIC(12, 2) DEFAULT 0.00, -- 40% + rollover
  tier_4_pool NUMERIC(12, 2) DEFAULT 0.00, -- 35%
  tier_3_pool NUMERIC(12, 2) DEFAULT 0.00, -- 25%
  rolled_over_amount NUMERIC(12, 2) DEFAULT 0.00,
  total_eligible_subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prize_pools_draw ON prize_pools (draw_id);

-- ----------------------------------------------------------
-- 7. DRAW ENTRIES TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  numbers INTEGER[] NOT NULL,
  match_count INTEGER DEFAULT 0 CHECK (match_count >= 0 AND match_count <= 5),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_draw_entry UNIQUE (draw_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_draw_entries_draw ON draw_entries (draw_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_user ON draw_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_draw_entries_matches ON draw_entries (draw_id, match_count DESC);

-- ----------------------------------------------------------
-- 8. WINNERS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES draw_entries(id) ON DELETE SET NULL,
  match_tier INTEGER NOT NULL CHECK (match_tier IN (3, 4, 5)),
  prize_amount NUMERIC(12, 2) NOT NULL,
  proof_image_url TEXT,
  verification_status VARCHAR(50) DEFAULT 'PENDING_PROOF' CHECK (verification_status IN ('PENDING_PROOF', 'PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  payment_status VARCHAR(50) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID')),
  payment_reference VARCHAR(255),
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_draw_tier_winner UNIQUE (draw_id, user_id, match_tier)
);

CREATE INDEX IF NOT EXISTS idx_winners_user ON winners (user_id);
CREATE INDEX IF NOT EXISTS idx_winners_draw ON winners (draw_id);
CREATE INDEX IF NOT EXISTS idx_winners_status ON winners (verification_status, payment_status);

-- ----------------------------------------------------------
-- 9. CHARITY CONTRIBUTIONS TABLE
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS charity_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  contribution_percentage NUMERIC(5, 2) NOT NULL,
  contribution_type VARCHAR(50) DEFAULT 'SUBSCRIPTION_SHARE' CHECK (contribution_type IN ('SUBSCRIPTION_SHARE', 'DIRECT_DONATION')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_charity_contributions_user ON charity_contributions (user_id);
CREATE INDEX IF NOT EXISTS idx_charity_contributions_charity ON charity_contributions (charity_id);
