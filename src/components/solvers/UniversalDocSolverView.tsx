import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Camera, 
  Sparkles, 
  Copy, 
  Check, 
  Bookmark, 
  Download, 
  X, 
  Loader2, 
  AlertCircle,
  FileSearch,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { OrganizedAnswerCard } from './OrganizedAnswerCard';

interface UniversalDocSolverViewProps {
  user: any;
  userProfile: any;
  onSaveToNotes?: (title: string, content: string) => void;
}

export const UniversalDocSolverView: React.FC<UniversalDocSolverViewProps> = ({
  user,
  userProfile,
  onSaveToNotes
}) => {
  const [docBase64, setDocBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [targetQuestion, setTargetQuestion] = useState<number>(-1); // -1 = Solve All

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.error('Camera error', err);
      setError('Cannot access device camera. Please upload an image or PDF instead.');
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
      setDocBase64(dataUrl);
      setFileName('Captured_Textbook_Page.jpg');
      setMimeType('image/jpeg');
    }
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setMimeType(file.type || 'image/jpeg');

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setDocBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSolve = async () => {
    if (!docBase64) {
      setError('Please upload a document or photograph first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSolution(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/solver/detect-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageOrPdfBase64: docBase64,
          mimeType,
          language: userProfile?.language || 'English',
          selectedQuestionIndex: targetQuestion,
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze document.');
      }

      setSolution(data.result);
    } catch (err: any) {
      console.error('Document solve error:', err);
      setError(err?.message || 'Error occurred while analyzing document.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!solution || !user) return;
    try {
      const res = await fetch('/api/solutions/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          title: `Document: ${fileName || 'Scanned Page Solution'}`,
          subject: 'Universal OCR',
          question: fileName,
          solution,
          tags: ['Document', 'OCR', 'Textbook']
        })
      });
      if (res.ok) {
        setIsSaved(true);
        if (onSaveToNotes) {
          onSaveToNotes(`Document Solution: ${fileName}`, solution);
        }
      }
    } catch (e) {
      console.error('Failed to save document solution', e);
    }
  };

  const handleCopy = () => {
    if (!solution) return;
    navigator.clipboard.writeText(solution);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-700 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider text-white mb-3">
            <FileSearch className="w-3.5 h-3.5" />
            100% Free • Multi-Question OCR & Page Solver
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Ask from Image / PDF Document
          </h1>
          <p className="text-blue-100 text-sm md:text-base mt-1 max-w-2xl">
            Upload any worksheet, exam paper, textbook page, or handwritten assignment. Our multimodal AI identifies the subject, detects questions, and delivers comprehensive step-by-step solutions.
          </p>
        </div>
      </div>

      {/* Upload & Setup Box */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Solve Scope
            </label>
            <select
              value={targetQuestion}
              onChange={(e) => setTargetQuestion(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
              <option value={-1}>Solve All Questions on the Page</option>
              <option value={0}>Solve Question 1 Only</option>
              <option value={1}>Solve Question 2 Only</option>
              <option value={2}>Solve Question 3 Only</option>
              <option value={3}>Solve Question 4 Only</option>
              <option value={4}>Solve Question 5 Only</option>
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-slate-500 pb-2">
              Supports PNG, JPG, WEBP, and PDF documents with handwritten or printed problems.
            </p>
          </div>
        </div>

        {/* Live Camera Scanner */}
        {isCameraActive && (
          <div className="bg-slate-900 rounded-2xl p-4 text-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Camera className="w-4 h-4 text-emerald-400 animate-pulse" />
                Live Document Camera
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
            </div>
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg flex items-center gap-2 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                Capture Page Photo
              </button>
            </div>
          </div>
        )}

        {/* Document Preview Box */}
        {docBase64 ? (
          <div className="relative border border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-3 truncate">
              {mimeType.includes('image') ? (
                <img src={docBase64} alt="Document thumbnail" className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-2xs" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs uppercase">
                  PDF
                </div>
              )}
              <div className="truncate">
                <p className="text-sm font-bold text-slate-900 truncate">{fileName || 'Attached Page'}</p>
                <p className="text-xs text-slate-500">{mimeType}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setDocBase64(null);
                setFileName('');
                setSolution(null);
              }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-blue-400 bg-slate-50/50 hover:bg-blue-50/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-800">
                Click to upload textbook page or drop PDF / image here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PNG, JPG, WEBP, PDF up to 25MB
              </p>
            </div>
          </div>
        )}

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,application/pdf"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              Choose File
            </button>
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className="px-3.5 py-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              Use Camera
            </button>
          </div>

          <button
            type="button"
            onClick={handleSolve}
            disabled={isLoading || !docBase64}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all active:scale-95"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Reading & Solving Document...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-yellow-300" />
                Scan & Solve Questions
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Unable to process document</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rendered Solution with 9-Part Architecture */}
      {solution && (
        <OrganizedAnswerCard
          question={fileName ? `Document: ${fileName}` : 'Scanned Textbook Page / Document'}
          subject="Universal AI Question Solver"
          topic="Textbook OCR & Multi-Question Solver"
          solution={solution}
          isSaved={isSaved}
          onSave={handleSave}
          onAskFollowUp={(followUp) => {
            // handle follow up
            setSolution(prev => `${prev}\n\n---\n\n### 💬 Follow-Up Question: *${followUp}*\n\nAnalyzing follow-up for this document question...`);
          }}
        />
      )}
    </div>
  );
};
