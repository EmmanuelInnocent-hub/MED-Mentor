import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Calendar,
  Layers,
  ChevronDown,
  Inbox
} from 'lucide-react';
import { motion } from 'motion/react';
import { SessionResult } from '../types';

export default function History() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('medmentor_sessions') || '[]');
    setSessions(saved);
  }, []);

  const specialties = ['All', ...Array.from(new Set(sessions.map(s => s.specialty)))];

  const filtered = sessions.filter(s => {
    const matchesSpecialty = filter === 'All' || s.specialty === filter;
    const matchesSearch = s.caseTitle.toLowerCase().includes(search.toLowerCase());
    return matchesSpecialty && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Clinical History</h1>
        <p className="text-slate-500 mt-1">Repository of your diagnostic paths and reasoning evaluations.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Filter sessions by case title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-56">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-xs font-bold uppercase tracking-widest text-slate-600 cursor-pointer"
            >
              {specialties.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-x-auto custom-scrollbar">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Patient Case</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Specialty</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Outcome</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Grade</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-left">Simulation Date</th>
                <th className="px-6 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="bg-slate-100/50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6">
                      <Inbox className="w-10 h-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Repository Empty</h3>
                    <p className="text-slate-500 text-sm mt-1">Configure your next simulation to begin tracking.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <motion.tr 
                    key={s.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => navigate(`/results/${s.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer group transition-colors"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-105">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{s.caseTitle}</div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-wide mt-1">ID: {s.id.slice(0,8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-600 font-medium">
                      {s.specialty}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${
                        s.score.overall >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        s.score.overall >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {s.score.overall}%
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {s.score.grade}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-slate-400 font-medium font-mono">
                      {new Date(s.completedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-6 text-right">
                      <button className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        Review
                      </button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
