import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'brand' }) => {
  const colorStyles = {
    brand: 'from-brand-500/10 to-transparent border-brand-500/20 text-brand-400',
    impact: 'from-impact-500/10 to-transparent border-impact-500/20 text-impact-400',
    amber: 'from-amber-500/10 to-transparent border-amber-500/20 text-amber-400',
    rose: 'from-rose-500/10 to-transparent border-rose-500/20 text-rose-400',
  }[color] || 'from-brand-500/10 to-transparent border-brand-500/20 text-brand-400';

  return (
    <div className={`p-5 rounded-2xl border bg-gradient-to-b ${colorStyles} bg-dark-900/60 backdrop-blur-sm relative overflow-hidden`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold tracking-tight text-white mb-1">{value}</div>
      {subtitle && <div className="text-xs text-slate-400">{subtitle}</div>}
      {trend && (
        <div className="text-[11px] font-medium text-brand-400 mt-2 flex items-center gap-1">
          {trend}
        </div>
      )}
    </div>
  );
};
