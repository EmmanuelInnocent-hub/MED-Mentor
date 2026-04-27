import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Settings, 
  Mail, 
  School, 
  GraduationCap, 
  Activity, 
  Clock, 
  Users, 
  Calendar,
  Check,
  ChevronRight,
  Loader2,
  LogOut
} from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SessionResult } from '../types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({
    casesDone: 0,
    avgScore: 0,
    streak: 12, // Mocked for streak aesthetic
    rank: 14
  });
  const [performance, setPerformance] = useState({
    bestSpecialty: 'Cardiology',
    bestScore: 91,
    worstSpecialty: 'Neurology',
    worstScore: 54
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedSessions = querySnapshot.docs.map(doc => doc.data()) as SessionResult[];
        
        if (fetchedSessions.length > 0) {
          const avg = Math.round(fetchedSessions.reduce((acc, s) => acc + s.score.overall, 0) / fetchedSessions.length);
          
          const specialtyTotals: Record<string, { total: number, count: number }> = {};
          fetchedSessions.forEach(s => {
            if (!specialtyTotals[s.specialty]) specialtyTotals[s.specialty] = { total: 0, count: 0 };
            specialtyTotals[s.specialty].total += s.score.overall;
            specialtyTotals[s.specialty].count += 1;
          });

          let best = { name: 'Not set', score: 0 };
          let worst = { name: 'Not set', score: 100 };

          Object.entries(specialtyTotals).forEach(([name, data]) => {
            const score = Math.round(data.total / data.count);
            if (score > best.score) best = { name, score };
            if (score < worst.score) worst = { name, score };
          });

          setStats(prev => ({
            ...prev,
            casesDone: fetchedSessions.length,
            avgScore: avg
          }));

          setPerformance({
            bestSpecialty: best.name,
            bestScore: best.score,
            worstSpecialty: worst.name,
            worstScore: worst.score
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const joinDate = profile?.createdAt?.toDate?.() || new Date();
  const joinMonthYear = joinDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl"
      >
        {/* Hero Section */}
        <div className="bg-slate-900 p-6 sm:p-8 md:p-12 relative overflow-hidden">
          {/* Abstract Decorations */}
          <div className="absolute top-[-40px] right-[-20px] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
          <div className="absolute bottom-[-40px] left-[-30px] w-64 h-64 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* Mobile Top Actions (Hidden on Tablet and Laptop) */}
          <div className="md:hidden flex items-center justify-between relative z-20 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="p-2.5 bg-white/5 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-all active:scale-95 shadow-lg">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-center gap-5 md:gap-6 text-center sm:text-left">
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full border-4 border-white/5 p-1 bg-white/5">
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-display font-black text-white relative shadow-2xl">
                    {profile?.firstName?.slice(0, 2).toUpperCase() || 'DR'}
                    <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-0.5 md:space-y-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white leading-tight">
                  Dr. {profile?.firstName || 'User'}
                </h2>
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-3 gap-y-1">
                  <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-[0.15em] uppercase">
                    {profile?.rank || 'Resident'}
                  </p>
                  <span className="hidden sm:inline text-slate-700 font-bold">•</span>
                  <p className="text-[10px] md:text-xs text-slate-500 font-mono tracking-[0.15em] uppercase">
                    {profile?.institution || 'Global Clinic'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end justify-center gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 w-full sm:w-auto">
                Modify Registry
              </button>
            </div>
          </div>

          <div className="mt-8 md:mt-12 grid grid-cols-2 md:grid-cols-4 bg-white/5 rounded-2xl md:rounded-[2rem] overflow-hidden backdrop-blur-md border border-white/10 shadow-inner relative z-10">
            <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center border-r border-b md:border-b-0 border-white/5">
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white">{stats.casesDone}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase font-black tracking-widest text-slate-500 mt-0.5 sm:mt-1">Cases Done</span>
            </div>
            <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center border-b md:border-r md:border-b-0 border-white/5">
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white">{stats.avgScore}%</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase font-black tracking-widest text-slate-500 mt-0.5 sm:mt-1">Avg Score</span>
            </div>
            <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center border-r border-white/5">
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white">{stats.streak}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase font-black tracking-widest text-slate-500 mt-0.5 sm:mt-1">Streak</span>
            </div>
            <div className="p-4 sm:p-6 md:p-8 flex flex-col items-center">
              <span className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white">#{stats.rank}</span>
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-mono uppercase font-black tracking-widest text-slate-500 mt-0.5 sm:mt-1">Rank</span>
            </div>
          </div>
        </div>

        {/* Curved Transition */}
        <div className="h-8 md:h-10 bg-white rounded-t-[2.5rem] md:rounded-t-[3rem] -mt-8 md:-mt-10 relative z-20" />

        {/* Info Rows in Grid */}
        <div className="px-5 sm:px-8 md:px-12 pb-10 md:pb-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 md:gap-y-10">
          <section className="space-y-6">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-slate-400 pb-2 border-b border-slate-100 flex items-center gap-2">
              <School className="w-3 h-3" />
              Academic Registry
            </h3>
            <div className="space-y-1">
              <ProfileRow 
                icon={<Mail className="w-4 h-4 text-blue-500" />} 
                label="Verified Email" 
                value={user?.email || 'N/A'} 
                isLink 
              />
              <ProfileRow 
                icon={<School className="w-4 h-4 text-indigo-500" />} 
                label="Home Institution" 
                value={profile?.institution || 'University Teaching Hospital'} 
              />
              <ProfileRow 
                icon={<GraduationCap className="w-4 h-4 text-slate-600" />} 
                label="Year of Training" 
                value={profile?.yearOfStudy || '3rd Year MBBS'} 
              />
              <ProfileRow 
                icon={<Calendar className="w-4 h-4 text-slate-500" />} 
                label="Registry Date" 
                value={joinMonthYear} 
              />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-slate-400 pb-2 border-b border-slate-100 flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Performance Matrix
            </h3>
            <div className="space-y-1">
              <ProfileRow 
                icon={<Activity className="w-4 h-4 text-emerald-500" />} 
                label="Primary Specialty" 
                value={
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-700">{performance.bestSpecialty} · {performance.bestScore}%</span>
                  </div>
                } 
              />
              <ProfileRow 
                icon={<Clock className="w-4 h-4 text-amber-500" />} 
                label="Improvement Required" 
                value={
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-slate-700">{performance.worstSpecialty} · {performance.worstScore}%</span>
                  </div>
                } 
              />
              <ProfileRow 
                icon={<Users className="w-4 h-4 text-blue-500" />} 
                label="Competitive Tier" 
                value={
                  <div className="flex items-center gap-2 text-slate-700">
                    <span>Rank #{stats.rank}</span>
                    <span className="bg-blue-50 text-blue-600 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border border-blue-100">
                      Elite 1%
                    </span>
                  </div>
                } 
              />
              <button 
                onClick={signOut}
                className="w-full flex items-center justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all group mt-2"
              >
                <LogOut className="w-4 h-4 mr-2 opacity-50 group-hover:opacity-100" />
                End Clinical Shift
              </button>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileRow({ icon, label, value, isLink }: any) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-slate-50 last:border-0 group cursor-pointer">
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 group-hover:bg-blue-50 group-hover:border-blue-100 transition-all">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
        <div className={`text-xs font-bold truncate ${isLink ? 'text-blue-600' : 'text-slate-600'}`}>
          {value}
        </div>
      </div>
      <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
    </div>
  );
}
