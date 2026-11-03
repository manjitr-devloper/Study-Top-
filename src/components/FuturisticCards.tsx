import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  GraduationCap, 
  FileText, 
  TrendingUp, 
  Youtube, 
  Clock, 
  BookOpen, 
  ArrowRight,
  Flame,
  Check,
  Zap,
  RotateCw
} from 'lucide-react';
import { StudyCard3DFlip } from './StudyCard3DFlip';

export const FuturisticCards: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 10, y: -y * 10 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: '1200px' }}
      className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 transition-transform duration-300 ease-out"
    >
      {/* Card 1: 3D Study Card with Flip Animation */}
      <motion.div
        animate={{
          rotateY: tilt.x * 0.8,
          rotateX: tilt.y * 0.8,
          y: [0, -6, 0]
        }}
        transition={{
          y: { repeat: Infinity, duration: 4.5, ease: "easeInOut" },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 }
        }}
        className="w-full"
      >
        <StudyCard3DFlip />
      </motion.div>

      {/* Card 2: AI Notes (Notebook with animated writing lines & glowing AI icon) */}
      <motion.div
        animate={{
          rotateY: tilt.x * 0.8,
          rotateX: tilt.y * 0.8,
          y: [0, -6, 0]
        }}
        transition={{
          y: { repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.2 },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 }
        }}
        className="group relative bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/90 shadow-[0_10px_35px_rgba(79,70,229,0.08)] hover:shadow-[0_16px_45px_rgba(79,70,229,0.16)] transition-all overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-violet-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
              Auto-Structuring
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-800 tracking-tight">AI Smart Notes</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Turns messy texts &amp; lectures into high-yield summaries.</p>
        </div>

        {/* Animated notebook writing preview */}
        <div className="mt-4 p-3 bg-slate-50/90 rounded-2xl border border-slate-100/90 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-slate-200/60 text-[10px] font-black text-slate-600">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Cellular Respiration Notes</span>
          </div>
          
          <div className="space-y-1.5">
            <motion.div
              animate={{ width: ['30%', '90%', '65%', '90%'] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="h-2 bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full"
            />
            <motion.div
              animate={{ width: ['40%', '80%', '50%', '80%'] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.3 }}
              className="h-2 bg-slate-200 rounded-full"
            />
            <motion.div
              animate={{ width: ['20%', '70%', '40%', '70%'] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut", delay: 0.6 }}
              className="h-2 bg-slate-200 rounded-full"
            />
          </div>
          
          <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>Point 1: Glycolysis</span>
            <span className="text-emerald-600 flex items-center gap-0.5 font-bold">
              <Check className="w-2.5 h-2.5 stroke-[3]" /> Formatted
            </span>
          </div>
        </div>
      </motion.div>

      {/* Card 3: Smart Learning (Rotating graduation-cap card with 3D depth) */}
      <motion.div
        animate={{
          rotateY: tilt.x * 0.9,
          rotateX: tilt.y * 0.9,
          y: [0, -8, 0]
        }}
        transition={{
          y: { repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.3 },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 }
        }}
        className="group relative bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/90 shadow-[0_10px_35px_rgba(124,58,237,0.08)] hover:shadow-[0_16px_45px_rgba(124,58,237,0.16)] transition-all overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-violet-400/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-violet-500/25"
            >
              <GraduationCap className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full border border-violet-100">
              Exam Mastery
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-800 tracking-tight">Adaptive Study Guide</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Generates instant flashcards, practice quizzes, and recall questions.</p>
        </div>

        <div className="mt-4 p-3 bg-gradient-to-br from-violet-50 to-indigo-50/60 rounded-2xl border border-violet-100/70">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-violet-700">Rapid Flashcard #03</span>
            <span className="text-[9px] font-bold text-violet-500">Physics 101</span>
          </div>
          <p className="text-[11px] font-bold text-slate-700 leading-snug">
            "What is Faraday's Law of Electromagnetic Induction?"
          </p>
          <div className="mt-2 pt-2 border-t border-violet-200/50 flex items-center justify-between text-[10px] font-bold text-violet-800">
            <span>Tap to reveal answer</span>
            <span className="text-[9px] bg-white text-violet-700 px-2 py-0.5 rounded-md shadow-xs">High Yield</span>
          </div>
        </div>
      </motion.div>

      {/* Card 4: PDF & Images (Document card with OCR extraction) */}
      <motion.div
        animate={{
          rotateY: tilt.x * 1,
          rotateX: tilt.y * 1,
          y: [0, -5, 0]
        }}
        transition={{
          y: { repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.6 },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 }
        }}
        className="group relative bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/90 shadow-[0_10px_35px_rgba(16,185,129,0.08)] hover:shadow-[0_16px_45px_rgba(16,185,129,0.16)] transition-all overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
              OCR &amp; Multipage
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-800 tracking-tight">PDF &amp; Photo Scanner</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Extracts handwriting, textbook scans, and multi-page documents.</p>
        </div>

        {/* Page flip simulation */}
        <div className="mt-4 p-3 bg-slate-50/90 rounded-2xl border border-slate-100 relative">
          <div className="flex items-center justify-between mb-1.5 text-[10px] font-black text-slate-700">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Syllabus_Chapter4.pdf
            </span>
            <span className="text-slate-400">12 Pages</span>
          </div>
          <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: ['20%', '85%', '100%', '20%'] }}
              transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
              className="bg-emerald-500 h-full rounded-full"
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>Text OCR Extraction</span>
            <span className="text-emerald-600 font-black">99.4% Clarity</span>
          </div>
        </div>
      </motion.div>

      {/* Card 5: Study Progress (Mini dashboard with retention indicator) */}
      <motion.div
        animate={{
          rotateY: tilt.x * 0.8,
          rotateX: tilt.y * 0.8,
          y: [0, -7, 0]
        }}
        transition={{
          y: { repeat: Infinity, duration: 4.6, ease: "easeInOut", delay: 0.9 },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 }
        }}
        className="group relative bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/90 shadow-[0_10px_35px_rgba(59,130,246,0.08)] hover:shadow-[0_16px_45px_rgba(59,130,246,0.16)] transition-all overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-500/25">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-100">
              Live Retention
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-800 tracking-tight">Study Mastery</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Track retention rate, weekly chapters, and exam readiness.</p>
        </div>

        {/* Circular progress & metrics */}
        <div className="mt-4 p-3 bg-slate-50/90 rounded-2xl border border-slate-100 flex items-center justify-between">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <motion.path
                className="text-blue-600"
                strokeDasharray="100, 100"
                strokeDashoffset={18}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[11px] font-black text-slate-800 tabular-nums">82%</span>
          </div>

          <div className="space-y-0.5 text-right">
            <div className="text-[11px] font-black text-slate-800">18 Notes Mastered</div>
            <div className="text-[9px] font-bold text-slate-400">Exam target: 24 chapters</div>
            <div className="text-[9px] font-black text-emerald-600 flex items-center justify-end gap-0.5">
              <Flame className="w-3 h-3 text-amber-500" /> 7-Day Streak
            </div>
          </div>
        </div>
      </motion.div>

      {/* Card 6: YouTube to Notes */}
      <motion.div
        animate={{
          rotateY: tilt.x * 1,
          rotateX: tilt.y * 1,
          y: [0, -6, 0]
        }}
        transition={{
          y: { repeat: Infinity, duration: 4.4, ease: "easeInOut", delay: 1.2 },
          rotateX: { duration: 0.2 },
          rotateY: { duration: 0.2 }
        }}
        className="group relative bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-white/90 shadow-[0_10px_35px_rgba(244,63,94,0.08)] hover:shadow-[0_16px_45px_rgba(244,63,94,0.16)] transition-all overflow-hidden flex flex-col justify-between"
      >
        <div className="absolute top-0 right-0 w-28 h-28 bg-rose-400/10 rounded-full blur-2xl pointer-events-none" />

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-md shadow-rose-500/25">
              <Youtube className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
              Video Transcripts
            </span>
          </div>

          <h3 className="text-sm font-black text-slate-800 tracking-tight">YouTube to Notes</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Paste any educational video URL to extract timestamps &amp; notes.</p>
        </div>

        {/* Video to Note animation */}
        <div className="mt-4 p-3 bg-gradient-to-br from-rose-50/50 to-slate-50 rounded-2xl border border-rose-100/60">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-black text-slate-800 truncate">MIT 6.006 Lecture 01</span>
            <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.5 rounded">48:12</span>
          </div>
          <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1.5">
            <ArrowRight className="w-3 h-3 text-rose-500 shrink-0" />
            <span className="truncate">Synthesized into 8 Key Formulas</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[9px] font-bold text-slate-400">
            <span>[04:15] Asymptotic Analysis</span>
            <span>·</span>
            <span>[12:30] Big-O</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
