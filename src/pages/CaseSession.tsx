import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  Send, 
  User as UserIcon, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Loader2,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  Brain,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { doc, setDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { cases } from '../lib/casePrompts';
import { buildSystemPrompt, getChatResponse, scoreSession } from '../lib/gemini';
import { Message, Case, SessionResult } from '../types';
import { v4 as uuidv4 } from 'uuid';

export default function CaseSession() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const difficulty = location.state?.difficulty || 'Resident';
  
  const [activeCase, setActiveCase] = useState<Case | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBriefExpanded, setIsBriefExpanded] = useState(true);
  const [isEnding, setIsEnding] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const found = cases.find(c => c.id === id);
    if (!found) {
      navigate('/');
      return;
    }
    setActiveCase(found);
    setIsBriefExpanded(!isMobile);
    const systemPrompt = buildSystemPrompt(found, difficulty);
    const initialGreeting = `Hello Dr. ${profile?.firstName || ''}. I am MedMentor. I have a new patient for us to evaluate. Please review the brief above and tell me your initial approach or any questions you'd like to ask the patient first.`;
    
    setMessages([
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: initialGreeting }
    ]);
  }, [id, difficulty, profile]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !activeCase) return;

    const userMessage: Message = { role: 'user', content: inputValue };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(updatedMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "I'm sorry, I'm having trouble connecting to the medical network. Let's try that again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeCase || isEnding || !user) return;
    setIsEnding(true);
    
    try {
      const resultData = await scoreSession(messages, activeCase);
      const sessionId = uuidv4();
      
      const fullResult = {
        userId: user.uid,
        caseId: activeCase.id,
        caseTitle: activeCase.title,
        specialty: activeCase.specialty,
        difficulty,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        score: resultData,
        status: 'completed',
        completedAt: serverTimestamp()
      };

      // Save to Firestore
      await setDoc(doc(db, 'sessions', sessionId), fullResult);

      // Update user progress (simple increment for demo)
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        knowledgeProgress: increment(5)
      });
      
      navigate(`/results/${sessionId}`);
    } catch (error: any) {
      handleFirestoreError(error, 'create', `sessions/${id}`);
    } finally {
      setIsEnding(false);
    }
  };

  if (!activeCase) return null;

  return (
    <div className="flex flex-col h-[100dvh] md:h-full bg-white overflow-hidden">
      {/* Patient Brief Header - Minimized */}
      <motion.div 
        layout
        className="bg-white border-b border-slate-200 shadow-sm overflow-hidden shrink-0 z-50 relative"
      >
        <div 
          className="px-4 md:px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsBriefExpanded(!isBriefExpanded)}
        >
          <div className="flex items-center gap-3 md:gap-4 min-w-0">
            <div className="bg-emerald-50 p-2 rounded-xl shrink-0">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-col md:flex-row md:items-baseline md:gap-3 min-w-0">
              <h2 className="font-bold text-slate-800 text-sm tracking-tight truncate">{activeCase.title}</h2>
              <span className="text-[8px] md:text-[9px] text-slate-400 uppercase tracking-[0.15em] font-black truncate">
                {activeCase.specialty} • {difficulty}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <span className="hidden sm:inline text-[10px] text-slate-400 font-bold italic">Review Scenario</span>
            <div className="bg-slate-50 p-2 rounded-xl">
              {isBriefExpanded ? <ChevronUp className="w-3 h-3 text-slate-400" /> : <ChevronDown className="w-3 h-3 text-slate-400" />}
            </div>
          </div>
        </div>
        <AnimatePresence>
          {isBriefExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 md:px-6 pb-4 pt-1"
            >
              <div className="bg-slate-900 rounded-2xl p-4 md:p-5 text-white flex gap-4 shadow-inner">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] md:text-xs text-slate-300 leading-relaxed italic font-medium">
                   "{activeCase.patientBrief}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Area - Full Height */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pt-6 pb-32 md:pb-40 space-y-6 md:space-y-8 custom-scrollbar">
          {messages.filter(m => m.role !== 'system').map((m, idx) => {
            const isInitialMsg = idx === 0 && m.role === 'assistant';
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 md:gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {!isMobile && (
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                    m.role === 'user' ? 'bg-blue-600 text-white' : (isInitialMsg ? 'bg-slate-900 text-blue-400' : 'bg-white text-slate-600 border border-slate-100')
                  }`}>
                    {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : (isInitialMsg ? <Activity className="w-5 h-5" /> : <Brain className="w-5 h-5" />)}
                  </div>
                )}
                <div className={`max-w-[92%] sm:max-w-[85%] rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-6 text-sm md:text-base leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none md:rounded-tr-none font-medium' 
                    : (isInitialMsg ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100')
                }`}>
                  {isInitialMsg && (
                    <div className="flex items-center gap-2 mb-4 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      Incoming Clinical Report
                    </div>
                  )}
                  <div className={`markdown-body prose prose-xs md:prose-sm ${isInitialMsg ? 'prose-invert text-slate-300' : 'prose-slate'} max-w-none`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {isLoading && (
            <div className="flex gap-4">
              {!isMobile && (
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shrink-0">
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                </div>
              )}
              <div className="bg-slate-50 rounded-[1.5rem] rounded-tl-none p-5 border border-slate-100 h-14 flex items-center shadow-sm">
                <div className="flex gap-1.5">
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.3 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.6 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 border-t border-slate-100 bg-white/95 backdrop-blur-md pb-6 md:pb-8">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 max-w-6xl mx-auto items-stretch sm:items-end">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isMobile ? "Propose investigation..." : "Diagnostic reasoning or requested investigation..."}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all resize-none max-h-32 min-h-[56px] font-medium"
                rows={isMobile ? 1 : 2}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-5 py-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 group flex items-center justify-center min-h-[56px]"
              >
                <span className="md:hidden mr-2 text-[10px] font-black uppercase tracking-widest">Send</span>
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              
              <button
                onClick={handleEndSession}
                disabled={isEnding || messages.length < 4}
                className="flex-1 sm:flex-none bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all shadow-xl active:scale-95 text-white min-h-[56px]"
              >
                {isEnding ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                Finalize
              </button>
            </div>
          </div>
          {!isMobile && (
            <p className="mt-4 text-[9px] text-slate-400 text-center uppercase tracking-[0.3em] font-black">
              Clinical Engine: Gemini 1.5 Flash Precision Simulation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

