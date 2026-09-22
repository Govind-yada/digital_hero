import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { scoreApi, drawApi, winnerApi, subscriptionApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { NumberBall } from '../../components/common/NumberBall.jsx';
import { EmptyState } from '../../components/common/EmptyState.jsx';
import {
  Trophy,
  Heart,
  Calendar,
  Activity,
  ArrowRight,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Zap,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, subscription, refreshUser } = useAuth();
  const [scores, setScores] = useState([]);
  const [upcomingDraw, setUpcomingDraw] = useState(null);
  const [winningsSummary, setWinningsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluatorMessage, setEvaluatorMessage] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [scoresData, drawData, winningsData] = await Promise.all([
        scoreApi.getScores().catch(() => ({ scores: [] })),
        drawApi.getUpcoming().catch(() => null),
        winnerApi.getMyWinnings().catch(() => null),
      ]);
      setScores(scoresData.scores || []);
      setUpcomingDraw(drawData);
      setWinningsSummary(winningsData);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSimulateToggle = async (status) => {
    try {
      const res = await subscriptionApi.simulateToggle({
        planType: subscription?.plan_type || 'MONTHLY',
        status,
      });
      setEvaluatorMessage(res.message);
      await refreshUser();
      await loadData();
      setTimeout(() => setEvaluatorMessage(null), 3500);
    } catch (err) {
      alert(err.message);
    }
  };

  const isSubscribed = subscription?.status === 'ACTIVE';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking your Stableford performance and community impact
          </p>
        </div>

        {/* Subscription Status Pill */}
        <div className="flex items-center gap-3">
          <div
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 border ${
              isSubscribed
                ? 'bg-brand-500/15 text-brand-300 border-brand-500/30'
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSubscribed ? 'bg-brand-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span>
              {isSubscribed
                ? `ACTIVE (${subscription?.plan_type || 'MONTHLY'})`
                : subscription?.status || 'INACTIVE'}
            </span>
          </div>

          {!isSubscribed ? (
            <Link
              to="/pricing"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md"
            >
              Activate Membership
            </Link>
          ) : (
            <button
              onClick={() => handleSimulateToggle('CANCELLED')}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel Sub
            </button>
          )}
        </div>
      </div>

      {/* Evaluator Helper Bar */}
      <div className="mb-8 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Zap className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">Evaluator Quick Controls:</span>
          <span className="text-slate-400">Toggle subscription lifecycle states in real-time</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulateToggle('ACTIVE')}
            className="px-2.5 py-1 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 rounded-lg"
          >
            Force ACTIVE
          </button>
          <button
            onClick={() => handleSimulateToggle('LAPSED')}
            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 rounded-lg"
          >
            Force LAPSED
          </button>
          <button
            onClick={() => handleSimulateToggle('INACTIVE')}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg"
          >
            Force INACTIVE
          </button>
        </div>
      </div>

      {evaluatorMessage && (
        <div className="mb-8 p-3 rounded-xl bg-brand-950/60 border border-brand-500/40 text-brand-300 text-xs text-center">
          {evaluatorMessage}
        </div>
      )}

      {/* Metric Cards (PRD §10) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Active Subscription"
          value={subscription?.status === 'ACTIVE' ? 'Active Member' : 'Inactive'}
          subtitle={
            subscription?.current_period_end
              ? `Renews ${new Date(subscription.current_period_end).toLocaleDateString()}`
              : 'No renewal scheduled'
          }
          icon={CheckCircle2}
          color="brand"
        />

        <StatCard
          title="Total Winnings"
          value={`$${(winningsSummary?.totalWon || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle={
            winningsSummary?.pendingPayout > 0
              ? `$${winningsSummary.pendingPayout} awaiting verification/payout`
              : 'All prizes fully paid'
          }
          icon={Trophy}
          color="amber"
        />

        <StatCard
          title="Charity Impact"
          value={`${user?.charity_percentage || 10}% Pledged`}
          subtitle={user?.charity?.name || 'Selected beneficiary'}
          icon={Heart}
          color="rose"
        />

        <StatCard
          title="Rolling Scores"
          value={`${scores.length} of 5 Logged`}
          subtitle={scores.length === 5 ? '5-score ticket active' : 'Log 5 to complete ticket'}
          icon={Activity}
          color="impact"
        />
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent 5 Scores & Ticket */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active 5-Score Card */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-brand-400" />
                  <span>Your 5 Rolling Stableford Scores (PRD §05)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Latest 5 rounds retained in reverse chronological order
                </p>
              </div>
              <Link
                to="/scores"
                className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-brand-600/20"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage Scores</span>
              </Link>
            </div>

            {scores.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No scores added yet"
                description="Add your latest Stableford score (1–45) to get started with draw participation."
                actionText="Add First Score"
                actionLink="/scores"
              />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-3 text-center mb-4">
                  {scores.map((s, idx) => (
                    <div key={s.id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-mono block mb-1">
                        {idx === 0 ? 'NEWEST' : `R${5 - idx}`}
                      </span>
                      <span className="text-xl font-black text-white">{s.score}</span>
                      <span className="text-[10px] text-slate-400 block mt-1 truncate">
                        {s.score_date.split('-').slice(1).join('/')}
                      </span>
                    </div>
                  ))}
                  {Array.from({ length: Math.max(0, 5 - scores.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="p-3 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-600 text-xs"
                    >
                      <span>Slot {scores.length + i + 1}</span>
                      <span className="text-[10px]">Pending</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                  <span>Scores range: 1–45 (Stableford)</span>
                  <Link to="/scores" className="text-brand-400 hover:underline">
                    View Score History & Trend Chart →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Monthly Draw Participation Ticket */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span>Current Draw Ticket ({upcomingDraw?.draw?.draw_code || 'Active Draw'})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your draw ticket automatically derives from your 5 stored rounds
                </p>
              </div>
              <Link to="/draws" className="text-xs font-semibold text-brand-400 hover:underline">
                Draw Details →
              </Link>
            </div>

            {scores.length < 5 ? (
              <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs">
                You have logged {scores.length} of 5 required rounds. Log {5 - scores.length} more round(s) to activate
                your official draw ticket!
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  {scores.map((s) => (
                    <NumberBall key={s.id} number={s.score} size="md" />
                  ))}
                </div>
                <div className="text-center sm:text-right">
                  <span className="text-xs text-slate-400 block">Status:</span>
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Eligible for {upcomingDraw?.draw?.draw_code}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Beneficiary Charity & Winnings Claim */}
        <div className="space-y-8">
          {/* Selected Charity Card */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span>Selected Cause</span>
              </h3>
              <Link to="/charities" className="text-xs text-brand-400 hover:underline">
                Change
              </Link>
            </div>

            {user?.charity ? (
              <div className="space-y-3">
                <div className="h-28 rounded-2xl overflow-hidden relative">
                  <img
                    src={user.charity.cover_url}
                    alt={user.charity.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
                  <span className="absolute bottom-2 left-2 text-xs font-bold text-white">
                    {user.charity.name}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2">
                  <span className="text-slate-400">Pledged Portion:</span>
                  <span className="font-bold text-rose-300">{user.charity_percentage}% of fee</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total Given to Date:</span>
                  <span className="font-bold text-white">
                    ${((subscription?.amount || 29) * (user.charity_percentage / 100)).toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-400">
                <p className="mb-2">No charity selected yet.</p>
                <Link to="/charities" className="text-brand-400 underline">
                  Choose your cause now
                </Link>
              </div>
            )}
          </div>

          {/* Winnings Quick Action */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Prize Claims</span>
              </h3>
              <Link to="/winnings" className="text-xs text-brand-400 hover:underline">
                View All
              </Link>
            </div>

            {winningsSummary?.winnings?.length > 0 ? (
              <div className="space-y-3">
                {winningsSummary.winnings.slice(0, 2).map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">
                        ${Number(w.prize_amount).toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {w.match_tier}-number match ({w.drawCode})
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        w.payment_status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : w.verification_status === 'PENDING_PROOF'
                          ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {w.payment_status === 'PAID' ? 'PAID' : w.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">
                You haven't won a draw yet. Next draw runs at the end of the month!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
