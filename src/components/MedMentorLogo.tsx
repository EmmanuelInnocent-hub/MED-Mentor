import React from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface MedMentorLogoProps {
  className?: string;
  iconSize?: number;
  containerSize?: string;
  textSize?: string;
  showText?: boolean;
}

export default function MedMentorLogo({ 
  className = "", 
  iconSize = 24, 
  containerSize = "w-12 h-12",
  textSize = "text-xl", 
  showText = true 
}: MedMentorLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative group">
        <div className={`${containerSize} bg-blue-600 rounded-full flex items-center justify-center shadow-2xl shadow-blue-500/40 transition-all duration-300`}>
          <Activity className="text-white" size={iconSize} strokeWidth={2.5} />
        </div>
        {/* Glow effect matching the image */}
        <div className="absolute -inset-2 bg-blue-500 rounded-full blur-xl opacity-20" />
      </div>
      
      {showText && (
        <div className={`font-black tracking-tight ${textSize} text-slate-900 dark:text-white flex items-center gap-1`}>
          <span className="text-slate-900 dark:text-white">MED</span>
          <span className="text-blue-600">MENTOR</span>
        </div>
      )}
    </div>
  );
}
