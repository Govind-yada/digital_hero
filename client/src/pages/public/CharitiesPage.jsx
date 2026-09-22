import React, { useState, useEffect } from 'react';
import { charityApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, Heart, Calendar, Users, ExternalLink, Sparkles, CheckCircle2, DollarSign } from 'lucide-react';

export const CharitiesPage = () => {
  const { user, refreshUser } = useAuth();
  const [charities, setCharities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [donationModalCharity, setDonationModalCharity] = useState(null);
  const [donationAmount, setDonationAmount] = useState('25');
  const [donorName, setDonorName] = useState('');
  const [donationSuccess, setDonationSuccess] = useState(null);
  const [submittingDonation, setSubmittingDonation] = useState(false);
  const [selectionMessage, setSelectionMessage] = useState(null);

  const categories = ['All', 'Youth & Education', 'Environment & Oceans', 'Veteran Support', 'Wildlife & Nature'];

  const loadCharities = async () => {
    setLoading(true);
    try {
      const data = await charityApi.list({
        search: search || undefined,
        category: selectedCategory !== 'All' ? selectedCategory : undefined,
      });
      setCharities(data.charities || []);
    } catch (err) {
      console.error('Error loading charities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCharities();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadCharities();
  };

  const handleSelectCharity = async (charityId) => {
    if (!user) {
      window.location.href = `/register?charity=${charityId}`;
      return;
    }
    try {
      await charityApi.updateUserCharity({ charity_id: charityId });
      setSelectionMessage(`Successfully updated your beneficiary charity!`);
      refreshUser();
      setTimeout(() => setSelectionMessage(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDonationSubmit = async (e) => {
    e.preventDefault();
    if (!donationModalCharity) return;

    setSubmittingDonation(true);
    try {
      const res = await charityApi.donate(donationModalCharity.id, {
        amount: parseFloat(donationAmount),
        donor_name: donorName || user?.name || 'Anonymous Hero',
      });
      setDonationSuccess(res.message);
      loadCharities();
      setTimeout(() => {
        setDonationSuccess(null);
        setDonationModalCharity(null);
        setDonorName('');
      }, 2500);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingDonation(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Heart className="w-3.5 h-3.5" />
          <span>Vetted Partner Organizations</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Charity Directory
        </h1>
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
          Every subscriber directs at least 10% of their subscription to one of these impact partners. Explore their
          missions and upcoming golf day events.
        </p>
      </div>

      {selectionMessage && (
        <div className="mb-8 p-4 rounded-2xl bg-brand-950/60 border border-brand-500/40 text-brand-300 flex items-center gap-2 max-w-xl mx-auto text-sm justify-center">
          <CheckCircle2 className="w-4 h-4" />
          <span>{selectionMessage}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search causes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Charity Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-96 rounded-3xl bg-slate-900/40 border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : charities.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400 text-sm">No charities match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {charities.map((charity) => {
            const isUserCharity = user?.selected_charity_id === charity.id;

            return (
              <div
                key={charity.id}
                className={`rounded-3xl border ${
                  isUserCharity ? 'border-brand-500/50 bg-slate-900/80' : 'border-slate-800 bg-dark-900/60'
                } overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-colors shadow-lg`}
              >
                <div>
                  <div className="h-52 relative overflow-hidden">
                    <img
                      src={charity.cover_url}
                      alt={charity.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-dark-950/80 backdrop-blur-md text-brand-300 border border-brand-500/30">
                        {charity.category}
                      </span>
                      {charity.is_featured && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/80 text-dark-950 font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Featured</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="text-xl font-bold text-white tracking-tight">{charity.name}</h3>
                      {charity.website_url && (
                        <a
                          href={charity.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>

                    <p className="text-slate-300 text-sm leading-relaxed mb-6">{charity.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 mb-6 text-center">
                      <div>
                        <span className="text-[11px] uppercase text-slate-400 block mb-1">Total Raised</span>
                        <span className="text-lg font-bold text-brand-300">
                          ${Number(charity.totalRaised || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase text-slate-400 block mb-1">Supporters</span>
                        <span className="text-lg font-bold text-white">
                          {charity.supporterCount || 0} golfers
                        </span>
                      </div>
                    </div>

                    {/* Upcoming events / golf days */}
                    {charity.upcoming_events?.length > 0 && (
                      <div className="mb-6 space-y-2">
                        <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
                          Upcoming Events:
                        </span>
                        {charity.upcoming_events.map((evt, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-200 font-medium">{evt.title}</span>
                            <span className="text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-brand-400" />
                              {evt.date}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-6 pt-0 border-t border-slate-800/60 flex items-center justify-between gap-3 mt-4">
                  <button
                    onClick={() => handleSelectCharity(charity.id)}
                    className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                      isUserCharity
                        ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40 cursor-default'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isUserCharity ? 'Selected Beneficiary' : user ? 'Choose as My Cause' : 'Select at Signup'}
                  </button>

                  <button
                    onClick={() => setDonationModalCharity(charity)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Direct Gift</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Independent Direct Donation Modal (PRD §08.1) */}
      {donationModalCharity && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>Direct Gift to {donationModalCharity.name}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              PRD §08.1: Independent donation not tied to monthly gameplay. 100% of this gift goes directly to the
              cause.
            </p>

            {donationSuccess ? (
              <div className="p-6 text-center text-brand-300 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-brand-400" />
                <p className="font-semibold text-sm">{donationSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleDonationSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Donor Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-2">Select Donation Amount</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {['10', '25', '50', '100'].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDonationAmount(amt)}
                        className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                          donationAmount === amt
                            ? 'bg-rose-600 text-white'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        ${amt}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                    <input
                      type="number"
                      min="1"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDonationModalCharity(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingDonation}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
                  >
                    {submittingDonation ? 'Processing...' : `Donate $${donationAmount}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
