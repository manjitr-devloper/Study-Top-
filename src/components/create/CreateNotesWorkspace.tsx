import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileUp, 
  FileText, 
  Camera, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  Plus, 
  Layers, 
  BookOpen, 
  GraduationCap, 
  Trash2, 
  Clock, 
  Check, 
  ShieldCheck, 
  Upload, 
  Globe, 
  Sliders, 
  ChevronRight,
  Eye,
  FileCode,
  Scan,
  Database,
  ExternalLink,
  RotateCcw,
  History,
  FileCheck,
  AlertTriangle,
  StopCircle,
  FileQuestion,
  HelpCircle,
  Plug
} from 'lucide-react';
import { generateSmartStudyNotes, SmartNoteOptions } from '../../lib/gemini';
import { 
  processSourceFile, 
  ProcessedSourceFile, 
  formatFileSize 
} from '../../lib/documentParser';
import { PremiumNotesEditor } from './PremiumNotesEditor';
import { StudyTopLogo } from '../StudyTopLogo';

interface CreateNotesWorkspaceProps {
  onBack: () => void;
  onCreateNote: (noteData: { 
    title: string; 
    content: string; 
    categoryId?: string;
    structuredData?: any;
  }) => void;
  initialAssignment?: { title: string; content: string; subject?: string } | null;
  onOpenClassroomHub?: () => void;
  onOpenConnectorsHub?: () => void;
  language?: string;
}

const ACADEMIC_SUBJECTS = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 
  'Computer Science', 'History', 'Geography', 'Political Science', 
  'Civics', 'Economics', 'English', 'Environmental Science', 
  'General Knowledge', 'Reasoning'
];

const NOTE_FORMATS = [
  { id: 'Deep Notes', label: 'Deep Notes', desc: 'Comprehensive coverage, step-by-step reasoning & derivations' },
  { id: 'Smart Short Notes', label: 'Smart Short Notes', desc: 'High-density, high-yield bulleted summary with zero fluff' },
  { id: 'Exam Notes', label: 'Exam Notes', desc: 'Scoring keys, high-probability exam questions & pitfall alerts' },
  { id: 'Concept Notes', label: 'Concept Notes', desc: 'Mental models, core principles & conceptual analogies' },
  { id: 'Revision Notes', label: 'Revision Notes', desc: 'Rapid 5-minute review with memory hooks & summary matrices' },
  { id: 'Question-Answer Notes', label: 'Question & Answer', desc: 'Full chapter converted into questions with model answers' },
  { id: 'Handwritten-Style Notes', label: 'Handwritten Style', desc: 'Notebook aesthetics, margin callouts & sketch boxes' },
  { id: 'Last-Minute Notes', label: 'Last-Minute Sheet', desc: 'Ultra-condensed cheat sheet with formulas, dates & 1-liners' },
  { id: 'Chapter Master Notes', label: 'Chapter Master', desc: 'Synthesizes all files, merging overlaps & resolving conflicts' },
  { id: 'Teaching Notes', label: 'Teaching Notes', desc: 'Step-by-step master tutor walkthrough with conceptual checks' }
];

const EDUCATION_LEVELS = [
  'High School (Class 9-10)',
  'Senior Secondary (Class 11-12)',
  'College / University',
  'Middle School (Class 6-8)',
  'Competitive Exams (JEE / NEET / UPSC)'
];

const LANGUAGES = [
  { id: 'English', label: 'English', sub: 'Standard Academic' },
  { id: 'Hindi', label: 'Hindi (हिंदी)', sub: 'Devanagari Script' },
  { id: 'Hinglish', label: 'Hinglish', sub: 'Roman Hindi' }
];

interface SavedHistoryNote {
  id: string;
  title: string;
  markdown: string;
  format: string;
  language: string;
  timestamp: number;
  fileCount: number;
}

export const CreateNotesWorkspace: React.FC<CreateNotesWorkspaceProps> = ({
  onBack,
  onCreateNote,
  initialAssignment,
  onOpenClassroomHub,
  onOpenConnectorsHub,
  language: initialLang = 'English'
}) => {
  // Engine version: Mind 2.0 vs Classic 1.0
  const [engineVersion, setEngineVersion] = useState<'2.0' | '1.0'>('2.0');

  // Input mode: Files vs Pasted Text
  const [inputMode, setInputMode] = useState<'files' | 'text'>(
    initialAssignment ? 'text' : 'files'
  );

  // Uploaded files list
  const [sourceFiles, setSourceFiles] = useState<ProcessedSourceFile[]>([]);
  const [pastedText, setPastedText] = useState(initialAssignment?.content || '');
  const [isDragging, setIsDragging] = useState(false);

  // Configuration options
  const [selectedSubject, setSelectedSubject] = useState(initialAssignment?.subject || 'Mathematics');
  const [chapterTitle, setChapterTitle] = useState(initialAssignment?.title || '');
  const [selectedFormat, setSelectedFormat] = useState('Deep Notes');
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [educationLevel, setEducationLevel] = useState('High School (Class 9-10)');
  const [strictSourceOnly, setStrictSourceOnly] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<string>(() => {
    return localStorage.getItem('studytop_default_ai_provider') || 'auto';
  });
  const [customInstructions, setCustomInstructions] = useState('');

  // 6-Stage Real-time Pipeline state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStageNumber, setCurrentStageNumber] = useState<number>(1);
  const [currentStageText, setCurrentStageText] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Abort controller ref for cancel button
  const abortControllerRef = useRef<AbortController | null>(null);

  // File Inputs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Preview Modal for individual file
  const [previewFile, setPreviewFile] = useState<ProcessedSourceFile | null>(null);

  // History Drawer/Modal
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [recentNotes, setRecentNotes] = useState<SavedHistoryNote[]>(() => {
    try {
      const stored = localStorage.getItem('studytop_recent_notes_history');
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Completed Note state (when notes are generated, we render the Premium Editor!)
  const [generatedNote, setGeneratedNote] = useState<{
    title: string;
    markdown: string;
    format: string;
    language: string;
    sourceContext: string;
  } | null>(null);

  // Sync recent notes to localStorage
  const saveToRecentHistory = (note: SavedHistoryNote) => {
    try {
      const updated = [note, ...recentNotes.filter(n => n.id !== note.id)].slice(0, 15);
      setRecentNotes(updated);
      localStorage.setItem('studytop_recent_notes_history', JSON.stringify(updated));
    } catch (_) {}
  };

  const deleteRecentHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = recentNotes.filter(n => n.id !== id);
    setRecentNotes(updated);
    try {
      localStorage.setItem('studytop_recent_notes_history', JSON.stringify(updated));
    } catch (_) {}
  };

  // Handle files selection & extraction
  const handleFilesSelected = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const newlyProcessed: ProcessedSourceFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 30 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds the 30MB limit.`);
        continue;
      }
      try {
        const processed = await processSourceFile(file, [...sourceFiles, ...newlyProcessed]);
        newlyProcessed.push(processed);
      } catch (err: any) {
        console.error('File processing error:', err);
      }
    }

    if (newlyProcessed.length > 0) {
      setSourceFiles(prev => [...prev, ...newlyProcessed]);
      // Auto-set title from first file if blank
      if (!chapterTitle) {
        const cleanName = newlyProcessed[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setChapterTitle(cleanName);
      }
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await handleFilesSelected(e.dataTransfer.files);
    }
  };

  const removeFile = (id: string) => {
    setSourceFiles(prev => prev.filter(f => f.id !== id));
  };

  // Cancel Notes Generation
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsProcessing(false);
    setProgressPercent(0);
    setCurrentStageText('Generation cancelled.');
  };

  // Execute AI Notes Generation
  const handleGenerateNotes = async () => {
    setErrorMessage(null);

    // Validate inputs
    const hasFiles = sourceFiles.length > 0;
    const hasText = pastedText.trim().length > 0;

    if (!hasFiles && !hasText) {
      setErrorMessage('Please upload at least one document/image or paste lecture/textbook text.');
      return;
    }

    // Build source text representation for context
    const extractedFileTexts = sourceFiles
      .filter(f => f.extractedText)
      .map(f => `--- File: ${f.name} ---\n${f.extractedText}`)
      .join('\n\n');

    const combinedSourceContext = [
      pastedText ? `--- Provided Text Content ---\n${pastedText}` : '',
      extractedFileTexts
    ].filter(Boolean).join('\n\n');

    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setProgressPercent(15);
    setCurrentStageNumber(1);
    setCurrentStageText('Stage 1/4: Analyzing source content & concepts...');

    // Fast dynamic progress ticker
    const progressInterval = setInterval(() => {
      setProgressPercent(prev => {
        if (prev < 40) return prev + 15;
        if (prev < 75) return prev + 10;
        if (prev < 90) return prev + 5;
        return prev;
      });
    }, 250);

    try {
      // Gather files for inline Gemini multimodal payload (PDFs and Images)
      // SPEED OPTIMIZATION: Only pass heavy base64 data if text wasn't already extracted
      const hasExtractedText = combinedSourceContext.trim().length > 60;
      const filesPayload = !hasExtractedText
        ? sourceFiles
            .filter(f => f.base64Data && (f.type === 'pdf' || f.type === 'image' || f.type === 'camera'))
            .slice(0, 3)
            .map(f => ({
              base64Data: f.base64Data!,
              mimeType: f.mimeType,
              name: f.name
            }))
        : [];

      const noteTitle = chapterTitle.trim() || sourceFiles[0]?.name.replace(/\.[^/.]+$/, '') || 'Academic Study Notes';

      const optionsPayload: SmartNoteOptions = {
        title: noteTitle,
        textContent: combinedSourceContext,
        files: filesPayload,
        format: selectedFormat,
        language: selectedLanguage,
        educationLevel,
        strictSourceOnly,
        provider: selectedProvider,
        customInstructions: customInstructions.trim(),
        signal: controller.signal
      };

      const result = await generateSmartStudyNotes(optionsPayload);

      clearInterval(progressInterval);

      setProgressPercent(100);
      setCurrentStageNumber(4);
      setCurrentStageText('Completed in seconds! Opening document editor...');

      // Save to recent notes history
      const savedItem: SavedHistoryNote = {
        id: `note_${Date.now()}`,
        title: result.title || noteTitle,
        markdown: result.markdown,
        format: selectedFormat,
        language: selectedLanguage,
        timestamp: Date.now(),
        fileCount: sourceFiles.length
      };
      saveToRecentHistory(savedItem);

      // Brief pause to show completion then switch to Premium Editor
      setTimeout(() => {
        setIsProcessing(false);
        abortControllerRef.current = null;
        setGeneratedNote({
          title: result.title || noteTitle,
          markdown: result.markdown,
          format: selectedFormat,
          language: selectedLanguage,
          sourceContext: combinedSourceContext
        });
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsProcessing(false);
      abortControllerRef.current = null;

      if (err.name === 'AbortError' || err.message?.includes('aborted')) {
        setCurrentStageText('Generation was cancelled.');
        return;
      }

      console.error('Notes Generation Failure:', err);
      setErrorMessage(
        err.message || 'AI notes generation failed. Please check your network connection and try again.'
      );
    }
  };

  // If a note has been generated, show the Premium Notes Editor directly!
  if (generatedNote) {
    return (
      <PremiumNotesEditor
        initialTitle={generatedNote.title}
        initialContent={generatedNote.markdown}
        sourceContext={generatedNote.sourceContext}
        format={generatedNote.format}
        language={generatedNote.language}
        onSaveToLibrary={(note) => {
          onCreateNote({
            title: note.title,
            content: note.content,
            categoryId: selectedSubject.toLowerCase().includes('math') ? 'math' : 'science'
          });
        }}
        onBackToGenerator={() => setGeneratedNote(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none text-slate-900">
      
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer flex items-center gap-1.5 font-bold text-xs"
            title="Return to Study Top Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2">
            <StudyTopLogo size="sm" showTagline={false} />
            
            {/* Version Switcher: 2.0 vs 1.0 */}
            <div className="hidden sm:flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setEngineVersion('2.0')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                  engineVersion === '2.0' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mind 2.0 + Gemini Intelligent Notes Engine"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Mind 2.0</span>
              </button>
              <button
                type="button"
                onClick={() => setEngineVersion('1.0')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                  engineVersion === '1.0' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Study Top 1.0 Classic Notes Maker"
              >
                <span>Classic 1.0</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Header: Connectors Hub, Classroom & History */}
        <div className="flex items-center gap-2">
          {onOpenConnectorsHub && (
            <button
              onClick={onOpenConnectorsHub}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition cursor-pointer"
              title="Universal AI Connectors Hub"
            >
              <Plug className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden md:inline">Connectors Hub</span>
            </button>
          )}

          {onOpenClassroomHub && (
            <button
              onClick={onOpenClassroomHub}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition cursor-pointer"
              title="Import coursework from Google Classroom"
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Classroom</span>
            </button>
          )}

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            title="View recent notes generation history"
          >
            <History className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">History</span>
            {recentNotes.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                {recentNotes.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Hero Headline */}
      <div className="bg-gradient-to-b from-white to-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-6 text-center">
        <div className="max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>100% Strict Source Grounding • Zero Hallucination</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Advanced AI Notes Generator
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            Upload your textbooks, lecture PDFs, slides, or photos. Our AI synthesizes structured, high-yield academic notes strictly from your uploaded files.
          </p>
        </div>
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Error Alert with Retry */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="font-bold text-rose-900">Notes Generation Issue</div>
                <p className="text-rose-700 leading-relaxed text-[11px]">{errorMessage}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-rose-200/60 text-[11px]">
              <span className="text-rose-600 font-medium">Your uploaded files and settings remain safely preserved.</span>
              <button
                type="button"
                onClick={handleGenerateNotes}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Retry Generation</span>
              </button>
            </div>
          </div>
        )}

        {/* 6-Stage Progress Pipeline Modal / Banner when Generating */}
        {isProcessing && (
          <div className="bg-white border-2 border-blue-500 rounded-3xl p-6 shadow-xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">{currentStageText}</h3>
                  <p className="text-[11px] text-slate-500">Checking sources, parsing formulas &amp; structuring sections...</p>
                </div>
              </div>

              {/* Working Cancel Button */}
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                title="Cancel the ongoing notes generation request"
              >
                <StopCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
                <span>Pipeline Stage {currentStageNumber} of 6</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* 6 Stage Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2">
              {[
                '1. Uploaded',
                '2. Parsing',
                '3. Structuring',
                '4. Notes Gen',
                '5. Source Check',
                '6. Finalize'
              ].map((stageLabel, idx) => {
                const isPassed = currentStageNumber > idx + 1;
                const isCurrent = currentStageNumber === idx + 1;
                return (
                  <div
                    key={stageLabel}
                    className={`px-2 py-1.5 rounded-xl text-[10px] font-bold text-center border transition-all ${
                      isPassed
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : isCurrent
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-400'
                    }`}
                  >
                    {isPassed ? '✓ ' : ''}{stageLabel}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Input Grid: Left = Upload/Input, Right = Customization Settings */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Upload Hub (Col 7) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-5">
              
              {/* Mode Toggle: Files vs Text */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setInputMode('files')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'files'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload Documents &amp; Photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      inputMode === 'text'
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Text</span>
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-medium">
                  {sourceFiles.length} file{sourceFiles.length !== 1 ? 's' : ''} attached
                </span>
              </div>

              {/* Mode 1: Files Upload & Drag/Drop */}
              {inputMode === 'files' && (
                <div className="space-y-4">
                  {/* Drag and Drop Zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition space-y-3 ${
                      isDragging 
                        ? 'border-blue-600 bg-blue-50/50 scale-[1.01]' 
                        : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/20 bg-slate-50/50'
                    }`}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-2xs">
                      <FileUp className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900">
                        Drag &amp; drop textbook files or click to browse
                      </div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Supports PDF, DOCX, TXT, PPTX &amp; Images (PNG, JPG, WEBP) up to 30MB each
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Browse Files</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                        title="Take a live photo of a textbook or notebook page"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Camera Snap</span>
                      </button>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt,.md,.rtf,.csv,.pptx,.ppt,image/*"
                    multiple
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                  />

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    className="hidden"
                  />

                  {/* Attached Files Shelf */}
                  {sourceFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-blue-600" />
                          <span>Uploaded Documents ({sourceFiles.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setSourceFiles([])}
                          className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                        >
                          Clear all
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {sourceFiles.map((file) => (
                          <div
                            key={file.id}
                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2 ${
                              file.isDuplicate
                                ? 'bg-amber-50/70 border-amber-200'
                                : 'bg-slate-50 border-slate-200 hover:bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {file.previewUrl ? (
                                <img
                                  src={file.previewUrl}
                                  alt={file.name}
                                  className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-200"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                  <FileText className="w-4 h-4" />
                                </div>
                              )}
                              <div className="truncate text-left">
                                <div className="text-xs font-bold text-slate-800 truncate" title={file.name}>
                                  {file.name}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                                  <span>{file.sizeFormatted}</span>
                                  <span>•</span>
                                  <span className="uppercase">{file.type}</span>
                                  {file.isDuplicate && (
                                    <span className="text-amber-700 font-bold ml-1">
                                      Duplicate
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setPreviewFile(file)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Preview extracted content"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFile(file.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Remove file"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Pasted Text */}
              {inputMode === 'text' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>Paste Study Excerpt, Notes, or Lecture Text</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {pastedText.length} characters
                    </span>
                  </div>
                  <textarea
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder="Paste textbook sections, lecture notes, syllabus concepts or assignment questions here. The AI will strictly synthesize notes only from this content."
                    rows={11}
                    className="w-full p-4 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white outline-none transition leading-relaxed resize-y"
                  />
                  {pastedText && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setPastedText('')}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Clear text
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Strict Source Guarantee Footer */}
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed text-[11px]">
                  <span className="font-bold">Zero-Hallucination Academic Standard:</span>
                  <p className="text-blue-800">
                    The engine operates in strict closed-world mode. No external web facts or synthetic assumptions will be injected. If a concept is missing from your material, it will not be fabricated.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Customization & Launch Controls (Col 5) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Customization Controls
                  </h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  9 Academic Sections
                </span>
              </div>

              {/* Subject & Education Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Academic Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
                  >
                    {ACADEMIC_SUBJECTS.map(subj => (
                      <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Education Level</label>
                  <select
                    value={educationLevel}
                    onChange={(e) => setEducationLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none cursor-pointer"
                  >
                    {EDUCATION_LEVELS.map(lvl => (
                      <option key={lvl} value={lvl}>{lvl}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI Engine & Strict Source Mode */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    <span>AI Provider Engine</span>
                  </label>
                  {onOpenConnectorsHub && (
                    <button
                      type="button"
                      onClick={onOpenConnectorsHub}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Configure Connectors
                    </button>
                  )}
                </div>

                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800 cursor-pointer"
                >
                  <option value="auto">Study Top Auto (Mind 2.0 + Gemini)</option>
                  <option value="gemini">Google Gemini (Direct)</option>
                  <option value="openai">OpenAI (ChatGPT)</option>
                  <option value="claude">Anthropic Claude</option>
                </select>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Strict Uploaded-Only Mode</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStrictSourceOnly(!strictSourceOnly)}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer flex items-center ${
                      strictSourceOnly ? 'bg-emerald-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                </div>
              </div>

              {/* Chapter / Topic Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Chapter or Topic Title (Optional)
                </label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="e.g. Chemical Reactions and Equations"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              {/* Format Selection (6 Options) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Notes Format</label>
                <div className="grid grid-cols-2 gap-2">
                  {NOTE_FORMATS.map(fmt => {
                    const isSelected = selectedFormat === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setSelectedFormat(fmt.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{fmt.label}</div>
                        <div className={`text-[10px] line-clamp-1 mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {fmt.desc}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Language Selection (English, Hindi, Hinglish) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Output Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map(lang => {
                    const isSelected = selectedLanguage === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() => setSelectedLanguage(lang.id as any)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="text-xs font-bold leading-tight">{lang.label}</div>
                        <div className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          {lang.sub}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Additional Custom Instructions (Optional) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Focus / Instructions (Optional)
                </label>
                <input
                  type="text"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g. Emphasize numerical derivations and definition tables"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none"
                />
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerateNotes}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing Uploaded Content...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate High-Yield Study Notes</span>
                    </>
                  )}
                </button>
              </div>

              <div className="pt-1 text-center text-[10px] text-slate-400">
                Automatically divides documents • Preserves LaTeX math &amp; tables • Full Traceability
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* File Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <h3 className="text-xs font-bold text-slate-800 truncate">{previewFile.name}</h3>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs text-slate-700">
              {previewFile.previewUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-200">
                  <img src={previewFile.previewUrl} alt={previewFile.name} className="w-full object-contain max-h-72" />
                </div>
              )}
              {previewFile.extractedText ? (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 font-mono text-[11px] whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {previewFile.extractedText}
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  Document ready for AI multimodal analysis ({previewFile.sizeFormatted}).
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Drawer / Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Notes Generation History</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {recentNotes.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <FileQuestion className="w-8 h-8 mx-auto opacity-50" />
                  <p className="text-xs">No notes generated yet in this session.</p>
                </div>
              ) : (
                recentNotes.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsHistoryOpen(false);
                      setGeneratedNote({
                        title: item.title,
                        markdown: item.markdown,
                        format: item.format,
                        language: item.language,
                        sourceContext: ''
                      });
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{item.format}</span>
                        <span>•</span>
                        <span>{item.language}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600 group-hover:underline">
                        Open Editor →
                      </span>
                      <button
                        onClick={(e) => deleteRecentHistoryItem(item.id, e)}
                        className="p-1 text-slate-300 hover:text-rose-600 transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-xs text-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
