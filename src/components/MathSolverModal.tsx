import React, { useState } from 'react';
import { Calculator, X, Sparkles, Loader2, Copy, Check, Save, Camera, Upload, FileText, ChevronLeft, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { solveQuestionStepByStep } from '../lib/gemini';

interface MathSolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onInsertIntoNote?: (title: string, solutionMarkdown: string) => void;
}

export const MathSolverModal: React.FC<MathSolverModalProps> = ({
  isOpen,
  onClose,
  language,
  onInsertIntoNote
}) => {
  const [question, setQuestion] = useState('');
  const [mathBranch, setMathBranch] = useState('Algebra & Equations');
  const [classLevel, setClassLevel] = useState('10');
  const [isSolving, setIsSolving] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setQuestion(prev => prev + `\n[Uploaded Math Document/Image: ${file.name}]`);
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!question.trim()) return;
    setIsSolving(true);
    setSolution(null);
    try {
      const prompt = `Solve this mathematics problem step-by-step for Class ${classLevel} (${mathBranch}):\n${question}\n\nProvide:
1. Identified Question
2. Given Information & Variables
3. Required Mathematical Formulae
4. Step-by-Step Calculation & Explanation
5. Final Verified Answer
6. Alternative Solving Method (if applicable)
7. 2 Practice Questions with Answers`;

      const result = await solveQuestionStepByStep({
        question: prompt,
        subject: `Mathematics (${mathBranch})`,
        classLevel,
        board: 'CBSE / ICSE / Universal',
        language,
        useGoogleData: true
      });
      setSolution(result.solution);
    } catch (err) {
      console.error("Math solver error", err);
      alert("Failed to solve mathematical problem. Please try again.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleSave = () => {
    if (!solution || !onInsertIntoNote) return;
    const content = `## AI Math Solution (${mathBranch})\n\n**Problem:** ${question}\n\n${solution}\n`;
    onInsertIntoNote(`Math Solution: ${question.slice(0, 30)}...`, content);
    onClose();
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(`Problem: ${question}\n\nSolution:\n${solution}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-3xl shadow-2xl border border-blue-100 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/20 shadow-2xs shrink-0"
                title="Back"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">AI Math Solver (100% Free for Everyone)</h3>
                <p className="text-[11px] sm:text-xs text-emerald-100 truncate">Arithmetic, Algebra, Calculus, Trigonometry & Geometry solver</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Mathematics Branch</label>
                <select
                  value={mathBranch}
                  onChange={(e) => setMathBranch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                >
                  {[
                    'Arithmetic & Number Systems',
                    'Fractions, Decimals & Percentages',
                    'Algebra & Linear/Quadratic Equations',
                    'Geometry & Mensuration',
                    'Trigonometry & Identities',
                    'Statistics & Probability',
                    'Calculus (Derivatives & Integrals)',
                    'Matrices & Determinants',
                    'Word Problems'
                  ].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">Class / Level</label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800"
                >
                  {['6', '7', '8', '9', '10', '11', '12', 'College Undergrad'].map(c => (
                    <option key={c} value={c}>Class / Level {c}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">Problem Statement / Equation / Numerical</label>
                <label className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Image / PDF / Handwriting</span>
                  <input type="file" accept="image/*,application/pdf" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
              <textarea
                rows={4}
                placeholder="Type your math problem here (e.g. Solve 2x^2 + 5x - 3 = 0, Find derivative of sin(x) * e^x, Calculate compound interest on ₹10,000 at 8% for 2 years)..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-semibold text-slate-800 outline-none focus:border-emerald-500"
              />
              {uploadedFileName && (
                <p className="mt-1.5 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Attached: {uploadedFileName}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSolve}
                disabled={isSolving || !question.trim()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Solve Math Problem Free
              </button>
            </div>

            {solution && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800">Step-by-Step Math Solution</h4>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 text-xs text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                  {solution}
                </div>

                {onInsertIntoNote && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
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
