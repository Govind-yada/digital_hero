import React, { useState, useEffect } from 'react';
import { adminApi, drawApi, charityApi, winnerApi } from '../../services/api.js';
import { StatCard } from '../../components/common/StatCard.jsx';
import { NumberBall } from '../../components/common/NumberBall.jsx';
import {
  Shield,
  Users,
  Trophy,
  Heart,
  FileCheck,
  Activity,
  Plus,
  Play,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'draws' | 'charities' | 'winners'
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Surface 01: Users
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Surface 02: Draws
  const [drawsList, setDrawsList] = useState([]);
  const [newDrawCode, setNewDrawCode] = useState('');
  const [newDrawMonth, setNewDrawMonth] = useState('');
  const [newDrawType, setNewDrawType] = useState('ALGORITHMIC');
  const [simulationResult, setSimulationResult] = useState(null);
  const [drawActionLoading, setDrawActionLoading] = useState(false);

  // Surface 03: Charities
  const [charitiesList, setCharitiesList] = useState([]);
  const [showAddCharityModal, setShowAddCharityModal] = useState(false);
  const [charityFormData, setCharityFormData] = useState({
    name: '',
    description: '',
    category: 'Youth & Education',
    logo_url: '',
    cover_url: '',
    is_featured: false,
  });

  // Surface 04: Winners
  const [winnersList, setWinnersList] = useState([]);
  const [reviewingWinner, setReviewingWinner] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [payoutReference, setPayoutReference] = useState('');

  const [notification, setNotification] = useState(null);

  const notify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ovData, usersData, drawsData, charitiesData, winnersData] = await Promise.all([
        adminApi.getOverview().catch(() => null),
        adminApi.listUsers().catch(() => ({ users: [] })),
        drawApi.adminList().catch(() => ({ draws: [] })),
        charityApi.list().catch(() => ({ charities: [] })),
        winnerApi.adminList().catch(() => ({ winners: [] })),
      ]);

      setOverview(ovData);
      setUsersList(usersData?.users || []);
      setDrawsList(drawsData?.draws || []);
      setCharitiesList(charitiesData?.charities || []);
      setWinnersList(winnersData?.winners || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  // --- DRAW HANDLERS ---
  const handleCreateDraw = async (e) => {
    e.preventDefault();
    if (!newDrawCode || !newDrawMonth) return;
    setDrawActionLoading(true);
    try {
      const res = await drawApi.adminCreate({
        draw_code: newDrawCode,
        draw_month: newDrawMonth,
        draw_type: newDrawType,
      });
      notify(res.message);
      setNewDrawCode('');
      setNewDrawMonth('');
      await loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setDrawActionLoading(false);
    }
  };

  const handleGenerateNumbers = async (drawId, mode) => {
    setDrawActionLoading(true);
    try {
      const res = await drawApi.adminGenerateNumbers(drawId, { draw_type: mode });
      notify(res.message);
      await loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setDrawActionLoading(false);
    }
  };

  const handleSimulateDraw = async (drawId) => {
    setDrawActionLoading(true);
    try {
      const res = await drawApi.adminSimulate(drawId);
      setSimulationResult(res);
      notify('Simulation complete! Review matched tickets below.');
      await loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setDrawActionLoading(false);
    }
  };

  const handlePublishDraw = async (drawId) => {
    if (!window.confirm('Are you sure you want to lock and officially publish this draw? Winning records will be officially created.')) {
      return;
    }
    setDrawActionLoading(true);
    try {
      const res = await drawApi.adminPublish(drawId);
      notify(res.message);
      setSimulationResult(null);
      await loadAll();
    } catch (err) {
      alert(err.message);
    } finally {
      setDrawActionLoading(false);
    }
  };

  // --- USER HANDLERS ---
  const handleUpdateUserRole = async (userId, role) => {
    try {
      await adminApi.updateUser(userId, { role });
      notify(`User role updated to ${role}`);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateUserSub = async (userId, status) => {
    try {
      await adminApi.updateUser(userId, { subscription_status: status });
      notify(`User subscription updated to ${status}`);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CHARITY HANDLERS ---
  const handleCreateCharity = async (e) => {
    e.preventDefault();
    try {
      await charityApi.adminCreate(charityFormData);
      notify('New charity organization created.');
      setShowAddCharityModal(false);
      setCharityFormData({
        name: '',
        description: '',
        category: 'Youth & Education',
        logo_url: '',
        cover_url: '',
        is_featured: false,
      });
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCharity = async (id) => {
    if (!window.confirm('Delete this charity?')) return;
    try {
      await charityApi.adminDelete(id);
      notify('Charity removed.');
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleCharityFeatured = async (charity) => {
    try {
      await charityApi.adminUpdate(charity.id, { is_featured: !charity.is_featured });
      notify(`Charity featured status toggled.`);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- WINNER HANDLERS ---
  const handleReviewWinnerProof = async (winnerId, action) => {
    try {
      await winnerApi.adminReviewProof(winnerId, {
        action,
        reason: action === 'REJECT' ? rejectionReason : undefined,
      });
      notify(`Winner proof ${action === 'APPROVE' ? 'approved' : 'rejected'}.`);
      setReviewingWinner(null);
      setRejectionReason('');
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMarkPayoutPaid = async (winnerId) => {
    try {
      await winnerApi.adminMarkPayout(winnerId, {
        payment_reference: payoutReference || `PAYOUT-WIRE-${Date.now()}`,
      });
      notify('Winner payout marked as PAID.');
      setPayoutReference('');
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Shield className="w-3.5 h-3.5" />
            <span>PRD §11 Five Control Surfaces</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Operations Hub</h1>
          <p className="text-xs text-slate-400 mt-1">Platform administration, draw simulations, proofs, and metrics</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'overview', label: '05. Analytics' },
            { id: 'users', label: '01. Users' },
            { id: 'draws', label: '02. Draw Engine' },
            { id: 'charities', label: '03. Charities' },
            { id: 'winners', label: '04. Winners & Payouts' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-dark-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {notification && (
        <div className="mb-6 p-4 rounded-2xl bg-brand-950/60 border border-brand-500/40 text-brand-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* ================= TAB 05: OVERVIEW & REPORTS ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Users"
              value={overview?.metrics?.totalUsers || 0}
              subtitle={`${overview?.metrics?.activeSubscribers || 0} active subscribers`}
              icon={Users}
              color="brand"
            />
            <StatCard
              title="Total Prize Pools"
              value={`$${Number(overview?.metrics?.totalPrizePool || 0).toLocaleString()}`}
              subtitle={`$${Number(overview?.metrics?.totalPaidOut || 0).toLocaleString()} paid out`}
              icon={Trophy}
              color="amber"
            />
            <StatCard
              title="Total Charity Raised"
              value={`$${Number(overview?.metrics?.totalCharityContributed || 0).toLocaleString()}`}
              subtitle="Guaranteed subscriber pledges"
              icon={Heart}
              color="rose"
            />
            <StatCard
              title="Draws Managed"
              value={overview?.metrics?.totalDraws || 0}
              subtitle={`${overview?.metrics?.publishedDrawsCount || 0} published draws`}
              icon={Activity}
              color="impact"
            />
          </div>

          {/* Active Draw Banner */}
          {overview?.activeDraw && (
            <div className="p-6 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-1">
                  Upcoming Active Draw
                </span>
                <h3 className="text-xl font-bold text-white">
                  {overview.activeDraw.draw_code} ({overview.activeDraw.draw_type})
                </h3>
                <span className="text-xs text-slate-400">
                  Month: {overview.activeDraw.draw_month} • Enrolled Subscribers: {overview.activeDraw.entriesCount}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('draws')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-dark-950 shadow-md"
              >
                Go to Draw Operations →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 01: USER MANAGEMENT ================= */}
      {activeTab === 'users' && (
        <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">User Accounts & Subscriptions</h2>
              <p className="text-xs text-slate-400 mt-0.5">Manage subscriber statuses, roles, and charity splits</p>
            </div>
            <input
              type="text"
              placeholder="Search user name/email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500 w-full sm:w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Subscription</th>
                  <th className="py-3 px-4">Scores</th>
                  <th className="py-3 px-4">Charity Pledge</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {usersList
                  .filter(
                    (u) =>
                      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearch.toLowerCase())
                  )
                  .map((u) => (
                    <tr key={u.id}>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.subscription.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {u.subscription.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">{u.scoresCount} / 5 stored</td>
                      <td className="py-3.5 px-4">
                        {u.charity_percentage}% ({u.charityName})
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        {u.subscription.status !== 'ACTIVE' ? (
                          <button
                            onClick={() => handleUpdateUserSub(u.id, 'ACTIVE')}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded text-[10px]"
                          >
                            Set Active
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateUserSub(u.id, 'INACTIVE')}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px]"
                          >
                            Deactivate
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateUserRole(u.id, u.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                          className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded text-[10px]"
                        >
                          Toggle {u.role === 'ADMIN' ? 'User' : 'Admin'}
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 02: DRAW MANAGEMENT & SIMULATION ================= */}
      {activeTab === 'draws' && (
        <div className="space-y-8">
          {/* Create New Draw Form */}
          <div className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Initialize Monthly Draw Draft</span>
            </h2>

            <form onSubmit={handleCreateDraw} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Draw Code</label>
                <input
                  type="text"
                  placeholder="DRAW-2026-10"
                  required
                  value={newDrawCode}
                  onChange={(e) => setNewDrawCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Draw Month / Date</label>
                <input
                  type="date"
                  required
                  value={newDrawMonth}
                  onChange={(e) => setNewDrawMonth(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Draw Mode</label>
                <select
                  value={newDrawType}
                  onChange={(e) => setNewDrawType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                >
                  <option value="ALGORITHMIC">Algorithmic (Score Frequency)</option>
                  <option value="RANDOM">Uniform Random</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={drawActionLoading}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-dark-950 font-bold text-xs shadow-md disabled:opacity-50"
                >
                  Create Draft
                </button>
              </div>
            </form>
          </div>

          {/* Draws List & Simulation Runner */}
          <div className="space-y-6">
            {drawsList.map((d) => (
              <div
                key={d.id}
                className="p-6 sm:p-8 rounded-3xl border border-slate-800 bg-dark-900/70 backdrop-blur-sm shadow-xl"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-black text-white">{d.draw_code}</h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          d.status === 'PUBLISHED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : d.status === 'SIMULATED'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 block">
                      Target Month: {d.draw_month} • Mode: {d.draw_type} • Enrolled Entries: {d.totalEntries}
                    </span>
                  </div>

                  {/* Actions for Draft / Simulated */}
                  {d.status !== 'PUBLISHED' && d.status !== 'COMPLETED' && (
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => handleGenerateNumbers(d.id, 'RANDOM')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Gen Random</span>
                      </button>

                      <button
                        onClick={() => handleGenerateNumbers(d.id, 'ALGORITHMIC')}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-impact-600/30 hover:bg-impact-600/50 text-impact-300 border border-impact-500/30 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gen Algorithmic</span>
                      </button>

                      <button
                        onClick={() => handleSimulateDraw(d.id)}
                        disabled={!d.winning_numbers?.length}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 disabled:opacity-40"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Simulate Matches</span>
                      </button>

                      <button
                        onClick={() => handlePublishDraw(d.id)}
                        disabled={d.status !== 'SIMULATED'}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-dark-950 flex items-center gap-1.5 disabled:opacity-40 shadow-lg"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Publish Draw</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Winning Numbers display */}
                <div className="mb-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-semibold uppercase">5 Winning Numbers:</span>
                  {d.winning_numbers?.length === 5 ? (
                    <div className="flex items-center gap-2">
                      {d.winning_numbers.map((n, i) => (
                        <NumberBall key={i} number={n} matched size="sm" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-amber-400">Click Generate Numbers to pick 5 numbers</span>
                  )}
                </div>

                {/* Pool summary */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-300">
                  <div className="p-3 bg-dark-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">Total Pool</span>
                    <span className="font-bold text-white">${Number(d.prizePool?.total_pool || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-dark-950 rounded-xl border border-slate-800">
                    <span className="text-amber-400 block mb-1">Tier 5 (40% + Rollover)</span>
                    <span className="font-bold text-amber-300">
                      ${Number(d.prizePool?.tier_5_pool || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="p-3 bg-dark-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">Tier 4 (35%)</span>
                    <span className="font-bold text-white">${Number(d.prizePool?.tier_4_pool || 0).toLocaleString()}</span>
                  </div>
                  <div className="p-3 bg-dark-950 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block mb-1">Tier 3 (25%)</span>
                    <span className="font-bold text-white">${Number(d.prizePool?.tier_3_pool || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Simulation Preview Inspector Modal */}
          {simulationResult && (
            <div className="p-8 rounded-3xl border border-blue-500/40 bg-dark-900 shadow-2xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Play className="w-5 h-5 text-blue-400" />
                  <span>Simulation Results Preview</span>
                </h3>
                <button
                  onClick={() => setSimulationResult(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close Preview
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">5-Match Winners</span>
                  <span className="text-2xl font-black text-amber-300">
                    {simulationResult.distribution.tier5.winnersCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ${simulationResult.distribution.tier5.prizePerWinner.toLocaleString()} each
                  </span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">4-Match Winners</span>
                  <span className="text-2xl font-black text-white">
                    {simulationResult.distribution.tier4.winnersCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ${simulationResult.distribution.tier4.prizePerWinner.toLocaleString()} each
                  </span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 block">3-Match Winners</span>
                  <span className="text-2xl font-black text-white">
                    {simulationResult.distribution.tier3.winnersCount}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    ${simulationResult.distribution.tier3.prizePerWinner.toLocaleString()} each
                  </span>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-amber-500/30">
                  <span className="text-xs text-amber-400 block">Tier 5 Rollover</span>
                  <span className="text-2xl font-black text-amber-300">
                    ${simulationResult.distribution.totalRolledOver.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    {simulationResult.distribution.totalRolledOver > 0
                      ? 'No 5-match winners; carries forward'
                      : 'Jackpot claimed!'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 03: CHARITY MANAGEMENT ================= */}
      {activeTab === 'charities' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">Partner Charity Organizations</h2>
            <button
              onClick={() => setShowAddCharityModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Charity</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {charitiesList.map((c) => (
              <div
                key={c.id}
                className="p-6 rounded-3xl border border-slate-800 bg-dark-900/60 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-lg font-bold text-white">{c.name}</h3>
                    <button
                      onClick={() => handleToggleCharityFeatured(c)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.is_featured
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {c.is_featured ? '★ Featured Spotlight' : 'Standard'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2 mb-4">{c.description}</p>
                  <span className="text-xs text-brand-400 font-semibold block mb-4">
                    Category: {c.category}
                  </span>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => handleDeleteCharity(c.id)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg text-xs"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Charity Modal */}
          {showAddCharityModal && (
            <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4">Add Partner Charity</h3>
                <form onSubmit={handleCreateCharity} className="space-y-4">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Organization Name</label>
                    <input
                      type="text"
                      required
                      value={charityFormData.name}
                      onChange={(e) => setCharityFormData({ ...charityFormData, name: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Category</label>
                    <input
                      type="text"
                      required
                      value={charityFormData.category}
                      onChange={(e) => setCharityFormData({ ...charityFormData, category: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Description</label>
                    <textarea
                      required
                      rows={3}
                      value={charityFormData.description}
                      onChange={(e) => setCharityFormData({ ...charityFormData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={charityFormData.cover_url}
                      onChange={(e) => setCharityFormData({ ...charityFormData, cover_url: e.target.value })}
                      className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="feat"
                      checked={charityFormData.is_featured}
                      onChange={(e) => setCharityFormData({ ...charityFormData, is_featured: e.target.checked })}
                      className="accent-brand-500"
                    />
                    <label htmlFor="feat" className="text-xs text-slate-300 cursor-pointer">
                      Feature on homepage spotlight
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddCharityModal(false)}
                      className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white"
                    >
                      Create Organization
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 04: WINNERS & PAYOUTS ================= */}
      {activeTab === 'winners' && (
        <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/60 backdrop-blur-sm shadow-xl">
          <h2 className="text-xl font-bold text-white mb-2">Winner Proof Review & Payout Desk</h2>
          <p className="text-xs text-slate-400 mb-6">
            Review uploaded scorecard screenshots, approve or reject submissions, and mark payout settlement.
          </p>

          {winnersList.length === 0 ? (
            <p className="text-center py-12 text-slate-400 text-xs">
              No winners created yet. Run and publish a draw in Draw Engine to record winners.
            </p>
          ) : (
            <div className="space-y-4">
              {winnersList.map((w) => (
                <div
                  key={w.id}
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-lg font-black text-white">{w.userName}</span>
                      <span className="text-xs text-slate-400">({w.userEmail})</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                        {w.match_tier}-Match Winner
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mb-2">
                      Prize: <strong className="text-white">${Number(w.prize_amount).toLocaleString()}</strong> •
                      Draw: {w.drawCode}
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.verification_status === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : w.verification_status === 'PENDING_REVIEW'
                            ? 'bg-blue-500/20 text-blue-300'
                            : w.verification_status === 'REJECTED'
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        Proof: {w.verification_status}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          w.payment_status === 'PAID'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        Payment: {w.payment_status}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {w.proof_image_url ? (
                      <a
                        href={w.proof_image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1"
                      >
                        <span>View Scorecard</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-slate-500 italic">No proof uploaded</span>
                    )}

                    {w.verification_status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => handleReviewWinnerProof(w.id, 'APPROVE')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                        >
                          Approve Proof
                        </button>
                        <button
                          onClick={() => setReviewingWinner(w)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600/30 hover:bg-red-600/50 text-red-300 border border-red-500/30"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {w.verification_status === 'APPROVED' && w.payment_status !== 'PAID' && (
                      <button
                        onClick={() => handleMarkPayoutPaid(w.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-dark-950"
                      >
                        Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reject Reason Modal */}
          {reviewingWinner && (
            <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-lg font-bold text-white mb-2">Reject Winner Proof</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Please provide a clear reason to explain why this scorecard screenshot was rejected.
                </p>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Unclear timestamp, score does not match Stableford points..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500 mb-4"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setReviewingWinner(null);
                      setRejectionReason('');
                    }}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!rejectionReason}
                    onClick={() => handleReviewWinnerProof(reviewingWinner.id, 'REJECT')}
                    className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-40"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
