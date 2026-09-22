import React, { useState, useEffect } from 'react';
import { scoreApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { SubscriptionGuard } from '../../components/common/ProtectedRoute.jsx';
import { Activity, Plus, Edit2, Trash2, Calendar, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export const ScoresPage = () => {
  const { user } = useAuth();
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scoreInput, setScoreInput] = useState(36);
  const [dateInput, setDateInput] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingScore, setEditingScore] = useState(null);

  const loadScores = async () => {
    setLoading(true);
    try {
      const data = await scoreApi.getScores();
      setScores(data.scores || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScores();
  }, []);

  const handleAddScore = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await scoreApi.addScore({
        score: parseInt(scoreInput, 10),
        score_date: dateInput,
      });
      setSuccess('Score recorded! Rolling 5-score limit updated.');
      setScores(res.currentScores || []);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateScore = async (e) => {
    e.preventDefault();
    if (!editingScore) return;
    setError(null);
    try {
      const res = await scoreApi.updateScore(editingScore.id, {
        score: parseInt(editingScore.score, 10),
        score_date: editingScore.score_date,
      });
      setScores(res.currentScores || []);
      setEditingScore(null);
      setSuccess('Score updated successfully.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteScore = async (id) => {
    if (!window.confirm('Are you sure you want to delete this score entry?')) return;
    try {
      const res = await scoreApi.deleteScore(id);
      setScores(res.remainingScores || []);
      setSuccess('Score deleted.');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Prepare chart data (sorted chronologically for line progression)
  const chartData = [...scores]
    .sort((a, b) => new Date(a.score_date) - new Date(b.score_date))
    .map((s) => ({
      date: s.score_date.split('-').slice(1).join('/'),
      score: s.score,
    }));

  return (
    <SubscriptionGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-slate-800">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>PRD §05 Stableford Engine</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Score Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Enter your official rounds. Strictly maintains only your latest 5 rounds in reverse chronological order.
          </p>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Add Score Form */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/70 backdrop-blur-sm shadow-xl h-fit">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-brand-400" />
              <span>Record Stableford Round</span>
            </h2>

            <form onSubmit={handleAddScore} className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-medium text-slate-300">Stableford Score (1–45)</label>
                  <span className="text-lg font-black text-brand-400">{scoreInput} pts</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="45"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-brand-500 mb-2"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>1 (Min)</span>
                  <span>25 (Average)</span>
                  <span>45 (Max)</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">Round Date</label>
                <input
                  type="date"
                  required
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">
                  * Duplicate scores for the same date are rejected by the system.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm transition-all shadow-md shadow-brand-600/20 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Add Round to Active History'}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 flex items-start gap-2 text-slate-400 text-xs">
              <Info className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
              <span>
                When a sixth score is added, the oldest stored score is retired automatically, ensuring your ticket always
                reflects current performance.
              </span>
            </div>
          </div>

          {/* Center & Right: 5 Stored Scores & Trend Chart */}
          <div className="lg:col-span-2 space-y-8">
            {/* 5-Score List Card */}
            <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/70 backdrop-blur-sm shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Active 5-Score Roster</h2>
                  <span className="text-xs text-slate-400">Displayed in reverse chronological order</span>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-brand-300 border border-brand-500/20">
                  {scores.length} / 5 Stored
                </span>
              </div>

              {scores.length === 0 ? (
                <p className="text-center py-10 text-slate-400 text-sm">
                  No scores recorded yet. Add your latest round using the form.
                </p>
              ) : (
                <div className="space-y-3">
                  {scores.map((s, idx) => (
                    <div
                      key={s.id}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/90 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-brand-400">
                          {idx === 0 ? 'NEW' : `#${idx + 1}`}
                        </div>
                        <div>
                          <div className="text-base font-extrabold text-white">{s.score} Points</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{s.score_date}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingScore(s)}
                          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Edit score"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteScore(s.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                          title="Delete score"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Performance Trend Chart */}
            {scores.length >= 2 && (
              <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/70 backdrop-blur-sm shadow-xl">
                <h3 className="text-base font-bold text-white mb-1">Score Trend (Recent Rounds)</h3>
                <p className="text-xs text-slate-400 mb-6">Visual progression of your Stableford points</p>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, 45]} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '0.75rem',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#1fa881"
                        strokeWidth={3}
                        dot={{ fill: '#1fa881', r: 5 }}
                        activeDot={{ r: 7 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Score Modal */}
        {editingScore && (
          <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
              <h3 className="text-lg font-bold text-white mb-4">Edit Score Entry</h3>
              <form onSubmit={handleUpdateScore} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Stableford Score (1–45)</label>
                  <input
                    type="number"
                    min="1"
                    max="45"
                    value={editingScore.score}
                    onChange={(e) => setEditingScore({ ...editingScore, score: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={editingScore.score_date}
                    onChange={(e) => setEditingScore({ ...editingScore, score_date: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                    required
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingScore(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SubscriptionGuard>
  );
};
