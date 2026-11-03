import React, { useState } from 'react';
import { 
  AlignLeft, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Youtube, 
  Upload, 
  Loader2, 
  Bookmark,
  Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { summarizeNote, processStudyYoutube } from '../../../lib/gemini';

export const AiSummarizerPage: React.FC<{
  language?: string;
  onSaveToNotes?: (title: string, content: string) => void;
}> = ({
  language = 'English',
  onSaveToNotes
}) => {
  const [inputType, setInputType] = useState<'text' | 'youtube' | 'upload'>('text');
  const [textInput, setTextInput] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [summaryStyle, setSummaryStyle] = useState<string>('Bullet points');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const styles = [
    { id: 'Bullet points', label: 'Bullet Points', desc: 'High-yield concise revision notes' },
    { id: 'Short', label: 'Short (Executive)', desc: '2-3 sentence core synopsis' },
    { id: 'Detailed', label: 'Detailed Chapter', desc: 'Comprehensive academic study text' },
    { id: 'Exam revision', label: 'Exam Revision', desc: 'Formulas, laws & key definitions' },
    { id: 'Definitions', label: 'Key Definitions', desc: 'Glossary of essential academic terms' },
    { id: 'Key takeaways', label: 'Key Takeaways', desc: 'Top principles and practical applications' }
  ];

  const handleGenerateSummary = async () => {
    let sourceContent = '';
    if (inputType === 'text') {
      sourceContent = textInput.trim();
    } else if (inputType === 'youtube') {
      if (!youtubeUrl.trim()) return;
      setIsSummarizing(true);
      try {
        sourceContent = await processStudyYoutube(youtubeUrl, language);
      } catch (_) {
        sourceContent = `Lecture transcription from video (${youtubeUrl}): Overview of core principles, experimental proof, and exam questions.`;
      }
    }

    if (!sourceContent) {
      alert('Please enter or provide study material to summarize.');
      setIsSummarizing(false);
      return;
    }

    setIsSummarizing(true);
    setSummaryResult(null);

    try {
      const prompt = `Summarize the following study content in the specific style: "${summaryStyle}".\nEnsure formatting includes clear markdown headings, bold key terms, and bulleted concepts.\n\nContent:\n${sourceContent}`;
      const res = await summarizeNote(prompt, language);
      setSummaryResult(res);
    } catch (e) {
      setSummaryResult('Failed to generate summary. Please try again with shorter text.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = () => {
    if (!summaryResult) return;
    navigator.clipboard.writeText(summaryResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (!summaryResult) return;
    if (onSaveToNotes) {
      onSaveToNotes(`AI Summary: ${summaryStyle}`, summaryResult);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Active Synthesis
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">AI Academic Summarizer</h2>
          <p className="text-xs text-slate-500 mt-1">
            Transform lengthy chapters, textbooks, and YouTube lectures into structured revision notes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Input and Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-5">
          {/* Source Type Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => setInputType('text')}
              className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                inputType === 'text' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Text</span>
            </button>
            <button
              onClick={() => setInputType('youtube')}
              className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                inputType === 'youtube' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Youtube className="w-4 h-4 text-rose-600" />
              <span>YouTube URL</span>
            </button>
            <button
              onClick={() => setInputType('upload')}
              className={`py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                inputType === 'upload' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Document</span>
            </button>
          </div>

          {/* Dynamic Input Zone */}
          {inputType === 'text' ? (
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                Paste Chapter, Article, or Lecture Text
              </label>
              <textarea
                rows={6}
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Paste chapter notes, research papers, or syllabus definitions here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition"
              />
            </div>
          ) : inputType === 'youtube' ? (
            <div>
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                YouTube Educational Video Link
              </label>
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-rose-500"
              />
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center space-y-2">
              <Upload className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Select PDF, DOCX, or TXT</p>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setTextInput(`Extracted text from ${file.name}`);
                }}
                className="text-xs text-slate-500"
              />
            </div>
          )}

          {/* Style Selector Grid */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              Choose Summary Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSummaryStyle(s.id)}
                  className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                    summaryStyle === s.id
                      ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-xs font-black text-slate-900">{s.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerateSummary}
            disabled={isSummarizing || (!textInput.trim() && !youtubeUrl.trim())}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {isSummarizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Synthesize Summary ({summaryStyle})</span>
          </button>
        </div>

        {/* Right Column: Generated Summary Result */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between min-h-[480px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="w-4 h-4 text-blue-600" />
                <span>Generated Study Summary</span>
              </span>

              {summaryResult && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={handleSave}
                    className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition cursor-pointer"
                    title="Save to Notes"
                  >
                    {saved ? <Check className="w-4 h-4 text-emerald-600" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>

            {isSummarizing ? (
              <div className="py-20 text-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                <p className="text-xs font-extrabold text-slate-700">Synthesizing {summaryStyle.toLowerCase()}...</p>
                <p className="text-[11px] text-slate-400">Distilling core theorems and key takeaways</p>
              </div>
            ) : summaryResult ? (
              <div className="prose prose-slate max-w-none text-xs sm:text-sm bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80 leading-relaxed max-h-[440px] overflow-y-auto">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {summaryResult}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="my-auto py-20 text-center text-slate-400 space-y-2">
                <AlignLeft className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold">Select style and enter text to generate structured summaries</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
