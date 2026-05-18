import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Activity, 
  Clock, 
  Plus, 
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Brain
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SessionResult } from '../types';
import ProgressRing from '../components/ProgressRing';
import RoadmapSection from '../components/RoadmapSection';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    completed: 0,
    avgScore: 0,
    weakArea: 'None',
    streak: 0
  });

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(
          sessionsRef, 
          where('userId', '==', user.uid),
          orderBy('completedAt', 'desc')
        );
        
        let querySnapshot;
        try {
          querySnapshot = await getDocs(q);
        } catch (idxError) {
          const qFallback = query(
            sessionsRef, 
            where('userId', '==', user.uid)
          );
          querySnapshot = await getDocs(qFallback);
        }
        
        const allFetchedSessions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data,
            completedAt: data.completedAt?.toDate?.()?.toISOString() || (typeof data.completedAt === 'string' ? data.completedAt : new Date().toISOString())
          };
        }) as SessionResult[];

        // A session is "completed" for stats if it has a score
        const completedSessions = allFetchedSessions.filter(s => s.score && s.score.overall !== undefined);
        
        setSessions(allFetchedSessions.slice(0, 5)); // Show top 5 recent ones for the summary table
        
        let avg = 0;
        let worstSpecialty = 'None';

        if (completedSessions.length > 0) {
          avg = Math.round(completedSessions.reduce((acc: number, s: SessionResult) => acc + s.score.overall, 0) / completedSessions.length);
          
          const specialtyScores: Record<string, { total: number, count: number }> = {};
          completedSessions.forEach((s: SessionResult) => {
            if (!specialtyScores[s.specialty]) specialtyScores[s.specialty] = { total: 0, count: 0 };
            specialtyScores[s.specialty].total += s.score.overall;
            specialtyScores[s.specialty].count += 1;
          });

          let minAvg = 101;
          Object.entries(specialtyScores).forEach(([key, val]) => {
            const avgScore = val.total / val.count;
            if (avgScore < minAvg) {
              minAvg = avgScore;
              worstSpecialty = key;
            }
          });
        }

        setStats({
          completed: completedSessions.length,
          avgScore: avg,
          weakArea: worstSpecialty,
          streak: profile?.streak || 0
        });
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user, profile]);

  const StatCard = ({ label, value, subtext, delay, valueColor = 'text-slate-900' }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
        <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
      </div>
      <div className="mt-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {subtext}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 shrink-0">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Welcome back, Dr. {profile?.firstName || user?.displayName?.split(' ')[0] || 'Emmanuel'}
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            You have {stats.completed} active sessions in your rotation. Review your performance.
          </p>
        </div>
        <button
          onClick={() => navigate('/case/setup')}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
        >
          <Plus className="w-5 h-5" />
          Start New Clinical Case
        </button>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          label="Cases Completed" 
          value={stats.completed} 
          subtext="↑ 12% vs last month" 
          delay={0.1} 
        />
        <StatCard 
          label="Average Score" 
          value={`${stats.avgScore}%`} 
          subtext="Resident Level" 
          delay={0.2} 
        />
        <StatCard 
          label="Focus Area" 
          value={stats.weakArea === 'None' ? 'N/A' : stats.weakArea} 
          subtext={`${stats.completed > 0 ? "3 cases under 60%" : "Start a case"}`} 
          delay={0.3} 
          valueColor="text-orange-600"
        />
        <StatCard 
          label="Study Streak" 
          value={`${stats.streak} Days`} 
          subtext="Keep the momentum!" 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-50 flex justify-between items-center">
            <h2 className="font-bold text-xl text-slate-800">Recent Case Sessions</h2>
            <button 
              onClick={() => navigate('/history')} 
              className="text-[10px] text-blue-600 font-black hover:underline uppercase tracking-[0.2em]"
            >
              View All
            </button>
          </div>

      <div className="flex-1 overflow-visible">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar p-4">
              <table className="w-full min-w-[600px] border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-3">Case Title</th>
                    <th className="px-4 py-3">Specialty</th>
                    <th className="px-4 py-3 text-center">Score</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-400 text-sm font-medium">No clinical simulations found.</td>
                    </tr>
                  ) : (
                    sessions.map((session) => (
                      <tr key={session.id} className="group hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{session.caseTitle}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {isNaN(new Date(session.completedAt).getTime()) ? "recently" : new Date(session.completedAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500 font-medium tracking-tight">
                          {session.specialty}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-block text-[10px] font-black px-3 py-1.5 rounded-lg border leading-none ${
                            session.score.overall >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                            session.score.overall >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                            'bg-rose-50 text-rose-700 border-rose-100'
                          }`}>
                            {session.score.overall}%
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${
                            session.score.overall >= 80 ? 'text-emerald-500' :
                            session.score.overall >= 60 ? 'text-yellow-600' : 'text-rose-500'
                          }`}>
                            {session.score.overall >= 80 ? 'Passed' : session.score.overall >= 60 ? 'Review Needed' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/results/${session.id}`)}
                            className="text-blue-600 text-[10px] font-black uppercase tracking-widest hover:text-blue-800"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden p-4 space-y-4">
              {sessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-100 rounded-3xl">
                  No clinical simulations found.
                </div>
              ) : (
                sessions.map((session) => (
                  <div 
                    key={session.id} 
                    onClick={() => navigate(`/results/${session.id}`)}
                    className="p-5 bg-white border border-slate-100 rounded-3xl shadow-sm active:scale-[0.98] transition-all flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="max-w-[70%]">
                        <div className="font-bold text-slate-900 leading-tight mb-1">{session.caseTitle}</div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{session.specialty}</div>
                      </div>
                      <div className={`text-sm font-black px-3 py-1.5 rounded-xl border leading-none ${
                        session.score.overall >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        session.score.overall >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                        'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {session.score.overall}%
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-slate-50 pt-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-300" />
                        <span className="text-[10px] font-bold text-slate-400">
                           {isNaN(new Date(session.completedAt).getTime()) ? "recently" : new Date(session.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-black uppercase tracking-[0.1em] text-blue-600">Review Result</span>
                        <ChevronRight className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="bg-[#0f172a] rounded-3xl p-8 text-white flex flex-col shadow-xl shadow-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Brain className="w-24 h-24" />
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Knowledge Gap Alert</span>
          </div>
          
          <h3 className="text-2xl font-bold mb-4 leading-tight">Clinical Management: ACS Protocols</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">
            You've missed ordering an EKG within 10 minutes in 2/3 cardiology cases this week. Review the Acute Coronary Syndrome door-to-data flow.
          </p>
          
          <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-8 group hover:bg-white/10 transition-colors cursor-pointer">
            <div className="text-[10px] font-bold uppercase text-blue-400 tracking-widest mb-1">Case Recommendation</div>
            <div className="font-bold text-base">Unstable Angina vs NSTEMI</div>
            <div className="text-[10px] text-slate-500 mt-1 italic">Curated to improve your weak areas.</div>
          </div>
          
          <button className="mt-auto w-full py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition-all text-sm shadow-xl active:scale-95">
            Refresh Knowledge
          </button>
        </section>
      </div>

      <RoadmapSection />
    </div>
  );
}
