import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  BookOpen, 
  CheckSquare, 
  Download, 
  Copy, 
  Check, 
  Loader2, 
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import { stClient } from '../../lib/stCloudClient';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const PdfToolsWorkspaceView: React.FC<{
  onSaveToNotes?: (title: string, content: string) => void;
}> = ({ onSaveToNotes }) => {
  const [pdfFileName, setPdfFileName] = useState<string | null>(null);
  const [pdfTextContent, setPdfTextContent] = useState<string>('');
  const [activeTool, setActiveTool] = useState<'summarize' | 'qa' | 'extract' | 'chapter'>('summarize');
  const [userQuestion, setUserQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    
    // Simulate/parse text content
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setPdfTextContent(text.slice(0, 10000));
    };
    reader.readAsText(file);
  };

  const handleExecuteTool = async () => {
    if (!pdfTextContent.trim() && !pdfFileName) {
      setError('Please upload a PDF document first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      let prompt = '';
      if (activeTool === 'summarize') {
        prompt = `Generate a high-yield, chapter-wise summary of this study document (${pdfFileName}):\n\n${pdfTextContent.slice(0, 4000)}`;
      } else if (activeTool === 'qa') {
        prompt = `Using ONLY this document content (${pdfFileName}):\n${pdfTextContent.slice(0, 4000)}\n\nAnswer this student question: ${userQuestion}`;
      } else if (activeTool === 'extract') {
        prompt = `Extract all key definitions, formulas, and textbook principles from (${pdfFileName}):\n\n${pdfTextContent.slice(0, 4000)}`;
      } else {
        prompt = `Generate 5 important high-yield exam questions with model answers from (${pdfFileName}):\n\n${pdfTextContent.slice(0, 4000)}`;
      }

      const res = await stClient.ai.chat({
        message: prompt,
        subject: 'PDF Academic Document'
      });
      setResult(res.reply || 'PDF processing completed.');
    } catch (err: any) {
      setError(err.message || 'Error processing PDF document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20">
          <FileText className="w-4 h-4 text-white" />
          <span>MIND 1.0 PDF Processing Suite</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          PDF Academic Tools &amp; Summarizer
        </h2>
        <p className="text-xs sm:text-sm text-indigo-100 max-w-2xl font-medium">
          Extract text, generate chapter-wise summaries, ask grounded questions, and create exam revision sheets directly from textbook PDFs.
        </p>
      </div>

      {/* Upload & Tools Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                {pdfFileName || 'Upload Textbook PDF'}
              </h3>
              <p className="text-xs text-slate-400">
                {pdfFileName ? 'Document ready for MIND 1.0 analysis' : 'Supports PDF files up to 50MB'}
              </p>
            </div>
          </div>

          <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95">
            <Upload className="w-4 h-4" />
            <span>{pdfFileName ? 'Change PDF' : 'Upload PDF'}</span>
            <input type="file" accept=".pdf,.txt" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Tool Modes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'summarize', label: 'Chapter Summary', desc: 'Point-wise synopsis' },
            { id: 'qa', label: 'Ask from PDF', desc: 'Grounded question answering' },
            { id: 'extract', label: 'Formulas & Definitions', desc: 'Core academic concepts' },
            { id: 'chapter', label: 'Important Questions', desc: 'Exam model solutions' }
          ].map(tool => (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id as any)}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeTool === tool.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="text-xs font-black">{tool.label}</div>
              <div className={`text-[10px] mt-0.5 ${activeTool === tool.id ? 'text-blue-100' : 'text-slate-400'}`}>
                {tool.desc}
              </div>
            </button>
          ))}
        </div>

        {/* Question Box if 'qa' */}
        {activeTool === 'qa' && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Question About This Document</label>
            <input
              type="text"
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              placeholder="e.g. What is the author's argument in Section 2? Or explain the optical derivation."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
            />
          </div>
        )}

        <button
          onClick={handleExecuteTool}
          disabled={isLoading || (!pdfTextContent && !pdfFileName)}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing Document with MIND 1.0...</span>
            </>
          ) : (
            <>
              <span>Process PDF with MIND 1.0</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
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
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">
              PDF Analysis Result
            </span>

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
                  onClick={() => onSaveToNotes(pdfFileName ? `Notes: ${pdfFileName}` : 'PDF Study Notes', result)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 transition flex items-center gap-1.5 cursor-pointer border border-blue-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save to Notes</span>
                </button>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed space-y-3">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {result}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
