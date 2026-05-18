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
  Minus,
  Menu,
  MoreVertical,
  X,
  ChevronUp,
  ChevronDown,
  Settings,
  Send
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const thumbs = [
  { id: '4x', label: '4x — Low power', svg: 'M 30,30 m -20,0 a 20,15 0 1,0 40,0 a 20,15 0 1,0 -40,0', description: 'General architecture' },
  { id: '10x', label: '10x — Medium', svg: 'M 40,35 m -28,0 a 28,20 0 1,0 56,0 a 28,20 0 1,0 -56,0', description: 'Glandular patterns' },
  { id: '40x', label: '40x — Active', active: true, description: 'Cellular detail' },
  { id: '100x', label: '100x — Oil', svg: 'M 55,40 m -15,0 a 15,10 0 1,0 30,0 a 15,10 0 1,0 -30,0', description: 'Nuclear features' },
  { id: 'pas', label: 'PAS stain', svg: 'M 40,35 m -28,0 a 28,20 0 1,0 56,0 a 28,20 0 1,0 -56,0', description: 'Basement membranes' },
  { id: 'ck7', label: 'IHC — CK7', svg: 'M 40,35 m -28,0 a 28,20 0 1,0 56,0 a 28,20 0 1,0 -56,0', description: 'Cytokeratin markers' },
];

export default function Pathology() {
  const navigate = useNavigate();
  const [activeThumb, setActiveThumb] = useState('40x');
  const [zoom, setZoom] = useState(1);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to the Pathology station. We have a H&E stain of a tissue biopsy. What are your initial observations of the architecture at this power?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        
        {/* Desktop Sidebar - Views/Thumbnails */}
        {!isMobile && (
          <aside className="w-72 flex flex-col border-r border-[#1e2a3a] bg-[#111620] shrink-0 overflow-hidden">
            <div className="p-6 border-b border-[#1e2a3a]">
              <h3 className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#5a7090]">Slide Views</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {thumbs.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => setActiveThumb(t.id)}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all flex flex-col gap-2 ${
                    activeThumb === t.id ? 'bg-[#161d2a] border-teal-500 shadow-lg shadow-teal-900/20' : 'border-transparent hover:bg-[#161d2a]/50'
                  }`}
                >
                  <div className={`w-full h-16 rounded-lg overflow-hidden flex items-center justify-center ${t.id === 'pas' ? 'bg-[#e8f0e0]' : t.id === 'ck7' ? 'bg-[#e8e0f0]' : 'bg-[#f0e0d8]'}`}>
                    <div className="w-10 h-8 bg-[#c8a0b8]/40 rounded-full border border-black/10" />
                  </div>
                  <div className="text-[10px] font-bold text-white px-1">
                    {t.label}
                  </div>
                </button>
              ))}
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
                className="fixed bottom-0 left-0 right-0 h-[70vh] bg-[#111620] z-[120] md:hidden rounded-t-[2.5rem] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-4 flex-shrink-0" />
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-[#a8b8cc]">Slide Selection</h3>
                  <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500"><X className="w-5 h-5"/></button>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 grid grid-cols-2 gap-4">
                  {thumbs.map((t) => (
                    <button 
                      key={t.id}
                      onClick={() => {
                        setActiveThumb(t.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`text-left p-4 rounded-3xl border-2 transition-all flex flex-col gap-3 ${
                        activeThumb === t.id ? 'bg-[#161d2a] border-teal-500 shadow-[0_0_20px_rgba(20,184,166,0.2)]' : 'border-[#1e2a3a] bg-[#0a0e14]/40'
                      }`}
                    >
                      <div className={`w-full h-24 rounded-2xl overflow-hidden flex items-center justify-center ${t.id === 'pas' ? 'bg-[#e8f0e0]' : t.id === 'ck7' ? 'bg-[#e8e0f0]' : 'bg-[#f0e0d8]'}`}>
                        <Microscope className="w-8 h-8 text-[#c8a0b8]" />
                      </div>
                      <div>
                        <div className={`text-xs font-black uppercase tracking-widest transition-colors ${activeThumb === t.id ? 'text-white' : 'text-[#5a7090]'}`}>
                          {t.id.toUpperCase()}
                        </div>
                        <div className="text-[10px] text-[#5a7090] mt-1 line-clamp-1">{t.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
 
        <section className={`flex-1 flex flex-col min-w-0 bg-[#0d1008] border-r border-[#1e2a3a] overflow-hidden ${isMobile ? 'pb-16' : ''}`}>
          {/* Top Bar Navigation */}
          <div className="px-4 md:px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0 z-10">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <button 
                onClick={() => navigate(-1)}
                className="p-2.5 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-xl transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
                id="back-btn"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <Microscope className="w-5 h-5 text-teal-500 shrink-0" />
                <h1 className="text-sm md:text-lg font-serif italic text-white tracking-tight truncate">Pathology Station</h1>
              </div>
            </div>

            {/* Mobile Actions */}
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
                      className="absolute right-0 top-full mt-2 w-48 bg-[#0a0e14]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden"
                    >
                      {[
                        { id: 'slides', label: 'Slide Selection', icon: Menu, action: () => setIsSidebarOpen(true) },
                        { id: 'reset', label: 'Reset Zoom', icon: Maximize, action: () => setZoom(1) },
                        { id: 'atlas', label: 'Stain Info', icon: Settings, action: () => {} },
                      ].map((item) => (
                        <button 
                          key={item.id}
                          onClick={() => {
                            item.action();
                            setShowOverflowMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-[#a8b8cc] hover:text-white transition-all active:bg-white/5"
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

          <div className="flex-1 flex flex-col min-w-0 bg-[#0d1008] relative">
            {/* Slide Viewer Area */}
            <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden touch-none">
              <motion.div 
                animate={{ scale: zoom }}
                className="relative w-full h-[60vh] md:h-full lg:max-w-4xl flex items-center justify-center bg-[#f5e8e0] shadow-2xl rounded-3xl border border-black/20 overflow-hidden"
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
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse flex-shrink-0" />
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
                   {/* Mobile Peer Review/Objectives Header */}
                   <div className="px-6 pb-4 border-b border-[#1e2a3a]">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-[0.1em] text-white">Pathology Tutor</h3>
                          <p className="text-[10px] text-[#5a7090] font-mono uppercase tracking-wider">H&E · Diagnostic Lab</p>
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
                            msg.role === 'user' ? 'bg-teal-600 text-white shadow-lg font-bold' : 'bg-[#161d2a] text-[#e8edf5] border border-[#1e2a3a]'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex items-center gap-2 text-teal-400 p-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Analyzing slides...</span>
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
                          className="absolute right-2 bottom-2 p-3 bg-teal-600 text-white rounded-xl shadow-lg active:scale-95"
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

        {/* Desktop Chat / Analysis Panel */}
        {!isMobile && (
          <aside className="w-[400px] flex flex-col bg-[#111620] shrink-0 border-l border-[#1e2a3a] overflow-hidden shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
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
                    className="flex flex-col items-start home-typing-indicator"
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
          </aside>
        )}
      </div>
    </div>
  );
}
