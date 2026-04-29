import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  ChevronRight, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Info, 
  ArrowLeft,
  Send,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { getModuleResponse } from '../lib/gemini';
import { Message } from '../types';

const BodySVG = ({ system }: { system: string }) => {
  const isCardio = system === 'cardio';
  const isResp = system === 'resp';
  
  return (
    <svg className="w-full h-full lg:max-w-md drop-shadow-[0_0_40px_rgba(45,212,191,0.15)]" viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="heartGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#7f1d1d"/>
                <stop offset="100%" stopColor="#450a0a"/>
            </radialGradient>
            <radialGradient id="chamberGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#dc2626" stopOpacity=".3"/>
                <stop offset="100%" stopColor="#991b1b" stopOpacity=".1"/>
            </radialGradient>
            <radialGradient id="lungGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#a5f3fc" stopOpacity=".4"/>
                <stop offset="100%" stopColor="#0891b2" stopOpacity=".1"/>
            </radialGradient>
        </defs>
        
        {/* Silhouette */}
        <path d="M200 30 C280 25 360 80 370 180 C380 280 320 370 200 400 C80 370 20 280 30 180 C40 80 120 25 200 30Z" fill="none" stroke="#2a3a4a" strokeWidth="1.5" strokeDasharray="4 3" opacity=".6"/>
        
        {/* Cardiovascular */}
        <AnimatePresence>
          {isCardio && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <path d="M200 55 C265 50 340 95 348 190 C356 270 300 350 200 385 C100 350 44 270 52 190 C60 95 135 50 200 55Z" fill="url(#heartGrad)" stroke="#7f1d1d" strokeWidth="1.5"/>
              <ellipse cx="155" cy="150" rx="55" ry="50" fill="url(#chamberGrad)" stroke="#ef4444" strokeWidth="1" opacity=".8"/>
              <ellipse cx="245" cy="145" rx="50" ry="46" fill="url(#chamberGrad)" stroke="#f87171" strokeWidth="1" opacity=".8"/>
              <path d="M110 200 Q130 280 200 330 Q170 290 145 210Z" fill="rgba(220,38,38,0.2)" stroke="#ef4444" strokeWidth="1"/>
              <path d="M200 200 Q245 280 200 340 Q280 300 290 210Z" fill="rgba(220,38,38,0.2)" stroke="#f87171" strokeWidth="1"/>
            </motion.g>
          )}
        </AnimatePresence>

        {/* Respiratory */}
        <AnimatePresence>
          {isResp && (
            <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <path d="M180 80 L220 80 L210 180 L190 180 Z" fill="#243044" stroke="#5a7090" strokeWidth="1" />
              <path d="M180 160 Q80 180 60 300 Q140 380 190 320" fill="url(#lungGrad)" stroke="#06b6d4" strokeWidth="1.5" />
              <path d="M220 160 Q320 180 340 300 Q260 380 210 320" fill="url(#lungGrad)" stroke="#06b6d4" strokeWidth="1.5" />
            </motion.g>
          )}
        </AnimatePresence>
    </svg>
  );
};

const bodySystems = [
  { id: 'cardio', name: 'Cardiovascular', color: 'bg-rose-500' },
  { id: 'resp', name: 'Respiratory', color: 'bg-blue-400' },
  { id: 'neuro', name: 'Nervous system', color: 'bg-purple-500' },
  { id: 'digest', name: 'Digestive', color: 'bg-amber-500' },
  { id: 'msk', name: 'Musculoskeletal', color: 'bg-teal-500' },
];

const allHotspots: Record<string, any[]> = {
  cardio: [
    { top: '24%', left: '57%', label: 'Aorta', info: 'Largest vessel in the body, originating from the left ventricle.' },
    { top: '35%', left: '35%', label: 'Right Atrium', info: 'Receives deoxygenated blood from the body via SVC/IVC.' },
    { top: '48%', left: '54%', label: 'Left Ventricle', info: 'The strongest chamber, pumping oxygenated blood to the whole body.' }
  ],
  resp: [
    { top: '22%', left: '50%', label: 'Trachea', info: 'Connecting the larynx to the bronchi, kept open by C-shaped cartilaginous rings.' },
    { top: '60%', left: '25%', label: 'Right Lung', info: 'Has three lobes (Superior, Middle, Inferior) and is slightly larger than the left.' },
    { top: '60%', left: '75%', label: 'Left Lung', info: 'Has two lobes and a cardiac notch to accommodate the heart.' }
  ]
};

export default function Anatomy() {
  const navigate = useNavigate();
  const [activeSystem, setActiveSystem] = useState('cardio');
  const [selectedStruct, setSelectedStruct] = useState<any>(null);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Welcome to the Anatomy lab. We are currently focusing on the Cardiovascular system. I see you've highlighted the heart chambers. Trace the path of blood from the Right Atrium to the Aorta — can you name all the valves it passes through?"
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hotspots = allHotspots[activeSystem] || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    setSelectedStruct(null);
    const sysName = bodySystems.find(s => s.id === activeSystem)?.name;
    setMessages([{
      role: 'assistant',
      content: `Switched to the ${sysName} system. Explore the hotspots to identify key structures. What would you like to focus on in this region?`
    }]);
  }, [activeSystem]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await getModuleResponse(`Anatomy (${activeSystem})`, [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Chat error:', error);
    } finally {
      setIsTyping(false);
    }
  };

  const handleHotspotClick = (hs: any) => {
    setSelectedStruct(hs);
    // Trigger tutor comment about the structure
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `I see you are looking at the ${hs.label}. ${hs.info} What clinical conditions often affect this specific structure?`
    }]);
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Sidebar - Systems */}
        <div className="hidden xl:flex w-64 flex-col border-r border-[#1e2a3a] bg-[#111620]">
          <div className="p-6 border-b border-[#1e2a3a]">
             <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Body Systems</h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-px custom-scrollbar">
            {bodySystems.map((sys) => (
              <button 
                key={sys.id}
                onClick={() => setActiveSystem(sys.id)}
                className={`w-full text-left px-6 py-3.5 flex items-center gap-3 transition-all ${
                  activeSystem === sys.id ? 'bg-[#161d2a] border-l-2 border-teal-400' : 'hover:bg-[#161d2a]/50 border-l-2 border-transparent'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${sys.color}`} />
                <span className={`text-[13px] font-medium ${activeSystem === sys.id ? 'text-white' : 'text-[#a8b8cc]'}`}>
                  {sys.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Viewer Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-br from-[#0d1a20] to-[#050a0e] relative">
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 px-6 py-4 border-b border-[#1e2a3a]/30 flex items-center justify-between bg-[#111620]/40 backdrop-blur-xl z-10">
             <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <Box className="w-5 h-5 text-teal-400" />
                <h1 className="text-lg font-serif italic text-white tracking-tight">Anatomy Explorer</h1>
              </div>
            </div>
            <div className="flex gap-2">
               <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-teal-400 transition-all hover:bg-teal-500/10"><RotateCcw className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center p-8 group overflow-hidden">
             <BodySVG system={activeSystem} />
             
             {hotspots.map((hs, i) => (
               <motion.div 
                 key={`${activeSystem}-${i}`}
                 initial={{ opacity: 0, scale: 0.5 }}
                 animate={{ opacity: 1, scale: 1 }}
                 transition={{ delay: i * 0.1 }}
                 className="absolute cursor-pointer transition-transform hover:scale-125 group/hs z-20"
                 style={{ top: hs.top, left: hs.left }}
                 onClick={() => handleHotspotClick(hs)}
               >
                 <div className="w-5 h-5 rounded-full border-2 border-teal-500/50 bg-teal-500/10 flex items-center justify-center relative">
                   <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-20" />
                   <div className="w-1.5 h-1.5 bg-teal-400 rounded-full" />
                 </div>
               </motion.div>
             ))}

             <AnimatePresence>
              {selectedStruct && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="absolute top-24 right-6 md:right-12 w-64 bg-[#111620]/90 backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-2xl z-30"
                >
                  <h3 className="text-base font-serif text-teal-400 mb-1">{selectedStruct.label}</h3>
                  <p className="text-xs text-[#a8b8cc] leading-relaxed mb-6">{selectedStruct.info}</p>
                  <button 
                    onClick={() => setSelectedStruct(null)} 
                    className="w-full py-2 bg-white/5 border border-white/10 rounded-lg text-[10px] font-mono text-[#5a7090] hover:text-white transition-colors"
                  >
                    DISMISS
                  </button>
                </motion.div>
              )}
             </AnimatePresence>
          </div>
        </div>

        {/* Tutor Panel */}
        <div className="w-full lg:w-[450px] flex flex-col bg-[#111620] shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
           <div className="px-6 py-6 border-b border-[#1e2a3a] shrink-0">
             <h3 className="text-sm font-semibold text-white mb-1">Anatomy Tutor</h3>
             <p className="text-[11px] font-mono text-[#5a7090] uppercase tracking-wider">{activeSystem} LAB ACTIVE</p>
           </div>
           
           <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#0a0e14] custom-scrollbar">
             <AnimatePresence mode="popLayout">
               {messages.map((msg, idx) => (
                 <motion.div 
                   key={idx}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                 >
                   <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">
                     {msg.role === 'assistant' ? 'Anatomy Tutor' : 'Medical Student'}
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
                   <span className="text-[9px] font-mono uppercase text-[#5a7090] mb-1">Anatomy Tutor</span>
                   <div className="bg-[#161d2a] p-3 rounded-2xl rounded-tl-none border border-[#1e2a3a] flex items-center gap-2">
                     <Loader2 className="w-3 h-3 animate-spin text-teal-400" />
                     <span className="text-[10px] text-[#5a7090] italic">Browsing atlas...</span>
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
                  className="w-full bg-[#161d2a] border border-[#243044] rounded-xl p-4 pr-12 text-xs text-white placeholder-[#2d3d56] resize-none h-20 focus:border-teal-500/40 outline-none transition-all"
                  placeholder="Ask about anatomical landmarks, origins, or insertions..." 
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="absolute bottom-4 right-4 p-2 bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-lg transition-all active:scale-95"
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
