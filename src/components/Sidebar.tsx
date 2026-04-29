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
  LogOut,
  User,
  ScanSearch,
  FlaskConical,
  Binary,
  Microscope,
  Brain,
  Baby,
  BriefcaseMedical,
  Target,
  Trophy,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navSections = [
    {
      title: 'Core',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: PlusCircle, label: 'Simulation', path: '/case/setup' },
        { icon: History, label: 'History', path: '/history' },
        { icon: User, label: 'Profile', path: '/profile' },
      ]
    },
    {
      title: 'AI Branches',
      items: [
        { icon: ScanSearch, label: 'Radiology AI', path: '/radiology', badge: 'AI', badgeType: 'ai' },
        { icon: FlaskConical, label: 'Pharmacology', path: '/pharmacology', badge: 'New', badgeType: 'new' },
        { icon: Binary, label: 'Anatomy 3D', path: '/anatomy', badge: 'AI', badgeType: 'ai' },
        { icon: Microscope, label: 'Pathology', path: '/pathology' },
        { icon: Brain, label: 'Neurology', path: '/neurology', badge: 'Hot', badgeType: 'hot' },
        { icon: Baby, label: 'Pediatrics', path: '/pediatrics' },
      ]
    },
    {
      title: 'Tools',
      items: [
        { icon: BriefcaseMedical, label: 'Drug Checker', path: '/tools/drug-checker', badge: 'New', badgeType: 'new' },
        { icon: Target, label: 'Progress', path: '/tools/progress' },
        { icon: Trophy, label: 'Leaderboard', path: '/tools/leaderboard' },
      ]
    }
  ];

  const badgeStyles: Record<string, string> = {
    new: 'bg-blue-500/10 text-blue-400',
    ai: 'bg-purple-500/10 text-purple-400',
    hot: 'bg-rose-500/10 text-rose-400'
  };

  return (
    <>
      {/* Mobile Top Header (Toggle for Drawer) */}
      {!location.pathname.startsWith('/case/') && (
        <div className="md:hidden sticky top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="font-black text-sm tracking-tight text-slate-900">
              MED<span className="text-blue-500">MENTOR</span>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(true)}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[120] md:hidden shadow-2xl flex flex-col overflow-hidden rounded-r-[2.5rem]"
            >
              {/* Drawer Header (Blue Profile Section) */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 pb-10 relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-1">
                    <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center text-blue-600 font-display font-black text-xl shadow-lg">
                      {profile?.firstName?.slice(0, 2).toUpperCase() || 'Dr'}
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsMobileOpen(false)}
                    className="p-2 bg-white/10 rounded-xl border border-white/20 text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="relative z-10">
                  <h2 className="text-white font-display font-black text-lg tracking-tight">
                    Dr. {profile?.firstName || 'User'}
                  </h2>
                  <p className="text-blue-100/70 text-[10px] font-mono uppercase tracking-[0.2em] font-black mt-0.5">
                    {profile?.rank || 'Resident Specialist'}
                  </p>
                </div>
              </div>

              {/* Drawer Navigation List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                {navSections.map((section) => (
                  <div key={section.title} className="space-y-3">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 px-3">
                      {section.title}
                    </h3>
                    <nav className="space-y-1">
                      {section.items.map((item) => (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setIsMobileOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
                              isActive 
                                ? 'bg-blue-50 text-blue-600 font-bold border border-blue-100 shadow-sm' 
                                : 'text-slate-500 hover:bg-slate-50 active:scale-95'
                            }`
                          }
                        >
                          <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="text-sm font-bold tracking-tight flex-1">{item.label}</span>
                          {item.badge && (
                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${badgeStyles[item.badgeType || 'new']}`}>
                              {item.badge}
                            </span>
                          )}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                ))}
              </div>

              {/* Sign Out Action */}
              <div className="p-6 border-t border-slate-50 bg-slate-50/50">
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsMobileOpen(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-slate-200 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500 transition-all active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  Terminate Session
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isExpanded ? 260 : 88 }}
        className="hidden md:flex h-screen bg-[#0f172a] text-slate-300 flex-col shrink-0 border-r border-slate-800 transition-all duration-500 ease-in-out relative z-50 overflow-hidden"
      >
        <div className="p-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
          {/* Branding */}
          <div className="flex items-center gap-4 mb-10 px-2 mt-2">
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
                  MED<span className="text-blue-500 font-bold">MENTOR</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Sections */}
          <div className="space-y-8 flex-1">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-2">
                {isExpanded && (
                  <h3 className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 pb-1">
                    {section.title}
                  </h3>
                )}
                <nav className="space-y-1">
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-4 p-3 rounded-xl transition-all group relative ${
                          isActive 
                            ? 'bg-blue-600/10 text-blue-400 font-bold border border-blue-500/20' 
                            : 'hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 border border-transparent'
                        }`
                      }
                    >
                      <item.icon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="flex items-center justify-between flex-1 min-w-0"
                          >
                            <span className="text-xs tracking-wide truncate">{item.label}</span>
                            {item.badge && (
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${badgeStyles[item.badgeType || 'new']}`}>
                                {item.badge}
                              </span>
                            )}
                          </motion.div>
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
              </div>
            ))}
          </div>

          {/* Footer / Profile */}
          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <NavLink 
              to="/profile"
              className={`p-4 rounded-3xl bg-slate-800/30 border border-slate-700/30 transition-all block hover:bg-slate-800/50 ${!isExpanded ? 'p-2' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shrink-0 shadow-inner ring-2 ring-blue-500/20">
                  {profile?.firstName?.slice(0, 2).toUpperCase() || 'Dr'}
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="min-w-0 flex-1"
                    >
                      <p className="font-bold text-white text-sm truncate leading-tight">Dr. {profile?.firstName || 'User'}</p>
                      <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.15em] mt-0.5">{profile?.rank || 'Resident'}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {isExpanded && (
                  <div className="p-2 text-slate-500 hover:text-blue-400 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </div>
              {isExpanded && (
                <div className="mt-5 space-y-2.5">
                  <div className="flex justify-between text-[9px] font-black tracking-[0.2em] text-slate-500 uppercase">
                    <span>Knowledge progress</span>
                    <span className="text-blue-500">{profile?.knowledgeProgress || 0}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${profile?.knowledgeProgress || 0}%` }}
                      className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full" 
                    />
                  </div>
                </div>
              )}
            </NavLink>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6 w-full flex items-center justify-center p-3 rounded-2xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700/50 active:scale-95 group"
            >
              {isExpanded ? <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> : <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </div>
        </div>
      </motion.aside>

      {/* Mobile Navigation Bar */}
      {!location.pathname.startsWith('/case/') && !['/radiology', '/neurology', '/pathology', '/pharmacology', '/anatomy', '/pediatrics', '/tools/drug-checker', '/tools/progress', '/tools/leaderboard'].includes(location.pathname) && (
        <div className="md:hidden fixed bottom-6 left-6 right-6 z-[100]">
          <nav className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-4 flex justify-around items-center shadow-2xl shadow-blue-900/20">
            {navSections[0].items.filter(item => item.path !== '/profile').map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex flex-col items-center gap-1.5 transition-all px-4 py-2 rounded-2xl ${
                    isActive 
                      ? 'text-blue-400 bg-blue-500/10' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`
                }
              >
                <item.icon className="w-6 h-6" />
                {location.pathname === item.path && (
                  <motion.div layoutId="mobile-nav-pill" className="w-1 h-1 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                )}
              </NavLink>
            ))}
            <NavLink 
              to="/profile"
              className={`w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-black text-[10px] shadow-lg border-2 ${
                location.pathname === '/profile' ? 'border-blue-400' : 'border-white/10'
              }`}
            >
              {profile?.firstName?.slice(0, 2).toUpperCase() || 'Dr'}
            </NavLink>
          </nav>
        </div>
      )}
    </>
  );
}
