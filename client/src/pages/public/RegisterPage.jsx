import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { charityApi } from '../../services/api.js';
import { Sparkles, Heart, AlertCircle, CheckCircle2 } from 'lucide-react';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedCharityId = searchParams.get('charity') || '';
  const preselectedPlan = searchParams.get('plan') || 'MONTHLY';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [charities, setCharities] = useState([]);
  const [selectedCharityId, setSelectedCharityId] = useState(preselectedCharityId);
  const [charityPercentage, setCharityPercentage] = useState(15);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    charityApi.list().then((res) => {
      const list = res.charities || [];
      setCharities(list);
      if (!selectedCharityId && list.length > 0) {
        setSelectedCharityId(list[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (charityPercentage < 10) {
      setError('PRD §08.1 requires a minimum 10% charity contribution.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name,
        email,
        password,
        selected_charity_id: selectedCharityId,
        charity_percentage: charityPercentage,
      });

      // Forward to plan selection
      navigate(`/pricing?plan=${preselectedPlan}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-impact-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Become a Hero Subscriber</h2>
          <p className="text-xs text-slate-400 mt-1">Play for high-stakes draws. Give back with every round.</p>
        </div>

        {/* Card */}
        <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/80 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Golfer"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Password (min 8 characters)</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500 placeholder-slate-500"
              />
            </div>

            {/* Charity selection at signup (PRD §08.1) */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-300 block mb-1.5">Select Beneficiary Charity</label>
              <select
                value={selectedCharityId}
                onChange={(e) => setSelectedCharityId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
              >
                {charities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Voluntary percentage slider with min 10% (PRD §08.1) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-300">Monthly Contribution Percentage</label>
                <span className="text-xs font-bold text-rose-400">{charityPercentage}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="50"
                step="1"
                value={charityPercentage}
                onChange={(e) => setCharityPercentage(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                * Minimum 10% required by platform rules. You may increase voluntarily.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-4 py-3.5 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-semibold text-sm transition-all shadow-lg shadow-brand-600/20 disabled:opacity-50"
            >
              {submitting ? 'Creating Account...' : 'Continue to Plans'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-400 hover:text-brand-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
