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

  useEffect(() => {
    const found = cases.find(c => c.id === id);
    if (!found) {
      navigate('/');
      return;
    }
    setActiveCase(found);

    // Initial AI greeting
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
    <div className="h-full flex flex-col gap-0">
      {/* Patient Brief Header - Minimized */}
      <motion.div 
        layout
        className="bg-white border-b border-slate-200 shadow-sm overflow-hidden shrink-0"
      >
        <div 
          className="px-6 py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsBriefExpanded(!isBriefExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-50 p-1.5 rounded-xl">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="font-bold text-slate-800 text-sm tracking-tight">{activeCase.title}</h2>
              <span className="text-[9px] text-slate-400 uppercase tracking-[0.15em] font-black">{activeCase.specialty} • {difficulty}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold italic">Review Scenario</span>
            <div className="bg-slate-50 p-1 rounded-lg">
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
              className="px-6 pb-4 pt-1"
            >
              <div className="bg-slate-900 rounded-2xl p-4 text-white flex gap-4 shadow-inner">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-300 leading-relaxed italic font-medium">
                   "{activeCase.patientBrief}"
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Chat Area - Full Height */}
      <div className="flex-1 bg-white flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar pb-32">
          {messages.filter(m => m.role !== 'system').map((m, idx) => {
            const isInitialMsg = idx === 0 && m.role === 'assistant';
            
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  m.role === 'user' ? 'bg-blue-600 text-white' : (isInitialMsg ? 'bg-slate-900 text-blue-400' : 'bg-white text-slate-600 border border-slate-100')
                }`}>
                  {m.role === 'user' ? <UserIcon className="w-5 h-5" /> : (isInitialMsg ? <Activity className="w-5 h-5" /> : <Brain className="w-5 h-5" />)}
                </div>
                <div className={`max-w-[95%] rounded-[1.5rem] p-6 text-base leading-relaxed shadow-sm ${
                  m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none font-medium' 
                    : (isInitialMsg ? 'bg-slate-900 text-slate-100 rounded-tl-none border border-slate-800' : 'bg-slate-50 text-slate-800 rounded-tl-none border border-slate-100')
                }`}>
                  {isInitialMsg && (
                    <div className="flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                      Incoming Clinical Report
                    </div>
                  )}
                  <div className={`markdown-body prose prose-sm ${isInitialMsg ? 'prose-invert text-slate-300' : 'prose-slate'} max-w-none`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shrink-0">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              </div>
              <div className="bg-slate-50 rounded-[1.5rem] rounded-tl-none p-5 border border-slate-100 h-14 flex items-center">
                <div className="flex gap-1.5">
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                  <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-slate-100 bg-white/80 backdrop-blur-md">
          <div className="flex gap-4 max-w-full px-6 mx-auto relative items-end">
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
                placeholder="Diagnostic reasoning or requested investigation..."
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500/50 transition-all resize-none max-h-40 font-medium"
                rows={2}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={isLoading || !inputValue.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white p-4 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-95 group"
              >
                <Send className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              
              <button
                onClick={handleEndSession}
                disabled={isEnding || messages.length < 4}
                className="bg-slate-900 hover:bg-black disabled:bg-slate-200 disabled:text-slate-400 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center gap-3 transition-all shadow-xl active:scale-95"
              >
                {isEnding ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                Finalize
              </button>
            </div>
          </div>
          <p className="mt-4 text-[9px] text-slate-400 text-center uppercase tracking-[0.3em] font-black">
            Clinical Engine: Gemini 1.5 Flash Precision Simulation
          </p>
        </div>
      </div>
    </div>
  );
}

