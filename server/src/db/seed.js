import bcrypt from 'bcryptjs';
import db from './index.js';

export async function seedDatabase() {
  console.log('Seeding Digital Heroes database...');

  // Reset store for fresh idempotent seeding
  db.store.reset();

  // 1. Seed Charities
  const charities = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Youth On Course Global',
      slug: 'youth-on-course-global',
      description:
        'Providing life-changing opportunities, mentorship, and youth leadership training through athletic participation and STEM scholarships.',
      category: 'Youth & Education',
      logo_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1000&auto=format&fit=crop&q=80',
      website_url: 'https://youthoncourse.org',
      is_active: true,
      is_featured: true,
      upcoming_events: [
        {
          title: 'Annual Youth Invitational Charity Day',
          date: '2026-10-15',
          location: 'Pine Valley, NJ',
        },
      ],
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Ocean Clean Impact',
      slug: 'ocean-clean-impact',
      description:
        'Recovering ocean plastic, restoring fragile coastal habitats, and turning recycled marine materials into sustainable athletic community gear.',
      category: 'Environment & Oceans',
      logo_url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=200&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1000&auto=format&fit=crop&q=80',
      website_url: 'https://theoceancleanup.com',
      is_active: true,
      is_featured: true,
      upcoming_events: [
        {
          title: 'Coastal Cleanup & Scramble for Clean Waters',
          date: '2026-11-04',
          location: 'Monterey Bay, CA',
        },
      ],
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Adaptive Heroes Veteran Fund',
      slug: 'adaptive-heroes-veteran-fund',
      description:
        'Empowering wounded and recovering service veterans with cutting-edge adaptive athletic prosthetics, rehabilitation, and sports recovery retreats.',
      category: 'Veteran Support',
      logo_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1000&auto=format&fit=crop&q=80',
      website_url: 'https://woundedwarriorproject.org',
      is_active: true,
      is_featured: false,
      upcoming_events: [
        {
          title: 'Veterans Warrior Scramble',
          date: '2026-11-11',
          location: 'San Antonio, TX',
        },
      ],
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Green Sanctuary Wildlife Trust',
      slug: 'green-sanctuary-wildlife-trust',
      description:
        'Transforming outdoor public spaces and municipal grounds into biodiversity corridors and native bird protection reserves.',
      category: 'Wildlife & Nature',
      logo_url: 'https://images.unsplash.com/photo-1535083783855-76ae62b2914e?w=200&auto=format&fit=crop&q=80',
      cover_url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1000&auto=format&fit=crop&q=80',
      website_url: 'https://worldwildlife.org',
      is_active: true,
      is_featured: false,
      upcoming_events: [],
    },
  ];

  for (const c of charities) {
    db.charities.create(c);
  }

  // 2. Hash passwords
  const adminPasswordHash = await bcrypt.hash('AdminPass123!', 10);
  const subPasswordHash = await bcrypt.hash('SubPass123!', 10);

  // 3. Create Admin User
  const adminUser = db.users.create({
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'admin@digitalheroes.co.in',
    password_hash: adminPasswordHash,
    name: 'Sarah Sterling (Admin)',
    role: 'ADMIN',
    selected_charity_id: charities[0].id,
    charity_percentage: 15.0,
  });

  // 4. Create Evaluation Test Subscriber
  const testSubscriber = db.users.create({
    id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    email: 'subscriber@digitalheroes.co.in',
    password_hash: subPasswordHash,
    name: 'Alex Mercer',
    role: 'USER',
    selected_charity_id: charities[1].id,
    charity_percentage: 20.0,
  });

  // Add Active Subscription for Alex Mercer
  db.subscriptions.createOrUpdate(testSubscriber.id, {
    plan_type: 'MONTHLY',
    status: 'ACTIVE',
    amount: 29.0,
    currency: 'usd',
    stripe_customer_id: 'cus_test_alex123',
    stripe_subscription_id: 'sub_test_alex123',
    current_period_start: new Date(Date.now() - 10 * 86400000).toISOString(),
    current_period_end: new Date(Date.now() + 20 * 86400000).toISOString(),
    cancel_at_period_end: false,
  });

  // Record Alex Mercer's initial charity contribution
  db.charityContributions.create({
    user_id: testSubscriber.id,
    charity_id: charities[1].id,
    amount: 5.8, // 20% of $29
    contribution_percentage: 20.0,
    contribution_type: 'SUBSCRIPTION_SHARE',
  });

  // Add 5 initial Stableford scores for Alex Mercer (reverse chronological dates)
  // Scores: 38, 41, 32, 36, 40
  db.scores.addScore(testSubscriber.id, 40, '2026-09-08');
  db.scores.addScore(testSubscriber.id, 36, '2026-09-12');
  db.scores.addScore(testSubscriber.id, 32, '2026-09-15');
  db.scores.addScore(testSubscriber.id, 41, '2026-09-17');
  db.scores.addScore(testSubscriber.id, 38, '2026-09-20');

  // 5. Create 10 additional active community subscribers for realistic draw pools
  const demoUsers = [
    { name: 'Marcus Chen', email: 'marcus.c@example.com', charityIdx: 0, percent: 15, scores: [35, 29, 38, 42, 31] },
    { name: 'Elena Rostova', email: 'elena.r@example.com', charityIdx: 1, percent: 25, scores: [41, 36, 39, 34, 38] },
    { name: 'David Okafor', email: 'david.o@example.com', charityIdx: 2, percent: 10, scores: [28, 33, 36, 40, 37] },
    { name: 'Priya Sharma', email: 'priya.s@example.com', charityIdx: 0, percent: 20, scores: [39, 44, 32, 35, 41] },
    { name: 'Lucas Vance', email: 'lucas.v@example.com', charityIdx: 3, percent: 12, scores: [30, 36, 38, 41, 34] },
    { name: 'Chloe Dubois', email: 'chloe.d@example.com', charityIdx: 1, percent: 18, scores: [42, 37, 35, 31, 39] },
    { name: 'Taro Takahashi', email: 'taro.t@example.com', charityIdx: 2, percent: 15, scores: [33, 40, 36, 38, 43] },
    { name: 'Hannah Abbott', email: 'hannah.a@example.com', charityIdx: 0, percent: 10, scores: [31, 35, 38, 40, 36] },
    { name: 'Liam Gallagher', email: 'liam.g@example.com', charityIdx: 3, percent: 22, scores: [36, 38, 41, 32, 29] },
    { name: 'Sophia Miller', email: 'sophia.m@example.com', charityIdx: 1, percent: 30, scores: [37, 41, 36, 39, 40] },
  ];

  for (let i = 0; i < demoUsers.length; i++) {
    const du = demoUsers[i];
    const u = db.users.create({
      email: du.email,
      password_hash: subPasswordHash,
      name: du.name,
      role: 'USER',
      selected_charity_id: charities[du.charityIdx].id,
      charity_percentage: du.percent,
    });

    db.subscriptions.createOrUpdate(u.id, {
      plan_type: i % 3 === 0 ? 'YEARLY' : 'MONTHLY',
      status: 'ACTIVE',
      amount: i % 3 === 0 ? 290.0 : 29.0,
      currency: 'usd',
      stripe_customer_id: `cus_test_${i}`,
      stripe_subscription_id: `sub_test_${i}`,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    });

    // Record charity contribution
    const contributionAmt = (i % 3 === 0 ? 290.0 : 29.0) * (du.percent / 100);
    db.charityContributions.create({
      user_id: u.id,
      charity_id: charities[du.charityIdx].id,
      amount: parseFloat(contributionAmt.toFixed(2)),
      contribution_percentage: du.percent,
      contribution_type: 'SUBSCRIPTION_SHARE',
    });

    // Add their 5 scores on distinct dates
    for (let sIdx = 0; sIdx < du.scores.length; sIdx++) {
      const day = String(10 + sIdx * 2).padStart(2, '0');
      db.scores.addScore(u.id, du.scores[sIdx], `2026-09-${day}`);
    }
  }

  // 6. Create Initial Monthly Draw for September 2026
  const activeSubCount = db.subscriptions.countActive();
  const estimatedRevenue = activeSubCount * 29.0;
  const poolShare = estimatedRevenue * 0.5; // 50%
  const previousRollover = 1500.0; // Rolled over from prior unclaimed 5-match jackpot

  const septemberDraw = db.draws.create({
    id: '55555555-5555-5555-5555-555555555555',
    draw_code: 'DRAW-2026-09',
    draw_month: '2026-09-30',
    draw_type: 'ALGORITHMIC',
    winning_numbers: [],
    status: 'DRAFT',
    rollover_from_previous: previousRollover,
    algorithm_metadata: {
      description: 'Weighted by community score frequency with Laplace smoothing',
    },
  });

  db.prizePools.createOrUpdate(septemberDraw.id, {
    total_revenue: estimatedRevenue,
    total_pool: poolShare + previousRollover,
    tier_5_pool: poolShare * 0.4 + previousRollover,
    tier_4_pool: poolShare * 0.35,
    tier_3_pool: poolShare * 0.25,
    rolled_over_amount: 0.0,
    total_eligible_subscribers: activeSubCount,
  });

  // Automatically derive initial draw tickets for all active subscribers from their 5 latest scores
  const allSubscribers = db.users.find().filter((u) => {
    const sub = db.subscriptions.findByUserId(u.id);
    return sub && sub.status === 'ACTIVE';
  });

  for (const sub of allSubscribers) {
    const userScores = db.scores.findByUserId(sub.id);
    if (userScores.length === 5) {
      const numbers = userScores.map((s) => s.score);
      db.drawEntries.createOrUpdate(septemberDraw.id, sub.id, numbers);
    }
  }

  console.log(`Seeding complete:
  - Charities: ${charities.length}
  - Admin: admin@digitalheroes.co.in (AdminPass123!)
  - Test Subscriber: subscriber@digitalheroes.co.in (SubPass123!)
  - Community Subscribers: ${demoUsers.length}
  - Active Draw: ${septemberDraw.draw_code} (Pool: $${(poolShare + previousRollover).toFixed(2)})
  `);
}

// Auto-run if executed directly
if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase().catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });
}
