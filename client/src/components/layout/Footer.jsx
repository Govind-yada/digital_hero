import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShieldCheck, Award } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-dark-950 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-impact-500 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-bold text-white tracking-tight text-base">
                digital<span className="text-brand-400">HEROES</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Transforming athletic Stableford rounds into community charity impact and monthly reward pools.
              Leading with impact, powered by technology.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/how-it-works" className="hover:text-white transition-colors">
                  Draw & Pool Mechanics
                </Link>
              </li>
              <li>
                <Link to="/charities" className="hover:text-white transition-colors">
                  Charity Directory
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-white transition-colors">
                  Subscription Plans
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Integrity</h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
                <span>Audited Draw Engine</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                <span>Min 10% Guaranteed Giving</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Strict Winner Verification</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-4">Evaluation Mode</h4>
            <p className="text-xs text-slate-400 mb-2">
              Sample assignment edition 2026. Built with full-stack React, Node, and PostgreSQL.
            </p>
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300">
              Admin: admin@digitalheroes.co.in<br/>
              Pass: AdminPass123!
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Digital Heroes. All rights reserved.</p>
          <div className="flex gap-6">
            <span>PCI DSS Stripe Compliant</span>
            <span>Independent Charity Settlement</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
