import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Mail, Lock, ArrowRight, Chrome, AlertCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [rank, setRank] = useState('Student');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create Firestore profile
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          firstName,
          rank,
          email: user.email,
          createdAt: serverTimestamp(),
          knowledgeProgress: 0
        });
      }
      navigate('/');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled in Firebase. Please enable it in your Firebase Console under Authentication > Sign-in method.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network request failed. This is usually caused by an ad-blocker or because your current URL is not in the Firebase "Authorized Domains" list. Please check your internet and Firebase Console settings.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if profile exists first
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        // Create new profile with defaults
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          firstName: user.displayName?.split(' ')[0] || 'Doctor',
          rank: 'Resident',
          email: user.email,
          createdAt: serverTimestamp(),
          knowledgeProgress: 0
        });
      }
      
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Visual Brand Side */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-slate-900 rounded-[2.5rem] p-10 text-white flex flex-col justify-between relative overflow-hidden"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-10">
              <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-blue-500/40 shadow-2xl">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <span className="font-black text-xl tracking-tight">MED<span className="text-blue-500">MENTOR</span></span>
            </div>
            
            <h1 className="text-4xl font-bold tracking-tight leading-tight mb-6">
              Refine your <span className="text-blue-400">Clinical Intuition</span> in a safe-to-fail arena.
            </h1>
            <p className="text-slate-400 font-medium leading-relaxed">
              Step into high-fidelity simulations powered by medical-grade AI models. Built for the modern student.
            </p>
          </div>

          <div className="relative z-10 mt-12 bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-sm">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Platform Invariant</p>
            <p className="text-sm text-slate-300 italic">"Medicine is not an algorithm. It is a dialogue. MedMentor simulates the pressure of the 'why' behind the 'what'."</p>
          </div>

          {/* Abstract Decorations */}
          <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-indigo-500/5 rounded-full blur-[120px]" />
        </motion.div>

        {/* Auth Form Side */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-10 flex flex-col justify-center"
        >
          <div className="mb-10 text-center md:text-left">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
              {isLogin ? 'Access Clinical Hub' : 'Register Residency'}
            </h2>
            <p className="text-sm text-slate-500 font-medium tracking-wide">
              {isLogin ? 'Welcome back, Doctor. Your shifts await.' : 'Join the elite cohort of medical thinkers.'}
            </p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              <Chrome className="w-5 h-5 text-white" />
              {isLogin ? 'Enter with Google Identity' : 'Register with Google'}
            </button>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-100 w-full" />
              <span className="bg-white px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 absolute">OR USE TERMINAL</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 text-rose-600 text-[11px] font-bold"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}

              {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                  <input 
                    type="text" 
                    placeholder="Wealth"
                    required={!isLogin}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rank</label>
                  <div className="relative">
                    <select 
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold text-slate-700 appearance-none"
                    >
                      <option>Student</option>
                      <option>Resident</option>
                      <option>Attending</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-black text-[10px]">▼</div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Terminal</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="doctor@hospital.edu"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Passcode</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input 
                  type="password" 
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-12 pr-5 py-3.5 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all font-bold"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isLogin ? 'Enter Shift' : 'Initialize Protocol'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

          <p className="mt-8 text-center text-xs text-slate-400 font-bold uppercase tracking-widest">
            {isLogin ? 'New to residency?' : 'Already registered?'} 
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-2 text-blue-600 hover:underline"
            >
              {isLogin ? 'Create Identity' : 'Access Terminal'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
