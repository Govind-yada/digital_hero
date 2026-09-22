import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Navbar } from './components/layout/Navbar.jsx';
import { Footer } from './components/layout/Footer.jsx';
import { ProtectedRoute, AdminRoute } from './components/common/ProtectedRoute.jsx';

// Public Pages
import { HomePage } from './pages/public/HomePage.jsx';
import { HowItWorksPage } from './pages/public/HowItWorksPage.jsx';
import { CharitiesPage } from './pages/public/CharitiesPage.jsx';
import { PricingPage } from './pages/public/PricingPage.jsx';
import { LoginPage } from './pages/public/LoginPage.jsx';
import { RegisterPage } from './pages/public/RegisterPage.jsx';

// User Dashboard Pages
import { DashboardPage } from './pages/user/DashboardPage.jsx';
import { ScoresPage } from './pages/user/ScoresPage.jsx';
import { DrawsPage } from './pages/user/DrawsPage.jsx';
import { WinningsPage } from './pages/user/WinningsPage.jsx';
import { CharitySettingsPage } from './pages/user/CharitySettingsPage.jsx';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-dark-950 text-slate-100 selection:bg-brand-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/how-it-works" element={<HowItWorksPage />} />
              <Route path="/charities" element={<CharitiesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Authenticated User Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/scores" element={<ScoresPage />} />
                <Route path="/draws" element={<DrawsPage />} />
                <Route path="/winnings" element={<WinningsPage />} />
                <Route path="/charity-settings" element={<CharitySettingsPage />} />
              </Route>

              {/* Protected Admin Routes */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboardPage />} />
              </Route>

              {/* Catch-all fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
