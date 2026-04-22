/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import CaseSetup from './pages/CaseSetup';
import CaseSession from './pages/CaseSession';
import Results from './pages/Results';
import History from './pages/History';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Activity } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();

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

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-900 overflow-hidden flex-col md:flex-row">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden pb-24 md:pb-0">
              <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                  <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="case/setup" element={<CaseSetup />} />
                    <Route path="case/:id" element={<CaseSession />} />
                    <Route path="results/:id" element={<Results />} />
                    <Route path="history" element={<History />} />
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
