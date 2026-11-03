import React, { useState, useRef } from 'react';
import { 
  Copy, 
  Check, 
  Bookmark, 
  BookmarkCheck, 
  Download, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Languages, 
  HelpCircle, 
  Send, 
  Loader2, 
  CheckCircle2, 
  BookOpen, 
  Lightbulb, 
  AlertTriangle, 
  FileText,
  Repeat
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface OrganizedAnswerCardProps {
  question: string;
  subject: string;
  topic?: string;
  solution: string;
  isSaved?: boolean;
  onSave?: () => void;
  onAskFollowUp?: (followUp: string) => void;
  onExplainSimply?: () => void;
  onGenerateSimilar?: () => void;
  onTranslate?: (targetLanguage: string) => void;
  isLoadingAction?: boolean;
}

export const OrganizedAnswerCard: React.FC<OrganizedAnswerCardProps> = ({
  question,
  subject,
  topic,
  solution,
  isSaved = false,
  onSave,
  onAskFollowUp,
  onExplainSimply,
  onGenerateSimilar,
  onTranslate,
  isLoadingAction = false
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [followUpText, setFollowUpText] = useState('');
  const [isFollowUpOpen, setIsFollowUpOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState('Hindi');
  const [isTranslateOpen, setIsTranslateOpen] = useState(false);

  // 1. Copy to Clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(`Question: ${question}\n\nSubject: ${subject} (${topic || 'General'})\n\n${solution}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 2. Audio Reading (SpeechSynthesis)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural speech
    const cleanSpeechText = solution
      .replace(/[#*_`$]/g, '')
      .replace(/\$\$[\s\S]*?\$\$/g, ' mathematical equation ')
      .replace(/\$[^$]*\$/g, ' formula ')
      .slice(0, 2000); // safety cap

    const utterance = new SpeechSynthesisUtterance(cleanSpeechText);
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // 3. Export / Print PDF
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Study Top — ${subject} Solution</title>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #0f172a; max-width: 850px; margin: 0 auto; }
            .header { border-bottom: 3px solid #2563eb; padding-bottom: 16px; margin-bottom: 24px; }
            .q-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 14px 18px; border-radius: 8px; margin-bottom: 24px; font-weight: 600; }
            .badge { display: inline-block; background: #dbeafe; color: #1e40af; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 999px; text-transform: uppercase; }
            h1, h2, h3 { color: #1e3a8a; }
            .footer { margin-top: 48px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 16px; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">${subject}</span>
            <h1 style="margin: 8px 0 4px 0;">Study Top Academic Solution</h1>
            <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Topic:</strong> ${topic || 'General Studies'} • <strong>Study Top AI</strong></p>
          </div>
          <div class="q-box">
            <strong>Question:</strong> ${question}
          </div>
          <div>${solution.replace(/\n/g, '<br/>')}</div>
          <div class="footer">
            Created by Manjit Ranjan (Google Developer) • Study Top Learning Platform • https://studytoppp.netlify.app
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  const handleSendFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpText.trim() || !onAskFollowUp) return;
    onAskFollowUp(followUpText.trim());
    setFollowUpText('');
    setIsFollowUpOpen(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-7 md:p-8 space-y-6">
      {/* Top Meta & Action Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full">
                {subject}
              </span>
              {topic && (
                <span className="text-xs font-bold text-slate-500">
                  • {topic}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Audio Reader */}
          <button
            type="button"
            onClick={toggleSpeech}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                : 'border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            title={isSpeaking ? 'Stop Audio' : 'Listen to Answer'}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-600" /> : <Volume2 className="w-3.5 h-3.5 text-blue-600" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Copy entire answer to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Save to Notes */}
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                isSaved
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-black'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
              title="Save to your notes library"
            >
              {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-slate-500" />}
              <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
            </button>
          )}

          {/* PDF Download */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title="Export formatted PDF"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDF</span>
          </button>
        </div>
      </div>

      {/* 1. Display Original Question in Highlighted Box */}
      {question && (
        <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/50 border border-blue-200/80 rounded-2xl p-4 sm:p-5">
          <div className="text-[10px] font-black uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
            <span>Problem / Question</span>
          </div>
          <p className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
            {question}
          </p>
        </div>
      )}

      {/* Main Solution Output with KaTeX Math and Markdown Rendering */}
      <div className="prose prose-slate max-w-none text-slate-800 font-sans leading-relaxed text-sm md:text-base prose-headings:font-black prose-headings:text-slate-900 prose-headings:tracking-tight prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50/40 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-xl">
        <ReactMarkdown
          remarkPlugins={[remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {solution}
        </ReactMarkdown>
      </div>

      {/* Interactive Pedagogical Action Bar */}
      <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Explain More Simply (ELI5) */}
          {onExplainSimply && (
            <button
              type="button"
              onClick={onExplainSimply}
              disabled={isLoadingAction}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            >
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Explain More Simply</span>
            </button>
          )}

          {/* Generate Similar Practice Questions */}
          {onGenerateSimilar && (
            <button
              type="button"
              onClick={onGenerateSimilar}
              disabled={isLoadingAction}
              className="px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-900 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
            >
              <Repeat className="w-3.5 h-3.5 text-violet-600" />
              <span>Similar Questions</span>
            </button>
          )}

          {/* Translate Answer */}
          {onTranslate && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTranslateOpen(!isTranslateOpen)}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Languages className="w-3.5 h-3.5 text-blue-600" />
                <span>Translate</span>
              </button>

              {isTranslateOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-1.5 z-30 text-xs font-bold">
                  {['Hindi', 'Sanskrit', 'English', 'Bengali', 'Marathi', 'Gujarati', 'Tamil', 'Telugu'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setIsTranslateOpen(false);
                        setSelectedLang(lang);
                        onTranslate(lang);
                      }}
                      className="w-full text-left px-3.5 py-1.5 hover:bg-blue-50 text-slate-700 hover:text-blue-700"
                    >
                      Translate to {lang}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ask Follow-up Button */}
          {onAskFollowUp && (
            <button
              type="button"
              onClick={() => setIsFollowUpOpen(!isFollowUpOpen)}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
              <span>Ask Follow-up</span>
            </button>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Study Top AI • Verified Step-by-Step
        </div>
      </div>

      {/* Inline Follow-up Question Input Box */}
      {isFollowUpOpen && (
        <form onSubmit={handleSendFollowUp} className="pt-2 flex items-center gap-2">
          <input
            type="text"
            value={followUpText}
            onChange={(e) => setFollowUpText(e.target.value)}
            placeholder={`Ask a follow-up about this ${subject} problem (e.g. "Why did we use step 3?" or "Can you show another method?")...`}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            autoFocus
          />
          <button
            type="submit"
            disabled={!followUpText.trim() || isLoadingAction}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoadingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Ask</span>
          </button>
        </form>
      )}
    </div>
  );
};
