import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory / file-persisted fallback store for evaluation & offline development
const LOCAL_STORE_FILE = path.join(__dirname, '../../../scratch/db_state.json');

class LocalStore {
  constructor() {
    this.data = {
      users: [],
      subscriptions: [],
      charities: [],
      scores: [],
      draws: [],
      prize_pools: [],
      draw_entries: [],
      winners: [],
      charity_contributions: [],
    };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const raw = fs.readFileSync(LOCAL_STORE_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      }
    } catch {
      // Start with fresh schema on error
    }
  }

  save() {
    try {
      const dir = path.dirname(LOCAL_STORE_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(LOCAL_STORE_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving local store:', err.message);
    }
  }

  reset() {
    this.data = {
      users: [],
      subscriptions: [],
      charities: [],
      scores: [],
      draws: [],
      prize_pools: [],
      draw_entries: [],
      winners: [],
      charity_contributions: [],
    };
    this.save();
  }
}

const localStore = new LocalStore();

let pool = null;
let isPostgresConnected = false;

// Attempt Postgres connection if DATABASE_URL provided
if (config.db.connectionString && !config.db.connectionString.includes('dummy')) {
  pool = new pg.Pool({
    connectionString: config.db.connectionString,
    ssl: config.db.connectionString.includes('supabase') ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 2000,
  });

  pool.query('SELECT 1')
    .then(() => {
      isPostgresConnected = true;
      console.log('Connected to PostgreSQL database');
    })
    .catch(() => {
      isPostgresConnected = false;
      console.log('PostgreSQL connection not reachable, using local persistent data engine.');
    });
}

export const db = {
  get isPostgres() {
    return isPostgresConnected;
  },

  // Direct raw query wrapper for PostgreSQL
  async query(text, params) {
    if (isPostgresConnected && pool) {
      return pool.query(text, params);
    }
    throw new Error('Postgres not connected');
  },

  // Access the data store
  store: localStore,

  // Table repository helpers with strict business rule enforcement
  charities: {
    find: (filter = {}) => {
      let results = [...localStore.data.charities];
      if (filter.is_active !== undefined) results = results.filter((c) => c.is_active === filter.is_active);
      if (filter.is_featured !== undefined) results = results.filter((c) => c.is_featured === filter.is_featured);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        results = results.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
      }
      return results;
    },
    findById: (id) => localStore.data.charities.find((c) => c.id === id) || null,
    findBySlug: (slug) => localStore.data.charities.find((c) => c.slug === slug) || null,
    create: (charityData) => {
      const record = {
        id: crypto.randomUUID(),
        upcoming_events: [],
        is_active: true,
        is_featured: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...charityData,
      };
      localStore.data.charities.push(record);
      localStore.save();
      return record;
    },
    update: (id, updates) => {
      const idx = localStore.data.charities.findIndex((c) => c.id === id);
      if (idx === -1) return null;
      localStore.data.charities[idx] = {
        ...localStore.data.charities[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStore.save();
      return localStore.data.charities[idx];
    },
    delete: (id) => {
      const idx = localStore.data.charities.findIndex((c) => c.id === id);
      if (idx === -1) return false;
      localStore.data.charities.splice(idx, 1);
      localStore.save();
      return true;
    },
  },

  users: {
    find: () => [...localStore.data.users],
    findById: (id) => localStore.data.users.find((u) => u.id === id) || null,
    findByEmail: (email) => localStore.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null,
    create: (userData) => {
      // Validate minimum charity percentage
      const charityPercent = parseFloat(userData.charity_percentage ?? 10);
      if (isNaN(charityPercent) || charityPercent < 10) {
        throw new Error('Charity contribution percentage must be at least 10%');
      }

      const record = {
        id: crypto.randomUUID(),
        role: 'USER',
        charity_percentage: charityPercent,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...userData,
        email: userData.email.toLowerCase(),
      };
      localStore.data.users.push(record);
      localStore.save();
      return record;
    },
    update: (id, updates) => {
      const idx = localStore.data.users.findIndex((u) => u.id === id);
      if (idx === -1) return null;

      if (updates.charity_percentage !== undefined) {
        const percent = parseFloat(updates.charity_percentage);
        if (isNaN(percent) || percent < 10) {
          throw new Error('Charity contribution percentage must be at least 10%');
        }
      }

      localStore.data.users[idx] = {
        ...localStore.data.users[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStore.save();
      return localStore.data.users[idx];
    },
  },

  subscriptions: {
    findByUserId: (userId) => localStore.data.subscriptions.find((s) => s.user_id === userId) || null,
    findByStripeSubId: (subId) => localStore.data.subscriptions.find((s) => s.stripe_subscription_id === subId) || null,
    createOrUpdate: (userId, subData) => {
      let sub = localStore.data.subscriptions.find((s) => s.user_id === userId);
      if (sub) {
        Object.assign(sub, subData, { updated_at: new Date().toISOString() });
      } else {
        sub = {
          id: crypto.randomUUID(),
          user_id: userId,
          plan_type: 'MONTHLY',
          status: 'INACTIVE',
          amount: 29.0,
          currency: 'usd',
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...subData,
        };
        localStore.data.subscriptions.push(sub);
      }
      localStore.save();
      return sub;
    },
    countActive: () => localStore.data.subscriptions.filter((s) => s.status === 'ACTIVE').length,
  },

  scores: {
    // Return newest scores first (reverse chronological order)
    findByUserId: (userId) => {
      return localStore.data.scores
        .filter((s) => s.user_id === userId)
        .sort((a, b) => new Date(b.score_date) - new Date(a.score_date));
    },
    findById: (id) => localStore.data.scores.find((s) => s.id === id) || null,
    
    // Add score with range check, duplicate date check, and rolling 5-score limit
    addScore: (userId, score, scoreDate) => {
      const numScore = parseInt(score, 10);
      if (isNaN(numScore) || numScore < 1 || numScore > 45) {
        throw new Error('Stableford score must be an integer between 1 and 45');
      }

      // Check for duplicate date for the same user
      const existingSameDate = localStore.data.scores.find(
        (s) => s.user_id === userId && s.score_date === scoreDate
      );
      if (existingSameDate) {
        throw new Error('Only one score entry is permitted per date. You may edit or delete the existing entry.');
      }

      // Create new score record
      const newScore = {
        id: crypto.randomUUID(),
        user_id: userId,
        score: numScore,
        score_date: scoreDate,
        created_at: new Date().toISOString(),
      };

      // Add to store
      localStore.data.scores.push(newScore);

      // Enforce rolling 5-score limit:
      // Sort user's scores newest first by score_date
      const userScores = localStore.data.scores
        .filter((s) => s.user_id === userId)
        .sort((a, b) => new Date(b.score_date) - new Date(a.score_date));

      if (userScores.length > 5) {
        // Find oldest scores beyond the 5 newest
        const keptIds = new Set(userScores.slice(0, 5).map((s) => s.id));
        localStore.data.scores = localStore.data.scores.filter(
          (s) => s.user_id !== userId || keptIds.has(s.id)
        );
      }

      localStore.save();
      return newScore;
    },

    updateScore: (id, userId, updates) => {
      const idx = localStore.data.scores.findIndex((s) => s.id === id && s.user_id === userId);
      if (idx === -1) return null;

      if (updates.score !== undefined) {
        const numScore = parseInt(updates.score, 10);
        if (isNaN(numScore) || numScore < 1 || numScore > 45) {
          throw new Error('Stableford score must be an integer between 1 and 45');
        }
        localStore.data.scores[idx].score = numScore;
      }

      if (updates.score_date !== undefined) {
        const existingSameDate = localStore.data.scores.find(
          (s) => s.user_id === userId && s.score_date === updates.score_date && s.id !== id
        );
        if (existingSameDate) {
          throw new Error('A score already exists for this date');
        }
        localStore.data.scores[idx].score_date = updates.score_date;
      }

      localStore.save();
      return localStore.data.scores[idx];
    },

    deleteScore: (id, userId) => {
      const idx = localStore.data.scores.findIndex((s) => s.id === id && s.user_id === userId);
      if (idx === -1) return false;
      localStore.data.scores.splice(idx, 1);
      localStore.save();
      return true;
    },
  },

  draws: {
    find: (filter = {}) => {
      let results = [...localStore.data.draws];
      if (filter.status) results = results.filter((d) => d.status === filter.status);
      return results.sort((a, b) => new Date(b.draw_month) - new Date(a.draw_month));
    },
    findById: (id) => localStore.data.draws.find((d) => d.id === id) || null,
    findUpcoming: () => {
      return (
        localStore.data.draws.find((d) => d.status === 'PUBLISHED' || d.status === 'SIMULATED' || d.status === 'DRAFT') ||
        null
      );
    },
    create: (drawData) => {
      const record = {
        id: crypto.randomUUID(),
        winning_numbers: [],
        status: 'DRAFT',
        rollover_from_previous: 0.0,
        algorithm_metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...drawData,
      };
      localStore.data.draws.push(record);
      localStore.save();
      return record;
    },
    update: (id, updates) => {
      const idx = localStore.data.draws.findIndex((d) => d.id === id);
      if (idx === -1) return null;
      localStore.data.draws[idx] = {
        ...localStore.data.draws[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStore.save();
      return localStore.data.draws[idx];
    },
  },

  prizePools: {
    findByDrawId: (drawId) => localStore.data.prize_pools.find((p) => p.draw_id === drawId) || null,
    createOrUpdate: (drawId, poolData) => {
      let poolRecord = localStore.data.prize_pools.find((p) => p.draw_id === drawId);
      if (poolRecord) {
        Object.assign(poolRecord, poolData);
      } else {
        poolRecord = {
          id: crypto.randomUUID(),
          draw_id: drawId,
          total_revenue: 0.0,
          total_pool: 0.0,
          tier_5_pool: 0.0,
          tier_4_pool: 0.0,
          tier_3_pool: 0.0,
          rolled_over_amount: 0.0,
          total_eligible_subscribers: 0,
          created_at: new Date().toISOString(),
          ...poolData,
        };
        localStore.data.prize_pools.push(poolRecord);
      }
      localStore.save();
      return poolRecord;
    },
  },

  drawEntries: {
    findByDrawId: (drawId) => localStore.data.draw_entries.filter((e) => e.draw_id === drawId),
    findByDrawAndUser: (drawId, userId) =>
      localStore.data.draw_entries.find((e) => e.draw_id === drawId && e.user_id === userId) || null,
    findByUserId: (userId) => localStore.data.draw_entries.filter((e) => e.user_id === userId),
    createOrUpdate: (drawId, userId, numbers) => {
      let entry = localStore.data.draw_entries.find((e) => e.draw_id === drawId && e.user_id === userId);
      if (entry) {
        entry.numbers = numbers;
      } else {
        entry = {
          id: crypto.randomUUID(),
          draw_id: drawId,
          user_id: userId,
          numbers,
          match_count: 0,
          created_at: new Date().toISOString(),
        };
        localStore.data.draw_entries.push(entry);
      }
      localStore.save();
      return entry;
    },
    updateMatchCount: (id, matchCount) => {
      const entry = localStore.data.draw_entries.find((e) => e.id === id);
      if (entry) {
        entry.match_count = matchCount;
        localStore.save();
      }
      return entry;
    },
  },

  winners: {
    find: (filter = {}) => {
      let results = [...localStore.data.winners];
      if (filter.draw_id) results = results.filter((w) => w.draw_id === filter.draw_id);
      if (filter.user_id) results = results.filter((w) => w.user_id === filter.user_id);
      if (filter.verification_status)
        results = results.filter((w) => w.verification_status === filter.verification_status);
      if (filter.payment_status) results = results.filter((w) => w.payment_status === filter.payment_status);
      return results;
    },
    findById: (id) => localStore.data.winners.find((w) => w.id === id) || null,
    create: (winnerData) => {
      const record = {
        id: crypto.randomUUID(),
        verification_status: 'PENDING_PROOF',
        payment_status: 'PENDING',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...winnerData,
      };
      localStore.data.winners.push(record);
      localStore.save();
      return record;
    },
    update: (id, updates) => {
      const idx = localStore.data.winners.findIndex((w) => w.id === id);
      if (idx === -1) return null;
      localStore.data.winners[idx] = {
        ...localStore.data.winners[idx],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      localStore.save();
      return localStore.data.winners[idx];
    },
    clearByDrawId: (drawId) => {
      localStore.data.winners = localStore.data.winners.filter((w) => w.draw_id !== drawId);
      localStore.save();
    },
  },

  charityContributions: {
    findByCharityId: (charityId) =>
      localStore.data.charity_contributions.filter((c) => c.charity_id === charityId),
    findByUserId: (userId) =>
      localStore.data.charity_contributions.filter((c) => c.user_id === userId),
    create: (contributionData) => {
      const record = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        ...contributionData,
      };
      localStore.data.charity_contributions.push(record);
      localStore.save();
      return record;
    },
    totalAmount: () =>
      localStore.data.charity_contributions.reduce((acc, c) => acc + parseFloat(c.amount || 0), 0),
  },
};

export default db;
