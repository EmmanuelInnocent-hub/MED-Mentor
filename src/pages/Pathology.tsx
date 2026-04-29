import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus,
  ArrowLeft,
  Search,
  Maximize,
  ArrowRight,
  Microscope,
  Info,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Minus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const thumbs = [
  { id: '4x', label: '4x — Low power', svg: 'M 30,30 m -20,0 a 20,15 0 1,0 40,0 a 20,15 0 1,0 -40,0' },
  { id: '10x', label: '10x — Medium', svg: 'M 40,35 m -28,0 a 28,20 0 1,0 56,0 a 28,20 0 1,0 -56,0' },
  { id: '40x', label: '40x — Active', active: true },
  { id: '100x', label: '100x — Oil', svg: 'M 55,40 m -15,0 a 15,10 0 1,0 30,0 a 15,10 0 1,0 -30,0' },
  { id: 'pas', label: 'PAS stain', svg: 'M 40,35 m -28,0 a 28,20 0 1,0 56,0 a 28,20 0 1,0 -56,0' },
  { id: 'ck7', label: 'IHC — CK7', svg: 'M 40,35 m -28,0 a 28,20 0 1,0 56,0 a 28,20 0 1,0 -56,0' },
];

export default function Pathology() {
  const navigate = useNavigate();
  const [activeThumb, setActiveThumb] = useState('40x');
  const [zoom, setZoom] = useState(1);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Good. You've correctly identified this as glandular epithelial tissue — likely from the lung or colon. Now look carefully at the glandular architecture at 40x. What specific features of the glands strike you as abnormal? Focus on the nuclear morphology and the regularity of the gland borders."
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
      const response = await getModuleResponse('Pathology', [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        <div className="flex-1 flex flex-col min-w-0 bg-[#0d1008] border-r border-[#1e2a3a]">
          {/* Top Bar */}
          <div className="px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors"
                id="back-btn"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <Microscope className="w-5 h-5 text-teal-500" />
                <h1 className="text-lg font-serif italic text-white tracking-tight">Pathology</h1>
                <span className="text-[10px] px-2 py-1 rounded-full bg-teal-500/15 text-teal-400 font-mono font-bold">Microscopy</span>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <div className="flex bg-[#161d2a] rounded-lg p-1 border border-[#243044]">
                {['4x', '10x', '40x', '100x'].map(mag => (
                  <button 
                    key={mag}
                    onClick={() => setActiveThumb(mag)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                      activeThumb === mag ? 'bg-teal-600/20 text-teal-400' : 'text-[#5a7090] hover:text-white'
                    }`}
                  >
                    {mag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slide Viewer Area */}
          <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <motion.div 
              animate={{ scale: zoom }}
              className="relative w-full h-full lg:max-w-4xl flex items-center justify-center bg-[#f5e8e0] shadow-2xl rounded-sm border border-black/20 overflow-hidden"
            >
              <svg className="w-full h-full p-4" viewBox="0 0 900 500" xmlns="http://www.w3.org/2000/svg">
                <rect width="900" height="500" fill="#f5e8e0"/>
                <rect width="900" height="500" fill="#e8d5c8" opacity=".5"/>
                <g opacity={activeThumb === 'pas' ? 0.3 : 0.9}>
                   {/* Simulated glands */}
                  <ellipse cx="140" cy="120" rx={55 + (activeThumb === '100x' ? 20 : 0)} ry={40} fill={activeThumb === 'ck7' ? "#a0b8c8" : "#c8a0b8"} stroke={activeThumb === 'ck7' ? "#5a7a8b" : "#8b5a7a"} strokeWidth="1.5"/>
                  <ellipse cx="500" cy="150" rx={65 + (activeThumb === '10x' ? -20 : 0)} ry={48} fill={activeThumb === 'ck7' ? "#90a8b8" : "#b890a8"} stroke={activeThumb === 'ck7' ? "#4a6a7a" : "#7a4a6a"} strokeWidth="2"/>
                  <ellipse cx="740" cy="300" rx={58} ry={44} fill={activeThumb === 'ck7' ? "#a0b8c8" : "#c8a0b8"} stroke="#8b5a7a" strokeWidth="1.5"/>
                  {/* Nuclei */}
                  <g fill={activeThumb === 'pas' ? "#800040" : "#3a1a4a"}>
                    <circle cx="120" cy="110" r="5"/><circle cx="140" cy="100" r="6"/><circle cx="160" cy="120" r="5"/>
                    <circle cx="480" cy="140" r="8"/><circle cx="510" cy="130" r="7"/><circle cx="530" cy="160" r="8"/>
                  </g>
                </g>
                {activeThumb === 'pas' && (
                  <path d="M0 0 L900 500 M900 0 L0 500" stroke="#ff00ff" strokeWidth="0.5" opacity="0.1" />
                )}
                <text x="20" y="480" fill="#8a6a7a" className="font-mono text-[10px]">{activeThumb.toUpperCase()} · Slide ID: #442-PT</text>
              </svg>

              {/* Reticle - only visible if zoomed or active */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border-2 border-teal-500/20 rounded-md pointer-events-none">
                <div className="absolute inset-0 bg-teal-500/5 backdrop-blur-[2px]" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-teal-500/10" />
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-px bg-teal-500/10" />
              </div>

              {/* Metadata Overlays */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-mono text-white/60">{activeThumb.includes('x') ? 'H&E STAIN' : activeThumb.toUpperCase()}</span>
                <span className="px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[9px] font-mono text-white/60">{activeThumb} MAG</span>
              </div>
            </motion.div>
            
            {/* Viewport Control */}
            <div className="absolute top-12 left-12 flex flex-col gap-2">
              <div className="p-1 bg-[#111620]/80 backdrop-blur-xl border border-[#243044] rounded-lg flex flex-col">
                <button 
                  onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
                  className="p-2 text-[#5a7090] hover:text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
                  className="p-2 text-[#5a7090] hover:text-white transition-colors border-t border-[#243044]"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {setZoom(1); setActiveThumb('40x')}}
                  className="p-2 text-[#5a7090] hover:text-white transition-colors border-t border-[#243044]"
                >
                  <Maximize className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnail Strip */}
          <div className="h-[120px] bg-[#111620] border-t border-[#1e2a3a] flex items-center gap-4 px-6 overflow-x-auto no-scrollbar shrink-0">
             <div className="text-[10px] font-mono uppercase text-[#5a7090] shrink-0">Select view:</div>
             {thumbs.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setActiveThumb(t.id)}
                  className={`relative w-28 h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    activeThumb === t.id ? 'border-teal-500 shadow-lg shadow-teal-900/20' : 'border-[#243044] hover:border-[#2d3d56]'
                  }`}
                >
                  <div className={`w-full h-full flex items-center justify-center ${t.id === 'pas' ? 'bg-[#e8f0e0]' : t.id === 'ck7' ? 'bg-[#e8e0f0]' : 'bg-[#f0e0d8]'}`}>
                    <div className="w-12 h-10 bg-[#c8a0b8]/40 rounded-full border border-black/10" />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 py-1 px-2 bg-black/70 backdrop-blur-sm text-[8px] font-mono text-white/80">
                    {t.label}
                  </div>
                </button>
             ))}
          </div>
        </div>

        {/* Chat / Analysis Panel */}
        <div className="w-full lg:w-[450px] flex flex-col bg-[#111620] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
           <div className="px-6 py-6 border-b border-[#1e2a3a]">
             <h3 className="text-sm font-semibold text-white mb-1">Pathology Tutor</h3>
             <p className="text-[11px] font-mono text-[#5a7090]">H&E slide · Diagnostic analysis</p>
           </div>
           
           <div className="p-4 bg-[#161d2a] space-y-3">
             <div className="flex items-center gap-3">
               <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-[10px] text-green-500">✓</div>
               <span className="text-xs text-[#5a7090] line-through">Identify tissue type</span>
             </div>
             <div className="flex items-center gap-3">
               <div className="w-5 h-5 rounded-full bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-[10px] text-teal-500">2</div>
               <span className="text-xs text-white font-medium">Identify pathological features</span>
             </div>
             <div className="flex items-center gap-3 opacity-40">
               <div className="w-5 h-5 rounded-full border border-[#243044] flex items-center justify-center text-[10px] text-[#5a7090]">3</div>
               <span className="text-xs text-[#5a7090]">Differential diagnosis</span>
             </div>
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
                     {msg.role === 'assistant' ? 'Pathology Tutor' : 'Medical Student'}
                   </span>
                   <div className={`p-4 rounded-2xl text-xs leading-relaxed max-w-[90%] ${
                     msg.role === 'assistant' 
                       ? 'bg-[#161d2a] rounded-tl-none border border-[#1e2a3a] text-[#e8edf5]' 
                       : 'bg-teal-600 rounded-tr-none text-white'
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
                   <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">Pathology Tutor</span>
                   <div className="bg-[#161d2a] p-3 rounded-2xl rounded-tl-none border border-[#1e2a3a] flex items-center gap-2">
                     <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                     <span className="text-[10px] text-[#5a7090] italic">Analyzing morphology...</span>
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
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-xl p-4 pr-12 text-xs text-white placeholder-[#2d3d56] resize-none h-24 focus:border-teal-500/40 outline-none transition-all"
                  placeholder="Describe cellular morphology or ask the tutor..."
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute bottom-4 right-4 p-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95 shadow-lg shadow-teal-900/20"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
