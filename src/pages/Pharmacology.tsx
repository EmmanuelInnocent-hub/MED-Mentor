import React, { useState, useEffect, useRef } from 'react';
import { 
  Pill,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight,
  TrendingDown,
  Activity,
  Send,
  ArrowLeft,
  Loader2,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const drugLibrary: Record<string, any> = {
  metformin: {
    name: 'Metformin',
    class: 'Biguanide · Antidiabetic',
    brand: 'Glucophage®',
    category: 'BIGUANIDE',
    tags: ['1st Line T2DM', 'Cheap'],
    score: 90,
    color: 'green',
    moa: [
      { label: 'High blood glucose', type: 'state' },
      { label: 'Hepatic gluconeogenesis', type: 'state' },
      { label: 'Metformin inhibits Complex I (AMPK↑)', type: 'action', active: true },
      { label: 'Gluconeogenesis', type: 'inhibited' },
      { label: 'Blood glucose ↓', type: 'result' }
    ],
    params: [
      { l: 'Route', v: 'Oral' },
      { l: 'Half-life', v: '4–9 hours' },
      { l: 'Renal Dose', v: 'eGFR Required', c: 'text-rose-500' },
      { l: 'Protein B.', v: 'Minimal' },
      { l: 'Pregnancy', v: 'Category B', c: 'text-amber-500' },
      { l: 'Monitoring', v: 'eGFR, B12' },
    ],
    quiz: {
      question: "A patient with T2DM on metformin 1g BD is scheduled for a contrast CT scan. What is the correct management of their metformin?",
      options: [
        'Continue metformin as usual — no change needed',
        'Double the dose to maintain glycaemic control',
        'Hold metformin 48 hours before and after contrast',
        'Switch permanently to insulin before the procedure'
      ],
      correct: 2,
      explanation: "Metformin is cleared renally. Contrast can cause acute kidney injury (AKI). If AKI occurs while on metformin, the drug can accumulate and cause potentially fatal lactic acidosis. Standard practice is to hold it for 48h to ensure stable renal function."
    }
  },
  warfarin: {
    name: 'Warfarin',
    class: 'Vitamin K antagonist',
    brand: 'Coumadin®',
    category: 'ANTICOAGULANT',
    tags: ['High Risk', 'Narrow TI'],
    score: 55,
    color: 'amber',
    moa: [
      { label: 'Vitamin K availability', type: 'state' },
      { label: 'VKORC1 enzyme', type: 'state' },
      { label: 'Warfarin inhibits VKORC1', type: 'action', active: true },
      { label: 'Clotting factor synthesis', type: 'inhibited' },
      { label: 'INR increases', type: 'result' }
    ],
    params: [
      { l: 'Route', v: 'Oral' },
      { l: 'Half-life', v: '20–60 hours' },
      { l: 'Protein B.', v: '99% (High)', c: 'text-amber-500' },
      { l: 'Pregnancy', v: 'Category X', c: 'text-rose-600' },
      { l: 'Monitoring', v: 'INR (Target 2.5)', c: 'text-amber-500' },
      { l: 'Antidote', v: 'Vit K / PCC' },
    ],
    quiz: {
      question: "Which of the following would DECREASE the anticoagulant effect of warfarin (Low INR)?",
      options: [
        'Commencing Clarithromycin (CYP3A4 inhibitor)',
        'Chronic Alcohol misuse',
        'Increasing intake of green leafy vegetables',
        'Congestive Heart Failure exacerbation'
      ],
      correct: 2,
      explanation: "Green leafy vegetables are rich in Vitamin K. Warfarin works by antagonizing Vitamin K. High intake of Vitamin K directly bypasses the blockade, leading to reduced efficacy and a lower INR."
    }
  },
  atorvastatin: {
    name: 'Atorvastatin',
    class: 'Statins',
    brand: 'Lipitor®',
    category: 'HMG-COA INHIBITOR',
    tags: ['CV Protection', 'Pleiotropic'],
    score: 70,
    color: 'blue',
    moa: [
      { label: 'Mevalonate pathway', type: 'state' },
      { label: 'Atorvastatin inhibits HMG-CoA Reductase', type: 'action', active: true },
      { label: 'Endogenous cholesterol', type: 'inhibited' },
      { label: 'LDL receptor expression ↑', type: 'result' },
      { label: 'Plasma LDL-C ↓', type: 'result' }
    ],
    params: [
      { l: 'Route', v: 'Oral (Nightly)' },
      { l: 'Half-life', v: '14 hours' },
      { l: 'Metabolism', v: 'CYP3A4 (High)' },
      { l: 'Side Effect', v: 'Myalgia/Myopathy', c: 'text-amber-500' },
      { l: 'Pregnancy', v: 'Contraindicated', c: 'text-rose-600' },
      { l: 'Target', v: 'LDL < 1.8 mmol/L' },
    ],
    quiz: {
      question: "What is the most critical monitoring parameter for a patient starting high-intensity atorvastatin who develops muscle pain?",
      options: [
        'Alanine Aminotransferase (ALT)',
        'Creatine Kinase (CK)',
        'Serum Creatinine',
        'Thyroid Stimulating Hormone (TSH)'
      ],
      correct: 1,
      explanation: "Statin-associated muscle symptoms can range from simple myalgia to rhabdomyolysis. Serum Creatine Kinase (CK) is the marker of muscle breakdown used to assess for significant myopathy or rhabdomyolysis."
    }
  }
};

const drugListSummary = [
  { id: 'metformin', name: 'Metformin', class: 'Biguanide · Antidiabetic', tags: ['1st Line T2DM', 'Cheap'], score: 90, color: 'green' },
  { id: 'warfarin', name: 'Warfarin', class: 'Vitamin K antagonist', tags: ['High Risk', 'Many interactions'], score: 55, color: 'amber' },
  { id: 'atorvastatin', name: 'Atorvastatin', class: 'HMG-CoA reductase', tags: ['CV Protection'], score: 70, color: 'blue' },
  { id: 'amoxicillin', name: 'Amoxicillin', class: 'Aminopenicillin', tags: ['Broad spectrum'], score: 80, color: 'green' },
  { id: 'lisinopril', name: 'Lisinopril', class: 'ACE Inhibitor', tags: ['Heart protective', 'Avoid in pregnancy'], score: 60, color: 'blue' },
];

export default function Pharmacology() {
  const navigate = useNavigate();
  const [activeDrugId, setActiveDrugId] = useState('metformin');
  const [search, setSearch] = useState('');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "You're studying Metformin — the cornerstone of T2DM management. \n\nBefore we go further: can you explain *why* metformin doesn't cause hypoglycaemia on its own, even at high doses? Think about its mechanism."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const drug = drugLibrary[activeDrugId] || drugLibrary['metformin'];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  useEffect(() => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    // Reset tutor message for new drug
    setMessages([{
      role: 'assistant',
      content: `Let's discuss ${drug.name}. This ${drug.category} is fascinating. What is the most significant clinical concern you have when prescribing this to a new patient?`
    }]);
  }, [activeDrugId]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getModuleResponse(`Pharmacology (${drug.name})`, [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const filteredDrugs = drugListSummary.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) || 
    d.class.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Sidebar - Drug Library */}
        <div className="hidden xl:flex w-72 flex-col border-r border-[#1e2a3a] bg-[#111620]">
          <div className="p-4">
             <div className="bg-[#161d2a] border border-[#243044] rounded-lg px-3 py-2 flex items-center gap-2">
               <Search className="w-3.5 h-3.5 text-[#5a7090]" />
               <input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-[#2d3d56] w-full" 
                placeholder="Search drug..." 
               />
             </div>
          </div>
          <div className="px-6 py-2">
            <h3 className="text-[9px] font-mono uppercase tracking-widest text-[#5a7090]">Drug Library</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
            {filteredDrugs.map((d) => (
              <button 
                key={d.id}
                onClick={() => setActiveDrugId(d.id)}
                className={`w-full text-left p-3.5 rounded-lg border-l-2 transition-all ${
                  activeDrugId === d.id ? 'bg-[#161d2a] border-amber-600' : 'border-transparent hover:bg-[#161d2a]/50'
                }`}
              >
                <div className="text-sm font-semibold text-white mb-1">{d.name}</div>
                <div className="text-[10px] font-mono text-[#a8b8cc] mb-2">{d.class}</div>
                <div className="flex flex-wrap gap-1">
                  {d.tags.map(t => (
                    <span key={t} className="text-[8px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1c2537] text-[#5a7090]">
                      {t}
                    </span>
                  ))}
                </div>
                <div className="mt-3 h-[2px] bg-[#243044] rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${d.color === 'green' ? 'bg-green-500' : d.color === 'amber' ? 'bg-amber-500' : 'bg-blue-500'}`} 
                    style={{ width: `${d.score}%` }} 
                  />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0e14]">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <Pill className="w-5 h-5 text-amber-500" />
                <h1 className="text-lg font-serif italic text-white tracking-tight">Pharmacology</h1>
                <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 font-mono font-bold">Drug Logic</span>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
            {/* Drug Header Card */}
            <motion.div 
              key={activeDrugId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#161d2a] border border-[#243044] rounded-2xl p-8 relative overflow-hidden group"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 blur-3xl pointer-events-none group-hover:bg-amber-600/10 transition-all" />
               
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
                 <div>
                   <h2 className="text-3xl font-serif text-white leading-none">{drug.name}</h2>
                   <p className="text-xs font-mono text-[#5a7090] mt-2 italic">{drug.name.toLowerCase()} · {drug.brand}</p>
                 </div>
                 <span className="self-start px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-mono font-bold rounded-full">{drug.category}</span>
               </div>

               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                 {drug.params.map((p: any) => (
                   <div key={p.l} className="bg-[#1c2537] p-3 rounded-xl border border-[#243044]/50">
                     <p className="text-[9px] font-mono text-[#5a7090] uppercase mb-1">{p.l}</p>
                     <p className={`text-xs font-bold ${p.c || 'text-white'}`}>{p.v}</p>
                   </div>
                 ))}
               </div>
            </motion.div>

            {/* MOA Diagram */}
            <div className="bg-[#161d2a] border border-[#243044] rounded-2xl p-8 overflow-x-auto">
               <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090] mb-6">Mechanism of Action</h3>
               <div className="flex items-center gap-3 min-w-max">
                 {drug.moa.map((step: any, i: number) => (
                   <React.Fragment key={i}>
                    {i > 0 && <ArrowRight className="w-4 h-4 text-[#2d3d56] shrink-0" />}
                    <div className={`px-4 py-2 rounded-lg text-xs transition-all ${
                      step.type === 'action' ? 'bg-amber-600/10 border border-amber-500/30 text-amber-500 font-bold' :
                      step.type === 'inhibited' ? 'bg-rose-500/5 border border-rose-500/20 text-rose-500 line-through' :
                      step.type === 'result' ? 'bg-green-500/10 border border-green-500/30 text-green-500 font-bold' :
                      'bg-[#1c2537] border border-[#243044] text-[#a8b8cc]'
                    }`}>
                      {step.label}
                    </div>
                   </React.Fragment>
                 ))}
               </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#161d2a] border border-[#243044] rounded-2xl p-8">
               <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090] mb-4">Interactive Quiz</h3>
               <p className="text-base text-white font-medium mb-6 leading-relaxed">
                 {drug.quiz.question}
               </p>
               <div className="grid gap-3">
                 {drug.quiz.options.map((opt: string, i: number) => (
                   <button 
                     key={i}
                     onClick={() => {
                        if (showExplanation) return;
                        setSelectedAnswer(i);
                        setShowExplanation(true);
                     }}
                     className={`w-full text-left p-4 rounded-xl border text-xs transition-all relative overflow-hidden group ${
                       showExplanation 
                        ? i === drug.quiz.correct 
                          ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                          : selectedAnswer === i 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                            : 'bg-[#1c2537] border-[#243044] text-[#5a7090] opacity-50'
                        : 'bg-[#1c2537] border-[#243044] text-[#a8b8cc] hover:border-[#2d3d56]'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                        <span className="font-mono opacity-40">{String.fromCharCode(65 + i)}.</span>
                        <span className="flex-1">{opt}</span>
                        {showExplanation && i === drug.quiz.correct && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                        {showExplanation && selectedAnswer === i && i !== drug.quiz.correct && <AlertTriangle className="w-4 h-4 text-rose-500" />}
                     </div>
                   </button>
                 ))}
               </div>
               
               <AnimatePresence>
                {showExplanation && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 p-5 bg-[#1c2537] border-l-2 border-amber-500 rounded-r-xl"
                  >
                    <div className="flex items-start gap-3">
                      <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-xs font-bold text-white mb-2">Clinical Reasoning</h4>
                        <p className="text-xs text-[#a8b8cc] leading-relaxed italic">{drug.quiz.explanation}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
               </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Chat / Tutor Panel */}
        <div className="w-full lg:w-[450px] flex flex-col bg-[#111620] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
           <div className="px-6 py-6 border-b border-[#1e2a3a]">
             <h3 className="text-sm font-semibold text-white mb-1">Pharmacology Tutor</h3>
             <p className="text-[11px] font-mono text-[#5a7090]">{drug.name} module · Socratic mode</p>
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
                     {msg.role === 'assistant' ? 'Pharm Tutor' : 'Medical Student'}
                   </span>
                   <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                     msg.role === 'assistant' 
                       ? 'bg-[#161d2a] rounded-tl-none border border-[#1e2a3a] text-[#e8edf5]' 
                       : 'bg-amber-600 rounded-tr-none text-white font-medium'
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
                   <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">Pharm Tutor</span>
                   <div className="bg-[#161d2a] p-4 rounded-2xl rounded-tl-none border border-[#1e2a3a] flex items-center gap-2">
                     <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                     <span className="text-[10px] text-[#5a7090] italic">Consulting pharmacopoeia...</span>
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
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-xl p-4 pr-12 text-xs text-white placeholder-[#2d3d56] resize-none h-24 focus:border-amber-500/40 outline-none transition-all"
                  placeholder="Ask about mechanism, side effects, or clinical pearls..."
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute bottom-4 right-4 p-2 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-amber-900/20"
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
