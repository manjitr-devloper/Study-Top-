import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Network, 
  HelpCircle, 
  Camera, 
  FileText, 
  FileUp, 
  Youtube, 
  Clock, 
  Calculator, 
  Calendar, 
  GraduationCap, 
  Layers, 
  ArrowRight,
  BookOpen,
  Award,
  ChevronLeft
} from 'lucide-react';

interface StudyToolsHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPointWise: () => void;
  onOpenDiagram: () => void;
  onOpenQa: () => void;
  onOpenSmartNote: (source?: 'text' | 'camera' | 'images' | 'pdf' | 'youtube') => void;
  onOpenFocusTimer: () => void;
  onOpenCalculator: () => void;
  onOpenCalendar: () => void;
  onOpenResultMaker: () => void;
}

export const StudyToolsHubModal: React.FC<StudyToolsHubModalProps> = ({
  isOpen,
  onClose,
  onOpenPointWise,
  onOpenDiagram,
  onOpenQa,
  onOpenSmartNote,
  onOpenFocusTimer,
  onOpenCalculator,
  onOpenCalendar,
  onOpenResultMaker
}) => {
  if (!isOpen) return null;

  const tools = [
    {
      id: 'pointwise',
      title: 'Point-Wise Notes Maker',
      desc: 'Generate bulleted, exam-oriented study summaries by Class & Board',
      icon: Sparkles,
      color: 'from-blue-600 to-indigo-600',
      badge: 'High Yield',
      action: () => { onClose(); onOpenPointWise(); }
    },
    {
      id: 'diagram',
      title: 'Mermaid Diagram Maker',
      desc: 'Create mind-maps, flowcharts, and architecture diagrams',
      icon: Network,
      color: 'from-indigo-600 to-violet-600',
      badge: 'Visual AI',
      action: () => { onClose(); onOpenDiagram(); }
    },
    {
      id: 'qa',
      title: 'Q&A Academic Solver',
      desc: 'Ask complex homework or exam questions for step-by-step solutions',
      icon: HelpCircle,
      color: 'from-violet-600 to-purple-600',
      badge: 'Instant Solve',
      action: () => { onClose(); onOpenQa(); }
    },
    {
      id: 'camera_ocr',
      title: 'Camera Scan & OCR',
      desc: 'Capture textbook pages or handwriting and convert to notes',
      icon: Camera,
      color: 'from-emerald-600 to-teal-600',
      badge: 'Mobile OCR',
      action: () => { onClose(); onOpenSmartNote('camera'); }
    },
    {
      id: 'youtube',
      title: 'YouTube Video to Notes',
      desc: 'Convert educational lectures into structured notes & questions',
      icon: Youtube,
      color: 'from-rose-600 to-red-600',
      badge: 'Lectures',
      action: () => { onClose(); onOpenSmartNote('youtube'); }
    },
    {
      id: 'pdf',
      title: 'PDF & Document Parser',
      desc: 'Extract key points, formulas, and summaries from uploaded PDFs',
      icon: FileUp,
      color: 'from-amber-500 to-orange-600',
      badge: 'Docs',
      action: () => { onClose(); onOpenSmartNote('pdf'); }
    },
    {
      id: 'pomodoro',
      title: 'Focus Pomodoro Timer',
      desc: 'Structured 25/5 min focus blocks to maximize study retention',
      icon: Clock,
      color: 'from-cyan-600 to-blue-600',
      badge: 'Productivity',
      action: () => { onClose(); onOpenFocusTimer(); }
    },
    {
      id: 'calculator',
      title: 'Scientific Calculator',
      desc: 'Quick arithmetic and mathematical calculations while studying',
      icon: Calculator,
      color: 'from-sky-600 to-indigo-600',
      badge: 'Math Tools',
      action: () => { onClose(); onOpenCalculator(); }
    },
    {
      id: 'calendar',
      title: 'Exam Calendar & Planner',
      desc: 'Track assignment deadlines, exam dates, and revision timetables',
      icon: Calendar,
      color: 'from-purple-600 to-pink-600',
      badge: 'Schedule',
      action: () => { onClose(); onOpenCalendar(); }
    },
    {
      id: 'results',
      title: 'Grade & Result Maker',
      desc: 'Calculate GPA, marks percentage, and generate progress report cards',
      icon: Award,
      color: 'from-emerald-600 to-green-600',
      badge: 'Grades',
      action: () => { onClose(); onOpenResultMaker(); }
    }
  ];

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[115] flex items-end sm:items-center justify-center p-0 sm:p-4 font-sans"
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-t-[32px] sm:rounded-[36px] w-full max-w-2xl max-h-[88dvh] shadow-2xl border border-white flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-2xs shrink-0"
                title="Back to Notebooks"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-xl font-black text-slate-900 tracking-tight truncate">
                  Study Tools &amp; AI Utilities
                </h2>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">
                  Instant academic tools designed for speed on mobile &amp; desktop
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tools Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tools.map((tool, tIdx) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={`tool-${tool.id}-${tIdx}`}
                    onClick={tool.action}
                    type="button"
                    className="p-3.5 sm:p-4 rounded-2xl border border-slate-100 bg-white hover:bg-slate-50/80 hover:border-blue-200 transition-all text-left shadow-xs hover:shadow-md cursor-pointer active:scale-98 flex items-start gap-3 group"
                  >
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${tool.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {tool.title}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full shrink-0">
                          {tool.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {tool.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="p-3.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
            <p className="text-[11px] text-slate-400 font-medium">
              Created by <strong className="text-slate-700 font-bold">Manjit Ranjan ( Google Developer)</strong>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
