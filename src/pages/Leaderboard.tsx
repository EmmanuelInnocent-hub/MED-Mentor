import React, { useState } from 'react';
import { 
  Trophy, 
  Crown, 
  TrendingUp, 
  Activity, 
  Award, 
  ArrowLeft,
  ChevronRight,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

const globalRanks = [
  { rank: 1, user: 'Chukwuemeka U.', school: 'UNILAG · Lagos', score: 97, cases: 68, streak: 30, change: 'flat' },
  { rank: 2, user: 'Aisha I.', school: 'UI · Ibadan', score: 94, cases: 54, streak: 21, change: 'up', delta: 2 },
  { rank: 3, user: 'Fatima B.', school: 'ABU · Zaria', score: 92, cases: 61, streak: 18, change: 'down', delta: 1 },
  { rank: 4, user: 'Kofi A.', school: 'KNUST · Ghana', score: 91, cases: 48, streak: 14, change: 'up', delta: 3 },
  { rank: 5, user: 'Maryam O.', school: 'UNIBEN · Benin', score: 89, cases: 52, streak: 9, change: 'flat' },
  { rank: 14, user: 'James M. (You)', school: 'UNILAG · Lagos', score: 78, cases: 42, streak: 12, change: 'up', delta: 6, isYou: true },
];

const schoolRanks = [
  { rank: 1, user: 'Chukwuemeka U.', school: 'UNILAG · Lagos', score: 97, cases: 68, streak: 30, change: 'flat' },
  { rank: 2, user: 'James M. (You)', school: 'UNILAG · Lagos', score: 78, cases: 42, streak: 12, change: 'up', delta: 2, isYou: true },
  { rank: 3, user: 'Sola O.', school: 'UNILAG · Lagos', score: 75, cases: 38, streak: 5, change: 'up', delta: 1 },
  { rank: 4, user: 'Ifeanyi E.', school: 'UNILAG · Lagos', score: 72, cases: 30, streak: 8, change: 'down', delta: 1 },
];

const top3Global = [
  { id: '2', name: 'Aisha I.', school: 'UI Ibadan', score: 94, avatar: 'AI', color: 'silver', pos: 2 },
  { id: '1', name: 'Chukwuemeka U.', school: 'UNILAG Lagos', score: 97, avatar: 'CU', color: 'gold', pos: 1, crown: true },
  { id: '3', name: 'Fatima B.', school: 'ABU Zaria', score: 92, avatar: 'FB', color: 'bronze', pos: 3 },
];

export default function Leaderboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'global' | 'school'>('global');
  const [search, setSearch] = useState('');

  const currentRanks = filter === 'global' ? globalRanks : schoolRanks;
  const filteredRanks = currentRanks.filter(r => 
    r.user.toLowerCase().includes(search.toLowerCase()) || 
    r.school.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Sidebar - Personal Ranks */}
        <div className="hidden xl:flex w-72 flex-col border-r border-[#1e2a3a] bg-[#111620]">
           <div className="p-6 border-b border-[#1e2a3a]">
             <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Global Filter</h3>
             <div className="mt-4 flex bg-[#161d2a] rounded-lg p-1 border border-[#243044]">
               <button 
                onClick={() => setFilter('global')}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-mono transition-all ${
                  filter === 'global' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-[#5a7090] hover:text-white'
                }`}
               >
                Global
               </button>
               <button 
                onClick={() => setFilter('school')}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-mono transition-all ${
                  filter === 'school' ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-[#5a7090] hover:text-white'
                }`}
               >
                School
              </button>
             </div>
             
             <div className="mt-4 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-[#5a7090]" />
                <input 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-lg py-2 pl-8 pr-4 text-[10px] outline-none text-white placeholder-[#2d3d56] focus:border-blue-500/30"
                  placeholder="Find student..."
                />
             </div>
           </div>

           <div className="p-6 m-4 bg-gradient-to-br from-blue-600/20 to-blue-600/5 rounded-2xl border border-blue-500/20 transition-all hover:border-blue-500/40">
              <div className="text-[10px] font-mono uppercase tracking-widest text-blue-400 mb-6">Your position</div>
              <div className="text-5xl font-serif text-white mb-2 leading-none italic">{filter === 'global' ? '#14' : '#2'}</div>
              <div className="text-sm font-bold text-white mb-1">Dr. James Martin</div>
              <div className="text-[11px] font-mono text-[#5a7090]">78% avg · 42 cases · 12🔥</div>
              <div className="mt-4 flex items-center gap-2 text-[10px] font-mono text-green-500 font-bold">
                 <ArrowUp className="w-3 h-3" /> ↑ {filter === 'global' ? '6' : '2'} places this week
              </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Specialty Ranks</h3>
              {[
                { s: 'Cardiology', r: '#4', c: 'text-green-500' },
                { s: 'Pediatrics', r: '#9', c: 'text-green-500' },
                { s: 'Radiology', r: '#28', c: 'text-amber-500' },
                { s: 'Neurology', r: '#118', c: 'text-rose-500' },
              ].map(spec => (
                <div key={spec.s} className="flex items-center justify-between py-2 border-b border-white/5 group cursor-pointer hover:border-white/10 transition-all">
                  <span className="text-xs text-white/50 group-hover:text-white transition-colors">{spec.s}</span>
                  <span className={`text-xs font-mono font-bold ${spec.c}`}>{spec.r}</span>
                </div>
              ))}
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0e14]">
           <div className="px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0">
             <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-blue-500" />
                  <h1 className="text-lg font-serif italic text-white tracking-tight">Leaderboard <span className="text-sm font-sans font-light not-italic opacity-30 ml-2">/ {filter.toUpperCase()}</span></h1>
                </div>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 custom-scrollbar">
              
              {/* Podium */}
              <AnimatePresence mode="wait">
                <motion.div 
                  key={filter}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-end justify-center gap-4 md:gap-12 pt-10"
                >
                   {top3Global.sort((a,b) => a.pos === 1 ? 0 : a.pos === 2 ? -1 : 1).map((hero) => (
                     <div key={hero.id} className={`flex flex-col items-center gap-4 ${hero.pos === 1 ? 'order-2' : hero.pos === 2 ? 'order-1 pb-4' : 'order-3 pb-4'}`}>
                        <div className={`w-14 h-14 md:w-24 md:h-24 rounded-full flex items-center justify-center border-2 bg-[#111620] relative shadow-2xl ${
                          hero.color === 'gold' ? 'border-amber-500 text-amber-500' : hero.color === 'silver' ? 'border-slate-400 text-slate-400' : 'border-amber-900 text-amber-900'
                        }`}>
                           {hero.crown && <span className="absolute -top-6 text-3xl drop-shadow-lg">👑</span>}
                           <span className="text-xl md:text-3xl font-serif">{hero.avatar}</span>
                           <div className="absolute -bottom-2 px-2 py-0.5 rounded bg-black/80 text-[8px] font-mono border border-white/10 uppercase tracking-widest">{hero.color}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-bold text-white whitespace-nowrap">{hero.name}</div>
                          <div className="text-[10px] font-mono text-[#5a7090] mt-0.5">{hero.school}</div>
                        </div>
                        <div className={`text-sm md:text-xl font-serif font-black ${hero.color === 'gold' ? 'text-amber-500' : hero.color === 'silver' ? 'text-slate-400' : 'text-amber-900'}`}>
                          {hero.score}%
                        </div>
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: hero.pos === 1 ? 128 : hero.pos === 2 ? 96 : 64 }}
                          className={`w-full rounded-t-2xl bg-gradient-to-t border-t ${
                            hero.pos === 1 ? 'from-amber-500/5 to-amber-500/20 border-amber-500/20' : 
                            hero.pos === 2 ? 'from-slate-400/5 to-slate-400/15 border-slate-400/20' : 'from-amber-900/5 to-amber-900/15 border-amber-900/20'
                          }`} 
                        />
                     </div>
                   ))}
                </motion.div>
              </AnimatePresence>

              {/* Table */}
              <motion.div 
                layout
                className="bg-[#111620] border border-[#243044] rounded-[2rem] overflow-hidden shadow-2xl"
              >
                 <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#161d2a] border-b border-[#243044]">
                        <th className="p-6 text-center font-mono text-[#5a7090] text-[10px] uppercase tracking-widest">Rank</th>
                        <th className="p-6 font-mono text-[#5a7090] text-[10px] uppercase tracking-widest">Student Practitioner</th>
                        <th className="p-6 text-center font-mono text-[#5a7090] text-[10px] uppercase tracking-widest">Mastery</th>
                        <th className="p-6 text-center font-mono text-[#5a7090] text-[10px] uppercase tracking-widest">Cases</th>
                        <th className="p-6 text-center font-mono text-[#5a7090] text-[10px] uppercase tracking-widest">Streak</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      <AnimatePresence mode="popLayout">
                        {filteredRanks.map((row) => (
                          <motion.tr 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            key={`${filter}-${row.rank}-${row.user}`} 
                            className={`group hover:bg-white/5 transition-colors ${row.isYou ? 'bg-blue-600/5' : ''}`}
                          >
                            <td className={`p-6 text-center font-serif text-3xl ${
                              row.rank === 1 ? 'text-amber-500' : row.rank === 2 ? 'text-slate-400' : row.rank === 3 ? 'text-amber-900' : 'text-[#5a7090]'
                            }`}>
                              {row.rank}
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-serif transition-colors ${
                                  row.isYou ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_20px_rgba(37,99,235,0.2)]' : 'bg-[#1c2537] text-[#a8b8cc] border border-white/5 group-hover:border-white/10'
                                }`}>
                                  {row.user.slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <div className={`text-sm font-bold tracking-tight ${row.isYou ? 'text-blue-400' : 'text-white'}`}>{row.user}</div>
                                  <div className="text-[10px] font-mono text-[#5a7090] uppercase">{row.school}</div>
                                </div>
                              </div>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-base font-mono font-bold text-green-500">{row.score}%</span>
                            </td>
                            <td className="p-6 text-center text-xs font-mono text-[#5a7090] font-bold tracking-tighter">{row.cases} CLI. CASES</td>
                            <td className="p-6 text-center">
                               <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/5 text-xs font-mono text-amber-500 font-bold border border-amber-500/10">
                                 <Flame className="w-3.5 h-3.5" /> {row.streak}
                               </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                 </table>
              </motion.div>
           </div>
        </div>

        {/* Right Panel - Badges & Challenges */}
        <div className="hidden 2xl:flex w-[380px] flex-col bg-[#111620] border-l border-[#1e2a3a] p-10 space-y-12 custom-scrollbar overflow-y-auto">
           <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Weekly Challenges</h3>
                <span className="text-[8px] font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">REFRESHES IN 2D</span>
             </div>
             <div className="space-y-4">
               {[
                 { t: 'Neuro Sprint', d: 'Complete 3 more Neuro cases with 70%+', p: 40, c: 'bg-purple-500' },
                 { t: 'Pharma Master', d: 'Score 80%+ on any 3 drug quizzes', p: 33, c: 'bg-amber-500' },
                 { t: 'Grit Award', d: 'Study for 7 consecutive days', p: 85, c: 'bg-teal-500' },
               ].map(ch => (
                 <div key={ch.t} className="bg-[#161d2a] border border-[#243044] rounded-3xl p-6 group hover:border-blue-500/20 transition-all">
                    <div className="flex justify-between items-start mb-3">
                       <div className="text-xs font-bold text-white group-hover:text-amber-500 transition-colors uppercase font-mono tracking-tighter">{ch.t}</div>
                       <div className="text-[9px] font-mono text-green-500 flex items-center gap-1 font-bold">+500 PX</div>
                    </div>
                    <p className="text-[11px] text-[#5a7090] leading-relaxed mb-5 font-medium">{ch.d}</p>
                    <div className="h-1.5 bg-[#1c2537] rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${ch.p}%` }}
                        className={`h-full ${ch.c}`} 
                       />
                    </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="space-y-6">
             <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Badges Earned</h3>
             <div className="grid grid-cols-3 gap-3">
               {[
                 { e: '❤️', l: 'Cardiology' },
                 { e: '🔥', l: 'Streak' },
                 { e: '👶', l: 'Pediatrics' },
                 { e: '🩻', l: 'Radiology' },
                 { e: '⚡', l: 'Precision' },
                 { e: '🌟', l: 'Top 100' }
               ].map((badge, i) => (
                 <div key={i} className="aspect-square bg-[#161d2a] border border-[#243044] rounded-3xl flex flex-col items-center justify-center gap-1 grayscale hover:grayscale-0 transition-all cursor-help hover:border-amber-500/30 group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">{badge.e}</span>
                    <span className="text-[7px] font-mono text-[#5a7090] font-bold uppercase">{badge.l}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
