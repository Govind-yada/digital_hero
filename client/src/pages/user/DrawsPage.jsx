import React, { useState, useEffect } from 'react';
import { drawApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { NumberBall } from '../../components/common/NumberBall.jsx';
import { Trophy, Calendar, Sparkles, CheckCircle2, History, ArrowRight } from 'lucide-react';

export const DrawsPage = () => {
  const { user } = useAuth();
  const [upcoming, setUpcoming] = useState(null);
  const [history, setHistory] = useState([]);
  const [userEntries, setUserEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      drawApi.getUpcoming().catch(() => null),
      drawApi.getHistory().catch(() => ({ history: [] })),
      user ? drawApi.getUserEntries().catch(() => ({ entries: [] })) : Promise.resolve({ entries: [] }),
    ])
      .then(([upcomingData, historyData, entriesData]) => {
        setUpcoming(upcomingData);
        setHistory(historyData?.history || []);
        setUserEntries(entriesData?.entries || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const draw = upcoming?.draw;
  const pool = upcoming?.prizePool;
  const userEntry = upcoming?.userEntry;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>Monthly Rewards Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Draws & Prize Pools</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Inspect current draw tiers, jackpot rollovers, and your active 5-number ticket.
        </p>
      </div>

      {/* Upcoming Draw Big Hero Card */}
      {draw && (
        <div className="p-8 sm:p-10 rounded-3xl border border-brand-500/30 bg-gradient-to-b from-dark-900 via-dark-950 to-dark-950 shadow-2xl mb-12 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <span className="text-xs uppercase font-bold text-brand-400 tracking-wider block mb-1">
                Active Monthly Draw
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{draw.draw_code}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Draw Date: {draw.draw_month}</span>
                <span>•</span>
                <span className="uppercase text-brand-300 font-semibold">{draw.draw_type} MODE</span>
              </div>
            </div>

            <div className="text-left md:text-right">
              <span className="text-xs uppercase text-slate-400 block mb-1">Total Prize Pool</span>
              <span className="text-3xl sm:text-4xl font-extrabold text-white">
                ${Number(pool?.total_pool || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* 3 Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-amber-500/30 relative">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-amber-300 uppercase">Tier 1: 5-Match</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                  40% + Rollover
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                ${Number(pool?.tier_5_pool || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-emerald-400 block font-medium">
                ★ Rolls over if unclaimed (Jackpot)
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-200 uppercase">Tier 2: 4-Match</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  35% Pool
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                ${Number(pool?.tier_4_pool || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block">Split equally among 4-match winners</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-200 uppercase">Tier 3: 3-Match</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                  25% Pool
                </span>
              </div>
              <div className="text-2xl font-black text-white mb-1">
                ${Number(pool?.tier_3_pool || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <span className="text-[11px] text-slate-400 block">Split equally among 3-match winners</span>
            </div>
          </div>

          {/* User's Ticket inside this Draw */}
          {user && (
            <div className="p-6 rounded-2xl bg-dark-950/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-slate-300 block mb-1">Your 5 Active Draw Numbers</span>
                {userEntry ? (
                  <div className="flex items-center gap-2 mt-2">
                    {userEntry.numbers.map((num, i) => (
                      <NumberBall key={i} number={num} size="md" />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    You need 5 recorded scores to form your draw ticket. Log rounds in Score Management.
                  </p>
                )}
              </div>
              <span className="text-xs text-slate-400 text-center sm:text-right">
                Derived directly from your Stableford score history
              </span>
            </div>
          )}
        </div>
      )}

      {/* Past Published Draws History */}
      <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
        <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <History className="w-5 h-5 text-brand-400" />
          <span>Past Draw Archives & Winning Numbers</span>
        </h3>
        <p className="text-xs text-slate-400 mb-6">Audited historical winning numbers and prize disbursements</p>

        {history.length === 0 ? (
          <p className="text-center py-8 text-slate-400 text-xs">
            No past draws published yet. Once the admin simulates and publishes the monthly draw, results appear here.
          </p>
        ) : (
          <div className="space-y-4">
            {history.map((pastDraw) => (
              <div
                key={pastDraw.id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base font-bold text-white">{pastDraw.draw_code}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                      PUBLISHED
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mb-4">
                    Month: {pastDraw.draw_month} • Mode: {pastDraw.draw_type}
                  </div>

                  {/* Winning Numbers */}
                  <div className="flex items-center gap-2">
                    {pastDraw.winning_numbers?.map((num, i) => (
                      <NumberBall key={i} number={num} matched size="sm" />
                    ))}
                  </div>
                </div>

                <div className="text-left md:text-right space-y-1 text-xs">
                  <div className="text-slate-300 font-semibold">
                    Total Pool: ${Number(pastDraw.prizePool?.total_pool || 0).toLocaleString()}
                  </div>
                  <div className="text-slate-400">
                    Winners: {pastDraw.winnersCount} (Tier 5: {pastDraw.tier5Winners}, Tier 4: {pastDraw.tier4Winners},
                    Tier 3: {pastDraw.tier3Winners})
                  </div>
                  {pastDraw.prizePool?.rolled_over_amount > 0 && (
                    <div className="text-amber-400 font-semibold">
                      Rolled Over: ${Number(pastDraw.prizePool.rolled_over_amount).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
