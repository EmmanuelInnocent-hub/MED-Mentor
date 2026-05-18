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
  Check,
  Menu,
  MoreVertical,
  X,
  ChevronUp,
  ChevronDown,
  Layout,
  FileText,
  Settings,
  PlusCircle
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
  
  const [drugs, setDrugs] = useState(drugListSummary);
  const [isEditingRegistry, setIsEditingRegistry] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  
  const drug = drugLibrary[activeDrugId] || drugLibrary['metformin'];

  const handleUpdateDrugName = (id: string, newName: string) => {
    setDrugs(prev => prev.map(d => d.id === id ? { ...d, name: newName } : d));
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Let's discuss ${drug.name}. This ${drug.category} is fascinating. What is the most significant clinical concern you have when prescribing this to a new patient?`
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1280);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Desktop Sidebar - Drug Library */}
        {isLargeScreen && (
          <aside className="w-72 flex flex-col border-r border-[#1e2a3a] bg-[#111620] shrink-0 overflow-hidden">

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
                {drugs.filter(d => 
                  d.name.toLowerCase().includes(search.toLowerCase()) || 
                  d.class.toLowerCase().includes(search.toLowerCase())
                ).map((d) => (
                  <div key={d.id} className="relative group">
                    <button 
                      onClick={() => !isEditingRegistry && setActiveDrugId(d.id)}
                      className={`w-full text-left p-3.5 rounded-lg border-l-2 transition-all ${
                        activeDrugId === d.id ? 'bg-[#161d2a] border-amber-600' : 'border-transparent hover:bg-[#161d2a]/50'
                      } ${isEditingRegistry ? 'cursor-default' : ''}`}
                    >
                      {isEditingRegistry ? (
                        <div className="space-y-2">
                          <input 
                            type="text"
                            value={d.name}
                            onChange={(e) => handleUpdateDrugName(d.id, e.target.value)}
                            className="w-full bg-[#0a0e14] border border-amber-500/30 rounded px-2 py-1 text-sm text-white outline-none focus:border-amber-500 transition-all font-serif italic"
                            autoFocus={activeDrugId === d.id}
                          />
                          <div className="text-[10px] font-mono text-[#5a7090] px-2">Editing Drug Identity</div>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-semibold text-white mb-1">{d.name}</div>
                          <div className="text-[10px] font-mono text-[#a8b8cc] mb-2">{d.class}</div>
                        </>
                      )}
                      
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
                  </div>
                ))}
              </div>
              
              {/* Modify Registry Button */}
              <div className="p-4 border-t border-[#1e2a3a] mt-auto">
                <button 
                  onClick={() => setIsEditingRegistry(!isEditingRegistry)}
                  className={`w-full py-3 px-4 rounded-full text-[11px] font-black tracking-widest uppercase transition-all shadow-lg flex items-center justify-center gap-2 ${
                    isEditingRegistry 
                      ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-900/20' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20'
                  }`}
                >
                  {isEditingRegistry ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      SAVE REGISTRY
                    </>
                  ) : (
                    'MODIFY REGISTRY'
                  )}
                </button>
              </div>
          </aside>
        )}

        {/* Mobile Sidebar Bottom Sheet */}
        <AnimatePresence>
          {isSidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] md:hidden"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 h-[75vh] bg-[#111620] z-[120] md:hidden rounded-t-[2.5rem] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 flex-shrink-0" />
                <div className="p-4 border-b border-[#1e2a3a] flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#a8b8cc]">Drug Library</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-[#5a7090]"><X className="w-5 h-5"/></button>
                </div>
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
                <div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-1">
                  {drugs.filter(d => 
                    d.name.toLowerCase().includes(search.toLowerCase()) || 
                    d.class.toLowerCase().includes(search.toLowerCase())
                  ).map((d) => (
                    <button 
                      key={d.id}
                      onClick={() => {
                        setActiveDrugId(d.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full text-left p-4 rounded-xl border-l-2 transition-all ${
                        activeDrugId === d.id ? 'bg-[#161d2a] border-amber-600' : 'border-transparent hover:bg-[#161d2a]/50'
                      }`}
                    >
                      <div className="text-base font-bold text-white transition-all">{d.name}</div>
                      <div className="text-[11px] font-mono text-[#a8b8cc] mb-2 uppercase">{d.class}</div>
                      <div className="flex flex-wrap gap-1">
                        {d.tags.map(t => (
                          <span key={t} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#1c2537] text-[#5a7090]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
 
        {/* Main Content Area */}
        <section className={`flex-1 flex flex-col min-w-0 bg-[#0a0e14] border-r border-[#1e2a3a] overflow-hidden ${isMobile ? 'pb-16' : ''}`}>

          {/* Top Bar Navigation */}
          <div className="px-4 md:px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0 z-10">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-xl transition-colors shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Pill className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-sm md:text-lg font-serif italic text-white tracking-tight truncate">Pharmacology</h1>
                  <span className="text-[8px] md:text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono font-bold">Drug Logic</span>
                </div>
              </div>
            </div>

            {/* Mobile Actions Header */}
            <div className="md:hidden flex items-center gap-1">
              <div className="relative">
                <button 
                  onClick={() => setShowOverflowMenu(!showOverflowMenu)}
                  className="p-3 text-[#5a7090] hover:text-white active:bg-white/10 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
                <AnimatePresence>
                  {showOverflowMenu && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-[#0a0e14]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50"
                    >
                      {[
                        { id: 'search', label: 'Drug Library', icon: Search, action: () => setIsSidebarOpen(true) },
                        { id: 'registry', label: 'Modify Registry', icon: Settings, action: () => { setIsEditingRegistry(!isEditingRegistry); setIsSidebarOpen(true); } },
                        { id: 'quiz', label: 'Jump to Quiz', icon: FileText, action: () => { /* Scroll logic if needed */ } },
                      ].map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setShowOverflowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[#a8b8cc] hover:text-white transition-all active:bg-white/5"
                        >
                          <item.icon className="w-4 h-4" />
                          {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
 
          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
            {/* Drug Header Card */}
            <motion.div 
              key={activeDrugId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#161d2a] border border-[#243044] rounded-3xl p-6 md:p-8 relative overflow-hidden group shadow-xl"
            >
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 blur-3xl pointer-events-none group-hover:bg-amber-600/10 transition-all" />
               
               <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 md:mb-8">
                 <div>
                   <h2 className="text-2xl md:text-3xl font-serif text-white leading-tight">
                     {drugs.find(d => d.id === activeDrugId)?.name || drug.name}
                   </h2>
                   <p className="text-[10px] md:text-xs font-mono text-[#5a7090] mt-2 italic uppercase tracking-wider">
                     {(drugs.find(d => d.id === activeDrugId)?.name || drug.name).toLowerCase()} · {drug.brand}
                   </p>
                 </div>
                 <span className="self-start px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] md:text-[10px] font-mono font-black rounded-full uppercase tracking-tighter">{drug.category}</span>
               </div>

               <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3">
                 {drug.params.map((p: any) => (
                   <div key={p.l} className="bg-[#1c2537] p-3 md:p-4 rounded-xl border border-[#243044]/50 hover:border-amber-500/20 transition-all">
                     <p className="text-[8px] md:text-[9px] font-mono text-[#5a7090] uppercase mb-1 font-black tracking-widest">{p.l}</p>
                     <p className={`text-[11px] md:text-xs font-bold leading-tight ${p.c || 'text-white'}`}>{p.v}</p>
                   </div>
                 ))}
               </div>
            </motion.div>

            {/* MOA Diagram */}
            <div className="bg-[#161d2a] border border-[#243044] rounded-3xl p-6 md:p-8 overflow-x-auto no-scrollbar shadow-inner">
               <h3 className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a7090] mb-6 font-black">Mechanism of Action</h3>
               <div className="flex items-center gap-3 min-w-max">
                 {drug.moa.map((step: any, i: number) => (
                   <React.Fragment key={i}>
                    {i > 0 && <ArrowRight className="w-3 md:w-4 h-3 md:h-4 text-[#2d3d56] shrink-0" />}
                    <div className={`px-4 py-2.5 rounded-xl text-[10px] md:text-xs transition-all shadow-sm ${
                      step.type === 'action' ? 'bg-amber-600/10 border border-amber-500/30 text-amber-500 font-black uppercase tracking-tighter' :
                      step.type === 'inhibited' ? 'bg-rose-500/5 border border-rose-500/20 text-rose-500 line-through decoration-2' :
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
            <div className="bg-[#161d2a] border border-[#243044] rounded-3xl p-6 md:p-8 pb-32 lg:pb-8 shadow-xl">
               <h3 className="text-[9px] md:text-[10px] font-mono uppercase tracking-[0.2em] text-[#5a7090] mb-4 font-black">Interactive Quiz</h3>
               <p className="text-base md:text-lg text-white font-medium mb-8 leading-relaxed">
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
                     className={`w-full text-left p-4 md:p-5 rounded-2xl border text-[11px] md:text-xs transition-all relative overflow-hidden group touch-manipulation ${
                       showExplanation 
                        ? i === drug.quiz.correct 
                          ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                          : selectedAnswer === i 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                            : 'bg-[#1c2537] border-[#243044] text-[#5a7090] opacity-50'
                        : 'bg-[#1c2537] border-[#243044] text-[#a8b8cc] hover:border-amber-500/30 active:bg-amber-500/5'
                     }`}
                   >
                     <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] opacity-40 font-black">{String.fromCharCode(65 + i)}.</span>
                        <span className="flex-1 font-bold leading-normal">{opt}</span>
                        {showExplanation && i === drug.quiz.correct && <CheckCircle2 className="w-5 h-5 text-green-500 animate-in zoom-in" />}
                        {showExplanation && selectedAnswer === i && i !== drug.quiz.correct && <AlertTriangle className="w-5 h-5 text-rose-500 animate-in shake" />}
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
                      <div className="mt-0.5 shrink-0">
                        <Info className="w-4 h-4 text-amber-500" />
                      </div>
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
        </section>

        {/* Mobile Chat Peek / Bottom Drawer */}
        <AnimatePresence>
          {isMobile && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: isChatExpanded ? 0 : 'calc(100% - 64px)' }}
              className="fixed inset-x-0 bottom-0 z-[100] bg-[#111620] md:hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)] border-t border-white/10 rounded-t-[2.5rem]"
              style={{ height: isChatExpanded ? '90vh' : 'auto' }}
            >
              <div 
                className="w-full py-4 flex flex-col items-center cursor-pointer"
                onClick={() => setIsChatExpanded(!isChatExpanded)}
              >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mb-2" />
                {!isChatExpanded && (
                  <div className="px-6 w-full flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#a8b8cc] truncate">
                        {messages[messages.length - 1].content}
                      </span>
                    </div>
                    {isChatExpanded ? <ChevronDown className="w-5 h-5 text-[#5a7090]" /> : <ChevronUp className="w-5 h-5 text-[#5a7090]" />}
                  </div>
                )}
              </div>

              {isChatExpanded && (
                <div className="flex flex-col h-full overflow-hidden">
                   <div className="px-6 pb-4 border-b border-[#1e2a3a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">Pharm Tutor</h3>
                          <p className="text-[10px] text-[#5a7090] font-mono">Socratic Clinical Advisor</p>
                        </div>
                        <button onClick={() => setIsChatExpanded(false)} className="p-2 bg-white/5 rounded-xl">
                          <ChevronDown className="w-5 h-5 text-[#5a7090]" />
                        </button>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-[#0a0e14]">
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                            msg.role === 'user' ? 'bg-amber-600 text-white shadow-lg font-bold' : 'bg-[#161d2a] text-[#e8edf5] border border-[#1e2a3a]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-2 text-amber-500 p-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Consulting...</span>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                   </div>

                   <div className="p-4 bg-[#111620] border-t border-[#1e2a3a] pb-10">
                      <div className="relative">
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          className="w-full bg-[#161d2a] border border-white/10 rounded-2xl p-4 pr-14 text-sm font-bold text-white resize-none h-14 outline-none"
                          placeholder="Type findings..."
                        />
                        <button 
                          onClick={() => handleSendMessage()}
                          className="absolute right-2 bottom-2 p-3 bg-amber-600 text-white rounded-xl shadow-lg active:scale-95"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Chat Panel */}
        {!isMobile && isLargeScreen && (
          <aside className="w-[400px] flex flex-col bg-[#111620] shrink-0 border-l border-[#1e2a3a] overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-6 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-white mb-1">Pharmacology Tutor</h3>
              <p className="text-[11px] font-mono text-[#5a7090]">
                {drugs.find(d => d.id === activeDrugId)?.name || drug.name} module · Socratic mode
              </p>
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
                    <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1 font-black tracking-widest">
                      {msg.role === 'assistant' ? 'Pharm Tutor' : 'Medical Student'}
                    </span>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                      msg.role === 'assistant' 
                        ? 'bg-[#161d2a] rounded-tl-none border border-[#1e2a3a] text-[#e8edf5]' 
                        : 'bg-amber-600 rounded-tr-none text-white font-black'
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
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-2xl p-4 pr-12 text-xs text-white placeholder-[#2d3d56] resize-none h-24 focus:border-amber-500/40 outline-none transition-all shadow-inner"
                  placeholder="Ask about mechanism, side effects, or clinical pearls..."
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute bottom-4 right-4 p-3 bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 shadow-lg shadow-amber-900/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
