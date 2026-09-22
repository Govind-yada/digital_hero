export const PLANS = {
  MONTHLY: {
    id: 'MONTHLY',
    name: 'Monthly Hero Plan',
    interval: 'month',
    price: 29.0,
    priceCents: 2900,
    currency: 'usd',
    features: [
      'Automatic entry into all monthly prize draws',
      'Track and retain your 5 rolling Stableford scores',
      '10%+ contribution to your chosen charity',
      'Real-time draw simulator & analytics',
      'Eligible for 5-match jackpot rollover',
    ],
  },
  YEARLY: {
    id: 'YEARLY',
    name: 'Annual Champion Plan',
    interval: 'year',
    price: 290.0,
    priceCents: 29000,
    currency: 'usd',
    discount: '17% off (2 months free)',
    features: [
      'Everything in Monthly Hero Plan',
      'Full 12 months guaranteed draw eligibility',
      'Highest charity impact badge',
      'Priority winner verification review',
      'Savings of $58 per year',
    ],
  },
};
