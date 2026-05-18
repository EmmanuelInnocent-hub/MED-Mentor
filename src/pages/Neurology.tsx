import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Send,
  ArrowLeft,
  Loader2,
  X,
  MoreVertical,
  FileText,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const initialExamSteps = [
  { id: 1, label: 'Mental status & GCS', status: 'active', penalty: null },
  { id: 2, label: 'Cranial nerves (I–XII)', status: 'todo', penalty: null },
  { id: 3, label: 'Motor system — power & tone', status: 'todo', penalty: null },
  { id: 4, label: 'Deep tendon reflexes', status: 'todo', penalty: null },
  { id: 5, label: 'Sensory examination', status: 'todo', penalty: null },
  { id: 6, label: 'Cerebellar function', status: 'todo', penalty: null },
  { id: 7, label: 'Gait & stance', status: 'todo', penalty: null },
  { id: 8, label: 'Higher cortical functions', status: 'todo', penalty: null },
];

export default function Neurology() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState(initialExamSteps);
  const [scores, setScores] = useState({
    examOrder: 0,
    findings: 0,
    skipped: 0
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Patient presents with suspected acute stroke. We've noted a slight facial asymmetry. How would you like to begin the neurological examination?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1280);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

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

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getModuleResponse('Neurology', [...messages, userMessage]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleStep = (id: number) => {
    setSteps(prev => {
      const nextSteps = prev.map(step => {
        if (step.id === id) {
          return { ...step, status: 'done' as const };
        }
        // Set next item as active if it was todo
        if (step.id === id + 1 && step.status === 'todo') {
          return { ...step, status: 'active' as const };
        }
        return step;
      });

      // Recalculate scores
      const doneCount = nextSteps.filter(s => s.status === 'done').length;
      const skippedCount = nextSteps.filter(s => s.status === 'skipped').length;
      
      setScores({
        examOrder: Math.min(100, Math.round((doneCount / (doneCount + skippedCount || 1)) * 100)),
        findings: 85, // Static for now as per guide
        skipped: skippedCount
      });

      return nextSteps;
    });
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Sidebar - Exam Checklist */}
        {!isMobile && (
          <aside className="w-72 flex flex-col border-r border-[#1e2a3a] bg-[#111620] shrink-0 overflow-hidden">
            <div className="p-6 border-b border-[#1e2a3a]">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#5a7090]">Neuro Exam Checklist</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {steps.map((step) => (
                <motion.div 
                  key={step.id}
                  layout
                  onClick={() => toggleStep(step.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-transparent transition-all cursor-pointer ${
                    step.status === 'active' ? 'bg-purple-500/10 border-purple-500/25' : 
                    step.status === 'done' ? 'bg-green-500/5 border-green-500/15' :
                    step.status === 'skipped' ? 'bg-rose-500/5 border-rose-500/20' : 'hover:bg-[#161d2a]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border-1.5 flex items-center justify-center text-[10px] shrink-0 ${
                    step.status === 'done' ? 'bg-green-500/15 border-green-500 text-green-500' :
                    step.status === 'active' ? 'bg-purple-500/20 border-purple-400 text-purple-400' :
                    step.status === 'skipped' ? 'bg-rose-500/12 border-rose-500 text-rose-500' : 'border-[#243044] text-[#a8b8cc]'
                  }`}>
                    {step.status === 'done' ? '✓' : step.status === 'skipped' ? '!' : step.id}
                  </div>
                  <div className={`text-xs ${step.status === 'active' ? 'text-white font-medium' : 'text-[#a8b8cc]'}`}>
                    {step.label}
                  </div>
                  {step.penalty && (
                    <span className="ml-auto text-[9px] font-mono text-rose-500">{step.penalty}</span>
                  )}
                </motion.div>
              ))}
            </div>
            
            <div className="p-4 m-2 bg-[#161d2a] border border-[#243044] rounded-xl space-y-4">
              <div className="text-[9px] font-mono uppercase tracking-[0.12em] text-[#5a7090]">Session Progress</div>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-[11px] mb-2">
                    <span className="text-[#5a7090]">Exam Order</span>
                    <span className={`${scores.examOrder < 80 ? 'text-amber-500' : 'text-green-500'} font-mono font-bold`}>
                      {scores.examOrder}%
                    </span>
                  </div>
                  <div className="h-1 bg-[#243044] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${scores.examOrder}%` }}
                      className={`h-full ${scores.examOrder < 80 ? 'bg-amber-500' : 'bg-green-500'}`} 
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-[#243044]/50 flex justify-between items-center text-[10px]">
                  <span className="text-[#5a7090] uppercase tracking-wider font-mono">Findings Identified</span>
                  <span className="text-green-500 font-bold font-mono">{scores.findings}%</span>
                </div>

                <div className="pt-2 flex justify-between items-center text-[10px]">
                  <span className="text-[#5a7090] uppercase tracking-wider font-mono">Steps Skipped</span>
                  <span className="text-rose-500 font-bold font-mono">{scores.skipped}</span>
                </div>
              </div>
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
                <div className="p-6 border-b border-[#1e2a3a] flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#5a7090]">Exam Checklist</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-[#5a7090]"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                  <div className="grid grid-cols-1 gap-2 p-2">
                    {steps.map((step) => (
                      <button 
                        key={step.id}
                        onClick={() => {
                          toggleStep(step.id);
                          setIsSidebarOpen(false);
                        }}
                        className={`flex items-center gap-4 p-5 rounded-2xl border transition-all text-left ${
                          step.status === 'active' ? 'bg-purple-500/10 border-purple-500/30' : 
                          step.status === 'done' ? 'bg-green-500/5 border-green-500/20' :
                          'bg-white/5 border-white/5'
                        }`}
                      >
                         <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-mono font-bold text-xs ${
                          step.status === 'done' ? 'bg-green-500/20 border-green-500 text-green-500' :
                          step.status === 'active' ? 'bg-purple-500/30 border-purple-400 text-purple-400' :
                          'border-[#243044] text-[#5a7090]'
                        }`}>
                          {step.status === 'done' ? '✓' : step.id}
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${step.status === 'active' ? 'text-white' : 'text-[#a8b8cc]'}`}>{step.label}</p>
                          <p className="text-[10px] text-[#5a7090] font-mono mt-1 uppercase">Neurological assessment</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
 
        {/* Patient Area */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0a0e14] overflow-hidden border-r border-[#1e2a3a]">
          {/* Top Bar */}
          <div className="px-4 md:px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 min-w-0">
                <Brain className="w-5 h-5 text-purple-500" />
                <h1 className="text-sm md:text-lg font-serif italic text-white tracking-tight truncate">MedMentor · Neurology</h1>
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
                      className="absolute right-0 top-full mt-2 w-48 bg-[#111620]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50"
                    >
                      {[
                        { id: 'checklist', label: 'Exam Checklist', icon: CheckCircle2, action: () => setIsSidebarOpen(true) },
                        { id: 'vitals', label: 'View Vitals', icon: Activity, action: () => {} },
                        { id: 'history', label: 'Brief History', icon: FileText, action: () => {} },
                      ].map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setShowOverflowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-[#a8b8cc] hover:text-white hover:bg-white/5 transition-all text-left"
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

          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar">
            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090] mb-3">Chief Complaint</div>
              <div className="bg-amber-500/5 border border-amber-500/30 rounded-xl p-5 text-[13px] leading-relaxed text-[#a8b8cc] shadow-lg shadow-amber-900/5">
                <strong className="text-amber-500 font-black uppercase tracking-widest mr-2">Chief Complaint:</strong> 
                47-year-old male, sudden onset right-sided weakness and slurred speech, 2-hour onset.
              </div>
            </div>

            <div className="bg-[#161d2a] border border-[#243044] rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-purple-500/15 border border-purple-400/30 flex items-center justify-center font-serif text-xl text-purple-400">BO</div>
                <div>
                  <h2 className="text-base font-semibold text-white">Benjamin O.</h2>
                  <p className="text-[11px] font-mono text-[#5a7090]">47M · Emergency Dept · FAST+</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { label: 'BP', val: '182/104', color: 'text-rose-500', note: 'Hypertensive emergency' },
                  { label: 'HR', val: '88 bpm', color: 'text-[#e8edf5]', note: 'Within normal range' },
                  { label: 'GCS', val: '13/15', color: 'text-amber-500', note: 'Reduced consciousness' },
                  { label: 'SpO2', val: '96%', color: 'text-[#e8edf5]', note: 'Acceptable' },
                  { label: 'Glucose', val: '7.2 mmol/L', color: 'text-[#e8edf5]', note: 'Stroke mimic ruled out' },
                  { label: 'Temp', val: '37.0°C', color: 'text-[#e8edf5]', note: 'Afebrile' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[#1c2537] p-3 rounded-lg border border-[#243044]/50 group transition-all hover:border-purple-500/30">
                    <div className="text-[9px] font-mono uppercase tracking-widest text-[#5a7090] mb-1">{stat.label}</div>
                    <div className={`text-sm font-black ${stat.color} mb-0.5`}>{stat.val}</div>
                    <div className="text-[8px] text-[#5a7090]/80 font-mono italic opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {stat.note}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Neurological Findings So Far</div>
              <div className="bg-[#161d2a] border border-[#243044] rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#1e2a3a]">
                      <th className="p-3 font-mono text-[#5a7090] font-medium uppercase text-[10px]">Finding</th>
                      <th className="p-3 font-mono text-[#5a7090] font-medium uppercase text-[10px]">Side</th>
                      <th className="p-3 font-mono text-[#5a7090] font-medium uppercase text-[10px]">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2a3a]/50">
                    {[
                      { f: 'Facial droop', s: 'Right', r: 'Positive', c: 'text-rose-500' },
                      { f: 'Arm drift', s: 'Right', r: 'Positive', c: 'text-rose-500' },
                      { f: 'Speech', s: '—', r: 'Dysarthric', c: 'text-rose-500' },
                      { f: 'Pupil reflex', s: 'Bilateral', r: 'Normal', c: 'text-green-500' },
                      { f: 'Plantar reflex', s: 'Right', r: 'Extensor/Babinski+', c: 'text-rose-500' },
                      { f: 'Gait', s: '—', r: 'Not assessed', c: 'text-amber-500' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 text-[#e8edf5]">{row.f}</td>
                        <td className="p-3 text-[#5a7090]">{row.s}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full bg-white/5 text-[10px] font-bold ${row.c}`}>
                            {row.r}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
                      <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#a8b8cc] truncate">
                        {messages[messages.length - 1].content}
                      </span>
                    </div>
                    <ChevronUp className="w-5 h-5 text-[#5a7090]" />
                  </div>
                )}
              </div>

              {isChatExpanded && (
                <div className="flex flex-col h-full overflow-hidden">
                   <div className="px-6 pb-4 border-b border-[#1e2a3a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">Neurology Attending</h3>
                          <p className="text-[10px] text-[#5a7090] font-mono uppercase tracking-wider">Exam Order Tracking active</p>
                        </div>
                        <button onClick={() => setIsChatExpanded(false)} className="p-2 bg-white/5 rounded-xl">
                          <ChevronDown className="w-5 h-5 text-[#5a7090]" />
                        </button>
                      </div>
                   </div>

                   <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar bg-[#0a0e14]">
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                          <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${
                            msg.role === 'user' ? 'bg-purple-600 text-white shadow-lg font-bold' : 'bg-[#161d2a] text-[#e8edf5] border border-[#1e2a3a]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-2 text-purple-400 p-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Contemplating...</span>
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
                          placeholder="Describe finding..."
                        />
                        <button 
                          onClick={() => handleSendMessage()}
                          className="absolute right-2 bottom-2 p-3 bg-purple-600 text-white rounded-xl shadow-lg active:scale-95"
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

        {/* Chat Panel */}
        {!isMobile && (
          <aside className="w-[400px] flex flex-col bg-[#111620] shrink-0 border-l border-[#1e2a3a] overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
            <div className="px-6 py-6 border-b border-[#1e2a3a]">
              <h3 className="text-sm font-semibold text-white mb-1">Neurology Attending</h3>
              <p className="text-[11px] font-mono text-[#5a7090]">Stroke protocol active · Exam order tracked</p>
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
                      {msg.role === 'system' ? 'System' : msg.role === 'assistant' ? 'Neurology Attending' : 'Medical Student'}
                    </span>
                    <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                      msg.role === 'system'
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono penalty-msg'
                        : msg.role === 'assistant' 
                        ? 'bg-[#161d2a] rounded-tl-none border border-[#1e2a3a] text-[#e8edf5]' 
                        : 'bg-purple-600 rounded-tr-none text-white font-medium'
                    }`}>
                      {msg.role === 'system' && <span className="mr-2">⚠</span>}
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
                    <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">Neurology Attending</span>
                    <div className="bg-[#161d2a] p-4 rounded-2xl rounded-tl-none border border-[#1e2a3a] flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                      <span className="text-[10px] text-[#5a7090] italic">Attending is contemplating...</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </div>

            <div className="p-6 border-t border-[#1e2a3a] bg-[#111620]">
              <div className="relative">
                <textarea 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-xl p-4 pr-12 text-xs text-white placeholder-[#2d3d56] resize-none h-24 focus:border-purple-500/40 outline-none transition-all"
                  placeholder="Describe your exam findings or ask for guidance..."
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute bottom-4 right-4 p-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 text-white rounded-lg shadow-lg shadow-purple-900/20 transition-all active:scale-95"
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
