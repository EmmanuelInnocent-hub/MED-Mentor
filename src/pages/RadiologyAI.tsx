import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Search, 
  Settings, 
  Activity, 
  Plus, 
  Send, 
  Upload, 
  Pencil, 
  Maximize, 
  Layout,
  Construction,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getChatResponse } from '../lib/gemini';
import { Message } from '../types';

interface CaseItem {
  id: string;
  name: string;
  meta: string;
  status?: 'new' | 'in-progress' | 'completed' | 'hard';
  description?: string;
  type: 'case' | 'folder';
  children?: CaseItem[];
}

const caseLibrary: CaseItem[] = [
  {
    id: 'thoracic',
    name: 'Thoracic Radiology',
    meta: '24 Cases',
    type: 'folder',
    children: [
      {
        id: 'acute-chest',
        name: 'Acute Chest / ER',
        meta: '8 Cases',
        type: 'folder',
        children: [
          { id: '001', name: 'Chest X-Ray #001', meta: 'PA view · 58y', status: 'in-progress', description: 'Fever, cough, and right-sided pleuritic chest pain for 4 days.', type: 'case' },
          { id: '031', name: 'Chest CT #031', meta: 'Coronal · 71y', status: 'new', description: 'Suspected PE, acute shortness of breath.', type: 'case' },
        ]
      },
      {
        id: 'oncology-chest',
        name: 'Thoracic Oncology',
        meta: '12 Cases',
        type: 'folder',
        children: [
          { id: '045', name: 'Lung Mass #045', meta: 'PET/CT · 62y', status: 'hard', type: 'case' },
        ]
      }
    ]
  },
  {
    id: 'neuro',
    name: 'Neuroradiology',
    meta: '15 Cases',
    type: 'folder',
    children: [
      { id: '007', name: 'Brain MRI #007', meta: 'T2 FLAIR · 34y', status: 'completed', type: 'case' },
    ]
  },
  {
    id: 'msk',
    name: 'Musculoskeletal',
    meta: '32 Cases',
    type: 'folder',
    children: [
      { id: '022', name: 'Pelvis X-Ray #022', meta: 'AP view · 67y', status: 'completed', type: 'case' },
      { id: '014', name: 'CT Abdomen #014', meta: 'Axial · 42y', status: 'hard', type: 'case' },
    ]
  }
];

const badgeStyles = {
  'new': 'bg-blue-500/10 text-blue-400',
  'in-progress': 'bg-amber-500/10 text-amber-400',
  'completed': 'bg-emerald-500/10 text-emerald-400',
  'hard': 'bg-rose-500/10 text-rose-400'
};

function RecursiveCaseItem({ item, activeId, onSelect, depth = 0 }: { 
  item: CaseItem; 
  activeId: string; 
  onSelect: (item: CaseItem) => void;
  depth?: number;
}) {
  const [isOpen, setIsOpen] = useState(depth === 0);
  const isFolder = item.type === 'folder';

  return (
    <div className="flex flex-col">
      <button
        onClick={() => isFolder ? setIsOpen(!isOpen) : onSelect(item)}
        className={`w-full text-left p-3 transition-all flex flex-col ${
          activeId === item.id 
            ? 'bg-blue-600/10 border-l-2 border-l-blue-500' 
            : 'hover:bg-white/5 border-l-2 border-l-transparent'
        }`}
        style={{ paddingLeft: `${(depth + 1) * 16}px` }}
      >
        <div className="flex items-center gap-2 group">
          {isFolder ? (
            <Layout className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'} text-slate-500`} />
          ) : (
            <div className={`w-1.5 h-1.5 rounded-full ${activeId === item.id ? 'bg-blue-500' : 'bg-slate-700'}`} />
          )}
          <span className={`text-[11px] font-bold ${isFolder ? 'text-slate-400' : 'text-slate-200'}`}>
            {item.name}
          </span>
        </div>
        {!isFolder && (
          <div className="pl-4">
            <div className="text-[9px] text-slate-500 font-mono italic mt-1">{item.meta}</div>
            {item.status && (
              <span className={`inline-block mt-1.5 text-[7px] font-black uppercase px-2 py-0.5 rounded-md ${badgeStyles[item.status]}`}>
                {item.status.replace('-', ' ')}
              </span>
            )}
          </div>
        )}
      </button>

      {isFolder && isOpen && item.children && (
        <div className="border-l border-white/5 ml-[22px]">
          {item.children.map((child) => (
            <RecursiveCaseItem 
              key={child.id} 
              item={child} 
              activeId={activeId} 
              onSelect={onSelect} 
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RadiologyAI() {
  const navigate = useNavigate();
  const initialCase = (caseLibrary[0] as any).children?.[0]?.children?.[0] || caseLibrary[0];
  const [activeCase, setActiveCase] = useState<CaseItem>(initialCase);
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Take your time reviewing this PA chest X-ray of a 58-year-old male presenting with fever, productive cough, and right-sided pleuritic chest pain for 4 days.\n\nStart by describing what you see systematically. What's your first impression of the lung fields?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setIsTyping(true);

    try {
      const messagesWithSystem: Message[] = [
        { 
          role: 'system', 
          content: `You are an attending radiologist conducting a Socratic teaching session. The following is a PA chest X-ray simulation. 
          Case: ${activeCase.name} - ${activeCase.description || activeCase.meta}. 
          Key finding: Right lower lobe consolidation consistent with pneumonia, mild cardiomegaly. 
          Guide the student to identify findings systematically (ABCDE: Airway, Bones, Cardiac, Diaphragm, Everything else/fields). 
          Ask ONE probing question at a time. Do not reveal the diagnosis until they have identified the findings themselves. 
          Tone: Professional, clinical, and mentoring.` 
        },
        ...newMessages
      ];

      const response = await getChatResponse(messagesWithSystem);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Calibration error. Please rephrase your findings." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#04070a] relative">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Sidebar - Case Library */}
        <div className="hidden xl:flex w-72 flex-col border-r border-white/5 bg-[#080c14]">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Case Library</h3>
            <button className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-2">
            {caseLibrary.map((item) => (
              <RecursiveCaseItem 
                key={item.id} 
                item={item} 
                activeId={activeCase.id} 
                onSelect={setActiveCase}
              />
            ))}
          </div>
          <div className="p-6 border-t border-white/5">
            <button 
              onClick={() => setIsUploadVisible(true)}
              className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2 group"
            >
              <Upload className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100" />
              <span className="text-[10px] font-black uppercase tracking-widest">External DICOM</span>
            </button>
          </div>
        </div>

        {/* Main Viewer area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#020408] border-b lg:border-b-0 lg:border-r border-white/5">
          {/* Top Bar Navigation */}
          <div className="px-4 md:px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#080c14]/80 backdrop-blur-xl shrink-0">
            <div className="flex items-center gap-3 md:gap-4 min-w-0">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-white/5 text-slate-500 hover:text-white rounded-lg transition-colors shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-[11px] md:text-sm font-black uppercase tracking-tight text-white truncate">
                    Diagnostic <span className="text-blue-500">Workstation</span>
                  </h1>
                  <p className="text-[8px] md:text-[9px] text-slate-500 font-mono tracking-widest truncate">
                    {activeCase.name} · RADIOLOGY AI
                  </p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <div className="flex bg-[#04070a] rounded-lg p-1 border border-white/5">
                <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-[10px] font-bold">Viewer</button>
                <button className="px-3 py-1.5 text-slate-500 text-[10px] font-bold hover:text-white">Analysis</button>
                <button className="px-3 py-1.5 text-slate-500 text-[10px] font-bold hover:text-white">Report</button>
              </div>
            </div>

            {/* Mobile Actions Drawer Toggle */}
            <div className="md:hidden flex items-center gap-2">
              <button className="p-2 text-slate-500 hover:text-white">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Imaging Area */}
          <div className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
            <div className="relative w-full h-full lg:max-w-2xl flex items-center justify-center bg-[#000] shadow-[0_0_100px_rgba(37,99,235,0.05)] border border-white/5 rounded-sm">
              <svg className="w-full h-full p-4 md:p-8" viewBox="0 0 600 700" xmlns="http://www.w3.org/2000/svg">
                <rect width="600" height="700" fill="#000"/>
                <ellipse cx="300" cy="350" rx="200" ry="280" fill="none" stroke="#111" strokeWidth="2"/>
                
                {/* Simulated Ribs & Bones */}
                <g stroke="#222" strokeWidth="1.5" fill="none">
                  {[200, 230, 260, 290, 320, 350].map((y, i) => (
                    <React.Fragment key={i}>
                      <path d={`M180 ${y} Q120 ${y+30} 100 ${y+70}`} opacity={0.6} />
                      <path d={`M420 ${y} Q480 ${y+30} 500 ${y+70}`} opacity={0.6} />
                    </React.Fragment>
                  ))}
                </g>

                {/* Central Soft Tissue */}
                <rect x="290" y="100" width="20" height="500" rx="10" fill="#111" opacity="0.5"/>
                
                {/* Lungs */}
                <ellipse cx="200" cy="340" rx="90" ry="160" fill="#05080c" stroke="#111" strokeWidth="1" />
                <ellipse cx="400" cy="340" rx="90" ry="160" fill="#05080c" stroke="#111" strokeWidth="1" />
                
                {/* Pathological Finding Simulation */}
                <motion.ellipse 
                  initial={{ opacity: 0.1 }}
                  animate={{ opacity: 0.4 }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
                  cx="420" cy="480" rx="60" ry="50" fill="#333" filter="blur(8px)"
                />
                
                {/* Heart */}
                <ellipse cx="280" cy="400" rx="70" ry="85" fill="#080c14" stroke="#111" strokeWidth="2" />
              </svg>

              {/* Annotation Markers */}
              <div className="absolute left-[70%] top-[68%] group/marker cursor-help">
                <div className="w-4 h-4 rounded-full border border-blue-500/50 bg-blue-500/10 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                </div>
                <div className="absolute top-1/2 left-full ml-3 -translate-y-1/2 opacity-0 lg:group-hover/marker:opacity-100 transition-opacity whitespace-nowrap bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded text-[10px] font-mono text-blue-400 z-20">
                  RLL Consolidation
                </div>
              </div>

              {/* Overlay Metadata */}
              <div className="absolute top-4 md:top-6 left-4 md:left-6 font-mono text-[8px] md:text-[9px] text-slate-700 uppercase tracking-widest leading-relaxed">
                PA CHEST · 58M · 82KG<br />
                INST: MEDMENTOR AI LAB<br />
                ACQ: 2026-04-27 18:28
              </div>
            </div>

            {/* Viewer HUD */}
            <div className="absolute bottom-6 md:bottom-10 left-6 md:left-10 flex gap-2 md:gap-4 flex-wrap">
              <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg shrink-0">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-[9px] md:text-[10px] font-mono text-slate-400 tracking-tighter">W: 1544 L: -620</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-1.5 md:py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-lg shrink-0">
                <Maximize className="w-3 h-3 text-slate-500" />
                <span className="text-[9px] md:text-[10px] font-mono text-slate-400 tracking-tighter">MAG: 1.0X</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chat / AI Analysis Panel */}
        <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col bg-[#05080c] lg:bg-[#080c14] border-t lg:border-t-0 border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] h-[40vh] lg:h-auto shrink-0">
          <div className="px-6 py-4 md:py-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3 mb-1 min-w-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white truncate">Clinical Socratic AI</h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed truncate">Systematically analyze findings via ABCDE approach.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[#04070a]">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.role === 'assistant' && (
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Attending Radiologist</span>
                )}
                <div className={`max-w-[90%] p-3 md:p-4 rounded-2xl text-[11px] md:text-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-500/10' 
                    : 'bg-[#111] text-slate-300 rounded-tl-none border border-white/5'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col items-start">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 mb-2">Analyzing...</span>
                <div className="bg-[#111] p-3 md:p-4 rounded-2xl rounded-tl-none border border-white/5 flex gap-1.5">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 md:p-6 border-t border-white/5 bg-[#080c14] shrink-0">
            <div className="relative group">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-[#04070a] border border-white/5 rounded-2xl p-3 md:p-4 pr-12 md:pr-14 text-[11px] md:text-xs resize-none h-20 md:h-24 focus:border-blue-500/50 transition-all custom-scrollbar outline-none"
                placeholder="Describe findings..."
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute bottom-3 md:bottom-4 right-3 md:right-4 p-2.5 md:p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Screen Upload Overlay */}
      <AnimatePresence>
        {isUploadVisible && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6"
          >
              <div className="max-w-lg w-full bg-[#080c14] border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
                <button 
                  onClick={() => setIsUploadVisible(false)}
                  className="absolute top-6 md:top-8 right-6 md:right-8 text-slate-500 hover:text-white transition-colors"
                >
                  <Plus className="w-6 h-6 rotate-45" />
                </button>
                
                <div className="w-16 h-16 md:w-24 md:h-24 bg-blue-600/10 rounded-[1.5rem] md:rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 md:mb-8 border border-blue-500/20">
                  <Layout className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white mb-2 md:mb-3">Diagnostic Data Interface</h2>
                <p className="text-xs md:text-sm text-slate-500 mb-6 md:mb-10 leading-relaxed font-medium">
                  Drag diagnostic sequences (DICOM, PNG) to initiate AI-assisted Socratic review.
                </p>
                
                <div className="p-6 md:p-10 border-2 border-dashed border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] hover:border-blue-500/40 hover:bg-blue-600/[0.02] transition-all group cursor-pointer mb-6 md:mb-8">
                  <Upload className="w-6 h-6 md:w-8 md:h-8 text-slate-600 group-hover:text-blue-500 mb-3 md:mb-4 mx-auto transition-colors" />
                  <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-blue-400">
                    Awaiting Input
                  </p>
                </div>
                
                <button 
                  onClick={() => setIsUploadVisible(false)}
                  className="w-full py-4 md:py-5 bg-[#111] hover:bg-[#1a1a1a] text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all rounded-2xl"
                >
                  Abort Protocol
                </button>
              </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

