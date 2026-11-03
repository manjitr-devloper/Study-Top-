import React, { useState, useRef, useEffect } from 'react';
import { 
  Calculator, 
  Camera, 
  Upload, 
  Image as ImageIcon, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  RotateCcw, 
  HelpCircle, 
  ChevronRight, 
  Lightbulb, 
  X, 
  Maximize2,
  Video,
  AlertCircle,
  Loader2,
  Share2,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface MathSolverViewProps {
  user: any;
  userProfile: any;
  onSaveToNotes?: (title: string, content: string) => void;
}

const MATH_SYMBOLS = [
  { label: 'π', val: 'π' },
  { label: '√x', val: '\\sqrt{}' },
  { label: 'x²', val: '^2' },
  { label: 'x³', val: '^3' },
  { label: '∫', val: '\\int' },
  { label: '∑', val: '\\sum' },
  { label: 'θ', val: '\\theta' },
  { label: 'α', val: '\\alpha' },
  { label: 'β', val: '\\beta' },
  { label: '∞', val: '\\infty' },
  { label: '±', val: '±' },
  { label: '≠', val: '≠' },
  { label: '≤', val: '≤' },
  { label: '≥', val: '≥' },
  { label: '÷', val: '÷' },
  { label: '×', val: '×' },
  { label: 'lim', val: '\\lim_{x \\to 0}' },
  { label: 'dy/dx', val: '\\frac{dy}{dx}' }
];

export const MathSolverView: React.FC<MathSolverViewProps> = ({
  user,
  userProfile,
  onSaveToNotes
}) => {
  const [questionText, setQuestionText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [gradeLevel, setGradeLevel] = useState('Senior Secondary (Class 11-12 / CBSE)');
  const [topic, setTopic] = useState('General');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [followUp, setFollowUp] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Stop camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please allow camera permissions or upload an image file.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setImages(prev => [...prev, dataUrl]);
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages(prev => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const insertSymbol = (sym: string) => {
    if (!textareaRef.current) {
      setQuestionText(prev => prev + sym);
      return;
    }
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const updated = questionText.substring(0, start) + sym + questionText.substring(end);
    setQuestionText(updated);
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(start + sym.length, start + sym.length);
    }, 10);
  };

  const handleSolve = async () => {
    if (!questionText.trim() && images.length === 0) {
      setError('Please type your math question, use device camera, or upload problem images.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSolution(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/solver/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionText,
          images,
          gradeLevel,
          topic,
          language: userProfile?.language || 'English',
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to solve math problem.');
      }

      setSolution(data.solution);
    } catch (err: any) {
      console.error('Math solve error:', err);
      setError(err?.message || 'Something went wrong while solving the problem. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUp.trim() || !solution) return;
    setIsFollowUpLoading(true);
    try {
      const res = await fetch('/api/solver/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: `Previous Solution:\n${solution}\n\nStudent Clarification/Follow-up Question:\n${followUp}`,
          gradeLevel,
          topic,
          language: userProfile?.language || 'English',
          uid: user?.uid
        })
      });
      const data = await res.json();
      if (data.solution) {
        setSolution(prev => (prev || '') + '\n\n---\n\n### 💬 Clarification & Follow-Up Solution\n\n' + data.solution);
        setFollowUp('');
      }
    } catch (e: any) {
      console.error('Follow-up error:', e);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleSaveSolution = async () => {
    if (!solution || !user) return;
    try {
      const res = await fetch('/api/solutions/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          title: `Math: ${questionText ? questionText.slice(0, 35) + '...' : 'Solved Problem'}`,
          subject: 'Mathematics',
          question: questionText || 'Image math question',
          solution,
          tags: ['Math', topic]
        })
      });
      if (res.ok) {
        setIsSaved(true);
        if (onSaveToNotes) {
          onSaveToNotes(`Math Solution: ${questionText.slice(0, 30) || 'Problem'}`, solution);
        }
      }
    } catch (err) {
      console.error('Failed to save solution:', err);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = () => {
    if (!solution) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Study Top - Mathematics Solution</title>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
              h1, h2, h3 { color: #1e3a8a; }
              .header { border-bottom: 2px solid #3b82f6; padding-bottom: 12px; margin-bottom: 24px; }
              .footer { margin-top: 40px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; }
              pre { background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>Study Top — AI Mathematics Solution</h2>
              <p><strong>Topic:</strong> ${topic} | <strong>Level:</strong> ${gradeLevel}</p>
            </div>
            <div>${solution.replace(/\n/g, '<br/>')}</div>
            <div class="footer">
              Created by Manjit Ranjan (Google Developer) • Study Top Academic Platform
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 rounded-3xl p-6 md:p-8 text-white shadow-xl shadow-blue-500/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white mb-3">
              <Calculator className="w-3.5 h-3.5" />
              100% Free • Multi-Step AI Math Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              Advanced AI Math Solver
            </h1>
            <p className="text-blue-100 text-sm md:text-base mt-1 max-w-xl">
              Upload textbook photos, handwritten notes, or type equations. Receive comprehensive step-by-step derivations, verified proofs, and alternative shortcuts.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/10 p-3 rounded-2xl backdrop-blur-sm self-start md:self-auto border border-white/20">
            <Sparkles className="w-6 h-6 text-yellow-300" />
            <div className="text-xs">
              <p className="font-semibold text-white">Pedagogical Mode</p>
              <p className="text-blue-200">LaTeX, Formulas & Checks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Input Workspace Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        {/* Controls: Grade Level & Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Academic Level
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="Middle School (Class 6-8)">Middle School (Class 6-8)</option>
              <option value="Secondary School (Class 9-10 / Matric)">Secondary School (Class 9-10 / Matric)</option>
              <option value="Senior Secondary (Class 11-12 / CBSE / State)">Senior Secondary (Class 11-12 / CBSE / State)</option>
              <option value="College / Engineering / B.Sc / B.Tech">College / Engineering / B.Sc / B.Tech</option>
              <option value="Competitive Exam (JEE Main/Adv, NEET, Olympiad)">Competitive Exam (JEE Main/Adv, NEET, Olympiad)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mathematics Topic
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value="General">Auto-Detect / General Mathematics</option>
              <option value="Algebra & Polynomials">Algebra & Polynomials</option>
              <option value="Calculus (Limits, Differentiation, Integrals)">Calculus (Limits, Derivatives, Integrals)</option>
              <option value="Trigonometry & Heights/Distances">Trigonometry & Heights/Distances</option>
              <option value="Geometry & Theorems">Geometry & Coordinate Geometry</option>
              <option value="Linear Algebra & Matrices">Matrices & Determinants</option>
              <option value="Probability & Statistics">Probability & Statistics</option>
              <option value="Arithmetic & Word Problems">Arithmetic & Word Problems</option>
            </select>
          </div>
        </div>

        {/* Quick Math Symbols Toolbar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Quick Math Symbols & Operators
            </span>
            <span className="text-xs text-slate-400">Click to insert at cursor</span>
          </div>
          <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-100">
            {MATH_SYMBOLS.map((sym) => (
              <button
                key={sym.label}
                type="button"
                onClick={() => insertSymbol(sym.val)}
                className="px-2.5 py-1 text-xs font-mono font-medium bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200 hover:border-blue-300 rounded-lg transition-all shadow-2xs active:scale-95"
              >
                {sym.label}
              </button>
            ))}
          </div>
        </div>

        {/* Textarea Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Type or Paste Math Problem
          </label>
          <textarea
            ref={textareaRef}
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="e.g. Find the roots of 2x^2 + 5x - 3 = 0, or evaluate the integral ∫ (x^3 * e^x) dx, or paste your textbook question..."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y font-mono"
          />
        </div>

        {/* Camera Capture Modal / Section */}
        {isCameraActive && (
          <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Video className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Camera Scanner
              </span>
              <button
                onClick={stopCamera}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-80 flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              <div className="absolute inset-8 border-2 border-dashed border-white/60 pointer-events-none rounded-lg" />
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Snap Problem Photo
              </button>
            </div>
          </div>
        )}

        {/* Attached Images Preview Grid */}
        {images.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Attached Problem Images ({images.length})
            </span>
            <div className="flex flex-wrap gap-3">
              {images.map((img, idx) => (
                <div key={idx} className="relative group w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                  <img src={img} alt={`Problem attachment ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600/90 text-white opacity-90 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons: Camera, File Upload, Solve */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              Upload Image / PDF
            </button>
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Device Camera
            </button>
          </div>

          <div className="flex items-center gap-2">
            {(questionText || images.length > 0) && (
              <button
                type="button"
                onClick={() => {
                  setQuestionText('');
                  setImages([]);
                  setSolution(null);
                  setError(null);
                }}
                className="px-3.5 py-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-all"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSolve}
              disabled={isLoading || (!questionText.trim() && images.length === 0)}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Solving with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  Solve Problem Step-by-Step
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to solve</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rendered Solution Card */}
      {solution && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
          {/* Solution Top Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-bold text-slate-900">
                Detailed Academic Solution
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={handleSaveSolution}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isSaved
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                {isSaved ? <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5 text-slate-500" />}
                {isSaved ? 'Saved to Solutions' : 'Save Solution'}
              </button>
              <button
                type="button"
                onClick={handleExportPDF}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                Export / Print
              </button>
            </div>
          </div>

          {/* Solution Markdown Body */}
          <div className="prose prose-slate max-w-none text-slate-800 font-sans leading-relaxed text-sm md:text-base prose-headings:font-bold prose-headings:text-slate-900 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:rounded-2xl">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {solution}
            </ReactMarkdown>
          </div>

          {/* Follow-up / Clarification Box */}
          <div className="pt-6 border-t border-slate-100 space-y-3 bg-slate-50 -mx-6 md:-mx-8 -mb-6 md:-mb-8 p-6 md:p-8 rounded-b-3xl">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              Ask a Follow-Up or Request Clarification on Any Step
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFollowUp()}
                placeholder="e.g. Can you explain why we factored (2x-1) in step 3? Or show another method?"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={handleFollowUp}
                disabled={isFollowUpLoading || !followUp.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
              >
                {isFollowUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Ask AI
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
