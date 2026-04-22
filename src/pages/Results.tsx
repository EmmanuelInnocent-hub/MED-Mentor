import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCcw, 
  ChevronLeft,
  Share2,
  FileText,
  Star,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import ReactMarkdown from 'react-markdown';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import ProgressRing from '../components/ProgressRing';
import { SessionResult } from '../types';

export default function Results() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      if (!id || !user) return;
      try {
        const docRef = doc(db, 'sessions', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.userId !== user.uid) {
            navigate('/');
            return;
          }
          setResult({
            id: docSnap.id,
            ...data,
            completedAt: data.completedAt?.toDate?.()?.toISOString() || new Date().toISOString()
          } as SessionResult);
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error fetching result:", error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchResult();
  }, [id, user]);

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Assembling Evaluative Data</p>
      </div>
    );
  }

  if (!result) return null;

  const radarData = [
    { subject: 'Diagnostic Accuracy', A: result.score.dimensions.diagnosticAccuracy, fullMark: 100 },
    { subject: 'Reasoning Process', A: result.score.dimensions.reasoningProcess, fullMark: 100 },
    { subject: 'Key Step Coverage', A: result.score.dimensions.keyStepCoverage, fullMark: 100 },
    { subject: 'Safety Awareness', A: result.score.dimensions.safetyAwareness, fullMark: 100 },
  ];

  const gradeColors: Record<string, string> = {
    'A+': 'text-emerald-600 bg-emerald-100',
    'A': 'text-emerald-600 bg-emerald-100',
    'B+': 'text-blue-600 bg-blue-100',
    'B': 'text-blue-600 bg-blue-100',
    'C+': 'text-amber-600 bg-amber-100',
    'C': 'text-amber-600 bg-amber-100',
    'D': 'text-rose-600 bg-rose-100',
    'F': 'text-rose-600 bg-rose-100',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors mb-2"
          >
            <ChevronLeft className="w-3 h-3" />
            Control Center
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Performance Analytics</h1>
        </div>
        <div className="flex gap-3">
          <button className="p-4 bg-white border border-slate-200 rounded-[1.25rem] text-slate-500 hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={() => navigate('/case/setup')}
            className="flex items-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95"
          >
            <RefreshCcw className="w-4 h-4" />
            Initiate New Simulation
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Stats Side */}
        <div className="lg:col-span-4 space-y-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 px-6 py-6 rounded-bl-[2rem] font-black text-2xl ${gradeColors[result.score.grade]?.split(' ')[0] || 'text-blue-600'}`}>
              {result.score.grade}
            </div>
            
            <div className="mb-8 relative">
              <ProgressRing score={result.score.overall} size={180} strokeWidth={14} color={result.score.overall >= 80 ? 'text-emerald-500' : 'text-blue-600'} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-slate-900">{result.score.overall}%</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Total Score</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.1em] mb-1">Challenge</p>
                <p className="font-bold text-slate-800 text-sm">{result.specialty}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[9px] uppercase font-black text-slate-400 tracking-[0.1em] mb-1">Status</p>
                <p className="font-bold text-emerald-600 text-sm uppercase">Complete</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
          >
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 text-center">
              Clinical Dimension Matrix
            </h3>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} />
                  <Radar
                    name="Performance"
                    dataKey="A"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill="#3b82f6"
                    fillOpacity={0.15}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-8 space-y-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-blue-600/20 p-3 rounded-2xl backdrop-blur-sm border border-blue-500/20">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Clinical Assessment</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Socratic Feedback Logic</p>
                </div>
              </div>
              <div className="markdown-body prose prose-invert prose-blue max-w-none prose-sm lg:prose-base !text-slate-300">
                <ReactMarkdown>{result.score.feedback}</ReactMarkdown>
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100/50 shadow-sm"
            >
              <h4 className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 p-2 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
                Diagnostic Merit
              </h4>
              <ul className="space-y-4">
                {result.score.strengths.map((s, idx) => (
                  <li key={idx} className="flex gap-4 text-[13px] text-emerald-900 font-bold leading-snug">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-rose-50/50 p-8 rounded-[2.5rem] border border-rose-100/50 shadow-sm"
            >
              <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-[0.2em] flex items-center gap-3 mb-6">
                <div className="bg-rose-100 p-2 rounded-lg"><AlertCircle className="w-4 h-4" /></div>
                Reasoning Gaps
              </h4>
              <ul className="space-y-4">
                {result.score.gaps.map((g, idx) => (
                  <li key={idx} className="flex gap-4 text-[13px] text-rose-900 font-bold leading-snug">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                    {g}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8 group">
            <div className="bg-blue-50 w-24 h-24 rounded-3xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Trophy className="w-12 h-12 text-blue-600" />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Advance Competency</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-md">
                Your performance in this case suggests mastery of standard diagnostic criteria. To proceed to the next tier, we recommend a focused simulation on **Critical Care Complications**.
              </p>
            </div>
            <button className="md:ml-auto bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95">
              Begin Pathway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
