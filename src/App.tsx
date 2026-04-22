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

export default function App() {
  return (
    <Router>
      <div className="flex h-screen w-full bg-[#f8fafc] font-sans text-slate-900 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
            <div className="max-w-6xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/case/setup" element={<CaseSetup />} />
                <Route path="/case/:id" element={<CaseSession />} />
                <Route path="/results/:id" element={<Results />} />
                <Route path="/history" element={<History />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
}
