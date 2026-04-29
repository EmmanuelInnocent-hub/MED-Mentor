import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Baby, 
  TrendingUp, 
  Calculator, 
  AlertCircle, 
  ArrowLeft,
  CheckCircle2,
  Send,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const ageGroups = [
  { id: 'neonate', name: 'Neonate', range: '0–28 days', badge: 'Critical dosing', color: 'pink' },
  { id: 'infant', name: 'Infant', range: '1m – 1y', badge: 'Developmental', color: 'pink' },
  { id: 'toddler', name: 'Toddler', range: '1 – 3 years', badge: 'Active case', color: 'amber', active: true },
  { id: 'preschool', name: 'Preschool', range: '3 – 5 years', badge: '2 cases', color: 'blue' },
  { id: 'school', name: 'School age', range: '6 – 12 years', badge: '3 cases', color: 'blue' },
];

export default function Pediatrics() {
  const navigate = useNavigate();
  const [activeAgeGroup, setActiveAgeGroup] = useState('toddler');
  const [weight, setWeight] = useState(12.4);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Chidera is showing signs of respiratory distress. \n\nBefore anything else — how do you assess severity in paediatric respiratory distress? What clinical signs tell you this child needs immediate intervention?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getModuleResponse('Pediatrics (Respiratory Distress)', [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const milestones = [
    { l: 'Walks independently', s: 'done' },
    { l: 'Uses 2-word phrases', s: 'done' },
    { l: 'Points to named objects', s: 'done' },
    { l: '50+ words in vocabulary', s: 'late' },
  ];

  const dosages = [
    { l: 'Paracetamol', dosage: 15, unit: 'mg/kg' },
    { l: 'Amoxicillin', dosage: 25, unit: 'mg/kg' },
    { l: 'Ibuprofen', dosage: 10, unit: 'mg/kg' },
    { l: 'Ceftriaxone', dosage: 50, unit: 'mg/kg' },
  ];

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Sidebar - Age Groups & Calc */}
        <div className="hidden xl:flex w-72 flex-col border-r border-[#1e2a3a] bg-[#111620]">
          <div className="p-6 border-b border-[#1e2a3a]">
             <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Age Groups</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-px custom-scrollbar">
            {ageGroups.map((ag) => (
              <button 
                key={ag.id}
                onClick={() => setActiveAgeGroup(ag.id)}
                className={`w-full text-left px-6 py-4 flex flex-col transition-all ${
                  activeAgeGroup === ag.id ? 'bg-[#161d2a] border-l-2 border-pink-500' : 'hover:bg-[#161d2a]/50 border-l-2 border-transparent'
                }`}
              >
                <div className="text-[13px] font-bold text-white mb-0.5">{ag.name}</div>
                <div className="text-[10px] font-mono text-[#5a7090] mb-2">{ag.range}</div>
                <span className={`self-start text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${
                  ag.color === 'pink' ? 'bg-pink-500/10 text-pink-400' : 
                  ag.color === 'amber' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                }`}>
                  {ag.badge}
                </span>
              </button>
            ))}
          </div>

          <div className="p-4 m-4 bg-[#161d2a] border border-[#243044] rounded-2xl shadow-xl shadow-pink-900/10">
             <div className="text-[9px] font-mono uppercase tracking-widest text-[#5a7090] mb-4 flex items-center gap-2">
               <Calculator className="w-3 h-3 text-pink-500" /> Weight-based Dosing
             </div>
             <div className="space-y-4">
               <div className="flex items-center justify-between">
                 <span className="text-xs text-[#a8b8cc]">Weight (kg)</span>
                 <input 
                  type="number" 
                  step="0.1"
                  value={weight} 
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-16 bg-[#1c2537] border border-[#243044] rounded px-2 py-1 text-xs font-mono text-center text-white focus:border-pink-500/50 outline-none" 
                 />
               </div>
               <div className="space-y-2 pt-2 border-t border-[#243044]">
                 {dosages.map(d => (
                   <div key={d.l} className="flex items-center justify-between text-[11px]">
                     <div className="flex flex-col">
                        <span className="text-[#a8b8cc]">{d.l}</span>
                        <span className="text-[8px] text-[#5a7090]">{d.dosage}{d.unit}</span>
                     </div>
                     <span className="font-mono text-green-500 font-bold">{Math.round(weight * d.dosage)} mg</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0e14]">
          <div className="px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <Baby className="w-5 h-5 text-pink-500" />
                <h1 className="text-lg font-serif italic text-white tracking-tight">Pediatrics Rotation</h1>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-5 text-xs leading-relaxed text-[#a8b8cc]"
             >
                <strong className="text-pink-500 font-bold font-serif text-sm block mb-1">Active Case: Toddler Respiratory Distress</strong>
                Chidera, 2-year-old male, brought by mother with 3-day history of high fever (39.8°C), barky cough, and inspiratory stridor. He appears lethargic and is using accessory muscles.
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.1 }}
               className="bg-[#161d2a] border border-[#243044] rounded-2xl p-6"
             >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-2xl">👦</div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Chidera A.</h2>
                      <p className="text-[11px] font-mono text-[#5a7090]">2 years · Male · {weight} kg · Paediatric ED</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                     <span className="text-[10px] font-mono text-rose-500 animate-pulse">TRIAGE LEVEL 2</span>
                     <span className="text-[9px] text-[#5a7090]">Status: Acute Distress</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { l: 'HR', v: '148', c: 'text-amber-500', n: '<150' },
                     { l: 'RR', v: '38/min', c: 'text-rose-500', n: '20–30' },
                     { l: 'SpO2', v: '93%', c: 'text-amber-500', n: '>95%' },
                     { l: 'Temp', v: '39.8°C', c: 'text-rose-500', n: '<38°C' },
                   ].map(v => (
                     <div key={v.l} className="bg-[#1c2537] p-3 rounded-xl border border-[#243044]/50">
                        <div className="text-[9px] font-mono text-[#5a7090] uppercase mb-1">{v.l}</div>
                        <div className={`text-base font-bold ${v.c}`}>{v.v}</div>
                        <div className="text-[8px] font-mono text-[#2d3d56] mt-1">Ref: {v.n}</div>
                     </div>
                   ))}
                </div>
             </motion.div>

             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="bg-[#161d2a] border border-[#243044] rounded-2xl p-6"
             >
                <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090] mb-4">Milestones Check — {activeAgeGroup.toUpperCase()}</h3>
                <div className="grid md:grid-cols-2 gap-2">
                   {milestones.map((m, i) => (
                     <div key={i} className="flex items-center justify-between p-3 bg-[#1c2537]/50 rounded-lg border border-[#243044]/30">
                        <div className="flex items-center gap-3">
                           <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${m.s === 'done' ? 'bg-green-500/15 text-green-500' : 'bg-rose-500/15 text-rose-500'}`}>
                              {m.s === 'done' ? '✓' : '!'}
                           </div>
                           <span className="text-xs text-[#a8b8cc]">{m.l}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold ${m.s === 'done' ? 'text-green-500/60' : 'text-rose-500'}`}>
                          {m.s === 'done' ? 'Met' : 'Delay?'}
                        </span>
                     </div>
                   ))}
                </div>
             </motion.div>
          </div>
        </div>

        {/* Chat / Attending Panel */}
        <div className="w-full lg:w-[450px] flex flex-col bg-[#111620] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
           <div className="px-6 py-6 border-b border-[#1e2a3a]">
             <h3 className="text-sm font-semibold text-white mb-1">Paeds Attending</h3>
             <p className="text-[11px] font-mono text-[#5a7090]">Active clinical case · Socratic tutor</p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0a0e14]">
             <AnimatePresence mode="popLayout">
               {messages.map((msg, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                 >
                   <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">
                     {msg.role === 'assistant' ? 'Paeds Attending' : 'Medical Student'}
                   </span>
                   <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                     msg.role === 'assistant' 
                       ? 'bg-[#161d2a] rounded-tl-none border border-[#1e2a3a] text-[#e8edf5]' 
                       : 'bg-pink-600 rounded-tr-none text-white font-medium'
                   }`}>
                     {msg.content}
                   </div>
                 </motion.div>
               ))}
               {isTyping && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className="flex flex-col items-start"
                 >
                   <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">Paeds Attending</span>
                   <div className="bg-[#161d2a] p-4 rounded-2xl rounded-tl-none border border-[#1e2a3a] flex items-center gap-2">
                     <Loader2 className="w-3 h-3 animate-spin text-pink-400" />
                     <span className="text-[10px] text-[#5a7090] italic">Reviewing vitals...</span>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
             <div ref={chatEndRef} />
           </div>

           <div className="p-6 border-t border-[#1e2a3a] bg-[#111620]">
             <div className="relative group">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-xl p-4 pr-12 text-xs text-white placeholder-[#2d3d56] resize-none h-24 focus:border-pink-500/40 outline-none transition-all" 
                  placeholder="Analyze the clinical signs and propose management..." 
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute bottom-4 right-4 p-2 bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg shadow-lg shadow-pink-900/20 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
