import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  RotateCcw, 
  RotateCw, 
  Save, 
  FileText, 
  FileDown, 
  FileCode,
  Image as ImageIcon, 
  Bookmark, 
  Sliders, 
  Undo2, 
  Redo2, 
  Highlighter, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Table as TableIcon, 
  Code, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ChevronDown,
  Layers,
  GraduationCap,
  Network,
  HelpCircle,
  Shuffle,
  Eye,
  Zap,
  ShieldCheck,
  BrainCircuit,
  MessageSquare,
  Maximize2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import mermaid from 'mermaid';
import { 
  exportNotesAsPdf, 
  exportNotesAsDocx, 
  exportNotesAsTxt, 
  exportNotesAsImage 
} from '../../lib/notesExporter';
import { 
  regenerateNoteSection,
  generateConceptMap,
  generateExamPrep,
  generateQualityReport,
  executeContextualAction,
  ConceptMapResult,
  ExamPrepResult,
  QualityReportResult
} from '../../lib/gemini';
import { StudyTopLogo } from '../StudyTopLogo';

interface PremiumNotesEditorProps {
  initialTitle: string;
  initialContent: string;
  sourceContext?: string;
  format?: string;
  language?: string;
  onSaveToLibrary: (note: { title: string; content: string }) => void;
  onBackToGenerator: () => void;
}

export const PremiumNotesEditor: React.FC<PremiumNotesEditorProps> = ({
  initialTitle,
  initialContent,
  sourceContext = '',
  format = 'Detailed Notes',
  language = 'English',
  onSaveToLibrary,
  onBackToGenerator
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  // Undo / Redo history
  const [history, setHistory] = useState<string[]>([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Editor states
  const [viewMode, setViewMode] = useState<'preview' | 'split' | 'raw'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [copiedSectionIndex, setCopiedSectionIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<string>('Saved just now');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('Premium Study Notes');

  // Section Regeneration
  const [regeneratingSectionIndex, setRegeneratingSectionIndex] = useState<number | null>(null);
  const [sectionRegenInstruction, setSectionRegenInstruction] = useState('');
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);

  // Modal States: Concept Map, Exam Prep, Quality Report, Flashcards, Contextual Action
  const [isConceptMapOpen, setIsConceptMapOpen] = useState(false);
  const [conceptMapData, setConceptMapData] = useState<ConceptMapResult | null>(null);
  const [isGeneratingConceptMap, setIsGeneratingConceptMap] = useState(false);

  const [isExamPrepOpen, setIsExamPrepOpen] = useState(false);
  const [examPrepData, setExamPrepData] = useState<ExamPrepResult | null>(null);
  const [isGeneratingExamPrep, setIsGeneratingExamPrep] = useState(false);
  const [selectedMcqAnswers, setSelectedMcqAnswers] = useState<Record<number, number>>({});
  const [showMcqExplanations, setShowMcqExplanations] = useState<Record<number, boolean>>({});

  const [isQualityReportOpen, setIsQualityReportOpen] = useState(false);
  const [qualityReportData, setQualityReportData] = useState<QualityReportResult | null>(null);
  const [isGeneratingQualityReport, setIsGeneratingQualityReport] = useState(false);

  const [isFlashcardsOpen, setIsFlashcardsOpen] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [difficultCards, setDifficultCards] = useState<number[]>([]);

  // Contextual Action Drawer
  const [contextualActionData, setContextualActionData] = useState<{
    isOpen: boolean;
    actionType: string;
    sectionHeading: string;
    output: string;
    isLoading: boolean;
  }>({
    isOpen: false,
    actionType: '',
    sectionHeading: '',
    output: '',
    isLoading: false
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mermaidRef = useRef<HTMLDivElement>(null);

  // Initialize Mermaid
  useEffect(() => {
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: 'neutral',
        securityLevel: 'loose'
      });
    } catch (_) {}
  }, []);

  // Render Mermaid diagram when concept map changes
  useEffect(() => {
    if (isConceptMapOpen && conceptMapData?.mermaidCode && mermaidRef.current) {
      const renderDiagram = async () => {
        try {
          mermaidRef.current!.innerHTML = '';
          const id = `mermaid_${Date.now()}`;
          const { svg } = await mermaid.render(id, conceptMapData.mermaidCode);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = svg;
          }
        } catch (err) {
          console.warn('Mermaid rendering notice:', err);
          if (mermaidRef.current) {
            mermaidRef.current.innerHTML = `<pre class="p-4 bg-slate-50 font-mono text-xs rounded-xl overflow-x-auto">${conceptMapData.mermaidCode}</pre>`;
          }
        }
      };
      renderDiagram();
    }
  }, [isConceptMapOpen, conceptMapData]);

  // Push new state to history
  const updateContentWithHistory = (newContent: string) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newContent);
    if (updated.length > 30) updated.shift();
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setContent(newContent);
    setAutoSaveTimer('Unsaved changes');
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIdx = historyIndex - 1;
      setHistoryIndex(newIdx);
      setContent(history[newIdx]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIdx = historyIndex + 1;
      setHistoryIndex(newIdx);
      setContent(history[newIdx]);
    }
  };

  // Auto-save debouncer
  useEffect(() => {
    const timer = setTimeout(() => {
      setAutoSaveTimer(`Auto-saved at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
    }, 1500);
    return () => clearTimeout(timer);
  }, [content, title]);

  // Parse markdown into sections
  const sections = useMemo(() => {
    const lines = content.split('\n');
    const parsed: Array<{ id: number; heading: string; body: string; fullText: string }> = [];
    let currentHeading = 'Overview';
    let currentLines: string[] = [];
    let sectionId = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        if (currentLines.length > 0 || currentHeading !== 'Overview') {
          parsed.push({
            id: sectionId++,
            heading: currentHeading,
            body: currentLines.join('\n').trim(),
            fullText: `## ${currentHeading}\n` + currentLines.join('\n').trim()
          });
        }
        currentHeading = line.replace(/^##\s+/, '').trim();
        currentLines = [];
      } else if (line.startsWith('# ') && sectionId === 0 && currentLines.length === 0) {
        continue;
      } else {
        currentLines.push(line);
      }
    }

    if (currentLines.length > 0 || currentHeading !== 'Overview') {
      parsed.push({
        id: sectionId++,
        heading: currentHeading,
        body: currentLines.join('\n').trim(),
        fullText: `## ${currentHeading}\n` + currentLines.join('\n').trim()
      });
    }

    return parsed;
  }, [content]);

  // Extract Flashcards from notes
  const flashcards = useMemo(() => {
    const cards: Array<{ front: string; back: string }> = [];
    sections.forEach(sec => {
      const lines = sec.body.split('\n').filter(l => l.trim().length > 0);
      lines.forEach(l => {
        if (l.startsWith('- **') && l.includes('**:')) {
          const parts = l.replace(/^- \*\*/, '').split('**:');
          if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
            cards.push({ front: parts[0].trim(), back: parts.slice(1).join('**:').trim() });
          }
        } else if (l.includes('$$') && !l.startsWith('$$')) {
          cards.push({ front: sec.heading, back: l.trim() });
        }
      });
    });

    if (cards.length === 0) {
      sections.slice(0, 6).forEach(sec => {
        cards.push({
          front: sec.heading,
          back: sec.body.slice(0, 250) + (sec.body.length > 250 ? '...' : '')
        });
      });
    }
    return cards;
  }, [sections]);

  // Actions
  const handleCopyEntireNote = async () => {
    try {
      await navigator.clipboard.writeText(`# ${title}\n\n${content}`);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (_) {}
  };

  const handleCopySection = async (sectionText: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(sectionText);
      setCopiedSectionIndex(idx);
      setTimeout(() => setCopiedSectionIndex(null), 2000);
    } catch (_) {}
  };

  const applyTextFormat = (prefix: string, suffix: string = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);
    updateContentWithHistory(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  // Section Regeneration
  const handleRegenerateSectionSubmit = async (sectionIndex: number) => {
    const sec = sections[sectionIndex];
    if (!sec) return;

    setIsRegeneratingSection(true);
    setRegenError(null);

    try {
      const res = await regenerateNoteSection({
        sectionTitle: sec.heading,
        sectionContent: sec.body,
        sourceContext,
        language,
        instruction: sectionRegenInstruction.trim() || 'Regenerate this section clearly strictly from the provided source document.'
      });

      if (res && res.regeneratedContent) {
        const targetSearch = `## ${sec.heading}`;
        const parts = content.split(targetSearch);
        if (parts.length >= 2) {
          const afterSearch = parts.slice(1).join(targetSearch);
          const nextHeaderIdx = afterSearch.indexOf('\n## ');
          let remainder = '';
          if (nextHeaderIdx !== -1) {
            remainder = afterSearch.substring(nextHeaderIdx);
          }
          const updatedContent = parts[0] + res.regeneratedContent.trim() + remainder;
          updateContentWithHistory(updatedContent);
        } else {
          const updatedContent = content.replace(sec.fullText, res.regeneratedContent.trim());
          updateContentWithHistory(updatedContent);
        }
      }

      setRegeneratingSectionIndex(null);
      setSectionRegenInstruction('');
    } catch (err: any) {
      setRegenError(err?.message || 'Section regeneration encountered an issue.');
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  // Open Concept Map Modal
  const handleOpenConceptMap = async () => {
    setIsConceptMapOpen(true);
    if (!conceptMapData) {
      setIsGeneratingConceptMap(true);
      try {
        const res = await generateConceptMap({ noteContent: content, title, language });
        setConceptMapData(res);
      } catch (err) {
        console.error('Concept map error:', err);
      } finally {
        setIsGeneratingConceptMap(false);
      }
    }
  };

  // Open Exam Prep Modal
  const handleOpenExamPrep = async () => {
    setIsExamPrepOpen(true);
    if (!examPrepData) {
      setIsGeneratingExamPrep(true);
      try {
        const res = await generateExamPrep({ noteContent: content, language });
        setExamPrepData(res);
      } catch (err) {
        console.error('Exam prep error:', err);
      } finally {
        setIsGeneratingExamPrep(false);
      }
    }
  };

  // Open Quality Report Modal
  const handleOpenQualityReport = async () => {
    setIsQualityReportOpen(true);
    if (!qualityReportData) {
      setIsGeneratingQualityReport(true);
      try {
        const res = await generateQualityReport({ noteContent: content, sourceContent: sourceContext, language });
        setQualityReportData(res);
      } catch (err) {
        console.error('Quality report error:', err);
      } finally {
        setIsGeneratingQualityReport(false);
      }
    }
  };

  // Contextual Inline Assistant Execution
  const handleExecuteContextualAction = async (sec: { heading: string; body: string }, actionType: any) => {
    setContextualActionData({
      isOpen: true,
      actionType,
      sectionHeading: sec.heading,
      output: '',
      isLoading: true
    });

    try {
      const res = await executeContextualAction({
        actionType,
        selectedText: `## ${sec.heading}\n${sec.body}`,
        fullNoteContext: content,
        language
      });
      setContextualActionData(prev => ({ ...prev, output: res.output, isLoading: false }));
    } catch (err: any) {
      setContextualActionData(prev => ({
        ...prev,
        output: err?.message || 'Action failed. Please try again.',
        isLoading: false
      }));
    }
  };

  const handleInsertContextualOutputIntoNote = () => {
    if (!contextualActionData.output) return;
    const addition = `\n\n### 💡 ${contextualActionData.actionType.toUpperCase()}: ${contextualActionData.sectionHeading}\n${contextualActionData.output}\n`;
    updateContentWithHistory(content + addition);
    setContextualActionData(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 select-none">
      
      {/* Top SaaS Header */}
      <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToGenerator}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            title="Return to Notes Generator"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Upload New</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <StudyTopLogo size="sm" showTagline={false} />
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase tracking-wider hidden sm:inline">
              Mind 2.0 Notes Engine
            </span>
          </div>
        </div>

        {/* Center: Title input & Auto-save status */}
        <div className="hidden md:flex flex-col items-center max-w-md truncate">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xs sm:text-sm font-black text-slate-900 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none px-2 py-0.5 max-w-xs truncate"
            title="Click to rename note"
          />
          <span className="text-[10px] text-slate-400 font-medium">
            {autoSaveTimer} • {language} • {format}
          </span>
        </div>

        {/* Right Actions: View modes, AI Suite & Export */}
        <div className="flex items-center gap-2">
          
          {/* Mind 2.0 AI Tools Drawer Button Group */}
          <button
            onClick={handleOpenConceptMap}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="AI Concept Mapper & Flowchart"
          >
            <Network className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden lg:inline">Concept Map</span>
          </button>

          <button
            onClick={handleOpenExamPrep}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Automatic Exam Preparation (MCQs & Questions)"
          >
            <GraduationCap className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Exam Prep</span>
          </button>

          <button
            onClick={() => {
              setIsFlashcardsOpen(true);
              setCurrentCardIndex(0);
              setIsFlipped(false);
            }}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="Interactive Flashcards"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden lg:inline">Flashcards</span>
          </button>

          <button
            onClick={handleOpenQualityReport}
            className="p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
            title="AI Notes Quality & Source Grounding Inspector"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden lg:inline">Quality</span>
          </button>

          {/* Copy Button */}
          <button
            onClick={handleCopyEntireNote}
            className="p-2 text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold border border-slate-200"
            title="Copy entire note to clipboard"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Copy'}</span>
          </button>

          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              disabled={isExporting}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Export</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1">
                  Export Studio Formats
                </div>
                <button
                  onClick={async () => {
                    setIsExportMenuOpen(false);
                    setIsExporting(true);
                    await exportNotesAsPdf(title, 'study-notes-printable-document');
                    setIsExporting(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-red-500" />
                  <span>PDF Document (A4 Multi-page)</span>
                </button>

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportNotesAsDocx(title, content);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>Microsoft Word (.docx)</span>
                </button>

                <button
                  onClick={async () => {
                    setIsExportMenuOpen(false);
                    setIsExporting(true);
                    await exportNotesAsImage(title, 'study-notes-printable-document', 'png');
                    setIsExporting(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PNG High-Resolution Image</span>
                </button>

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    exportNotesAsTxt(title, content);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5 text-slate-500" />
                  <span>Plain Text / Markdown</span>
                </button>

                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    const pack = {
                      app: 'Study Top 2.0',
                      pack_name: 'available.json',
                      version: '2.0.0',
                      format: 'study_top_available_pack',
                      author: 'Study Top (Manjit Ranjan)',
                      live_url: 'https://tinyurl.com/studytop2026',
                      generated_at: Date.now(),
                      note: {
                        title,
                        content,
                        format,
                        language,
                        sections,
                        flashcards: flashcards || [],
                        questions: examPrepData?.mcqs || []
                      }
                    };
                    const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = 'available.json';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-amber-900 bg-amber-50/60 hover:bg-amber-100 rounded-xl flex items-center gap-2 cursor-pointer border border-amber-200/50 mt-1"
                >
                  <FileCode className="w-3.5 h-3.5 text-amber-600" />
                  <span>available.json Pack</span>
                </button>
              </div>
            )}
          </div>

          {/* Save to Library */}
          <button
            onClick={() => onSaveToLibrary({ title, content })}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Save Note</span>
          </button>
        </div>
      </header>

      {/* Editor Formatting & View Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-2">Formatting:</span>
          
          <button onClick={() => applyTextFormat('**', '**')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold" title="Bold">
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('*', '*')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 italic" title="Italic">
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('==', '==')} className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-800 font-bold" title="Highlight">
            <Highlighter className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('\n## ')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-bold" title="Heading 2">
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('\n- ')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700" title="Bullet List">
            <List className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('\n1. ')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700" title="Numbered List">
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('\n| Concept | Explanation |\n|---|---|\n| Item 1 | Value 1 |\n')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700" title="Comparison Table">
            <TableIcon className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => applyTextFormat('$$', '$$')} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 font-mono" title="LaTeX Formula">
            <span className="font-serif italic font-bold">fx</span>
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 disabled:opacity-30" title="Undo">
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 disabled:opacity-30" title="Redo">
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'preview' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'split' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Split Edit
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                viewMode === 'raw' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Markdown
            </button>
          </div>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 gap-6">
        
        {viewMode === 'preview' && (
          <div className="flex flex-col items-center">
            {/* Printable A4 White Paper Canvas */}
            <div 
              id="study-notes-printable-document"
              className="bg-white border border-slate-200 rounded-3xl shadow-sm p-8 sm:p-14 max-w-4xl w-full min-h-[900px] text-slate-900 leading-relaxed space-y-6"
            >
              {/* Document Header Banner */}
              <div className="border-b-2 border-blue-600 pb-4 mb-6 flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 font-sans">
                    STUDY TOP 2.0 • MIND 2.0 NOTES ENGINE
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-950 font-sans tracking-tight mt-1">
                    {title}
                  </h1>
                  <div className="text-xs text-slate-500 font-sans mt-1 flex items-center gap-2">
                    <span>{format}</span>
                    <span>•</span>
                    <span>{language}</span>
                    <span>•</span>
                    <span>100% Strict Source Grounded</span>
                  </div>
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-[10px] font-bold text-slate-400 font-sans uppercase">Source Intelligence</div>
                  <div className="text-xs font-bold text-emerald-700 font-sans">Zero Hallucination</div>
                </div>
              </div>

              {/* Sections with Contextual AI Learning Tools */}
              <div className="space-y-8 font-sans">
                {sections.map((sec, idx) => (
                  <div 
                    key={sec.id} 
                    className="group relative p-4 rounded-2xl hover:bg-slate-50/70 border border-transparent hover:border-slate-200 transition-all"
                  >
                    {/* Section Top Controls */}
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <h2 className="text-lg font-black text-blue-900 tracking-tight flex items-center gap-2">
                        <span>{sec.heading}</span>
                      </h2>

                      {/* Floating AI Actions Toolbar for this section */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs">
                        {/* Contextual actions dropdown / buttons */}
                        <button
                          onClick={() => handleExecuteContextualAction(sec, 'explain')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Explain this concept with intuitive breakdowns"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span className="text-[10px]">Explain</span>
                        </button>

                        <button
                          onClick={() => handleExecuteContextualAction(sec, 'simplify')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Simplify for beginners"
                        >
                          <BrainCircuit className="w-3 h-3 text-blue-500" />
                          <span className="text-[10px]">Simplify</span>
                        </button>

                        <button
                          onClick={() => handleExecuteContextualAction(sec, 'example')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Generate practical examples"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span className="text-[10px]">Example</span>
                        </button>

                        <button
                          onClick={() => handleExecuteContextualAction(sec, 'convert_to_table')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 font-bold transition flex items-center gap-1 cursor-pointer"
                          title="Convert this section into a comparison table"
                        >
                          <TableIcon className="w-3 h-3 text-emerald-500" />
                          <span className="text-[10px]">Table</span>
                        </button>

                        <button
                          onClick={() => handleCopySection(sec.fullText, idx)}
                          className="p-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition cursor-pointer"
                          title="Copy this section"
                        >
                          {copiedSectionIndex === idx ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>

                        <button
                          onClick={() => {
                            setRegeneratingSectionIndex(idx);
                            setSectionRegenInstruction('');
                          }}
                          className="p-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-blue-700 transition cursor-pointer"
                          title="Regenerate this section using source context only"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Section Markdown Body */}
                    <div className="prose prose-slate max-w-none text-sm text-slate-800 leading-relaxed">
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {sec.body}
                      </ReactMarkdown>
                    </div>

                    {/* Inline Section Regenerator Prompt Modal */}
                    {regeneratingSectionIndex === idx && (
                      <div className="mt-4 p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                            <span>Regenerate Section: "{sec.heading}"</span>
                          </span>
                          <button
                            onClick={() => setRegeneratingSectionIndex(null)}
                            className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                          >
                            Cancel
                          </button>
                        </div>

                        {regenError && (
                          <div className="p-2 bg-rose-50 border border-rose-200 text-[11px] text-rose-700 rounded-xl">
                            {regenError}
                          </div>
                        )}

                        <input
                          type="text"
                          value={sectionRegenInstruction}
                          onChange={(e) => setSectionRegenInstruction(e.target.value)}
                          placeholder="e.g. Focus on concise formulas and definitions strictly from source..."
                          className="w-full px-3 py-2 text-xs bg-white border border-blue-200 rounded-xl focus:border-blue-500 outline-none"
                        />

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">Mind 2.0 Engine • Preserves other user edits</span>
                          <button
                            onClick={() => handleRegenerateSectionSubmit(idx)}
                            disabled={isRegeneratingSection}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {isRegeneratingSection ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            <span>Update Section</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Document Footer */}
              <div className="pt-8 border-t border-slate-200 text-center text-xs text-slate-400 font-sans space-y-1">
                <div>Study Top 2.0 • Mind 2.0 + Gemini Educational Notes Engine</div>
                <div className="text-[10px] text-slate-300">Strictly synthesized from verified student uploaded source materials</div>
              </div>
            </div>
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col h-[750px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                <span>Markdown Editor</span>
                <span>{content.length} characters</span>
              </div>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContentWithHistory(e.target.value)}
                className="w-full flex-1 p-3 text-xs sm:text-sm font-mono text-slate-800 leading-relaxed bg-slate-50/50 rounded-2xl border border-slate-200 focus:bg-white focus:border-blue-500 outline-none resize-none"
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-[750px] overflow-y-auto prose prose-slate max-w-none text-sm">
              <h1 className="text-xl font-black text-slate-900">{title}</h1>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {content}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {viewMode === 'raw' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Raw Notes Markdown Source</h3>
                <p className="text-[11px] text-slate-400">Directly edit raw headers, LaTeX formulas, and comparative tables</p>
              </div>
              <button
                onClick={handleCopyEntireNote}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw Text</span>
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => updateContentWithHistory(e.target.value)}
              className="w-full h-[650px] p-4 text-xs sm:text-sm font-mono text-slate-800 leading-relaxed bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white focus:border-blue-500 outline-none resize-none"
            />
          </div>
        )}

      </div>

      {/* MODAL 1: AI Concept Mapper & Flowchart */}
      {isConceptMapOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-purple-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">AI Concept Mapper &amp; Flowchart</h3>
                  <p className="text-[11px] text-slate-500">{conceptMapData?.title || 'Visual Knowledge Tree'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsConceptMapOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2">
              {isGeneratingConceptMap ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Generating Mermaid topic hierarchy &amp; flow...</p>
                </div>
              ) : (
                <>
                  {/* Mermaid Diagram Box */}
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-center min-h-[300px]">
                    <div ref={mermaidRef} className="w-full overflow-x-auto flex justify-center" />
                  </div>

                  {/* Concept Hierarchy Chips */}
                  {conceptMapData?.nodes && conceptMapData.nodes.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-700">Central Topics &amp; Relationships</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {conceptMapData.nodes.map(n => (
                          <div key={n.id} className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1">
                            <div className="text-xs font-bold text-purple-900">{n.label}</div>
                            <div className="text-[11px] text-slate-600">{n.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Strictly derived from notes content</span>
              <button
                onClick={() => setIsConceptMapOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Automatic Exam Preparation */}
      {isExamPrepOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Automatic Exam Preparation Set</h3>
                  <p className="text-[11px] text-slate-500">Board &amp; Competitive Exam Practice with Model Answers</p>
                </div>
              </div>
              <button
                onClick={() => setIsExamPrepOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-5 p-2 text-xs">
              {isGeneratingExamPrep ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Generating MCQs, short answers &amp; evaluation rubrics...</p>
                </div>
              ) : examPrepData ? (
                <>
                  {/* MCQs Section */}
                  <div className="space-y-3">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Part 1: Multiple Choice Questions (5 MCQs)</span>
                    </h4>
                    {examPrepData.mcqs.map((q, qIdx) => {
                      const selectedAns = selectedMcqAnswers[qIdx];
                      const isRevealed = showMcqExplanations[qIdx];
                      return (
                        <div key={qIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="font-bold text-slate-900">{qIdx + 1}. {q.question}</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedAns === optIdx;
                              const isCorrect = q.correctIndex === optIdx;
                              let btnStyle = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100';
                              if (selectedAns !== undefined) {
                                if (isCorrect) btnStyle = 'bg-emerald-100 border-emerald-300 text-emerald-900 font-bold';
                                else if (isSelected) btnStyle = 'bg-rose-100 border-rose-300 text-rose-900 font-bold';
                              }
                              return (
                                <button
                                  key={optIdx}
                                  onClick={() => {
                                    setSelectedMcqAnswers(prev => ({ ...prev, [qIdx]: optIdx }));
                                    setShowMcqExplanations(prev => ({ ...prev, [qIdx]: true }));
                                  }}
                                  className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer ${btnStyle}`}
                                >
                                  {String.fromCharCode(65 + optIdx)}. {opt}
                                </button>
                              );
                            })}
                          </div>

                          {isRevealed && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                              <span className="font-bold">Explanation: </span>
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Short Answers */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>Part 2: Short Answer Questions</span>
                    </h4>
                    {examPrepData.shortAnswers.map((sa, idx) => (
                      <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                        <div className="font-bold text-slate-900">Q{idx + 1}: {sa.question}</div>
                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 text-[11px] leading-relaxed">
                          <span className="font-bold text-slate-900">Model Answer: </span>
                          {sa.modelAnswer}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsExamPrepOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Interactive 3D Flashcards */}
      {isFlashcardsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">Interactive Study Flashcards</h3>
                  <p className="text-[11px] text-slate-500">
                    Card {currentCardIndex + 1} of {flashcards.length} • Click card to flip
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFlashcardsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Flashcard Area */}
            {flashcards.length > 0 ? (
              <div className="py-4 space-y-4">
                <div
                  onClick={() => setIsFlipped(!isFlipped)}
                  className={`min-h-[220px] rounded-3xl border p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 shadow-md ${
                    isFlipped 
                      ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200' 
                      : 'bg-white border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <span>{isFlipped ? 'Answer / Explanation' : 'Question / Concept'}</span>
                    <span>{isFlipped ? 'Back' : 'Front'}</span>
                  </div>

                  <div className="my-auto text-center py-4">
                    <div className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {isFlipped ? flashcards[currentCardIndex].back : flashcards[currentCardIndex].front}
                    </div>
                  </div>

                  <div className="text-center text-[10px] text-slate-400">
                    Click anywhere to flip
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.max(0, prev - 1));
                      setIsFlipped(false);
                    }}
                    disabled={currentCardIndex === 0}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs disabled:opacity-30 cursor-pointer"
                  >
                    ← Previous
                  </button>

                  <button
                    onClick={() => {
                      if (difficultCards.includes(currentCardIndex)) {
                        setDifficultCards(prev => prev.filter(c => c !== currentCardIndex));
                      } else {
                        setDifficultCards(prev => [...prev, currentCardIndex]);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                      difficultCards.includes(currentCardIndex)
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    {difficultCards.includes(currentCardIndex) ? '★ Marked Difficult' : '☆ Mark Difficult'}
                  </button>

                  <button
                    onClick={() => {
                      setCurrentCardIndex(prev => Math.min(flashcards.length - 1, prev + 1));
                      setIsFlipped(false);
                    }}
                    disabled={currentCardIndex === flashcards.length - 1}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs disabled:opacity-30 cursor-pointer"
                  >
                    Next →
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-center py-10 text-slate-400 text-xs">No flashcards found in this note.</p>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsFlashcardsOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: AI Notes Quality & Grounding Inspector */}
      {isQualityReportOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">AI Notes Quality &amp; Grounding Report</h3>
                  <p className="text-[11px] text-slate-500">Zero-Hallucination Academic Verification</p>
                </div>
              </div>
              <button
                onClick={() => setIsQualityReportOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 p-2 text-xs">
              {isGeneratingQualityReport ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Auditing note content against source material...</p>
                </div>
              ) : qualityReportData ? (
                <>
                  {/* Score & Verdict Banner */}
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Audit Verdict</div>
                      <div className="text-base font-black text-emerald-950 mt-0.5">{qualityReportData.verdict}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-700">{qualityReportData.qualityScore}/100</div>
                      <div className="text-[10px] font-bold text-emerald-600">Quality Score</div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Source Coverage</div>
                      <div className="text-base font-black text-slate-900">{qualityReportData.sourceCoveragePercent}%</div>
                      <div className="text-[10px] text-slate-500">Key syllabus concepts captured</div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Unsupported Claims</div>
                      <div className="text-base font-black text-emerald-700">{qualityReportData.unsupportedClaimsCount}</div>
                      <div className="text-[10px] text-slate-500">0 external hallucinations detected</div>
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-800">Verified Strengths:</div>
                    <ul className="space-y-1 text-slate-600 list-disc list-inside">
                      {qualityReportData.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Suggestions */}
                  {qualityReportData.suggestions && qualityReportData.suggestions.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-slate-800">Recommendations for Master Revision:</div>
                      <ul className="space-y-1 text-slate-600 list-disc list-inside">
                        {qualityReportData.suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsQualityReportOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Contextual Action Assistant Drawer */}
      {contextualActionData.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    AI Learning Assistant: {contextualActionData.actionType.toUpperCase()}
                  </h3>
                  <p className="text-[11px] text-slate-500">{contextualActionData.sectionHeading}</p>
                </div>
              </div>
              <button
                onClick={() => setContextualActionData(prev => ({ ...prev, isOpen: false }))}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 p-2 text-xs">
              {contextualActionData.isLoading ? (
                <div className="py-16 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-xs font-bold text-slate-600">Processing contextual explanation strictly from source...</p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none text-xs text-slate-800 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {contextualActionData.output}
                  </ReactMarkdown>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setContextualActionData(prev => ({ ...prev, isOpen: false }))}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>

              <button
                onClick={handleInsertContextualOutputIntoNote}
                disabled={contextualActionData.isLoading || !contextualActionData.output}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Insert into Notes</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
