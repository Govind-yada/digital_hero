import React from 'react';

export const NumberBall = ({ number, matched = false, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-14 h-14 text-lg font-bold',
    xl: 'w-16 h-16 text-2xl font-black',
  }[size] || 'w-10 h-10 text-sm';

  const variantClasses = matched
    ? 'bg-gradient-to-tr from-amber-500 to-amber-300 text-dark-950 shadow-lg shadow-amber-500/30 ring-2 ring-amber-300 ring-offset-2 ring-offset-dark-950 scale-105'
    : 'bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 text-slate-200 shadow-sm';

  return (
    <div
      className={`rounded-full flex items-center justify-center transition-all duration-300 select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      <span>{number}</span>
    </div>
  );
};
