import React, { useState } from 'react';
import { 
  AlertTriangle,
  History,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Info,
  Activity,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { checkDrugInteraction } from '../lib/gemini';

const initialHistory = [
  { drugs: 'Warfarin + Aspirin', severity: 'Major', summary: 'Additive bleeding risk — combined antiplatelet & anticoagulant effect.' },
  { drugs: 'Metformin + Contrast', severity: 'Moderate', summary: 'Risk of lactic acidosis — hold 48h before and after contrast.' },
  { drugs: 'Lisinopril + Spironolactone', severity: 'Moderate', summary: 'Hyperkalaemia risk — monitor K⁺ closely.' },
  { drugs: 'SSRIs + Tramadol', severity: 'Major', summary: 'Serotonin syndrome risk — avoid combination.' },
];

export default function InteractionChecker() {
  const navigate = useNavigate();
  const [drugA, setDrugA] = useState('');
  const [drugB, setDrugB] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(initialHistory);

  const handleCheck = async () => {
    if (!drugA || !drugB || loading) return;
    
    setLoading(true);
    setResult(null);

    try {
      const data = await checkDrugInteraction([drugA, drugB]);
      setResult(data);
      
      // Add to history
      setHistory(prev => [{
        drugs: `${drugA} + ${drugB}`,
        severity: data.severity,
        summary: data.clinicalSignificance
      }, ...prev].slice(0, 10));

    } catch (error) {
      console.error('Interaction check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] md:h-screen overflow-hidden bg-[#0a0e14] text-[#e8edf5] font-sans">
      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        
        {/* Sidebar - History */}
        <div className="hidden xl:flex w-72 flex-col border-r border-[#1e2a3a] bg-[#111620]">
          <div className="p-6 border-b border-[#1e2a3a]">
             <h3 className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Recent Checks</h3>
          </div>
          <div className="flex-1 overflow-y-auto px-2 space-y-1 custom-scrollbar">
             {history.map((h, i) => (
               <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={i} 
                className="p-4 rounded-lg border-b border-[#1e2a3a]/50 hover:bg-[#161d2a] transition-all cursor-pointer"
                onClick={() => {
                  const [a, b] = h.drugs.split(' + ');
                  setDrugA(a);
                  setDrugB(b);
                }}
               >
                  <div className="text-xs font-semibold text-white mb-2">{h.drugs}</div>
                  <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded-full mb-3 ${
                    h.severity === 'Major' || h.severity === 'Contraindicated' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {h.severity}
                  </span>
                  <p className="text-[11px] text-[#5a7090] leading-relaxed line-clamp-2">{h.summary}</p>
               </motion.div>
             ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#0a0e14]">
           <div className="px-6 py-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111620]/80 backdrop-blur-xl shrink-0">
             <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 text-[#5a7090] hover:text-white rounded-lg transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-teal-400" />
                  <h1 className="text-lg font-serif italic text-white tracking-tight">Interaction Checker</h1>
                </div>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="max-w-[800px] mx-auto p-6 md:p-12 space-y-10">
                 <div className="grid grid-cols-1 md:grid-cols-[1fr_60px_1fr] items-center gap-4 md:gap-0">
                    <div className="bg-[#111620] border-2 border-[#243044] rounded-2xl p-6 focus-within:border-teal-500/40 transition-all">
                       <span className="text-[10px] font-mono uppercase text-[#2d3d56] block mb-2">Drug A</span>
                       <input 
                        value={drugA} 
                        onChange={(e) => setDrugA(e.target.value)}
                        className="w-full bg-transparent border-none outline-none font-serif text-xl text-white placeholder-[#243044]" 
                        placeholder="e.g. Warfarin" 
                       />
                    </div>
                    <div className="flex items-center justify-center">
                       <div className="w-10 h-10 rounded-full bg-[#161d2a] border border-[#243044] flex items-center justify-center text-[#2d3d56] text-xl font-light">+</div>
                    </div>
                    <div className="bg-[#111620] border-2 border-[#243044] rounded-2xl p-6 focus-within:border-teal-500/40 transition-all">
                       <span className="text-[10px] font-mono uppercase text-[#2d3d56] block mb-2">Drug B</span>
                       <input 
                        value={drugB} 
                        onChange={(e) => setDrugB(e.target.value)}
                        className="w-full bg-transparent border-none outline-none font-serif text-xl text-white placeholder-[#243044]" 
                        placeholder="e.g. Aspirin" 
                       />
                    </div>
                 </div>

                 <button 
                  onClick={handleCheck}
                  disabled={!drugA || !drugB || loading}
                  className="w-full py-4 bg-teal-700 hover:bg-teal-600 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-xl shadow-teal-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                 >
                   {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                   {loading ? 'Analyzing Synergy...' : 'Check Interaction'}
                 </button>

                 <div className="space-y-4">
                    <div className="text-[10px] font-mono uppercase tracking-widest text-[#5a7090]">Suggested pairs</div>
                    <div className="flex flex-wrap gap-2">
                       {['Warfarin + Aspirin', 'Metformin + Alcohol', 'SSRIs + Tramadol', 'Simvastatin + Clarithromycin'].map(pair => (
                         <button 
                          key={pair}
                          onClick={() => {
                            const [a, b] = pair.split(' + ');
                            setDrugA(a); setDrugB(b);
                          }}
                          className="px-4 py-2 bg-[#161d2a] border border-[#243044] rounded-full text-[11px] font-mono text-[#a8b8cc] hover:border-teal-500/40 hover:text-teal-400 transition-all"
                         >
                           {pair}
                         </button>
                       ))}
                    </div>
                 </div>

                 <AnimatePresence>
                   {result && (
                     <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#111620] border border-[#243044] rounded-3xl overflow-hidden shadow-2xl"
                     >
                        <div className="p-6 md:p-8 flex items-center justify-between border-b border-[#1e2a3a]">
                           <div className="font-serif text-2xl text-white">{drugA} <span className="text-[#5a7090] font-sans font-light italic">plus</span> {drugB}</div>
                           <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                             result.severity === 'Major' || result.severity === 'Contraindicated' 
                              ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
                              : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                           }`}>
                             {result.severity}
                           </span>
                        </div>
                        <div className="p-6 md:p-8 space-y-6">
                           <div className="bg-[#161d2a] p-5 rounded-2xl">
                              <span className="text-[9px] font-mono uppercase text-[#2d3d56] block mb-3 tracking-widest">Mechanism</span>
                              <p className="text-xs text-[#a8b8cc] leading-relaxed">{result.mechanism}</p>
                           </div>
                           <div className="bg-[#161d2a] p-5 rounded-2xl">
                              <span className="text-[9px] font-mono uppercase text-[#2d3d56] block mb-3 tracking-widest">Guidance</span>
                              <p className="text-xs text-[#a8b8cc] leading-relaxed mb-4"><strong>Significance:</strong> {result.clinicalSignificance}</p>
                              <p className="text-xs text-teal-400 italic"><strong>Recommendation:</strong> {result.recommendation}</p>
                           </div>
                           {result.references && result.references.length > 0 && (
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono text-[#5a7090]">References:</span>
                                  <span className="text-[10px] font-mono text-[#e8edf5]">{result.references.join(', ')}</span>
                                </div>
                             </div>
                           )}
                        </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
