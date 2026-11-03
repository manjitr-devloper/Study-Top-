import React, { useState } from 'react';
import { 
  SpellCheck, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  RotateCw,
  ArrowRight
} from 'lucide-react';
import { checkSpelling, SpellingIssue } from '../../../lib/gemini';

export const GrammarCheckerPage: React.FC<{ language?: string }> = ({
  language = 'English'
}) => {
  const [inputText, setTextInput] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [correctedText, setCorrectedText] = useState<string | null>(null);
  const [issues, setIssues] = useState<SpellingIssue[]>([]);
  const [copied, setCopied] = useState(false);

  const handleCheckGrammar = async () => {
    if (!inputText.trim()) return;
    setIsChecking(true);
    setIssues([]);
    setCorrectedText(null);

    try {
      const detectedIssues = await checkSpelling(inputText, language);
      setIssues(detectedIssues || []);

      // Produce corrected text by applying suggestions or standard correction
      let corrected = inputText;
      if (detectedIssues && detectedIssues.length > 0) {
        detectedIssues.forEach(iss => {
          if (iss.suggestions && iss.suggestions.length > 0) {
            corrected = corrected.replace(iss.original, iss.suggestions[0]);
          }
        });
      }
      setCorrectedText(corrected);
    } catch (err) {
      setCorrectedText(inputText);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopy = () => {
    if (!correctedText) return;
    navigator.clipboard.writeText(correctedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
            Writing &amp; Editorial Assistant
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">AI Academic Grammar &amp; Spell Checker</h2>
          <p className="text-xs text-slate-500 mt-1">
            Detect and resolve grammatical errors, typos, punctuation slips, and awkward sentence phrasing.
          </p>
        </div>

        {correctedText && (
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Corrected Text' : 'Copy Corrected Text'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input text */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
              Original Draft Text
            </h3>
            <textarea
              rows={12}
              value={inputText}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your essay, thesis abstract, or homework solution here to review grammar and sentence flow..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition leading-relaxed"
            />
          </div>

          <button
            onClick={handleCheckGrammar}
            disabled={!inputText.trim() || isChecking}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : <SpellCheck className="w-4 h-4" />}
            <span>Analyze Grammar &amp; Mechanics</span>
          </button>
        </div>

        {/* Right Column: Corrected Text & Issue Explanations */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Editorial Recommendations</span>
              </h3>
              {issues.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                  {issues.length} {issues.length === 1 ? 'issue' : 'issues'} identified
                </span>
              )}
            </div>

            {isChecking ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Inspecting syntax, vocabulary &amp; punctuation...</p>
              </div>
            ) : correctedText ? (
              <div className="space-y-4">
                {/* Corrected Text Box */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    Polished &amp; Corrected Text
                  </label>
                  <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200 text-xs text-slate-800 leading-relaxed font-medium">
                    {correctedText}
                  </div>
                </div>

                {/* Issues List */}
                {issues.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-black text-slate-700 uppercase">Detailed Explanations:</p>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {issues.map((iss, i) => (
                        <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="line-through text-rose-600 font-bold">{iss.original}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="text-emerald-700 font-bold">{iss.suggestions?.[0] || 'corrected'}</span>
                          </div>
                          <p className="text-[11px] text-slate-500">{iss.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="my-auto py-20 text-center text-slate-400 space-y-2">
                <SpellCheck className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Paste your text on the left to see instant corrections and style advice</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
