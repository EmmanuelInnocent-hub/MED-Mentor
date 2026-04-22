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
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SessionResult } from '../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sessions, setSessions] = useState<SessionResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
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
          orderBy('completedAt', 'desc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const fetchedSessions = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as SessionResult[];
        
        setSessions(fetchedSessions);

        if (fetchedSessions.length > 0) {
          const avg = Math.round(fetchedSessions.reduce((acc: number, s: SessionResult) => acc + s.score.overall, 0) / fetchedSessions.length);
          
          const specialtyScores: Record<string, { total: number, count: number }> = {};
          fetchedSessions.forEach((s: SessionResult) => {
            if (!specialtyScores[s.specialty]) specialtyScores[s.specialty] = { total: 0, count: 0 };
            specialtyScores[s.specialty].total += s.score.overall;
            specialtyScores[s.specialty].count += 1;
          });

          let worstSpecialty = 'None';
          let minAvg = 101;
          Object.entries(specialtyScores).forEach(([key, val]) => {
            const avg = val.total / val.count;
            if (avg < minAvg) {
              minAvg = avg;
              worstSpecialty = key;
            }
          });

          setStats({
            completed: fetchedSessions.length,
            avgScore: avg,
            weakArea: worstSpecialty,
            streak: 5 // Defaulting to 5 for now
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const StatCard = ({ label, value, subtext, delay, valueColor = 'text-slate-900' }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
    >
      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</div>
        <div className={`text-3xl font-bold ${valueColor}`}>{value.length > 15 ? value.slice(0, 12) + '...' : value}</div>
      </div>
      <div className="mt-2 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
        {subtext}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 shrink-0">
        <div className="space-y-1 text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, Dr. {profile?.firstName || 'Emmanuel'}
          </h1>
          <p className="text-slate-500 text-sm">
            You have {stats.completed} active sessions in your rotation. Review your performance.
          </p>
        </div>
        <button
          onClick={() => navigate('/case/setup')}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
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
          value={stats.weakArea} 
          subtext="3 cases under 60%" 
          delay={0.3} 
          valueColor="text-orange-500"
        />
        <StatCard 
          label="Study Streak" 
          value={`${stats.streak} Days`} 
          subtext="Keep the momentum!" 
          delay={0.4} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
            <h2 className="font-bold text-base md:text-lg">Recent Case Sessions</h2>
            <button onClick={() => navigate('/history')} className="text-xs md:text-sm text-blue-600 font-bold hover:underline uppercase tracking-widest">View All</button>
          </div>

          <div className="flex-1 overflow-x-auto p-0 md:p-4 custom-scrollbar">
            <table className="w-full min-w-[600px] md:min-w-0 border-collapse">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  <th className="p-4">Case Title</th>
                  <th className="p-4">Specialty</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 text-sm">No cases completed yet</td>
                  </tr>
                ) : (
                  sessions.slice(0, 5).map((session) => (
                    <tr key={session.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-4">
                        <div className="font-semibold text-slate-800">{session.caseTitle}</div>
                        <div className="text-[10px] text-slate-400 lowercase">{new Date(session.completedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {session.specialty}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                          session.score.overall >= 80 ? 'bg-green-50 text-green-700 border-green-100' :
                          session.score.overall >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {session.score.overall}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {session.score.overall >= 80 ? 'Pass' : session.score.overall >= 60 ? 'Review Needed' : 'Failed'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => navigate(`/results/${session.id}`)}
                          className="text-blue-600 text-[10px] font-bold uppercase tracking-widest hover:underline"
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
        </section>

        <section className="bg-[#0f172a] rounded-3xl p-6 text-white flex flex-col shadow-xl shadow-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Knowledge Gap Alert</span>
          </div>
          <h3 className="text-xl font-bold mb-3 leading-snug">Clinical Management: ACS Protocols</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            You've missed ordering an EKG within 10 minutes in 2/3 cardiology cases this week. Review the Acute Coronary Syndrome door-to-data flow.
          </p>
          
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl mb-6">
            <div className="text-[10px] font-bold uppercase text-blue-400 mb-1">Case Recommendation</div>
            <div className="font-semibold text-sm">Unstable Angina vs NSTEMI</div>
            <div className="text-[10px] text-slate-500 mt-1 italic">Curated to improve your weak areas.</div>
          </div>
          
          <button className="mt-auto w-full py-4 bg-slate-100 text-slate-900 font-bold rounded-2xl hover:bg-white transition-colors text-sm">
            Refresh Knowledge
          </button>
        </section>
      </div>
    </div>
  );
}
