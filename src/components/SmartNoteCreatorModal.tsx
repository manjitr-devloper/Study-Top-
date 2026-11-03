import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  X, 
  FileText, 
  Camera, 
  Image as ImageIcon, 
  FileUp, 
  Youtube, 
  Settings, 
  Globe, 
  CheckCircle2, 
  RefreshCw, 
  Trash2, 
  RotateCw, 
  Copy, 
  Check, 
  Download, 
  ArrowRight,
  BookOpen,
  Layers,
  HelpCircle,
  AlertCircle,
  Eye,
  Sliders,
  Play,
  ChevronLeft
} from 'lucide-react';
import { generateSmartStudyNotes, SmartNoteOptions } from '../lib/gemini';
import { SUPPORTED_LANGUAGES } from '../constants';
import { AnimatedProgressBar, ProgressStatus } from './AnimatedProgressBar';
import { CancelConfirmModal } from './CancelConfirmModal';
import jsPDF from 'jspdf';

interface SmartNoteCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLanguage: string;
  onSaveNote: (note: { title: string; content: string; tags: string[]; categoryId?: string }) => void;
  initialSource?: 'text' | 'camera' | 'images' | 'pdf' | 'youtube';
}

export const SmartNoteCreatorModal: React.FC<SmartNoteCreatorModalProps> = ({
  isOpen,
  onClose,
  userLanguage,
  onSaveNote,
  initialSource = 'text'
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'camera' | 'images' | 'pdf' | 'youtube'>(initialSource);

  // Settings
  const [title, setTitle] = useState('');
  const [noteStyle, setNoteStyle] = useState<'Short' | 'Detailed' | 'Exam Preparation' | 'Handwritten-Style Text' | 'Revision Notes'>('Detailed');
  const [language, setLanguage] = useState(userLanguage || 'English');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Standard' | 'Advanced'>('Standard');
  const [outputFormat, setOutputFormat] = useState<'Point-wise Notes' | 'Q&A' | 'Table Format' | 'Mind Map Outline' | 'Flashcards'>('Point-wise Notes');
  const [length, setLength] = useState<'Brief' | 'Medium' | 'Comprehensive'>('Medium');
  const [useGoogleSearch, setUseGoogleSearch] = useState(true);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Input data states
  const [typedText, setTypedText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<Array<{ name: string; base64Data: string; mimeType: string; previewUrl?: string }>>([]);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeTranscriptFallback, setYoutubeTranscriptFallback] = useState('');
  const [pdfPageRange, setPdfPageRange] = useState('All');

  // Camera capture states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Progress & Execution states
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>('idle');
  const [stageText, setStageText] = useState('Uploading your content…');
  const [subText, setSubText] = useState('Extracting text…');
  const [progressPercent, setProgressPercent] = useState<number | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);

  // Result states
  const [generatedResult, setGeneratedResult] = useState<{ title: string; markdown: string; sources?: string[] } | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<'notes' | 'flashcards' | 'raw'>('notes');

  const abortControllerRef = useRef<AbortController | null>(null);
  const stageTimeoutRef = useRef<any[]>([]);

  const clearTimeouts = () => {
    stageTimeoutRef.current.forEach(t => clearTimeout(t));
    stageTimeoutRef.current = [];
  };

  // Sync initial tab
  useEffect(() => {
    if (initialSource) setActiveTab(initialSource);
  }, [initialSource]);

  // Clean up camera & abort controller when closing
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      clearTimeouts();
      if (abortControllerRef.current) abortControllerRef.current.abort();
    }
  }, [isOpen]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("Camera access failed", err);
      setCameraError('Camera access was denied or is unavailable on this device. You can upload textbook photos below.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const base64Data = dataUrl.split(',')[1];
    setUploadedFiles(prev => [
      ...prev,
      {
        name: `Captured_Page_${prev.length + 1}.jpg`,
        base64Data,
        mimeType: 'image/jpeg',
        previewUrl: dataUrl
      }
    ]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'pdf') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        alert(`File ${file.name} is larger than 25MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        const base64Data = result.split(',')[1];
        setUploadedFiles(prev => [
          ...prev,
          {
            name: file.name,
            base64Data,
            mimeType: file.type || (type === 'pdf' ? 'application/pdf' : 'image/jpeg'),
            previewUrl: file.type.startsWith('image/') ? result : undefined
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartGeneration = async () => {
    if (progressStatus === 'loading') return;

    // Validate inputs based on active tab
    if (activeTab === 'text' && !typedText.trim()) {
      alert('Please enter or paste your study material.');
      return;
    }
    if ((activeTab === 'images' || activeTab === 'camera') && uploadedFiles.length === 0 && !typedText.trim()) {
      alert('Please upload or capture at least one image or textbook page.');
      return;
    }
    if (activeTab === 'pdf' && uploadedFiles.length === 0) {
      alert('Please select a PDF document.');
      return;
    }
    if (activeTab === 'youtube' && !youtubeUrl.trim() && !youtubeTranscriptFallback.trim()) {
      alert('Please paste a YouTube video link or fallback transcript.');
      return;
    }

    clearTimeouts();
    abortControllerRef.current = new AbortController();
    const currentAbort = abortControllerRef.current;

    setProgressStatus('loading');
    setErrorMessage(null);
    setGeneratedResult(null);

    // Initial stage
    if (activeTab === 'youtube') {
      setStageText('Validating video URL…');
      setSubText('Checking available subtitles & captions…');
      setProgressPercent(15);
    } else if (activeTab === 'pdf') {
      setStageText('Importing PDF document…');
      setSubText('Preparing pages for high-precision OCR extraction…');
      setProgressPercent(20);
    } else if (activeTab === 'images' || activeTab === 'camera') {
      setStageText('Uploading your content…');
      setSubText('Enhancing image contrast for text recognition…');
      setProgressPercent(25);
    } else {
      setStageText('Analyzing your content…');
      setSubText('Parsing chapter concepts and definitions…');
      setProgressPercent(30);
    }

    // Schedule progressive truthful stage messages
    const t1 = setTimeout(() => {
      if (currentAbort.signal.aborted) return;
      if (activeTab === 'youtube') {
        setStageText('Retrieving transcript & captions…');
        setSubText('Processing timestamps and spoken audio…');
      } else {
        setStageText('Extracting text & formulas…');
        setSubText('Running curriculum-aligned concept recognition…');
      }
      setProgressPercent(45);
    }, 900);

    const t2 = setTimeout(() => {
      if (currentAbort.signal.aborted) return;
      setStageText('Organizing key points & comparisons…');
      setSubText(`Structuring notes in ${language} at ${difficulty} level…`);
      setProgressPercent(70);
    }, 2200);

    const t3 = setTimeout(() => {
      if (currentAbort.signal.aborted) return;
      setStageText('Generating your notes & flashcards…');
      setSubText('Formatting definitions, practice MCQs, and summaries…');
      setProgressPercent(88);
    }, 3800);

    stageTimeoutRef.current.push(t1, t2, t3);

    try {
      const options: SmartNoteOptions = {
        title: title.trim() || undefined,
        sourceType: activeTab,
        textContent: typedText.trim() || undefined,
        files: uploadedFiles.map(f => ({
          base64Data: f.base64Data,
          mimeType: f.mimeType,
          name: f.name
        })),
        youtubeUrl: activeTab === 'youtube' ? youtubeUrl.trim() : undefined,
        fallbackTranscript: activeTab === 'youtube' ? youtubeTranscriptFallback.trim() : undefined,
        style: noteStyle,
        language,
        difficulty,
        format: outputFormat,
        length,
        useGoogleSearch,
        signal: currentAbort.signal
      };

      const result = await generateSmartStudyNotes(options);

      if (currentAbort.signal.aborted) return;

      clearTimeouts();
      setProgressPercent(100);
      setStageText('Your notes are ready!');
      setSubText('Synthesized into structured, editable notes.');
      setProgressStatus('success');

      setTimeout(() => {
        if (!currentAbort.signal.aborted) {
          setGeneratedResult(result);
          setProgressStatus('idle');
        }
      }, 700);
    } catch (err: any) {
      if (currentAbort.signal.aborted) return;
      clearTimeouts();
      console.error("Smart note generation error:", err);
      setProgressStatus('error');
      setErrorMessage(
        err.name === 'AbortError'
          ? 'Note generation was cancelled. Your inputs remain saved.'
          : err.message || 'Failed to generate notes. Please check your connection and retry.'
      );
    }
  };

  const handleConfirmCancel = () => {
    setIsCancelConfirmOpen(false);
    setProgressStatus('cancelling');
    clearTimeouts();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setTimeout(() => {
      setProgressStatus('cancelled');
      setStageText('Process cancelled');
      setSubText('Note creation was halted. Your text and files are preserved.');
    }, 450);
  };

  const handleSaveToWorkspace = () => {
    if (!generatedResult) return;
    const tags = [
      `style:${noteStyle.toLowerCase().replace(/\s+/g, '-')}`,
      `level:${difficulty.toLowerCase()}`,
      `source:${activeTab}`
    ];
    onSaveNote({
      title: generatedResult.title || title || 'Study Notes',
      content: generatedResult.markdown,
      tags
    });
    onClose();
  };

  const handleExportPDF = () => {
    if (!generatedResult) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(generatedResult.title || 'Study Notes', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated by Study Top · Language: ${language} · Style: ${noteStyle}`, 14, 28);
    doc.line(14, 32, 196, 32);

    const splitText = doc.splitTextToSize(generatedResult.markdown, 180);
    doc.setFontSize(10);
    doc.text(splitText, 14, 40);
    doc.save(`${(generatedResult.title || 'StudyNotes').replace(/\s+/g, '_')}.pdf`);
  };

  const handleExportTXT = () => {
    if (!generatedResult) return;
    const element = document.createElement('a');
    const file = new Blob([generatedResult.markdown], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${(generatedResult.title || 'StudyNotes').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[115] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-4xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden relative"
        >
          {/* Top Banner */}
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

              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20 shrink-0">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-amber-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-2xl font-black tracking-tight truncate">AI Smart Notes Generator</h2>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20 hidden sm:inline-block">
                    Multimodal
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-blue-100 font-medium truncate">
                  Create organized, editable study notes from texts, camera photos, PDFs, or YouTube links
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
            
            {/* Progress Bar Display when processing */}
            <AnimatePresence>
              {progressStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AnimatedProgressBar
                    status={progressStatus}
                    stageText={stageText}
                    subText={subText}
                    progress={progressPercent}
                    errorMessage={errorMessage || undefined}
                    onCancel={() => setIsCancelConfirmOpen(true)}
                    onRetry={() => {
                      setProgressStatus('idle');
                      setErrorMessage(null);
                    }}
                    accent="blue"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {!generatedResult ? (
              <div className="space-y-6">
                
                {/* 1. Multiple Input Tabs Bar */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    1. Select Input Source
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                    {[
                      { id: 'text', label: 'Type / Paste', icon: FileText },
                      { id: 'camera', label: 'Camera Scan', icon: Camera },
                      { id: 'images', label: 'Upload Photos', icon: ImageIcon },
                      { id: 'pdf', label: 'Import PDF', icon: FileUp },
                      { id: 'youtube', label: 'YouTube Link', icon: Youtube }
                    ].map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveTab(tab.id as any);
                            if (tab.id !== 'camera') stopCamera();
                          }}
                          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            isActive
                              ? 'bg-white text-blue-600 shadow-sm border border-blue-100'
                              : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Source Input Panel */}
                <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/80">
                  {/* Text Input Panel */}
                  {activeTab === 'text' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">Paste Text, Chapter Excerpt or Syllabus</label>
                        <span className="text-[10px] font-bold text-slate-400 tabular-nums">{typedText.length} characters</span>
                      </div>
                      <textarea
                        rows={7}
                        value={typedText}
                        onChange={(e) => setTypedText(e.target.value)}
                        placeholder="Paste article, textbook paragraph, questions, or lecture notes here..."
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                      />
                    </div>
                  )}

                  {/* Camera Scan Panel */}
                  {activeTab === 'camera' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">Capture Textbook Pages or Handwritten Notes</label>
                        <span className="text-[10px] font-bold text-slate-400">{uploadedFiles.length} pages captured</span>
                      </div>

                      {cameraError && (
                        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-xs font-semibold">
                          {cameraError}
                        </div>
                      )}

                      {!isCameraActive ? (
                        <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white space-y-3">
                          <Camera className="w-10 h-10 text-blue-500 mx-auto" />
                          <div>
                            <p className="text-xs font-bold text-slate-700">Open Camera to Photograph Document Pages</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Supports multi-page capture with automated OCR extraction</p>
                          </div>
                          <button
                            type="button"
                            onClick={startCamera}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            Open Device Camera
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative rounded-2xl overflow-hidden bg-black aspect-video max-h-72 flex items-center justify-center">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            <canvas ref={canvasRef} className="hidden" />
                          </div>
                          <div className="flex items-center justify-center gap-3">
                            <button
                              type="button"
                              onClick={capturePhoto}
                              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md active:scale-95 cursor-pointer"
                            >
                              <Camera className="w-4 h-4" />
                              Capture Page
                            </button>
                            <button
                              type="button"
                              onClick={stopCamera}
                              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Close Camera
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Multipage Capture List */}
                      {uploadedFiles.length > 0 && (
                        <div className="pt-2">
                          <label className="block text-[11px] font-bold text-slate-500 mb-2">Captured Pages ({uploadedFiles.length})</label>
                          <div className="flex flex-wrap gap-3">
                            {uploadedFiles.map((file, idx) => (
                              <div key={idx} className="relative w-24 h-24 rounded-2xl border border-slate-200 overflow-hidden bg-white group shadow-xs">
                                {file.previewUrl && (
                                  <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                  #{idx + 1}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="absolute top-1 right-1 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Images Panel */}
                  {activeTab === 'images' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">Upload Image Files (JPG, PNG)</label>
                        <span className="text-[10px] font-bold text-slate-400">{uploadedFiles.length} files selected</span>
                      </div>

                      <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-blue-50/20">
                        <ImageIcon className="w-8 h-8 text-blue-500 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Choose images from gallery or drag &amp; drop</span>
                        <span className="text-[10px] text-slate-400 mt-1">Upload multiple photos of textbook pages or handwritten notes</span>
                        <input
                          type="file"
                          multiple
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'image')}
                        />
                      </label>

                      {uploadedFiles.length > 0 && (
                        <div className="flex flex-wrap gap-3">
                          {uploadedFiles.map((file, idx) => (
                            <div key={idx} className="relative w-24 h-24 rounded-2xl border border-slate-200 overflow-hidden bg-white group shadow-xs">
                              {file.previewUrl && (
                                <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded">
                                #{idx + 1}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="absolute top-1 right-1 p-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Upload Panel */}
                  {activeTab === 'pdf' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700">Import PDF Document (Digital or Scanned)</label>
                        <span className="text-[10px] font-bold text-slate-400">OCR Supported</span>
                      </div>

                      <label className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-blue-50/20">
                        <FileUp className="w-8 h-8 text-indigo-500 mb-2" />
                        <span className="text-xs font-bold text-slate-700">Select PDF textbook or research paper</span>
                        <span className="text-[10px] text-slate-400 mt-1">Digital text and scanned pages processed automatically</span>
                        <input
                          type="file"
                          accept="application/pdf"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'pdf')}
                        />
                      </label>

                      {uploadedFiles.length > 0 && (
                        <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-2.5 truncate">
                            <FileUp className="w-5 h-5 text-indigo-600 shrink-0" />
                            <div className="truncate">
                              <p className="text-xs font-black text-slate-800 truncate">{uploadedFiles[0].name}</p>
                              <p className="text-[10px] text-emerald-600 font-bold">Ready for OCR extraction</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setUploadedFiles([])}
                            className="p-1.5 text-slate-400 hover:text-rose-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* YouTube to Notes Panel */}
                  {activeTab === 'youtube' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">
                          Paste YouTube Educational Video URL
                        </label>
                        <div className="relative">
                          <Youtube className="w-4 h-4 text-rose-500 absolute left-4 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            value={youtubeUrl}
                            onChange={(e) => setYoutubeUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Validates URL, accesses available captions, and extracts timestamped key concepts.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 mb-1">
                          Fallback Transcript / Video Captions (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={youtubeTranscriptFallback}
                          onChange={(e) => setYoutubeTranscriptFallback(e.target.value)}
                          placeholder="Paste subtitles or transcript text here if automatic captions are unavailable..."
                          className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Note Title & Essential Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      2. Note Customization Settings
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{showAdvancedSettings ? 'Hide Details' : 'More Options'}</span>
                    </button>
                  </div>

                  {/* Title Row */}
                  <div>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Note Title / Chapter Name (e.g. Organic Chemistry: Hydrocarbons, World War II Overview...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                    />
                  </div>

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Note Style */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Note Style
                      </label>
                      <select
                        value={noteStyle}
                        onChange={(e) => setNoteStyle(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Detailed">Detailed (Recommended)</option>
                        <option value="Short">Short &amp; Crisp</option>
                        <option value="Exam Preparation">Exam Preparation</option>
                        <option value="Handwritten-Style Text">Handwritten-Style</option>
                        <option value="Revision Notes">Rapid Revision</option>
                      </select>
                    </div>

                    {/* Language */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-blue-600" />
                        Target Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGES.map((l, idx) => (
                          <option key={`${l.code}-${idx}`} value={l.name}>{l.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Output Format */}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                        Output Format
                      </label>
                      <select
                        value={outputFormat}
                        onChange={(e) => setOutputFormat(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="Point-wise Notes">Point-wise Notes</option>
                        <option value="Q&A">Question &amp; Answer (Q&amp;A)</option>
                        <option value="Table Format">Table &amp; Comparisons</option>
                        <option value="Mind Map Outline">Mind Map Outline</option>
                        <option value="Flashcards">Flashcard Deck</option>
                      </select>
                    </div>
                  </div>

                  {/* Advanced settings row (collapsible) */}
                  {showAdvancedSettings && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2"
                    >
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Difficulty Level
                        </label>
                        <select
                          value={difficulty}
                          onChange={(e) => setDifficulty(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Easy">Easy (Beginner friendly)</option>
                          <option value="Standard">Standard (Board / High School)</option>
                          <option value="Advanced">Advanced (Competitive / College)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">
                          Length Depth
                        </label>
                        <select
                          value={length}
                          onChange={(e) => setLength(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="Brief">Brief (Quick overview)</option>
                          <option value="Medium">Medium (Balanced)</option>
                          <option value="Comprehensive">Comprehensive (Full syllabus)</option>
                        </select>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ) : (
              /* 4. Generated Notes View & Management */
              <div className="space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('notes')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                        previewTab === 'notes' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Study Notes
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('raw')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
                        previewTab === 'raw' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Raw Markdown
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedResult.markdown);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportTXT}
                      className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                    >
                      <span>TXT</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGeneratedResult(null)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1 transition-all cursor-pointer"
                    >
                      Edit Inputs
                    </button>
                  </div>
                </div>

                {previewTab === 'notes' ? (
                  <div className="p-6 bg-slate-50/70 rounded-3xl border border-slate-200/80 prose prose-slate max-w-none text-sm leading-relaxed prose-headings:font-black prose-strong:text-blue-950">
                    <div className="whitespace-pre-wrap font-sans">
                      {generatedResult.markdown}
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={16}
                    value={generatedResult.markdown}
                    onChange={(e) => setGeneratedResult({ ...generatedResult, markdown: e.target.value })}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-5 rounded-2xl outline-none border border-slate-800 leading-relaxed custom-scrollbar"
                  />
                )}
              </div>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="bg-slate-50 px-6 md:px-8 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
            {!generatedResult ? (
              <>
                <div className="text-xs text-slate-500 font-medium truncate hidden sm:block">
                  Style: <strong className="text-slate-800">{noteStyle}</strong> · Language: <strong className="text-slate-800">{language}</strong> · Format: <strong className="text-slate-800">{outputFormat}</strong>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleStartGeneration}
                    disabled={progressStatus === 'loading'}
                    className="px-7 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-blue-500/25 active:scale-98 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Generate AI Notes</span>
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
                    onClick={() => setGeneratedResult(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer"
                  >
                    Regenerate
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToWorkspace}
                    className="px-7 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
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

      {/* Cancellation Confirmation Dialog */}
      <CancelConfirmModal
        isOpen={isCancelConfirmOpen}
        onContinue={() => setIsCancelConfirmOpen(false)}
        onConfirmCancel={handleConfirmCancel}
        title="Cancel this process?"
        description="Your note may not be completed. You can try again later."
      />
    </AnimatePresence>
  );
};
