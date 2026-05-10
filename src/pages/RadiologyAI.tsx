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
import { 
  Panel, 
  Group as PanelGroup, 
  Separator as PanelResizeHandle 
} from 'react-resizable-panels';
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
  const [activeTool, setActiveTool] = useState<'viewer' | 'zoom' | 'annotate' | 'window'>('viewer');
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [windowPreset, setWindowPreset] = useState<'lung' | 'soft-tissue' | 'bone'>('lung');
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Welcome to the Radiology station. I see we have ${initialCase.name} loaded. \n\nBefore you start, ensure you've checked the patient metadata. Start by describing the technical quality of the image.` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUploadVisible, setIsUploadVisible] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const windowFilters = {
    'lung': 'contrast(1.2) brightness(0.9) grayscale(1)',
    'soft-tissue': 'contrast(1.5) brightness(0.6) grayscale(1)',
    'bone': 'contrast(2) brightness(1.2) grayscale(1)'
  };

  const windowLabels = {
    'lung': 'W:1500 L:-600',
    'soft-tissue': 'W:400 L:40',
    'bone': 'W:2000 L:400'
  };

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

  const handleCaseSelect = (item: CaseItem) => {
    setActiveCase(item);
    setMessages([
      { 
        role: 'assistant', 
        content: `Loading ${item.name}. ${item.description || 'System ready.'}\n\nHow would you like to proceed with this case?` 
      }
    ]);
    setZoomLevel(1.0);
    setWindowPreset('lung');
  };

  const cycleWindow = () => {
    const presets: ('lung' | 'soft-tissue' | 'bone')[] = ['lung', 'soft-tissue', 'bone'];
    const nextIndex = (presets.indexOf(windowPreset) + 1) % presets.length;
    setWindowPreset(presets[nextIndex]);
    setActiveTool('window');
  };

  const useChip = (text: string) => {
    setInput(text);
    // Use a timeout to ensure state update before sending
    setTimeout(() => {
      handleSend(text);
    }, 0);
  };

  const autoResize = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 80)}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [input]);

  const handleSend = async (manualInput?: string) => {
    const messageContent = manualInput || input;
    if (!messageContent.trim() || isTyping) return;

    const userMsg = messageContent.trim();
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
      <PanelGroup orientation={isMobile ? "vertical" : "horizontal"} className="flex-1 overflow-hidden">
        
        {/* Sidebar - Case Library */}
        {isLargeScreen && (
          <>
            <Panel 
              defaultSize={33} 
              minSize={0} 
              maxSize={100}
              className="flex flex-col border-r border-white/5 bg-[#080c14]"
            >
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
                    onSelect={handleCaseSelect}
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
            </Panel>

            <PanelResizeHandle className="w-1.5 hover:w-2 transition-all bg-transparent hover:bg-blue-500/20 active:bg-blue-500/40 relative z-50">
              <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20" />
            </PanelResizeHandle>
          </>
        )}

        {/* Main Viewer area */}
        <Panel 
          defaultSize={isLargeScreen ? 34 : 60} 
          minSize={0}
          maxSize={100}
          className="flex flex-col min-w-0 bg-[#020408] border-b lg:border-b-0 lg:border-r border-white/5"
        >
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
                <button 
                  onClick={() => setActiveTool('zoom')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTool === 'zoom' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  Zoom
                </button>
                <button 
                  onClick={() => setActiveTool('annotate')}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTool === 'annotate' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  Annotate
                </button>
                <button 
                  onClick={cycleWindow}
                  className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${activeTool === 'window' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                  Window
                </button>
                <button 
                  onClick={() => setIsUploadVisible(true)}
                  className="px-3 py-1.5 text-slate-500 text-[10px] font-bold hover:text-white"
                >
                  Upload
                </button>
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
          <div 
            className="flex-1 relative flex items-center justify-center p-4 md:p-8 overflow-hidden cursor-crosshair"
            onWheel={(e) => {
              if (activeTool === 'zoom') {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.1 : 0.1;
                setZoomLevel(prev => Math.max(0.5, Math.min(prev + delta, 5.0)));
              }
            }}
          >
            <div 
              className={`relative w-full h-full lg:max-w-2xl flex items-center justify-center bg-[#000] shadow-[0_0_100px_rgba(37,99,235,0.05)] border transition-all duration-300 ${activeTool !== 'viewer' ? 'border-blue-500/30' : 'border-white/5'} rounded-sm overflow-hidden`}
            >
              <svg 
                className="w-full h-full" 
                style={{ 
                  filter: windowFilters[windowPreset],
                }}
                viewBox="0 0 600 800" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect width="600" height="800" fill="#020408"/>
                
                <g style={{ transformOrigin: 'center', transform: `scale(${zoomLevel})`, transition: 'transform 0.3s ease-out' }}>
                  {/* Outer frame / scan circle */}
                  <ellipse cx="300" cy="400" rx="280" ry="380" fill="none" stroke="#1a2530" strokeWidth="1" />
                  
                  {/* Spine */}
                  <g fill="#1a2530" opacity="0.3">
                    {[...Array(12)].map((_, i) => (
                      <rect key={i} x="285" y={150 + i * 35} width="30" height="25" rx="4" />
                    ))}
                    <rect x="295" y="470" width="10" height="300" rx="5" />
                  </g>

                  {/* Ribs (Technical Lines) */}
                  <g stroke="#1a2530" strokeWidth="1" fill="none" opacity="0.5">
                    {[...Array(8)].map((_, i) => (
                      <React.Fragment key={i}>
                        <path d={`M270 ${180 + i * 40} Q100 ${220 + i * 45} 120 ${280 + i * 50}`} />
                        <path d={`M330 ${180 + i * 40} Q500 ${220 + i * 45} 480 ${280 + i * 50}`} />
                      </React.Fragment>
                    ))}
                  </g>

                  {/* Clavicles */}
                  <path d="M280 180 Q150 160 120 185" fill="none" stroke="#1a2530" strokeWidth="1.5" opacity="0.6" />
                  <path d="M320 180 Q450 160 480 185" fill="none" stroke="#1a2530" strokeWidth="1.5" opacity="0.6" />

                  {/* Lungs - Blue Subtle Fill */}
                  <ellipse cx="210" cy="450" rx="100" ry="200" fill="#2563eb" fillOpacity="0.05" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.2" />
                  <ellipse cx="390" cy="450" rx="100" ry="200" fill="#2563eb" fillOpacity="0.05" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.2" />
                  
                  {/* Heart */}
                  <ellipse cx="330" cy="520" rx="80" ry="100" fill="#1a2530" fillOpacity="0.2" stroke="#2563eb" strokeWidth="1" strokeOpacity="0.2" />

                  {/* Diaphragm Curve */}
                  <path d="M120 720 Q300 680 480 720" fill="none" stroke="#1a2530" strokeWidth="2" opacity="0.8" />

                  {/* Target Indicators from image */}
                  <circle cx="300" cy="530" r="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" className="animate-pulse" />
                  <circle cx="300" cy="530" r="2" fill="#f59e0b" />

                  <g className="cursor-pointer" onClick={() => useChip("Focal opacity in RLL")}>
                    <circle cx="450" cy="620" r="40" fill="#10b981" fillOpacity="0.05" className="animate-pulse" />
                    <circle cx="450" cy="620" r="25" fill="#10b981" fillOpacity="0.03" />
                    <circle cx="450" cy="620" r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                    <circle cx="450" cy="620" r="2" fill="#ef4444" />
                  </g>
                </g>

                {/* Fixed Overlay elements (do not scale) */}
                <text x="550" y="50" fill="#2563eb" fontSize="16" fontWeight="900" opacity="0.4" className="font-mono">R</text>

                <g fill="#2563eb" fillOpacity="0.35" fontSize="10" fontWeight="bold" className="font-mono tracking-widest uppercase">
                  <text x="40" y="50">PA CHEST - 2026-04-27 - 58M - 82KG</text>
                  <text x="40" y="75">INST: MEDMENTOR AI LAB</text>
                  <text x="40" y="100">ACQ: 2026-04-27 18:33</text>
                </g>
              </svg>


              {/* Annotation Markers (removing previous divs to use integrated SVG markers) */}

              {/* HUD / Toolkit integration */}
              <div className="absolute inset-x-0 bottom-0 p-6 flex items-center justify-between pointer-events-none">
                <div className="flex gap-2 pointer-events-auto">
                  <div className="px-3 py-1.5 bg-[#080c14]/90 border border-white/10 rounded-md shadow-2xl backdrop-blur-md">
                    <span className="text-[10px] font-black tracking-tighter text-slate-300 font-mono">PA - Chest</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#080c14]/90 border border-white/10 rounded-md shadow-2xl backdrop-blur-md">
                    <span className="text-[10px] font-black tracking-tighter text-slate-300 font-mono">{windowLabels[windowPreset]}</span>
                  </div>
                  <div className="px-3 py-1.5 bg-[#080c14]/90 border border-white/10 rounded-md shadow-2xl backdrop-blur-md">
                    <span className="text-[10px] font-black tracking-tighter text-slate-300 font-mono uppercase">MAG: {zoomLevel.toFixed(1)}x</span>
                  </div>
                </div>

                <div className="flex gap-1.5 pointer-events-auto">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.5, 5))}
                    className="w-10 h-8 flex items-center justify-center bg-[#080c14]/90 border border-white/10 rounded-md hover:bg-white/5 text-slate-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.5))}
                    className="w-10 h-8 flex items-center justify-center bg-[#080c14]/90 border border-white/10 rounded-md hover:bg-white/5 text-slate-300 transition-colors"
                  >
                    <div className="w-3 h-0.5 bg-slate-300" />
                  </button>
                  <button 
                    onClick={() => setZoomLevel(1.0)}
                    className="px-3 h-8 flex items-center justify-center bg-[#080c14]/90 border border-white/10 rounded-md hover:bg-white/5 text-[10px] font-black text-slate-300 transition-colors font-mono"
                  >
                    1:1
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Panel>


        <PanelResizeHandle className="w-1.5 hover:w-2 transition-all bg-transparent hover:bg-blue-500/20 active:bg-blue-500/40 relative z-50">
          <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-white/20" />
        </PanelResizeHandle>

        {/* Chat / AI Analysis Panel */}
        <Panel 
          defaultSize={33} 
          minSize={0}
          maxSize={100}
          className="flex flex-col bg-[#05080c] lg:bg-[#080c14] border-t lg:border-t-0 border-white/5 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] h-[40vh] lg:h-auto shrink-0"
        >
          <div className="px-6 py-4 md:py-6 border-b border-white/5 shrink-0">
            <div className="flex items-center gap-3 mb-1 min-w-0">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shrink-0" />
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white truncate">Clinical Socratic AI</h3>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed truncate">Systematically analyze findings via ABCDE approach.</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-[#04070a]">
            {messages.filter(m => m.role !== 'system').map((msg, idx) => (
              <div key={idx} className="space-y-4">
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
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
                
                {idx === 0 && msg.role === 'assistant' && (
                  <div className="grid grid-cols-2 gap-2 mt-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    {[
                      'Check lung fields',
                      'Review cardiac size',
                      'Examine hila',
                      'Look at bones'
                    ].map((chip) => (
                      <button 
                        key={chip}
                        onClick={() => useChip(chip)}
                        className="p-2.5 bg-[#111] border border-white/5 hover:border-blue-500/30 rounded-xl text-left text-[10px] text-slate-400 hover:text-white transition-all uppercase font-black tracking-tight"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                )}
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
                ref={textAreaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="w-full bg-[#04070a] border border-white/5 rounded-2xl p-3 md:p-4 pr-12 md:pr-14 text-[11px] md:text-xs resize-none h-12 md:h-14 focus:border-blue-500/50 transition-all custom-scrollbar outline-none"
                placeholder="Describe what you see..."
              />
              <button 
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping}
                className="absolute bottom-3 md:bottom-4 right-3 md:right-4 p-2.5 md:p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all disabled:opacity-30 disabled:grayscale shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Panel>
      </PanelGroup>

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

