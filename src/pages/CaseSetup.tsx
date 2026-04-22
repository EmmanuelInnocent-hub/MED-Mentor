import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  Brain, 
  Layers, 
  Play, 
  ChevronRight,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';
import { cases } from '../lib/casePrompts';
import { Case } from '../types';

export default function CaseSetup() {
  const navigate = useNavigate();
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [difficulty, setDifficulty] = useState<Case['difficulty']>('Resident');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);

  const specialties = ['All', ...Array.from(new Set(cases.map(c => c.specialty)))];
  const filteredCases = selectedSpecialty === 'All' 
    ? cases 
    : cases.filter(c => c.specialty === selectedSpecialty);

  const startCase = () => {
    if (selectedCase) {
      navigate(`/case/${selectedCase.id}`, { state: { difficulty } });
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-0 space-y-6">
      <header className="shrink-0 mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Configure Simulation</h1>
        <p className="text-slate-500 mt-1">Select your specialty and challenge level to begin the Socratic session.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Specialty
            </h3>
            <div className="flex flex-wrap gap-2">
              {specialties.map(s => (
                <button
                  key={s}
                  onClick={() => setSelectedSpecialty(s)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    selectedSpecialty === s 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Difficulty Level
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {(['Intern', 'Resident', 'Attending'] as const).map(d => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] transition-all border-2 text-center ${
                    difficulty === d 
                      ? 'border-blue-600 bg-blue-50/50 text-blue-700' 
                      : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl p-5 text-white flex gap-4 shadow-xl shadow-slate-200">
            <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-blue-400 uppercase tracking-wider mb-1">Difficulty Impact</p>
              <p className="text-slate-400 leading-relaxed italic">
                {difficulty === 'Intern' && 'MedMentor will provide clarifying hints and follow-up guidance for missed priorities.'}
                {difficulty === 'Resident' && 'A collaborative peer-level discussion. You are expected to drive the diagnostic path.'}
                {difficulty === 'Attending' && 'High scrutiny. Assumptions will be challenged, and you must justify every clinical decision.'}
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <Stethoscope className="w-4 h-4" />
            Select Case Template
          </h3>
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-2 custom-scrollbar">
            {filteredCases.map(c => (
              <motion.div
                key={c.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setSelectedCase(c)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedCase?.id === c.id 
                    ? 'border-blue-500 bg-blue-50/10 shadow-md ring-1 ring-blue-500/20' 
                    : 'border-slate-100 bento-card-hover'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black uppercase tracking-[0.15em] text-blue-600">{c.specialty}</span>
                  {selectedCase?.id === c.id && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />}
                </div>
                <h4 className="font-bold text-slate-900 group-hover:text-blue-600">{c.title}</h4>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed line-clamp-2 italic">"{c.patientBrief}"</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      <div className="pt-6 flex justify-end">
        <button
          onClick={startCase}
          disabled={!selectedCase}
          className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all ${
            selectedCase 
              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 hover:scale-[1.02] active:scale-95' 
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {selectedCase ? 'Initialize Clinical Simulation' : 'Waiting for Case Selection'}
          <Play className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
