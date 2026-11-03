import React, { useState } from 'react';
import { 
  Brain, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Loader2, 
  Bookmark,
  ArrowRight
} from 'lucide-react';
import { summarizeNote } from '../../../lib/gemini';

export const TextSimplifierPage: React.FC<{
  language?: string;
  onSaveToNote?: (title: string, content: string) => void;
}> = ({
  language = 'English',
  onSaveToNote
}) => {
  const [inputText, setTextInput] = useState('');
  const [targetLevel, setTargetLevel] = useState('Class 8 level');
  const [simplifiedOutput, setSimplifiedOutput] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const levels = [
    { id: 'Very simple', label: 'ELI5 (Very Simple)', desc: 'Explain like I am 5 with everyday analogies' },
    { id: 'School-level', label: 'School Level', desc: 'Clear elementary conceptual language' },
    { id: 'Class 8 level', label: 'Class 8 Level', desc: 'Middle-school curriculum definitions' },
    { id: 'Class 10 level', label: 'Class 10 Level', desc: 'Secondary school board exam friendly' },
    { id: 'Detailed explanation', label: 'Detailed Explanation', desc: 'Step-by-step breakdown with context' },
    { id: 'Bullet points', label: 'Bullet Points', desc: 'Key takeaways in easy bite-sized points' },
    { id: 'Exam-ready answer', label: 'Exam-Ready Answer', desc: 'Structured for maximum marks on exams' }
  ];

  const handleSimplify = async () => {
    if (!inputText.trim()) return;
    setIsSimplifying(true);
    setSimplifiedOutput(null);

    try {
      const prompt = `Simplify the following text specifically for "${targetLevel}" understanding.
Preserve all accurate scientific/historical facts and laws, but explain any complex jargon using relatable analogies and simple wording.

Original Text:
${inputText}`;

      const res = await summarizeNote(prompt, language);
      setSimplifiedOutput(res);
    } catch (err) {
      setSimplifiedOutput('Could not simplify text right now. Please try with shorter text.');
    } finally {
      setIsSimplifying(false);
    }
  };

  const handleCopy = () => {
    if (!simplifiedOutput) return;
    navigator.clipboard.writeText(simplifiedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Comprehension &amp; Clarity
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">AI Academic Text Simplifier</h2>
          <p className="text-xs text-slate-500 mt-1">
            Demystify dense textbook passages, research jargon, and hard-to-understand definitions into clear language.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input text & Level selection */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
              Paste Difficult Academic Text
            </label>
            <textarea
              rows={7}
              value={inputText}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste complex textbook paragraphs, academic papers, or convoluted definitions here..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Choose Target Comprehension Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {levels.map(lvl => (
                <button
                  key={lvl.id}
                  onClick={() => setTargetLevel(lvl.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    targetLevel === lvl.id
                      ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{lvl.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{lvl.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSimplify}
            disabled={!inputText.trim() || isSimplifying}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isSimplifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            <span>Simplify for {targetLevel}</span>
          </button>
        </div>

        {/* Right Column: Simplified Result */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Plain Language Explanation</span>
              </h3>

              {simplifiedOutput && (
                <button
                  onClick={handleCopy}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {isSimplifying ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Translating complex terms into easy concepts...</p>
                <p className="text-[11px] text-slate-400">Crafting everyday analogies &amp; clear bullet points</p>
              </div>
            ) : simplifiedOutput ? (
              <div className="p-5 bg-slate-50/70 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium whitespace-pre-wrap max-h-[380px] overflow-y-auto">
                {simplifiedOutput}
              </div>
            ) : (
              <div className="my-auto py-20 text-center text-slate-400 space-y-2">
                <Brain className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Select a comprehension level and enter text to see it explained simply</p>
              </div>
            )}
          </div>

          {simplifiedOutput && onSaveToNote && (
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => onSaveToNote(`Simplified: ${targetLevel}`, simplifiedOutput)}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                + Save as Study Note →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
