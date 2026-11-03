import React, { useState } from 'react';
import { 
  Sparkles, X, BookOpen, GraduationCap, Globe, Layers, 
  FileText, Upload, Search, CheckCircle2, Loader2, ArrowRight,
  HelpCircle, Eye, Copy, Check, Download, Share2, Compass, AlertCircle, ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generatePointWiseNotes, PointWiseNotesOptions } from '../lib/gemini';
import { MermaidViewer } from './MermaidViewer';
import { SUPPORTED_LANGUAGES } from '../constants';

interface PointWiseNotesMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLanguage: string;
  onSaveNote: (title: string, content: string, tags: string[], categoryId: string) => void;
}

const CLASSES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const BOARDS = ['CBSE', 'ICSE', 'State Board', 'Other'];
const SUBJECTS = ['Science', 'Mathematics', 'English', 'SST', 'Computer', 'Physics', 'Chemistry', 'Biology', 'History', 'Custom'];
const LENGTHS: Array<'Very Short' | 'Short' | 'Detailed' | 'Exam-Ready'> = ['Very Short', 'Short', 'Detailed', 'Exam-Ready'];

export const PointWiseNotesMakerModal: React.FC<PointWiseNotesMakerModalProps> = ({
  isOpen,
  onClose,
  userLanguage,
  onSaveNote
}) => {
  const [classLevel, setClassLevel] = useState('10');
  const [board, setBoard] = useState('CBSE');
  const [subject, setSubject] = useState('Science');
  const [customSubject, setCustomSubject] = useState('');
  const [chapterTitle, setChapterTitle] = useState('');
  const [language, setLanguage] = useState(userLanguage || 'English');
  const [length, setLength] = useState<'Very Short' | 'Short' | 'Detailed' | 'Exam-Ready'>('Detailed');
  const [inputMethod, setInputMethod] = useState<'topic' | 'paste' | 'upload'>('topic');
  const [sourceMaterial, setSourceMaterial] = useState('');
  const [useGoogleData, setUseGoogleData] = useState(true);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'diagram' | 'raw'>('preview');

  if (!isOpen) return null;

  const actualSubject = subject === 'Custom' ? (customSubject.trim() || 'General') : subject;

  const handleGenerate = async () => {
    if (!chapterTitle.trim()) return;

    setIsGenerating(true);
    setGeneratedMarkdown(null);
    try {
      const result = await generatePointWiseNotes({
        classLevel,
        board,
        subject: actualSubject,
        chapterTitle: chapterTitle.trim(),
        language,
        length,
        sourceMaterial: inputMethod !== 'topic' ? sourceMaterial : undefined,
        useGoogleData
      });

      setGeneratedMarkdown(result.markdown);
      setSources(result.sources || []);
    } catch (err) {
      console.error("Notes generation error", err);
      alert("Failed to generate notes. Please check your connection and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToWorkspace = () => {
    if (!generatedMarkdown) return;
    const tags = [
      `class:${classLevel}`,
      `board:${board}`,
      `subject:${actualSubject}`,
      `length:${length}`
    ];
    onSaveNote(chapterTitle.trim() || 'Study Notes', generatedMarkdown, tags, actualSubject);
    onClose();
  };

  const handleCopy = () => {
    if (!generatedMarkdown) return;
    navigator.clipboard.writeText(generatedMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Extract mermaid code block if present
  const mermaidMatch = generatedMarkdown?.match(/```mermaid\s*([\s\S]*?)```/);
  const mermaidCode = mermaidMatch ? mermaidMatch[1].trim() : '';

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-4xl shadow-2xl border border-indigo-100 flex flex-col max-h-[92vh] overflow-hidden relative"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-4 sm:px-8 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 shadow-md gap-3">
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

              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-2xl font-black tracking-tight truncate">AI Point-Wise Notes Maker</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20 hidden sm:inline-block">Smart Engine</span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100 font-medium truncate">Turn any syllabus chapter or document into crystal-clear bullet points</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            {!generatedMarkdown ? (
              <div className="space-y-6">
                {/* Inputs Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Class */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      Class (1 - 12)
                    </label>
                    <select
                      value={classLevel}
                      onChange={(e) => setClassLevel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      {CLASSES.map(c => (
                        <option key={c} value={c}>Class {c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Board */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                      Board
                    </label>
                    <select
                      value={board}
                      onChange={(e) => setBoard(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer"
                    >
                      {BOARDS.map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-violet-600" />
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all cursor-pointer"
                    >
                      {SUBJECTS.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    {subject === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom subject..."
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        className="mt-2 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-violet-500"
                      />
                    )}
                  </div>
                </div>

                {/* Chapter / Topic Name */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                    Chapter Name or Topic <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={chapterTitle}
                    onChange={(e) => setChapterTitle(e.target.value)}
                    placeholder="e.g. Chemical Reactions and Equations, Electricity, Force and Laws of Motion..."
                    className="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-4 py-3.5 text-sm md:text-base font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all"
                  />
                </div>

                {/* Length & Language Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Notes Length */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">
                      Notes Length Style
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                      {LENGTHS.map((len) => (
                        <button
                          key={len}
                          type="button"
                          onClick={() => setLength(len)}
                          className={`py-2 px-1 text-[11px] font-black rounded-xl transition-all text-center ${
                            length === len
                              ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {len}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-600" />
                      Notes Language
                    </label>
                    <select
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {SUPPORTED_LANGUAGES.map((l, idx) => (
                        <option key={`${l.code}-${idx}`} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Input Method Toggle & Optional Source */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Input Method
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setInputMethod('topic')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          inputMethod === 'topic' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        Syllabus Topic Only
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMethod('paste')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          inputMethod === 'paste' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        Paste Chapter Text
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputMethod('upload')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                          inputMethod === 'upload' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        Upload Document
                      </button>
                    </div>
                  </div>

                  {inputMethod === 'paste' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <textarea
                        rows={5}
                        placeholder="Paste textbook excerpt, syllabus chapter, or lecture transcript here..."
                        value={sourceMaterial}
                        onChange={(e) => setSourceMaterial(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                      />
                    </motion.div>
                  )}

                  {inputMethod === 'upload' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                      <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-slate-50 hover:bg-blue-50/30">
                        <Upload className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Click to upload TXT or text file</span>
                        <span className="text-[10px] text-slate-400 mt-1">Converts raw text directly into structured notes</span>
                        <input
                          type="file"
                          accept=".txt,.md,.json"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const text = await file.text();
                              setSourceMaterial(text);
                              if (!chapterTitle) {
                                setChapterTitle(file.name.replace(/\.[^/.]+$/, ""));
                              }
                            }
                          }}
                        />
                      </label>
                      {sourceMaterial && (
                        <p className="text-[11px] font-bold text-emerald-600 mt-2 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> File content loaded ({sourceMaterial.length} characters)
                        </p>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Google Search Grounding Checkbox */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-xs border border-blue-200/60 text-blue-600">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Ground with Real Google Search Data</h4>
                      <p className="text-[11px] text-slate-500">Cross-checks latest curriculum formulas, syllabus definitions, and verified exam facts.</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useGoogleData}
                      onChange={(e) => setUseGoogleData(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ) : (
              /* Generated Notes View */
              <div className="space-y-6">
                {/* View Tabs & Actions */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('preview')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'preview' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Point-Wise Notes
                    </button>
                    {mermaidCode && (
                      <button
                        onClick={() => setActiveTab('diagram')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                          activeTab === 'diagram' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        Concept Diagram
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('raw')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                        activeTab === 'raw' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Raw Markdown
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => setGeneratedMarkdown(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 transition-all"
                    >
                      Edit Options
                    </button>
                  </div>
                </div>

                {/* Content Display */}
                {activeTab === 'preview' && (
                  <div className="prose prose-slate max-w-none prose-headings:font-black prose-h1:text-2xl prose-h2:text-xl prose-h2:text-indigo-900 prose-h2:border-b prose-h2:border-slate-100 prose-h2:pb-2 prose-strong:text-indigo-950 prose-li:my-1 text-slate-800 text-sm leading-relaxed p-6 bg-slate-50/70 rounded-3xl border border-slate-200/80">
                    <div className="whitespace-pre-wrap font-sans">
                      {generatedMarkdown}
                    </div>
                  </div>
                )}

                {activeTab === 'diagram' && mermaidCode && (
                  <MermaidViewer chart={mermaidCode} />
                )}

                {activeTab === 'raw' && (
                  <textarea
                    rows={16}
                    value={generatedMarkdown}
                    onChange={(e) => setGeneratedMarkdown(e.target.value)}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl outline-none border border-slate-800 leading-relaxed custom-scrollbar"
                  />
                )}

                {/* Grounding Sources */}
                {sources.length > 0 && (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">Google Grounding Sources</h5>
                    <div className="flex flex-wrap gap-2">
                      {sources.map((src, i) => (
                        <a
                          key={i}
                          href={src}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline bg-white px-2.5 py-1 rounded-lg border border-slate-200 truncate max-w-xs"
                        >
                          {src}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="bg-slate-50 px-6 md:px-8 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            {!generatedMarkdown ? (
              <>
                <div className="text-xs text-slate-500 font-medium">
                  Class {classLevel} • {board} • {actualSubject} • {length}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating || !chapterTitle.trim()}
                    className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Point-Wise Notes...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate Notes
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Notes Generated Successfully
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setGeneratedMarkdown(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToWorkspace}
                    className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Save to My Notes
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
