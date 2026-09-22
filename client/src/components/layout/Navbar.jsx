import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Trophy, Heart, Shield, LogOut, Menu, X, User, Layers, Sparkles } from 'lucide-react';

export const Navbar = () => {
  const { user, subscription, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-950/80 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-impact-500 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                digital<span className="text-brand-400">HEROES</span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium -mt-1">
                Impact Golf Platform
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'text-white bg-slate-800/60' : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Overview
            </Link>
            <Link
              to="/how-it-works"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/how-it-works')
                  ? 'text-white bg-slate-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Draw Mechanics
            </Link>
            <Link
              to="/charities"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/charities')
                  ? 'text-white bg-slate-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Charity Directory
            </Link>
            <Link
              to="/pricing"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/pricing')
                  ? 'text-white bg-slate-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
              }`}
            >
              Membership Plans
            </Link>
          </nav>

          {/* User / Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/20 transition-all"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    Admin Panel
                  </Link>
                )}

                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/50 text-sm font-medium text-slate-200 transition-colors"
                >
                  <User className="w-4 h-4 text-brand-400" />
                  <span>{user.name.split(' ')[0]}</span>
                  {subscription?.status === 'ACTIVE' && (
                    <span className="w-2 h-2 rounded-full bg-brand-400 ring-4 ring-brand-400/20 animate-pulse" />
                  )}
                </Link>

                <button
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 rounded-xl shadow-md shadow-brand-600/20 transition-all hover:scale-[1.02]"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-dark-950/95 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Overview
          </Link>
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Draw Mechanics
          </Link>
          <Link
            to="/charities"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Charity Directory
          </Link>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
          >
            Membership Plans
          </Link>

          {user ? (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-brand-400 hover:bg-slate-800"
              >
                My Dashboard
              </Link>
              {user.role === 'ADMIN' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-medium text-amber-400 hover:bg-slate-800"
                >
                  Admin Control Panel
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-slate-800"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-3 py-2 rounded-xl text-base font-medium text-white bg-brand-600 hover:bg-brand-500"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
