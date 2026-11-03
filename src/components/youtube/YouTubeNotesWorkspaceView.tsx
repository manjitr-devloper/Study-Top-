import React, { useState } from 'react';
import { 
  Youtube, 
  Sparkles, 
  Play, 
  Clock, 
  FileText, 
  Copy, 
  Check, 
  ArrowRight, 
  Loader2, 
  AlertCircle,
  Bookmark
} from 'lucide-react';
import { stClient } from '../../lib/stCloudClient';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const YouTubeNotesWorkspaceView: React.FC<{
  onSaveToNotes?: (title: string, content: string) => void;
}> = ({ onSaveToNotes }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [subject, setSubject] = useState('Science');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleUrls = [
    { title: 'Khan Academy: Quadratic Formula', url: 'https://www.youtube.com/watch?v=i7idZfS8t8w', subject: 'Mathematics' },
    { title: 'CrashCourse: Photosynthesis Light Reactions', url: 'https://www.youtube.com/watch?v=sQK3Yr4Sc_k', subject: 'Biology' },
    { title: 'Veritasium: The Science of Thinking', url: 'https://www.youtube.com/watch?v=UBVV8pch1Rs', subject: 'Science' }
  ];

  const handleGenerate = async (urlToUse?: string) => {
    const url = urlToUse || videoUrl;
    if (!url.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await stClient.ai.youtubeNotes({
        url: url.trim(),
        subject
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to process YouTube resource. Please verify URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.fullMarkdown) return;
    navigator.clipboard.writeText(result.fullMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20">
          <Youtube className="w-4 h-4 text-white" />
          <span>MIND 1.0 YouTube Resource Synthesizer</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          YouTube Video Notes Generator
        </h2>
        <p className="text-xs sm:text-sm text-rose-100 max-w-2xl font-medium">
          Transform educational lectures and YouTube tutorials into structured study notes with chapter timestamps and exam revision points.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Paste YouTube Video URL</label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Youtube className="w-4 h-4 text-red-500 absolute left-3.5 top-3" />
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-red-500 outline-none"
              />
            </div>

            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-blue-500 outline-none font-bold"
            >
              {['Science', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Computer Science'].map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            <button
              onClick={() => handleGenerate()}
              disabled={isLoading || !videoUrl.trim()}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 shadow-xs"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <span>Extract Notes</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Sample Links */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-slate-400 mb-2">Try a sample academic lecture:</div>
          <div className="flex flex-wrap gap-2">
            {sampleUrls.map((s, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setVideoUrl(s.url);
                  setSubject(s.subject);
                  handleGenerate(s.url);
                }}
                className="text-[11px] font-semibold text-slate-600 hover:text-red-600 bg-slate-50 hover:bg-red-50 border border-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                YouTube Video Notes
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">{result.title || 'Video Study Summary'}</h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {onSaveToNotes && (
                <button
                  onClick={() => onSaveToNotes(result.title || 'YouTube Study Notes', result.fullMarkdown || '')}
                  className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-xs font-bold text-red-700 transition flex items-center gap-1.5 cursor-pointer border border-red-200"
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>Save to Notebook</span>
                </button>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed space-y-3">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {result.fullMarkdown || ''}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
