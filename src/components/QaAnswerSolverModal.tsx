import React, { useState } from 'react';
import { HelpCircle, X, Sparkles, Loader2, Copy, Check, Save, Search, GraduationCap, Layers, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { solveQuestionStepByStep } from '../lib/gemini';

interface QaAnswerSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onInsertIntoNote?: (title: string, solutionMarkdown: string) => void;
}

export const QaAnswerSolverModal: React.FC<QaAnswerSolverModalProps> = ({
  isOpen,
  onClose,
  language,
  onInsertIntoNote
}) => {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('Science');
  const [classLevel, setClassLevel] = useState('10');
  const [board, setBoard] = useState('CBSE');
  const [useGoogleData, setUseGoogleData] = useState(true);
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSolve = async () => {
    if (!question.trim()) return;
    setIsSolving(true);
    setSolution(null);
    try {
      const result = await solveQuestionStepByStep({
        question: question.trim(),
        subject,
        classLevel,
        board,
        language,
        useGoogleData
      });
      setSolution(result.solution);
      setSources(result.sources || []);
    } catch (err) {
      console.error("QA Solver error", err);
      alert("Failed to solve question. Please try again.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleSave = () => {
    if (!solution || !onInsertIntoNote) return;
    const content = `## Question & Verified Solution\n\n**Question:** ${question}\n\n${solution}\n`;
    onInsertIntoNote(`Solution: ${question.slice(0, 30)}...`, content);
    onClose();
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(`Question: ${question}\n\nSolution:\n${solution}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-3xl shadow-2xl border border-blue-100 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/20 shadow-2xs shrink-0"
                title="Back to Notebooks"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">AI Exam Question & Answer Solver</h3>
                <p className="text-[11px] sm:text-xs text-blue-100 truncate">Step-by-step problem solver with exam marks strategy</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Class</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map(c => (
                    <option key={c} value={c}>Class {c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Board</label>
                <select
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                >
                  {['CBSE', 'ICSE', 'State Board', 'Other'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                >
                  {['Science', 'Mathematics', 'English', 'SST', 'Computer', 'Physics', 'Chemistry', 'Biology'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Question / Numerical / Problem</label>
              <textarea
                rows={4}
                placeholder="Type or paste the exam question here (e.g. Derive Snell's law, Solve quadratic equation 2x^2 + 5x - 3 = 0, Explain the causes of French Revolution)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={useGoogleData}
                  onChange={(e) => setUseGoogleData(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Verify with Google Search Grounding</span>
              </label>

              <button
                onClick={handleSolve}
                disabled={isSolving || !question.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Solve Step-by-Step
              </button>
            </div>

            {solution && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Step-by-Step Solution</h4>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-5 bg-blue-50/40 rounded-2xl border border-blue-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {solution}
                </div>

                {onInsertIntoNote && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Add Solution to Notes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
