import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { charityApi } from '../../services/api.js';
import { Heart, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

export const CharitySettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [selectedId, setSelectedId] = useState(user?.selected_charity_id || '');
  const [percentage, setPercentage] = useState(user?.charity_percentage || 15);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    charityApi.list().then((data) => {
      setCharities(data.charities || []);
      setLoading(false);
    });
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (percentage < 10) {
      setError('PRD §08.1 mandates a minimum 10% charity contribution.');
      return;
    }

    setSaving(true);
    try {
      await charityApi.updateUserCharity({
        charity_id: selectedId,
        charity_percentage: percentage,
      });
      await refreshUser();
      setMessage('Charity preferences updated successfully!');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Heart className="w-3.5 h-3.5" />
          <span>PRD §08 Giving Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Charity Preferences</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Select which vetted cause receives your recurring subscription pledge and adjust your voluntary giving percentage.
        </p>
      </div>

      {message && (
        <div className="mb-6 p-4 rounded-2xl bg-brand-950/40 border border-brand-500/30 text-brand-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/70 backdrop-blur-sm shadow-xl">
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="text-xs font-semibold text-slate-200 block mb-2">
              Select Primary Beneficiary Organization
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
            >
              {charities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-200">
                Voluntary Contribution Percentage of Subscription
              </label>
              <span className="text-sm font-black text-rose-400">{percentage}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              step="1"
              value={percentage}
              onChange={(e) => setPercentage(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
            <div className="flex justify-between text-[11px] text-slate-500 mt-1">
              <span>10% (Mandatory minimum)</span>
              <span>25%</span>
              <span>50%</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md transition-all disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Save Charity Preferences'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
