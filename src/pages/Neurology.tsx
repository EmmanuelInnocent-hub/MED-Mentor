import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Send,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Panel, 
  Group as PanelGroup, 
  Separator as PanelResizeHandle 
} from 'react-resizable-panels';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const initialExamSteps = [
  { id: 1, label: 'Mental status & GCS', status: 'done', penalty: null },
  { id: 2, label: 'Cranial nerves (I–XII)', status: 'done', penalty: null },
  { id: 3, label: 'Motor system — power & tone', status: 'active', penalty: null },
  { id: 4, label: 'Deep tendon reflexes', status: 'todo', penalty: null },
  { id: 5, label: 'Sensory examination', status: 'todo', penalty: null },
  { id: 6, label: 'Cerebellar function', status: 'todo', penalty: null },
  { id: 7, label: 'Gait & stance', status: 'skipped', penalty: '-5 pts' },
  { id: 8, label: 'Higher cortical functions', status: 'todo', penalty: null },
];

export default function Neurology() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [steps, setSteps] = useState(initialExamSteps);
  const [scores, setScores] = useState({
    examOrder: 72,
    findings: 85,
    skipped: 1
  });
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Good — you've identified a right facial droop, right arm drift, and dysarthric speech. The FAST screen is clearly positive. Now you need to proceed with the motor examination systematically. Test upper and lower limb power bilaterally using the MRC scale. What would you expect to find, and why?"
    },
    {
      role: 'system',
      content: "Gait assessment was skipped before proceeding — this step is required in all neuro exams. -5 points applied."
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1280);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1280);
      setIsMobile(window.innerWidth < 768);
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
      <PanelGroup orientation={isMobile ? "vertical" : "horizontal"} className="flex-1 overflow-hidden">
        
        {/* Sidebar - Exam Checklist */}
        {!isMobile && (
          <>
            <Panel 
              defaultSize={33} 
              minSize={0} 
              maxSize={100}
              className="flex flex-col border-r border-[#1e2a3a] bg-[#111620]"
            >
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
            </Panel>

            <PanelResizeHandle className="w-1.5 hover:w-2 transition-all bg-transparent hover:bg-purple-500/20 active:bg-purple-500/40 relative z-50">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20" />
            </PanelResizeHandle>
          </>
        )}

        {/* Patient Area */}
        <Panel 
          defaultSize={isMobile ? 100 : 34} 
          minSize={0}
          maxSize={100}
          className="flex flex-col min-w-0 bg-[#0a0e14]"
        >
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
                <Brain className="w-5 h-5 text-purple-500" />
                <h1 className="text-lg font-serif italic text-white tracking-tight">MedMentor · Neurology</h1>
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
        </Panel>

        <PanelResizeHandle className="w-1.5 hover:w-2 transition-all bg-transparent hover:bg-purple-500/20 active:bg-purple-500/40 relative z-50">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20" />
        </PanelResizeHandle>

        {/* Chat Panel */}
        <Panel 
          defaultSize={isMobile ? 100 : 33} 
          minSize={0}
          maxSize={100}
          className="flex flex-col bg-[#111620] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] lg:h-auto shrink-0"
        >
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
        </Panel>
      </PanelGroup>
    </div>
  );
}
