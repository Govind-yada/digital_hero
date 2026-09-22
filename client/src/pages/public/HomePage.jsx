import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { drawApi, charityApi } from '../../services/api.js';
import { Sparkles, Trophy, Heart, ArrowRight, ShieldCheck, Users, Activity, CheckCircle2 } from 'lucide-react';
import { NumberBall } from '../../components/common/NumberBall.jsx';

export const HomePage = () => {
  const [upcomingDraw, setUpcomingDraw] = useState(null);
  const [featuredCharities, setFeaturedCharities] = useState([]);
  const [calculatorSubs, setCalculatorSubs] = useState(250);

  useEffect(() => {
    drawApi.getUpcoming().then((data) => setUpcomingDraw(data)).catch(() => {});
    charityApi.getFeatured().then((data) => setFeaturedCharities(data.charities || [])).catch(() => {});
  }, []);

  const totalPool = upcomingDraw?.prizePool?.total_pool || 2500;
  const tier5Jackpot = upcomingDraw?.prizePool?.tier_5_pool || 1500;

  // Impact calculator values
  const calcRevenue = calculatorSubs * 29;
  const calcPool = calcRevenue * 0.5;
  const calcCharity = calcRevenue * 0.15; // avg 15%

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-600/15 via-impact-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Philanthropy Powered by Performance</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
            Turn your Stableford scores into{' '}
            <span className="bg-gradient-to-r from-brand-400 via-emerald-300 to-impact-400 bg-clip-text text-transparent">
              real community impact.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Subscribe, record your latest golf rounds, direct a minimum of 10% to verified causes, and enter monthly
            algorithmic prize pools with rollover jackpots.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-base rounded-2xl shadow-xl shadow-brand-600/25 transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <span>Join as a Hero Subscriber</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/how-it-works"
              className="w-full sm:w-auto px-8 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 font-medium text-base rounded-2xl transition-colors"
            >
              Explore Draw Mechanics
            </Link>
          </div>
        </div>
      </section>

      {/* Live Prize Pool & Stats Banner */}
      <section className="border-y border-slate-800/80 bg-slate-900/40 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium block mb-1">
                Estimated Prize Pool
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white">
                ${Number(totalPool).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4">
              <span className="text-xs uppercase tracking-wider text-amber-400 font-medium block mb-1">
                5-Match Jackpot
              </span>
              <span className="text-3xl sm:text-4xl font-black text-amber-300">
                ${Number(tier5Jackpot).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="p-4">
              <span className="text-xs uppercase tracking-wider text-rose-400 font-medium block mb-1">
                Guaranteed Giving
              </span>
              <span className="text-3xl sm:text-4xl font-black text-rose-300">Min 10%</span>
            </div>
            <div className="p-4">
              <span className="text-xs uppercase tracking-wider text-brand-400 font-medium block mb-1">
                Active Draw
              </span>
              <span className="text-3xl sm:text-4xl font-black text-brand-300">
                {upcomingDraw?.draw?.draw_code || 'DRAW-CURRENT'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Simple, Pure, Impactful</h2>
          <p className="text-3xl sm:text-4xl font-bold text-white tracking-tight">How Digital Heroes Works</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-dark-950/80 relative">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 mb-6 font-black text-lg">
              01
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Subscribe & Pick a Cause</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Choose a monthly or annual plan. Select your preferred vetted charity. A minimum of 10% (up to 100%
              voluntarily) goes directly to your cause every billing cycle.
            </p>
            <div className="flex items-center gap-2 text-xs text-brand-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Full charity settlement transparency</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-dark-950/80 relative">
            <div className="w-12 h-12 rounded-2xl bg-impact-500/10 border border-impact-500/30 flex items-center justify-center text-impact-400 mb-6 font-black text-lg">
              02
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Log Your 5 Stableford Scores</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Enter your real-world rounds (range 1–45). Our backend retains exactly your latest 5 rounds,
              automatically replacing the oldest when you post a new score.
            </p>
            <div className="flex items-center gap-2 text-xs text-impact-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Duplicate dates strictly prevented</span>
            </div>
          </div>

          <div className="p-8 rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-dark-950/80 relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 font-black text-lg">
              03
            </div>
            <h3 className="text-xl font-bold text-white mb-3">Win Draws & Rollover Jackpots</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Every month, 5 winning numbers are drawn. Match 5 (40%), 4 (35%), or 3 (25%). When the 5-number match is
              unclaimed, the jackpot rolls over into next month!
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              <span>Audited screenshot proof verification</span>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Impact Calculator */}
      <section className="py-16 bg-slate-900/30 border-y border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Community Scale</h2>
            <p className="text-2xl sm:text-3xl font-bold text-white">Monthly Impact & Prize Pool Simulator</p>
          </div>

          <div className="p-8 rounded-3xl border border-slate-800 bg-dark-950/90 shadow-2xl">
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-slate-300">Active Subscribers in Community Pool</label>
                <span className="text-xl font-bold text-brand-400">{calculatorSubs.toLocaleString()} golfers</span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                step="10"
                value={calculatorSubs}
                onChange={(e) => setCalculatorSubs(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs uppercase text-slate-400 font-medium block mb-1">Monthly Prize Pool (50%)</span>
                <span className="text-2xl font-black text-white">${calcPool.toLocaleString()}</span>
                <span className="text-[11px] text-slate-400 block mt-1">40% Tier 5, 35% Tier 4, 25% Tier 3</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs uppercase text-rose-400 font-medium block mb-1">Charity Giving (~15%)</span>
                <span className="text-2xl font-black text-rose-300">${calcCharity.toLocaleString()}</span>
                <span className="text-[11px] text-slate-400 block mt-1">Direct to partner organizations</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
                <span className="text-xs uppercase text-amber-400 font-medium block mb-1">Tier 5 Base Jackpot</span>
                <span className="text-2xl font-black text-amber-300">${(calcPool * 0.4).toLocaleString()}</span>
                <span className="text-[11px] text-slate-400 block mt-1">+ Any unclaimed rollovers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Charity Spotlight */}
      {featuredCharities.length > 0 && (
        <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-2">Causes You Support</h2>
              <p className="text-3xl font-bold text-white tracking-tight">Featured Charity Spotlight</p>
            </div>
            <Link
              to="/charities"
              className="mt-4 sm:mt-0 text-sm font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1.5"
            >
              <span>View full directory</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {featuredCharities.map((charity) => (
              <div
                key={charity.id}
                className="rounded-3xl border border-slate-800 bg-gradient-to-b from-slate-900/50 to-dark-950 overflow-hidden flex flex-col group hover:border-slate-700 transition-colors"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={charity.cover_url}
                    alt={charity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-dark-950/80 backdrop-blur-md text-brand-300 border border-brand-500/30">
                      {charity.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{charity.name}</h3>
                    <p className="text-slate-400 text-sm line-clamp-3 mb-6 leading-relaxed">
                      {charity.description}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <Link
                      to={`/charities`}
                      className="text-xs font-medium text-slate-300 hover:text-white"
                    >
                      Learn more & upcoming golf days →
                    </Link>
                    <Link
                      to="/register"
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                    >
                      Support at Signup
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Final Call to Action */}
      <section className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-12 sm:p-16 rounded-3xl border border-brand-500/30 bg-gradient-to-b from-brand-950/40 via-slate-900/40 to-dark-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Ready to turn performance into purpose?
          </h2>
          <p className="text-slate-300 max-w-xl mx-auto mb-8 text-base leading-relaxed">
            Join thousands of golfers elevating their monthly rounds for charity and competing for life-changing
            prize pools.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold rounded-2xl shadow-xl shadow-brand-600/30 transition-all hover:scale-105"
          >
            <span>Activate Your Membership</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
};
