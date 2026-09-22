import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, actionText, onAction, actionLink }) => {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/30">
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Icon className="w-6 h-6" />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-200 mb-1">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">{description}</p>
      {actionLink && actionText && (
        <a
          href={actionLink}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/20"
        >
          {actionText}
        </a>
      )}
      {onAction && actionText && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-xl transition-all shadow-md shadow-brand-600/20"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
