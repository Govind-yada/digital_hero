import { DRAW_CONSTANTS } from '../constants/drawConstants.js';

export const prizePoolService = {
  // Calculate base prize pool and tier splits from active subscriber revenue + rollover
  calculatePoolStructure(activeSubscriberCount, previousRollover = 0, monthlySubscriptionPrice = 29.0) {
    const totalRevenue = activeSubscriberCount * monthlySubscriptionPrice;
    const basePoolShare = totalRevenue * (DRAW_CONSTANTS.DEFAULT_PRIZE_POOL_PERCENT / 100);

    const tier5Base = basePoolShare * DRAW_CONSTANTS.TIER_5_SHARE; // 40%
    const tier4Pool = basePoolShare * DRAW_CONSTANTS.TIER_4_SHARE; // 35%
    const tier3Pool = basePoolShare * DRAW_CONSTANTS.TIER_3_SHARE; // 25%

    // 5-match jackpot includes rollover from previous draw
    const tier5Pool = tier5Base + previousRollover;
    const totalPool = basePoolShare + previousRollover;

    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      basePoolShare: parseFloat(basePoolShare.toFixed(2)),
      previousRollover: parseFloat(previousRollover.toFixed(2)),
      totalPool: parseFloat(totalPool.toFixed(2)),
      tier5Pool: parseFloat(tier5Pool.toFixed(2)),
      tier4Pool: parseFloat(tier4Pool.toFixed(2)),
      tier3Pool: parseFloat(tier3Pool.toFixed(2)),
      totalEligibleSubscribers: activeSubscriberCount,
    };
  },

  // Calculate prize payout per winner in each tier, handling equal splits and rollovers
  distributePrizes(poolStructure, matches) {
    // Group winners by tier (5, 4, 3 matches)
    const tier5Winners = matches.filter((m) => m.matchCount === 5);
    const tier4Winners = matches.filter((m) => m.matchCount === 4);
    const tier3Winners = matches.filter((m) => m.matchCount === 3);

    // Tier 5: 40% + rollover. If 0 winners, entire amount rolls over!
    let tier5PrizePerWinner = 0;
    let tier5Rollover = 0;
    if (tier5Winners.length > 0) {
      tier5PrizePerWinner = parseFloat((poolStructure.tier5Pool / tier5Winners.length).toFixed(2));
    } else {
      tier5Rollover = poolStructure.tier5Pool;
    }

    // Tier 4: 35%. If 0 winners, does not roll over to next draw (PRD §07)
    let tier4PrizePerWinner = 0;
    let tier4Unclaimed = 0;
    if (tier4Winners.length > 0) {
      tier4PrizePerWinner = parseFloat((poolStructure.tier4Pool / tier4Winners.length).toFixed(2));
    } else {
      tier4Unclaimed = poolStructure.tier4Pool;
    }

    // Tier 3: 25%. If 0 winners, does not roll over to next draw (PRD §07)
    let tier3PrizePerWinner = 0;
    let tier3Unclaimed = 0;
    if (tier3Winners.length > 0) {
      tier3PrizePerWinner = parseFloat((poolStructure.tier3Pool / tier3Winners.length).toFixed(2));
    } else {
      tier3Unclaimed = poolStructure.tier3Pool;
    }

    // Build winner awards
    const awards = [];

    for (const w of tier5Winners) {
      awards.push({
        userId: w.userId,
        entryId: w.entryId,
        matchTier: 5,
        prizeAmount: tier5PrizePerWinner,
        matchedNumbers: w.matchedNumbers,
      });
    }

    for (const w of tier4Winners) {
      awards.push({
        userId: w.userId,
        entryId: w.entryId,
        matchTier: 4,
        prizeAmount: tier4PrizePerWinner,
        matchedNumbers: w.matchedNumbers,
      });
    }

    for (const w of tier3Winners) {
      awards.push({
        userId: w.userId,
        entryId: w.entryId,
        matchTier: 3,
        prizeAmount: tier3PrizePerWinner,
        matchedNumbers: w.matchedNumbers,
      });
    }

    return {
      awards,
      tier5: {
        pool: poolStructure.tier5Pool,
        winnersCount: tier5Winners.length,
        prizePerWinner: tier5PrizePerWinner,
        rolledOverToNext: tier5Rollover,
      },
      tier4: {
        pool: poolStructure.tier4Pool,
        winnersCount: tier4Winners.length,
        prizePerWinner: tier4PrizePerWinner,
        unclaimedReserve: tier4Unclaimed,
      },
      tier3: {
        pool: poolStructure.tier3Pool,
        winnersCount: tier3Winners.length,
        prizePerWinner: tier3PrizePerWinner,
        unclaimedReserve: tier3Unclaimed,
      },
      totalRolledOver: tier5Rollover,
    };
  },
};
