import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  Settings, 
  ChevronLeft, 
  ChevronRight,
  Activity,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: PlusCircle, label: 'Simulation', path: '/case/setup' },
    { icon: History, label: 'History', path: '/history' },
  ];

  return (
    <motion.aside
      initial={false}
      animate={{ width: isExpanded ? 260 : 88 }}
      className="h-screen bg-[#0f172a] text-slate-300 flex flex-col shrink-0 border-r border-slate-800 transition-all duration-500 ease-in-out relative z-50 overflow-hidden"
    >
      <div className="p-6 flex flex-col h-full">
        {/* Branding */}
        <div className="flex items-center gap-4 mb-12">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-600/40 shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-black text-xl tracking-tight text-white flex items-center gap-1.5 whitespace-nowrap"
              >
                MED<span className="text-blue-500">MENTOR</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="space-y-3 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 p-3.5 rounded-2xl transition-all group relative ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20' 
                    : 'hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 border border-transparent'
                }`
              }
            >
              <item.icon className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
              <AnimatePresence>
                {isExpanded && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[13px] tracking-wide whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isExpanded && (
                <div className="absolute left-16 bg-slate-900 border border-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-2 group-hover:translate-x-0 shadow-2xl z-50">
                  {item.label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Profile */}
        <div className="mt-auto pt-8 border-t border-slate-800/50">
          <div className={`p-4 rounded-3xl bg-slate-800/30 border border-slate-700/30 transition-all ${!isExpanded ? 'p-2' : ''}`}>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner ring-2 ring-blue-500/20">
                JD
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="min-w-0"
                  >
                    <p className="font-bold text-white text-sm truncate leading-tight">Dr. John Doe</p>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mt-0.5">Resident PGY-2</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {isExpanded && (
              <div className="mt-5 space-y-2.5">
                <div className="flex justify-between text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase">
                  <span>Knowledge progress</span>
                  <span className="text-blue-500">78%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-slate-800">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '78%' }}
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" 
                  />
                </div>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-6 w-full flex items-center justify-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700/50 active:scale-95 group"
          >
            {isExpanded ? <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
