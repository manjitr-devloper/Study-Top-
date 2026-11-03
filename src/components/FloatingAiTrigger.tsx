import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Mic } from 'lucide-react';

interface FloatingAiTriggerProps {
  onClick: () => void;
  className?: string;
}

export const FloatingAiTrigger: React.FC<FloatingAiTriggerProps> = ({ onClick, className = '' }) => {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`fixed bottom-6 right-6 z-40 bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-full p-3.5 sm:px-5 sm:py-3.5 shadow-2xl shadow-blue-500/35 border-2 border-white/60 flex items-center gap-2.5 backdrop-blur-md cursor-pointer group ${className}`}
      title="Open Study Top AI Voice Assistant"
    >
      <div className="relative">
        <span className="absolute -inset-1 rounded-full bg-cyan-400 blur-sm opacity-60 animate-ping" />
        <div className="relative w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
      </div>
      <div className="hidden sm:flex flex-col text-left">
        <span className="text-xs font-black tracking-tight leading-tight">Study Top AI</span>
        <span className="text-[9px] font-bold text-cyan-200 tracking-wider uppercase">Live Voice &amp; Chat</span>
      </div>
      <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center sm:ml-1">
        <Mic className="w-3.5 h-3.5 text-white" />
      </div>
    </motion.button>
  );
};
