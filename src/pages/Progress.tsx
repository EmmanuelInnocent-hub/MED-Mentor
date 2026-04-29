import React, { useState } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Award, 
  Target, 
  Brain, 
  Pill, 
  Microscope, 
  Heart,
  ChevronRight,
  ArrowLeft,
  Info,
  AlertCircle,
  Clock,
  Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

const data = [
  { day: 'Mon', score: 65, hours: 2 },
  { day: 'Tue', score: 72, hours: 3.5 },
  { day: 'Wed', score: 68, hours: 2.5 },
  { day: 'Thu', score: 85, hours: 5 },
  { day: 'Fri', score: 78, hours: 4 },
  { day: 'Sat', score: 90, hours: 6 },
  { day: 'Sun', score: 82, hours: 3 },
];

const stats = [
  { label: 'Cases Done', val: '42', delta: '+8 this week', color: 'text-white' },
  { label: 'Avg Score', val: '78%', delta: '↑ 4% vs last week', color: 'text-green-500' },
  { label: 'Day Streak', val: '12', delta: 'Keep it going!', color: 'text-amber-500' },
  { label: 'Global Rank', val: '#14', delta: '↑ 6 places', color: 'text-blue-400' },
];

const specialties = [
  { name: 'Cardiology', score: 91, icon: Heart, color: 'bg-rose-500', cases: 12 },
  { name: 'Respiratory', score: 83, icon: Activity, color: 'bg-blue-400', cases: 8 },
  { name: 'Neurology', score: 54, icon: Brain, color: 'bg-purple-500', cases: 6, weak: true },
  { name: 'Pharmacology', score: 61, icon: Pill, color: 'bg-amber-500', cases: 5, weak: true },
  { name: 'Pathology', score: 72, icon: Microscope, color: 'bg-teal-500', cases: 5 },
];

export default function Progress() {
  const navigate = useNavigate();
  const [activeRange, setActiveRange] = useState('7d');

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="max-w-7xl mx-auto w-full p-6 md:p-12 space-y-10">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-serif text-white mb-2 italic">Performance Analytics</h1>
            <p className="text-sm text-[#5a7090] font-medium tracking-tight">AI-generated weak-spot analysis · Updated after every 15 minutes of study</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex bg-[#111620] p-1 rounded-lg border border-[#243044]">
                {['7d', '30d', 'All'].map(r => (
                  <button 
                    key={r}
                    onClick={() => setActiveRange(r)}
                    className={`px-3 py-1 text-[10px] font-mono font-bold rounded-md transition-all ${
                      activeRange === r ? 'bg-blue-600 text-white' : 'text-[#5a7090] hover:text-white'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
             </div>
             <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
               <span className="text-lg">🔥</span>
               <span className="text-sm font-bold text-amber-500 font-mono">12-DAY STREAK</span>
             </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
           {stats.map((s, i) => (
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="bg-[#111620] border border-[#243044] rounded-2xl p-6 relative overflow-hidden group hover:border-blue-500/30 transition-all"
             >
                <div className="relative z-10">
                   <div className={`text-4xl font-serif mb-2 ${s.color}`}>{s.val}</div>
                   <div className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090] mb-3">{s.label}</div>
                   <div className="text-[11px] font-mono text-green-500/80">{s.delta}</div>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 blur-3xl rounded-full" />
             </motion.div>
           ))}
        </div>

        {/* Main Analytics Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
           {/* Chart */}
           <div className="lg:col-span-2 bg-[#111620] border border-[#243044] rounded-3xl p-8">
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h3 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">Score Progression</h3>
                    <p className="text-[10px] font-mono text-[#5a7090]">Clinical reasoning accuracy over time</p>
                 </div>
                 <div className="flex items-center gap-4 text-[10px] font-mono text-[#5a7090]">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Accuracy (%)</div>
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500" /> Study Hours</div>
                 </div>
              </div>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                       <defs>
                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                       </defs>
                       <XAxis 
                        dataKey="day" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#5a7090', fontSize: 10, fontFamily: 'DM Mono' }} 
                       />
                       <YAxis hide />
                       <Tooltip 
                        contentStyle={{ backgroundColor: '#111620', border: '1px solid #243044', borderRadius: '12px', fontSize: '12px' }}
                        itemStyle={{ color: '#e8edf5' }}
                       />
                       <Area type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
           </div>

           {/* AI Insight Sidebar */}
           <div className="bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 rounded-3xl p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400"><Info className="w-4 h-4" /></div>
                  <h3 className="text-sm font-bold text-blue-400 font-mono uppercase tracking-widest">AI Intelligence</h3>
                </div>
                <p className="text-xs text-[#a8b8cc] leading-relaxed mb-8">
                  Focus on <strong className="text-amber-500 font-bold">Neurology</strong> cases — review the neuro exam order specifically. 
                  You tend to diagnose correctly but fail to prioritize management steps correctly.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 text-xs text-[#a8b8cc]">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono flex items-center justify-center shrink-0">1</div>
                    <span>Prioritize ABCDE in emergency simulations.</span>
                  </div>
                  <div className="flex items-start gap-4 text-xs text-[#a8b8cc]">
                    <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono flex items-center justify-center shrink-0">2</div>
                    <span>Review Pharmacokinetics for elders.</span>
                  </div>
                </div>
              </div>
              <button className="mt-8 w-full py-4 bg-blue-600/10 border border-blue-500/20 rounded-xl text-xs font-mono text-blue-400 font-bold hover:bg-blue-600/20 transition-all">
                GENERATE CUSTOM MOCK EXAM
              </button>
           </div>
        </div>

        {/* Specialty Breakdown */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Specialty Proficiency Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {specialties.map((spec, i) => (
               <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={i} 
                className="bg-[#111620] border border-[#243044] rounded-3xl p-6 group hover:border-blue-500/40 transition-all cursor-pointer overflow-hidden relative"
               >
                  <div className="flex items-center justify-between mb-4 relative z-10">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${spec.color}/15 flex items-center justify-center text-white`}>
                        <spec.icon className="w-5 h-5 opacity-80" />
                      </div>
                      <span className="text-sm font-bold text-white uppercase tracking-tight">{spec.name}</span>
                    </div>
                    <span className="text-2xl font-serif text-white">{spec.score}%</span>
                  </div>
                  <div className="h-1.5 bg-[#243044] rounded-full overflow-hidden mb-4 relative z-10">
                     <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${spec.score}%` }} 
                        className={`h-full ${spec.score > 80 ? 'bg-green-500' : spec.score > 60 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                     />
                  </div>
                  <div className="flex justify-between text-[11px] font-mono text-[#5a7090] relative z-10">
                     <span>{spec.cases} cases</span>
                     <span>Mastery Target: 85%</span>
                  </div>
                  {spec.weak && (
                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 text-[10px] text-amber-500 font-bold uppercase tracking-tight relative z-10">
                      <AlertCircle className="w-3 h-3" /> Training Recommended
                    </div>
                  )}
                  <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full blur-3xl opacity-10 ${spec.color}`} />
               </motion.div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}
