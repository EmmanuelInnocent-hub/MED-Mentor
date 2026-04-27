import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Construction, Activity } from 'lucide-react';

export default function ComingSoon() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mb-8"
      >
        <div className="w-24 h-24 bg-blue-600/10 rounded-[3rem] flex items-center justify-center shadow-2xl shadow-blue-500/10 mb-6">
          <Construction className="w-10 h-10 text-blue-600 animate-bounce" />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-4 font-display">
          Under Clinical Development
        </h1>
        <p className="max-w-md mx-auto text-slate-500 mb-10 leading-relaxed">
          The Medical Board is currently validating this AI branch. This section will be integrated into your residency rotation soon.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-black transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Station
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all active:scale-95"
          >
            <Activity className="w-4 h-4 text-blue-500" />
            Control Center
          </button>
        </div>
      </motion.div>
      
      {/* Decorative lines */}
      <div className="mt-20 flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="h-1 w-8 bg-slate-100 rounded-full animate-pulse" 
            style={{ animationDelay: `${i * 0.2}s` }} 
          />
        ))}
      </div>
    </div>
  );
}
