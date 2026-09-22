import React, { useState, useEffect } from 'react';
import { winnerApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Trophy, Upload, CheckCircle2, AlertCircle, Clock, DollarSign, FileText } from 'lucide-react';

export const WinningsPage = () => {
  const { user } = useAuth();
  const [winningsData, setWinningsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalWinner, setUploadModalWinner] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const loadWinnings = async () => {
    setLoading(true);
    try {
      const data = await winnerApi.getMyWinnings();
      setWinningsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWinnings();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadModalWinner || !selectedFile) return;

    setUploading(true);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('proof', selectedFile);

      await winnerApi.uploadProof(uploadModalWinner.id, formData);
      setMessage('Proof screenshot uploaded successfully! Status changed to Under Review.');
      await loadWinnings();
      setTimeout(() => {
        setMessage(null);
        setUploadModalWinner(null);
        setSelectedFile(null);
      }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (winner) => {
    if (winner.payment_status === 'PAID') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>PAID ({winner.payment_reference || 'Completed'})</span>
        </span>
      );
    }

    switch (winner.verification_status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            Verified • Payout Pending
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Under Review</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-300 border border-red-500/30">
            Proof Rejected
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            Action Required: Upload Proof
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-800">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Trophy className="w-3.5 h-3.5" />
          <span>PRD §09 Verification & Settlements</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Winnings & Claim Verification</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review your draw prizes, upload golf scorecard proof screenshots, and track payout status.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        <div className="p-6 rounded-3xl bg-dark-900/60 border border-slate-800">
          <span className="text-xs uppercase text-slate-400 block mb-1">Total Career Winnings</span>
          <span className="text-3xl font-black text-white">
            ${Number(winningsData?.totalWon || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-dark-900/60 border border-emerald-500/30">
          <span className="text-xs uppercase text-emerald-400 block mb-1">Total Paid Out</span>
          <span className="text-3xl font-black text-emerald-300">
            ${Number(winningsData?.paidOut || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-6 rounded-3xl bg-dark-900/60 border border-amber-500/30">
          <span className="text-xs uppercase text-amber-400 block mb-1">Pending Verification / Payout</span>
          <span className="text-3xl font-black text-amber-300">
            ${Number(winningsData?.pendingPayout || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Winnings List */}
      <div className="p-8 rounded-3xl border border-slate-800 bg-dark-900/70 backdrop-blur-sm shadow-xl">
        <h2 className="text-xl font-bold text-white mb-6">Prize History</h2>

        {!winningsData?.winnings?.length ? (
          <p className="text-center py-12 text-slate-400 text-sm">
            You have not won any draw prizes yet. Keep playing and recording scores!
          </p>
        ) : (
          <div className="space-y-4">
            {winningsData.winnings.map((w) => (
              <div
                key={w.id}
                className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
              >
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-black text-white">${Number(w.prize_amount).toLocaleString()}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300">
                      Tier {w.match_tier} ({w.match_tier}-Number Match)
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Draw: {w.drawCode} • Month: {w.drawMonth}
                  </div>

                  {w.rejection_reason && (
                    <div className="mt-3 p-3 rounded-xl bg-red-950/30 border border-red-500/30 text-red-300 text-xs">
                      <strong>Rejection Reason:</strong> {w.rejection_reason}
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  {getStatusBadge(w)}

                  {(w.verification_status === 'PENDING_PROOF' || w.verification_status === 'REJECTED') && (
                    <button
                      onClick={() => setUploadModalWinner(w)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{w.verification_status === 'REJECTED' ? 'Re-upload Proof' : 'Upload Proof'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proof Upload Modal (PRD §09) */}
      {uploadModalWinner && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Upload className="w-5 h-5 text-brand-400" />
              <span>Upload Scorecard Screenshot</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              PRD §09: Verification applies to winners only. Please upload a clear screenshot of your official golf
              handicap scorecard confirming your Stableford score for this draw period.
            </p>

            {message ? (
              <div className="p-6 text-center text-brand-300 space-y-2">
                <CheckCircle2 className="w-10 h-10 mx-auto text-brand-400" />
                <p className="font-semibold text-sm">{message}</p>
              </div>
            ) : (
              <form onSubmit={handleUploadSubmit} className="space-y-5">
                <div className="border-2 border-dashed border-slate-700 hover:border-brand-500/60 rounded-2xl p-6 text-center transition-colors cursor-pointer relative bg-slate-900/50">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    required
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <span className="text-xs font-semibold text-slate-200">
                      {selectedFile ? selectedFile.name : 'Click to select scorecard screenshot'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">PNG, JPG, or WebP (max 5MB)</span>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setUploadModalWinner(null);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md disabled:opacity-50"
                  >
                    {uploading ? 'Uploading to Storage...' : 'Submit for Review'}
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
