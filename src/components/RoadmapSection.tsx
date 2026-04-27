import React from 'react';
import { motion } from 'motion/react';
import { 
  ScanSearch, 
  FlaskConical, 
  Binary, 
  Microscope, 
  Brain, 
  Baby, 
  BriefcaseMedical, 
  Target 
} from 'lucide-react';

const roadmapItems = [
  {
    title: 'Radiology AI',
    description: 'Upload X-ray or MRI images, AI identifies findings and asks the student to interpret them before revealing the answer.',
    icon: ScanSearch,
    tag: 'Image analysis',
    color: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  },
  {
    title: 'Pharmacology',
    description: 'AI quizzes drug mechanisms, interactions, and dosing. Flags dangerous combinations with real-time feedback.',
    icon: FlaskConical,
    tag: 'Drug logic',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  },
  {
    title: 'Anatomy 3D',
    description: 'AI-guided anatomy tutor. Ask "where is the brachial plexus?" and get a conversational explanation tied to 3D structures.',
    icon: Binary,
    tag: 'Spatial learning',
    color: 'text-teal-500 bg-teal-500/10 border-teal-500/20'
  },
  {
    title: 'Neurology',
    description: 'Cases focused on neuro exams, stroke, seizure, and GCS scoring. AI tracks whether you follow correct neuro assessment order.',
    icon: Brain,
    tag: 'High complexity',
    color: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
  },
  {
    title: 'Pathology',
    description: 'Show histology slide images, ask students to identify tissue type, disease process, and clinical correlation.',
    icon: Microscope,
    tag: 'Microscopy',
    color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    title: 'Pediatrics',
    description: 'Age-adjusted cases for neonates, toddlers, and adolescents. AI enforces weight-based dosing and developmental milestones.',
    icon: Baby,
    tag: 'Age-sensitive',
    color: 'text-pink-500 bg-pink-500/10 border-pink-500/20'
  },
  {
    title: 'Drug interaction checker',
    description: 'Enter any two drugs — AI explains the mechanism of their interaction, severity, and clinical management.',
    icon: BriefcaseMedical,
    tag: 'Safety tool',
    color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  }
];

export default function RoadmapSection() {
  return (
    <div className="space-y-6 pt-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Active Clinical Pipelines</h2>
          <p className="text-xs text-slate-500 mt-1 uppercase font-black tracking-widest">Expansion Roadmap & Tooling Integration</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roadmapItems.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col group cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-300 overflow-hidden relative"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${item.color.split(' ')[1]} ${item.color.split(' ')[2]}`}>
                <item.icon className={`w-4 h-4 ${item.color.split(' ')[0]}`} />
              </div>
              <h3 className="font-bold text-slate-900 text-xs">{item.title}</h3>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-4 flex-1">
              {item.description}
            </p>
            <div className="flex items-center justify-between mt-auto">
              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${item.color}`}>
                {item.tag}
              </span>
              <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-blue-500 transition-colors">Coming Soon</span>
            </div>
            
            {/* Hover Decor */}
            <div className="absolute -right-4 -bottom-4 w-12 h-12 bg-blue-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
