/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CaseSetup from './pages/CaseSetup';
import CaseSession from './pages/CaseSession';
import Results from './pages/Results';
import History from './pages/History';
import Profile from './pages/Profile';
import RadiologyAI from './pages/RadiologyAI';
import Neurology from './pages/Neurology';
import Pathology from './pages/Pathology';
import Pharmacology from './pages/Pharmacology';
import Anatomy from './pages/Anatomy';
import Pediatrics from './pages/Pediatrics';
import InteractionChecker from './pages/InteractionChecker';
import Progress from './pages/Progress';
import Leaderboard from './pages/Leaderboard';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Activity } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-bounce">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <div className="text-blue-400 font-black tracking-[0.3em] uppercase text-xs animate-pulse">Initializing Lab</div>
        </div>
      </div>
    );
  }

  // Simple protection wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
  };

  const isModulePage = ['/radiology', '/neurology', '/pathology', '/pharmacology', '/anatomy', '/pediatrics', '/tools/drug-checker', '/tools/progress', '/tools/leaderboard'].includes(location.pathname);

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-900 overflow-hidden flex-col md:flex-row">
            <Sidebar />
            <main className={`flex-1 flex flex-col min-w-0 overflow-hidden ${isModulePage ? '' : 'pb-24'} md:pb-0`}>
              <div className={`flex-1 overflow-y-auto custom-scrollbar ${isModulePage ? 'p-0' : 'px-4 md:px-10'}`}>
                <div className={`w-full h-auto min-h-full ${isModulePage ? 'max-w-none pt-0 pb-0' : 'pt-10 md:pt-16 pb-32 max-w-7xl mx-auto'}`}>
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="case/setup" element={<CaseSetup />} />
                    <Route path="case/:id" element={<CaseSession />} />
                    <Route path="results/:id" element={<Results />} />
                    <Route path="history" element={<History />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="radiology" element={<RadiologyAI />} />
                    <Route path="pharmacology" element={<Pharmacology />} />
                    <Route path="anatomy" element={<Anatomy />} />
                    <Route path="pathology" element={<Pathology />} />
                    <Route path="neurology" element={<Neurology />} />
                    <Route path="pediatrics" element={<Pediatrics />} />
                    <Route path="tools/drug-checker" element={<InteractionChecker />} />
                    <Route path="tools/progress" element={<Progress />} />
                    <Route path="tools/leaderboard" element={<Leaderboard />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </div>
              </div>
            </main>
          </div>
        </ProtectedRoute>
      } />
      
      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
