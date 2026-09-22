import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Trophy, Sparkles, RefreshCw, Heart, FileCheck, ArrowRight, Check } from 'lucide-react';
import { NumberBall } from '../../components/common/NumberBall.jsx';

export const HowItWorksPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Complete System Architecture</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Platform & Draw Mechanics
        </h1>
        <p className="text-slate-300 text-lg leading-relaxed">
          How Stableford golf scores, charity giving, and monthly prize pools combine with mathematical transparency.
        </p>
      </div>

      {/* 1. Stableford Score Engine */}
      <div className="p-8 sm:p-12 rounded-3xl border border-slate-800 bg-dark-900/60 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold">
            §05
          </div>
          <h2 className="text-2xl font-bold text-white">1. Stableford Score Management & Rolling 5 Logic</h2>
        </div>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          Golfers record their official rounds in <strong>Stableford format</strong> (valid score range: <strong>1 to 45</strong>).
          Each score requires a valid date. Under PRD rules, duplicate scores on the same date are strictly prevented.
        </p>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 mb-6">
          <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wider mb-3">
            The Rolling 5-Score Retention Rule (PRD §05)
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            Only your latest 5 scores are retained at any time. When you record a sixth score, the system automatically
            replaces the oldest stored score, maintaining your active history in reverse chronological order:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 rounded-xl bg-dark-950 border border-slate-800">
              <span className="text-slate-400 font-bold block mb-2">Existing 5 Stored Scores:</span>
              <ul className="space-y-1 text-slate-300">
                <li>20 Sep → 38</li>
                <li>17 Sep → 41</li>
                <li>15 Sep → 32</li>
                <li>12 Sep → 36</li>
                <li className="text-red-400 font-semibold">08 Sep → 40 (Oldest)</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-dark-950 border border-brand-500/30">
              <span className="text-brand-400 font-bold block mb-2">After Adding (22 Sep → 35):</span>
              <ul className="space-y-1 text-slate-300">
                <li className="text-brand-400 font-semibold">22 Sep → 35 (Newest)</li>
                <li>20 Sep → 38</li>
                <li>17 Sep → 41</li>
                <li>15 Sep → 32</li>
                <li>12 Sep → 36</li>
                <li className="text-slate-400 italic">08 Sep → 40 was automatically retired</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Monthly Draw Engine */}
      <div className="p-8 sm:p-12 rounded-3xl border border-slate-800 bg-dark-900/60 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-impact-500/10 border border-impact-500/30 flex items-center justify-center text-impact-400 font-bold">
            §06
          </div>
          <h2 className="text-2xl font-bold text-white">2. Dual-Mode Draw Engine & Number Range</h2>
        </div>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          On a monthly cadence, <strong>5 winning numbers</strong> are drawn from the discrete range <strong>1 to 45</strong>
          (directly matching the Stableford score scale). The platform supports two auditable modes:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-brand-400" />
              <span>Standard Random Draw</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Standard lottery-style uniform random distribution. 5 distinct numbers are selected without replacement,
              giving every integer between 1 and 45 an equal probability.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-impact-400" />
              <span>Algorithmic Frequency-Weighted Draw</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Weighted by community score frequency. If a number (such as 36 or 38) was scored frequently across active
              golfers, its weight increases proportionally with Laplace smoothing ensuring every number retains a non-zero chance.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Prize Pool Distribution & Rollover */}
      <div className="p-8 sm:p-12 rounded-3xl border border-slate-800 bg-dark-900/60 mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            §07
          </div>
          <h2 className="text-2xl font-bold text-white">3. Prize Pool Distribution & Jackpot Rollover Rules</h2>
        </div>

        <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
          <strong>50% of gross subscription revenue</strong> funds the monthly prize pool. The distribution is
          enforced automatically on the backend:
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Match Tier</th>
                <th className="py-3 px-4">Pool Share</th>
                <th className="py-3 px-4">Multi-Winner Rule</th>
                <th className="py-3 px-4">Rollover Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300 text-xs sm:text-sm">
              <tr>
                <td className="py-4 px-4 font-bold text-amber-300">5-Number Match</td>
                <td className="py-4 px-4 font-semibold text-white">40% of pool</td>
                <td className="py-4 px-4">Split equally (Pool / N)</td>
                <td className="py-4 px-4 text-emerald-400 font-semibold">Yes — Rolls into next Jackpot</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-slate-200">4-Number Match</td>
                <td className="py-4 px-4 font-semibold text-white">35% of pool</td>
                <td className="py-4 px-4">Split equally (Pool / N)</td>
                <td className="py-4 px-4 text-slate-400">No (held in community reserve)</td>
              </tr>
              <tr>
                <td className="py-4 px-4 font-bold text-slate-200">3-Number Match</td>
                <td className="py-4 px-4 font-semibold text-white">25% of pool</td>
                <td className="py-4 px-4">Split equally (Pool / N)</td>
                <td className="py-4 px-4 text-slate-400">No (held in community reserve)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
          <strong>Example:</strong> If the 5-match tier pool is $10,000 and 2 subscribers match all 5 numbers, each receives
          $5,000. If no one matches 5 numbers, 100% of the $10,000 compounds into next month's Tier 5 jackpot!
        </div>
      </div>

      {/* 4. Winner Verification & Charity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
        <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/60">
          <div className="flex items-center gap-3 mb-4">
            <FileCheck className="w-6 h-6 text-brand-400" />
            <h3 className="text-xl font-bold text-white">Winner Verification (§09)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            To prevent fraud, winners must upload an authentic screenshot of their official scorecard from their golf
            handicap app or club platform. Admin reviewers verify the timestamp and Stableford points before authorizing
            payment settlement.
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
            Pending Proof → Under Review → Approved → Paid
          </div>
        </div>

        <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/60">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-rose-400" />
            <h3 className="text-xl font-bold text-white">Guaranteed Charity Giving (§08)</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
            Every subscriber selects a partner cause at signup. A <strong>minimum of 10%</strong> of the membership fee
            is irrevocably contributed to that charity, with users able to voluntarily increase their percentage up to
            100%. Independent direct donations are also supported.
          </p>
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-400 font-mono">
            Minimum 10% enforced at database level
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl shadow-xl shadow-brand-600/30 transition-all hover:scale-105"
        >
          <span>Join Digital Heroes Today</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
