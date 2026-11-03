import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  RotateCw, 
  BrainCircuit, 
  BookOpen, 
  Check, 
  Flame, 
  GraduationCap, 
  Target,
  ArrowRight,
  TrendingUp,
  Layers
} from 'lucide-react';

interface StudyCard3DFlipProps {
  className?: string;
  onFlip?: (isFlipped: boolean) => void;
}

export const StudyCard3DFlip: React.FC<StudyCard3DFlipProps> = ({ className = '', onFlip }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const toggleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip(!isFlipped);
  };

  return (
    <div className={`relative select-none ${className}`} style={{ perspective: '1200px' }}>
      {/* 3D Flip Card Container */}
      <motion.div
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
        onClick={toggleFlip}
        className="w-full relative cursor-pointer group min-h-[300px] sm:min-h-[310px] rounded-[28px] shadow-[0_12px_36px_rgba(79,70,229,0.10)] hover:shadow-[0_18px_45px_rgba(79,70,229,0.20)] transition-shadow"
      >
        {/* ========================================================= */}
        {/* FRONT FACE: 3D Study Deck & Memory Matrix                  */}
        {/* ========================================================= */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className="absolute inset-0 w-full h-full rounded-[28px] bg-gradient-to-br from-indigo-900 via-slate-900 to-violet-950 text-white p-5 flex flex-col justify-between border-2 border-indigo-500/40 shadow-2xl overflow-hidden"
        >
          {/* Subtle glowing ambient gradient */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-violet-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/30">
                <BrainCircuit className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 block">
                  3D Interactive Study Card
                </span>
                <h3 className="text-sm font-black text-white tracking-tight">
                  High-Yield Memory Matrix
                </h3>
              </div>
            </div>

            {/* Flip Button */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleFlip(); }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-cyan-200 border border-white/20 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-3 h-3 text-cyan-300" />
              <span>Flip Card</span>
            </button>
          </div>

          {/* Interactive Study Preview Body */}
          <div className="relative z-10 my-3 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <Target className="w-3.5 h-3.5" />
                Active Recall Mastery
              </span>
              <span className="text-emerald-400 font-mono font-black">94% Retention</span>
            </div>

            {/* Dynamic Animated Mastery Bar */}
            <div className="w-full bg-slate-800/80 h-2 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div
                animate={{ width: ['40%', '94%', '80%', '94%'] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="bg-gradient-to-r from-cyan-400 to-violet-500 h-full rounded-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Study Streak</span>
                <span className="text-amber-300 font-black flex items-center gap-1 mt-0.5">
                  <Flame className="w-3 h-3" /> 14 Days Active
                </span>
              </div>
              <div className="bg-slate-900/60 p-2 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Formulas Mastered</span>
                <span className="text-cyan-300 font-black flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3 h-3" /> 48 Concepts
                </span>
              </div>
            </div>
          </div>

          {/* Card Footer with Flip Hint */}
          <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-300 font-medium">
            <span className="flex items-center gap-1 text-cyan-300 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Tap to Flip for Quick Quiz Deck</span>
            </span>
            <RotateCw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* BACK FACE: Rapid Flashcard & Exam Recall Blueprint        */}
        {/* ========================================================= */}
        <div 
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          className="absolute inset-0 w-full h-full rounded-[28px] bg-gradient-to-br from-violet-950 via-slate-900 to-indigo-900 text-white p-5 flex flex-col justify-between border-2 border-violet-500/50 shadow-2xl overflow-hidden"
        >
          {/* Subtle glowing ambient gradient */}
          <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-gradient-to-tr from-pink-500/20 to-violet-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-pink-600 flex items-center justify-center shadow-md shadow-violet-500/30">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-violet-300 block">
                  Quick Flashcard Deck
                </span>
                <h3 className="text-sm font-black text-white tracking-tight">
                  Active Recall Prompt
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleFlip(); }}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-violet-200 border border-white/20 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all active:scale-95 cursor-pointer"
            >
              <RotateCw className="w-3 h-3 text-violet-300" />
              <span>Flip Back</span>
            </button>
          </div>

          {/* Flashcard Body */}
          <div className="relative z-10 my-2 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-violet-300">
              <span>Card #01 · High-Yield Exam Q</span>
              <span className="bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded-full border border-violet-400/30">Physics</span>
            </div>

            <p className="text-xs font-bold text-white leading-relaxed">
              "How does Lenz's Law relate to Conservation of Energy in electromagnetic induction?"
            </p>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3 h-3 stroke-[3]" /> Mastered Concept
              </span>
              <span className="text-slate-300 font-mono">Difficulty: Medium</span>
            </div>
          </div>

          {/* Back Footer */}
          <div className="relative z-10 flex items-center justify-between pt-1 border-t border-white/10 text-[10px] text-slate-300 font-medium">
            <span className="flex items-center gap-1 text-violet-300 font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Tap to Flip back to Matrix</span>
            </span>
            <RotateCw className="w-3.5 h-3.5 text-slate-400 group-hover:rotate-180 transition-transform duration-500" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};
