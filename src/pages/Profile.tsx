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
  LogOut,
  X,
  User,
  Briefcase,
  Building,
  Save,
  Globe,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { SessionResult } from '../types';

export default function Profile() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile } = useAuth();
  const [stats, setStats] = useState({
    casesDone: 0,
    avgScore: 0,
    streak: profile?.streak || 0,
    rank: 14
  });
  const [performance, setPerformance] = useState({
    bestSpecialty: 'Cardiology',
    bestScore: 91,
    worstSpecialty: 'Neurology',
    worstScore: 54
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    title: profile?.title || 'Dr.',
    role: profile?.rank || 'RESIDENT',
    institution: profile?.institution || 'Global Clinic',
    specialization: profile?.specialization || '',
    bio: profile?.bio || ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        title: profile.title || 'Dr.',
        role: profile.rank || 'RESIDENT',
        institution: profile.institution || 'Global Clinic',
        specialization: profile.specialization || '',
        bio: profile.bio || ''
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        title: formData.title,
        rank: formData.role,
        institution: formData.institution,
        specialization: formData.specialization,
        bio: formData.bio
      });
      setToastMsg('Registry updated successfully');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving registry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    const first = formData.firstName.trim();
    const last = formData.lastName.trim();
    if (first && last) return (first[0] + last[0]).toUpperCase();
    if (first) return first.slice(0, 2).toUpperCase();
    return 'EM';
  };

  useEffect(() => {
    async function fetchStats() {
      if (!user) return;
      try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(sessionsRef, where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const fetchedSessions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            completedAt: data.completedAt?.toDate?.()?.toISOString() || (typeof data.completedAt === 'string' ? data.completedAt : new Date().toISOString())
          };
        }) as SessionResult[];
        
        const completedSessions = fetchedSessions.filter(s => s.score && s.score.overall !== undefined);
        
        if (completedSessions.length > 0) {
          const avg = Math.round(completedSessions.reduce((acc, s) => acc + s.score.overall, 0) / completedSessions.length);
          
          const specialtyTotals: Record<string, { total: number, count: number }> = {};
          completedSessions.forEach(s => {
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
            casesDone: completedSessions.length,
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
                    {(profile?.firstName || user?.displayName?.split(' ')[0] || 'Emmanuel').slice(0, 2).toUpperCase()}
                    <div className="absolute bottom-0 right-0 w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-0.5 md:space-y-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white leading-tight">
                  Dr. {profile?.firstName || user?.displayName?.split(' ')[0] || 'Emmanuel'}
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
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 md:px-8 md:py-3 rounded-xl md:rounded-2xl font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-95 w-full sm:w-auto"
              >
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

      {/* Modify Registry Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh]"
            >
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between shrink-0">
                <h3 className="text-lg font-display font-black text-slate-900">Modify Registry</h3>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                {/* Avatar Section */}
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-display font-black text-white shrink-0 shadow-xl">
                    {getInitials()}
                  </div>
                  <div>
                    <button className="text-xs font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-2 mb-1">
                      <Upload className="w-3 h-3" />
                      Upload Photo
                    </button>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">JPG, PNG, GIF · MAX 2MB</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-slate-400 pb-2 border-b border-slate-50 flex items-center gap-2">
                    <User className="w-3 h-3" />
                    Personal Identity
                  </h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">First Name</label>
                      <input 
                        type="text" 
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">Last Name</label>
                      <input 
                        type="text" 
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">Title / Prefix</label>
                    <select 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="Dr.">Dr.</option>
                      <option value="Prof.">Prof.</option>
                      <option value="Mr.">Mr.</option>
                      <option value="Ms.">Ms.</option>
                      <option value="">None</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-slate-400 pb-2 border-b border-slate-50 flex items-center gap-2">
                    <Building className="w-3 h-3" />
                    Institutional Registry
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">Current Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                    >
                      <option value="RESIDENT">Resident</option>
                      <option value="INTERN">Intern</option>
                      <option value="FELLOW">Fellow</option>
                      <option value="ATTENDING">Attending</option>
                      <option value="STUDENT">Medical Student</option>
                      <option value="CONSULTANT">Consultant</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">Institution</label>
                    <div className="relative">
                      <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={formData.institution}
                        onChange={(e) => setFormData({...formData, institution: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        placeholder="e.g. Lagos University Teaching Hospital"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">Specialization</label>
                    <div className="relative">
                      <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <select 
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                      >
                        <option value="">Not specified</option>
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Radiology">Radiology</option>
                        <option value="Paediatrics">Paediatrics</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Emergency Medicine">Emergency Medicine</option>
                        <option value="Pathology">Pathology</option>
                        <option value="Pharmacology">Pharmacology</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 px-1">Clinical Bio</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all h-24 resize-none"
                      placeholder="e.g. Final-year resident focused on emergency radiology..."
                    />
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-slate-100 flex items-center justify-between gap-4 shrink-0">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Registry
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] bg-emerald-500 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-white/20"
          >
            <Check className="w-5 h-5" />
            <span className="text-xs font-black uppercase tracking-widest">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
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
