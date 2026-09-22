import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export const AdminRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const SubscriptionGuard = ({ children }) => {
  const { isSubscribed, loading } = useAuth();

  if (loading) return null;

  if (!isSubscribed) {
    return (
      <div className="p-8 border border-amber-500/30 bg-amber-950/20 rounded-2xl text-center my-6">
        <h3 className="text-xl font-bold text-amber-300 mb-2">Active Subscription Required</h3>
        <p className="text-slate-300 max-w-md mx-auto mb-6 text-sm">
          You need an active monthly or yearly membership to record scores and participate in the monthly prize draws.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-brand-500/20"
        >
          Activate Membership
        </a>
      </div>
    );
  }

  return children;
};
