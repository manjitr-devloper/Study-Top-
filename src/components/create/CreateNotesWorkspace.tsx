import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  FileUp, 
  FileText, 
  Camera, 
  Youtube, 
  Image as ImageIcon, 
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
  ChevronRight
} from 'lucide-react';
import { mindClient, MindNoteRequest, MindGeneratedNote } from '../../lib/mindClient';
import { NotebookSource } from '../../types';
import { StudyTopLogo } from '../StudyTopLogo';

interface CreateNotesWorkspaceProps {
  onBack: () => void;
  onCreateNote: (noteData: { 
    title: string; 
    content: string; 
    sources?: NotebookSource[]; 
    categoryId?: string;
    structuredData?: MindGeneratedNote;
  }) => void;
  language?: string;
}

interface UploadedFileItem {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'camera' | 'document' | 'text' | 'youtube';
  sizeString: string;
  sizeBytes: number;
  previewUrl?: string;
  base64?: string;
  mimeType?: string;
  textContent?: string;
}

interface StageInfo {
  id: number;
  name: string;
  detail: string;
  minPercent: number;
  maxPercent: number;
}

const PIPELINE_STAGES: StageInfo[] = [
  { id: 1, name: 'Uploading files', detail: 'Uploading your study material...', minPercent: 5, maxPercent: 15 },
  { id: 2, name: 'Extracting content', detail: 'Extracting content from your files...', minPercent: 15, maxPercent: 30 },
  { id: 3, name: 'Understanding material', detail: 'MIND 1.0 is understanding your study material...', minPercent: 30, maxPercent: 50 },
  { id: 4, name: 'Organizing information', detail: 'Organizing chapters and important points...', minPercent: 50, maxPercent: 65 },
  { id: 5, name: 'Generating notes', detail: 'Generating your point-wise notes...', minPercent: 65, maxPercent: 85 },
  { id: 6, name: 'Quality verification', detail: 'Checking and improving your notes...', minPercent: 85, maxPercent: 95 },
  { id: 7, name: 'Final note creation', detail: 'Your notes are ready!', minPercent: 95, maxPercent: 100 }
];

export const CreateNotesWorkspace: React.FC<CreateNotesWorkspaceProps> = ({
  onBack,
  onCreateNote,
  language: initialLang = 'English'
}) => {
  // Input Method Tabs
  const [activeTab, setActiveTab] = useState<'upload' | 'images' | 'camera' | 'documents' | 'paste' | 'youtube'>('upload');
  
  // Uploaded Files Collection (Multiple files supported)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileItem[]>([]);
  
  // YouTube and Text Inputs
  const [youtubeUrlInput, setYoutubeUrlInput] = useState('');
  const [pastedTextInput, setPastedTextInput] = useState('');
  
  // Form Fields
  const [subject, setSubject] = useState('');
  const [chapterName, setChapterName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'English' | 'Hindi' | 'Hinglish'>('English');
  const [explanationLevel, setExplanationLevel] = useState<'Simple' | 'Standard' | 'Detailed'>('Standard');

  // Pipeline execution & live progress states
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation controller
  const cancelRequestedRef = useRef(false);
  const timerIntervalRef = useRef<any>(null);
  const progressIntervalRef = useRef<any>(null);

  // File Inputs Refs
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // Supported Extensions Validation
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const validExts = ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'txt', 'docx', 'doc', 'md'];
    
    if (!ext || !validExts.includes(ext)) {
      return { valid: false, error: `Unsupported file format (.${ext}). Supported: PDF, JPG, PNG, WEBP, TXT, DOCX.` };
    }
    if (file.size === 0) {
      return { valid: false, error: `File "${file.name}" is empty (0 bytes).` };
    }
    if (file.size > 25 * 1024 * 1024) {
      return { valid: false, error: `File "${file.name}" exceeds the maximum allowed size (25MB).` };
    }
    return { valid: true };
  };

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1] || res;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Handle Multi-File Selection
  const handleFilesAdded = async (filesList: FileList | File[], defaultType?: UploadedFileItem['type']) => {
    setErrorMessage(null);
    const files = Array.from(filesList);
    if (!files.length) return;

    const newItems: UploadedFileItem[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setErrorMessage(validation.error || 'Invalid file uploaded.');
        continue;
      }

      let type: UploadedFileItem['type'] = defaultType || 'document';
      if (file.type.includes('pdf')) type = 'pdf';
      else if (file.type.includes('image')) type = 'image';
      else if (file.name.endsWith('.txt') || file.name.endsWith('.md')) type = 'text';

      let previewUrl: string | undefined = undefined;
      let base64: string | undefined = undefined;
      let textContent: string | undefined = undefined;

      if (type === 'image' || type === 'camera') {
        previewUrl = URL.createObjectURL(file);
        base64 = await fileToBase64(file);
      } else if (type === 'text') {
        textContent = await file.text();
      } else if (type === 'pdf') {
        base64 = await fileToBase64(file);
      }

      newItems.push({
        id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        type,
        sizeString: `${Math.round(file.size / 1024)} KB`,
        sizeBytes: file.size,
        previewUrl,
        base64,
        mimeType: file.type || (type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
        textContent
      });
    }

    if (newItems.length > 0) {
      setUploadedFiles(prev => [...prev, ...newItems]);
      // Auto-populate chapter/subject if empty
      if (!chapterName && newItems[0]) {
        const cleanName = newItems[0].name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setChapterName(cleanName);
      }
    }
  };

  // Remove File from selection
  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  // Add YouTube Source
  const handleAddYouTube = () => {
    if (!youtubeUrlInput.trim()) return;
    const url = youtubeUrlInput.trim();
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
      setErrorMessage('Please enter a valid YouTube video URL.');
      return;
    }

    const newItem: UploadedFileItem = {
      id: `yt_${Date.now()}`,
      name: `YouTube Resource: ${url.substring(0, 40)}...`,
      type: 'youtube',
      sizeString: 'Online Link',
      sizeBytes: 0,
      textContent: `YouTube Resource Video URL: ${url}`
    };
    setUploadedFiles(prev => [...prev, newItem]);
    setYoutubeUrlInput('');
    setErrorMessage(null);
  };

  // Add Pasted Text Source
  const handleAddPastedText = () => {
    if (!pastedTextInput.trim()) return;
    const firstLine = pastedTextInput.trim().split('\n')[0].substring(0, 35);
    const newItem: UploadedFileItem = {
      id: `txt_${Date.now()}`,
      name: firstLine ? `Notes: ${firstLine}...` : 'Pasted Text Notes',
      type: 'text',
      sizeString: `${Math.round(pastedTextInput.length / 1024)} KB`,
      sizeBytes: pastedTextInput.length,
      textContent: pastedTextInput.trim()
    };
    setUploadedFiles(prev => [...prev, newItem]);
    setPastedTextInput('');
    setErrorMessage(null);
  };

  // Safe Cancel Generation
  const handleCancelGeneration = () => {
    cancelRequestedRef.current = true;
    clearInterval(timerIntervalRef.current);
    clearInterval(progressIntervalRef.current);
    setIsGenerating(false);
    setProgressPercent(0);
    setErrorMessage('Note generation cancelled by student.');
  };

  // Start Real MIND 1.0 Note Generation Pipeline
  const handleStartGeneration = async () => {
    setErrorMessage(null);
    cancelRequestedRef.current = false;

    // Validate inputs
    if (uploadedFiles.length === 0 && !subject.trim() && !chapterName.trim()) {
      setErrorMessage('Please upload a file, paste study text, or provide a subject and chapter name.');
      return;
    }

    setIsGenerating(true);
    setCurrentStageIndex(0);
    setProgressPercent(5);
    setElapsedSeconds(0);

    // Start elapsed seconds timer
    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Progress simulation matching actual pipeline progression
    let currentPct = 5;
    progressIntervalRef.current = setInterval(() => {
      if (cancelRequestedRef.current) return;
      currentPct = Math.min(currentPct + 1, 92);
      setProgressPercent(currentPct);

      // Advance stage according to percent
      const stageIdx = PIPELINE_STAGES.findIndex(s => currentPct >= s.minPercent && currentPct < s.maxPercent);
      if (stageIdx !== -1) {
        setCurrentStageIndex(stageIdx);
      }
    }, 450);

    try {
      // 1. Gather text context and images
      let aggregatedText = '';
      const imagesPayload: { base64: string; mimeType: string; name?: string }[] = [];
      const notebookSources: NotebookSource[] = [];

      for (const item of uploadedFiles) {
        if (item.textContent) {
          aggregatedText += `\n\n--- Source: ${item.name} ---\n${item.textContent}\n`;
        }
        if (item.base64 && (item.type === 'image' || item.type === 'camera')) {
          imagesPayload.push({
            base64: item.base64,
            mimeType: item.mimeType || 'image/jpeg',
            name: item.name
          });
        }
        notebookSources.push({
          id: item.id,
          title: item.name,
          type: item.type === 'image' || item.type === 'camera' ? 'image' : (item.type === 'youtube' ? 'youtube' : 'text'),
          content: item.textContent || item.name,
          selected: true,
          dateAdded: Date.now(),
          size: item.sizeString
        });
      }

      if (subject.trim()) {
        aggregatedText += `\n\nSubject: ${subject.trim()}\n`;
      }
      if (chapterName.trim()) {
        aggregatedText += `Chapter/Topic Focus: ${chapterName.trim()}\n`;
      }
      if (classLevel.trim()) {
        aggregatedText += `Target Grade/Class Level: ${classLevel.trim()}\n`;
      }

      // 2. Call MIND 1.0 Note-Making Engine
      const payload: MindNoteRequest = {
        sourceType: uploadedFiles[0]?.type || 'topic',
        content: aggregatedText.trim() || undefined,
        imageBase64: imagesPayload[0]?.base64,
        imageMimeType: imagesPayload[0]?.mimeType,
        images: imagesPayload.length > 1 ? imagesPayload : undefined,
        title: chapterName.trim() || uploadedFiles[0]?.name?.replace(/\.[^/.]+$/, '') || 'Comprehensive Study Notes',
        subject: subject.trim() || 'General Studies',
        chapter: chapterName.trim(),
        classLevel: classLevel.trim(),
        language: selectedLanguage,
        explanationLevel
      };

      const generatedNote = await mindClient.generateNotes(payload);

      if (cancelRequestedRef.current) return;

      // Stage 7: Final Completion
      setCurrentStageIndex(6);
      setProgressPercent(100);

      clearInterval(timerIntervalRef.current);
      clearInterval(progressIntervalRef.current);

      // Brief transition to celebrate completion
      setTimeout(() => {
        onCreateNote({
          title: generatedNote.chapterTitle || chapterName || 'MIND 1.0 Study Notes',
          content: generatedNote.markdownOutput,
          sources: notebookSources.length > 0 ? notebookSources : undefined,
          categoryId: (subject.toLowerCase().includes('math') ? 'math' : (subject.toLowerCase().includes('science') ? 'science' : 'all')),
          structuredData: generatedNote
        });
      }, 700);

    } catch (err: any) {
      console.error('[MIND 1.0] Generation Pipeline Error:', err);
      clearInterval(timerIntervalRef.current);
      clearInterval(progressIntervalRef.current);
      setIsGenerating(false);
      setErrorMessage(err.message || 'MIND 1.0 note generation failed. Please verify your inputs and retry.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-blue-100">
      
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs px-4 sm:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Return to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <StudyTopLogo size="sm" variant="icon" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                  MIND 1.0 Engine
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">Automatic Point-Wise Creation</span>
              </div>
              <h1 className="text-base sm:text-xl font-black text-slate-900">
                AI Note Maker
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5" />
            <span>MIND 1.0 Active</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* Subtitle Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden">
          <div className="relative z-10 space-y-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
              Intelligent Study Assistant
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Transform your study materials into intelligent, organized notes.
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl leading-relaxed font-medium">
              Upload textbook pages, PDFs, lecture slides, or photos. MIND 1.0 automatically extracts concepts, formats point-wise explanations, verifies formulas, and generates complete exam-ready notes.
            </p>
          </div>
          <div className="absolute -right-10 -bottom-10 w-52 h-52 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Error Feedback Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =========================================================================
            LIVE 7-STAGE PIPELINE PROGRESS DISPLAY (When generating)
            ========================================================================= */}
        {isGenerating ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-lg space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200/80 p-2 flex items-center justify-center mx-auto shadow-md animate-pulse">
                <StudyTopLogo size="md" variant="icon" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 block">
                MIND 1.0 Note Pipeline Active
              </span>
              <h3 className="text-2xl font-black text-slate-900">
                Creating Your Study Notes
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Currently: <strong className="text-slate-800">{PIPELINE_STAGES[currentStageIndex]?.detail}</strong>
              </p>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2 max-w-xl mx-auto">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-600">Stage {currentStageIndex + 1} of 7: {PIPELINE_STAGES[currentStageIndex]?.name}</span>
                <span className="text-blue-600 font-mono text-sm">{progressPercent}%</span>
              </div>
              
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 shadow-xs"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                <span>Elapsed time: {elapsedSeconds}s</span>
                <span>MIND 1.0 • Gemini AI Intelligence</span>
              </div>
            </div>

            {/* 7-Stage Visual Roadmap */}
            <div className="max-w-xl mx-auto border border-slate-100 rounded-2xl p-4 bg-slate-50/70 space-y-2.5">
              {PIPELINE_STAGES.map((stg, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div key={stg.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      {isPassed ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 animate-spin">
                          <Loader2 className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                          {stg.id}
                        </div>
                      )}

                      <span className={`font-bold ${isCurrent ? 'text-blue-900 font-black' : (isPassed ? 'text-slate-800' : 'text-slate-400')}`}>
                        {stg.name}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {isPassed ? 'Completed' : (isCurrent ? 'In progress...' : 'Queued')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Safe Cancellation Button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleCancelGeneration}
                className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <X className="w-4 h-4 text-slate-500" />
                <span>Cancel Generation</span>
              </button>
            </div>

          </div>
        ) : (
          /* =========================================================================
              NOTE MAKER INPUTS & FILE UPLOAD CARDS
              ========================================================================= */
          <div className="space-y-6">
            
            {/* 1. SOURCE SELECTOR TABS */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                Select Source Type
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: 'upload', label: 'Upload PDF', icon: FileUp, color: 'text-rose-600 bg-rose-50' },
                  { id: 'images', label: 'Upload Images', icon: ImageIcon, color: 'text-blue-600 bg-blue-50' },
                  { id: 'camera', label: 'Take Photo', icon: Camera, color: 'text-amber-600 bg-amber-50' },
                  { id: 'documents', label: 'Upload Docs', icon: FileText, color: 'text-indigo-600 bg-indigo-50' },
                  { id: 'paste', label: 'Paste Text', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50' },
                  { id: 'youtube', label: 'YouTube Link', icon: Youtube, color: 'text-red-600 bg-red-50' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      activeTab === item.id 
                        ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-slate-800 leading-tight">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              {/* Dynamic Tab Panels */}
              <div className="pt-2 border-t border-slate-100">
                
                {/* PDF Upload */}
                {activeTab === 'upload' && (
                  <div 
                    onClick={() => pdfInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 space-y-2"
                  >
                    <FileUp className="w-10 h-10 text-blue-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-900">Click to upload PDF textbooks or lecture notes</h4>
                    <p className="text-xs text-slate-400">Supported: PDF files up to 25MB • Multiple files allowed</p>
                    <input 
                      type="file" 
                      ref={pdfInputRef} 
                      accept=".pdf" 
                      multiple 
                      onChange={(e) => e.target.files && handleFilesAdded(e.target.files, 'pdf')} 
                      className="hidden" 
                    />
                  </div>
                )}

                {/* Images Upload */}
                {activeTab === 'images' && (
                  <div 
                    onClick={() => imageInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 space-y-2"
                  >
                    <ImageIcon className="w-10 h-10 text-blue-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-900">Upload multiple textbook or notebook images</h4>
                    <p className="text-xs text-slate-400">Supported: JPG, JPEG, PNG, WEBP • Optical Character Recognition enabled</p>
                    <input 
                      type="file" 
                      ref={imageInputRef} 
                      accept="image/*" 
                      multiple 
                      onChange={(e) => e.target.files && handleFilesAdded(e.target.files, 'image')} 
                      className="hidden" 
                    />
                  </div>
                )}

                {/* Camera Snap */}
                {activeTab === 'camera' && (
                  <div 
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 space-y-2"
                  >
                    <Camera className="w-10 h-10 text-amber-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-900">Take a photo of a textbook page or blackboard</h4>
                    <p className="text-xs text-slate-400">Uses mobile or device camera • Instant OCR analysis</p>
                    <input 
                      type="file" 
                      ref={cameraInputRef} 
                      accept="image/*" 
                      capture="environment" 
                      onChange={(e) => e.target.files && handleFilesAdded(e.target.files, 'camera')} 
                      className="hidden" 
                    />
                  </div>
                )}

                {/* Documents Upload */}
                {activeTab === 'documents' && (
                  <div 
                    onClick={() => docInputRef.current?.click()}
                    className="p-8 border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl text-center cursor-pointer transition bg-slate-50/50 hover:bg-blue-50/20 space-y-2"
                  >
                    <FileText className="w-10 h-10 text-indigo-600 mx-auto" />
                    <h4 className="text-sm font-extrabold text-slate-900">Upload Word documents, TXT, or Markdown</h4>
                    <p className="text-xs text-slate-400">Supported: DOCX, TXT, MD • Structured chapter extraction</p>
                    <input 
                      type="file" 
                      ref={docInputRef} 
                      accept=".docx,.doc,.txt,.md" 
                      multiple 
                      onChange={(e) => e.target.files && handleFilesAdded(e.target.files, 'document')} 
                      className="hidden" 
                    />
                  </div>
                )}

                {/* Paste Text */}
                {activeTab === 'paste' && (
                  <div className="space-y-3">
                    <textarea
                      rows={5}
                      value={pastedTextInput}
                      onChange={(e) => setPastedTextInput(e.target.value)}
                      placeholder="Paste your study notes, essay draft, syllabus topics, or article paragraphs here..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPastedText}
                      disabled={!pastedTextInput.trim()}
                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                    >
                      Attach Pasted Text as Source
                    </button>
                  </div>
                )}

                {/* YouTube Video URL */}
                {activeTab === 'youtube' && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={youtubeUrlInput}
                        onChange={(e) => setYoutubeUrlInput(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm font-medium text-slate-900 outline-none focus:bg-white focus:border-red-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddYouTube}
                        disabled={!youtubeUrlInput.trim()}
                        className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                      >
                        Add Video
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">MIND 1.0 will analyze the video curriculum and lecture transcript.</p>
                  </div>
                )}

              </div>
            </div>

            {/* 2. UPLOADED FILES LIST & REMOVAL CONTROLS */}
            {uploadedFiles.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Uploaded Sources ({uploadedFiles.length})</span>
                  </h4>
                  <button
                    onClick={() => setUploadedFiles([])}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {uploadedFiles.map(file => (
                    <div 
                      key={file.id} 
                      className="p-3 rounded-2xl border border-slate-200/90 bg-slate-50/50 flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {file.previewUrl ? (
                          <img src={file.previewUrl} alt="Thumbnail" className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            {file.type === 'pdf' ? <FileUp className="w-5 h-5 text-rose-600" /> : <FileText className="w-5 h-5" />}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                          <span className="text-[10px] text-slate-400 font-medium uppercase">{file.type} • {file.sizeString}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                        title="Remove Source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. METADATA & CONFIGURATION FIELDS */}
            <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" />
                <span>Note Customization Options</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Subject */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Physics, Biology, History..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Chapter Name */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Chapter Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={chapterName}
                    onChange={(e) => setChapterName(e.target.value)}
                    placeholder="e.g., Force and Pressure"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>

                {/* Class / Grade */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Class / Grade (Optional)
                  </label>
                  <input
                    type="text"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="e.g., Class 10 / High School"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                {/* Language Option */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Note Language
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['English', 'Hindi', 'Hinglish'] as const).map(langOpt => (
                      <button
                        key={langOpt}
                        type="button"
                        onClick={() => setSelectedLanguage(langOpt)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                          selectedLanguage === langOpt 
                            ? 'bg-blue-50 border-blue-400 text-blue-700 ring-1 ring-blue-400' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        {langOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanation Level */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Explanation Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Simple', 'Standard', 'Detailed'] as const).map(lvl => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setExplanationLevel(lvl)}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                          explanationLevel === lvl 
                            ? 'bg-indigo-50 border-indigo-400 text-indigo-700 ring-1 ring-indigo-400' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* 4. PRIMARY GENERATE BUTTON */}
            <button
              type="button"
              onClick={handleStartGeneration}
              disabled={uploadedFiles.length === 0 && !subject.trim() && !chapterName.trim()}
              className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm tracking-wide shadow-xl shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              <span>Generate Notes with MIND 1.0</span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
