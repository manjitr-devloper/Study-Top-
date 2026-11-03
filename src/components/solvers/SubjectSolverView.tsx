import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Camera, 
  Mic, 
  MicOff, 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { ALL_23_SUBJECTS, SubjectData } from './AllSubjectsView';
import { OrganizedAnswerCard } from './OrganizedAnswerCard';

interface SubjectSolverViewProps {
  initialSubject?: string;
  initialQuestion?: string;
  user: any;
  userProfile: any;
  onSaveToNotes?: (title: string, content: string) => void;
}

export const SubjectSolverView: React.FC<SubjectSolverViewProps> = ({
  initialSubject = 'Science',
  initialQuestion = '',
  user,
  userProfile,
  onSaveToNotes
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(initialSubject);
  const activeSubject: SubjectData = ALL_23_SUBJECTS.find(s => s.id === selectedSubjectId || s.name === selectedSubjectId) || ALL_23_SUBJECTS[0];

  const [questionText, setQuestionText] = useState(initialQuestion);
  const [selectedTopic, setSelectedTopic] = useState(activeSubject.topics[0] || 'General');
  const [selectedClass, setSelectedClass] = useState<string>(() => {
    return localStorage.getItem('study_top_pref_class') || userProfile?.grade || 'Class 10';
  });
  const [selectedBoard, setSelectedBoard] = useState<string>(() => {
    return localStorage.getItem('study_top_pref_board') || 'CBSE';
  });
  const [solutionType, setSolutionType] = useState<'detailed' | 'quick' | 'exam_pointwise' | 'conceptual'>('detailed');
  
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [solution, setSolution] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  // Voice Recognition
  const [isListening, setIsListening] = useState(false);

  // Camera Live Capture
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update selected topic whenever the subject changes
  useEffect(() => {
    setSelectedTopic(activeSubject.topics[0] || 'General');
  }, [selectedSubjectId]);

  // If initialQuestion or initialSubject changes from parent
  useEffect(() => {
    if (initialSubject) setSelectedSubjectId(initialSubject);
    if (initialQuestion) setQuestionText(initialQuestion);
  }, [initialSubject, initialQuestion]);

  // Voice Input Speech Recognition
  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = userProfile?.language === 'Hindi' ? 'hi-IN' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuestionText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognition.start();
    } catch (_) {
      setIsListening(false);
    }
  };

  // Camera Controls
  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera error', err);
      alert('Unable to access camera. Please allow camera permissions or upload an image file.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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

  const handleSolve = async (overridePrompt?: string) => {
    const promptToSolve = overridePrompt || questionText;
    if (!promptToSolve.trim() && images.length === 0) {
      setError(`Please type your ${activeSubject.name} question, speak, or upload an image.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/solver/solve-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject.name,
          topic: selectedTopic,
          question: promptToSolve,
          images,
          gradeLevel: `${selectedClass} (${selectedBoard})`,
          language: userProfile?.language || 'English',
          solutionType,
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to solve question.');
      }

      setSolution(data.solution);
    } catch (err: any) {
      console.error('Subject solve error:', err);
      setError(err?.message || 'Error occurred while generating solution.');
    } finally {
      setIsLoading(false);
    }
  };

  // Follow-up Q&A
  const handleAskFollowUp = async (followUp: string) => {
    setIsLoadingAction(true);
    try {
      const res = await fetch('/api/solver/solve-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject.name,
          topic: selectedTopic,
          question: `Regarding the previous question ("${questionText}"), the student asks follow-up: "${followUp}". Please answer clearly.`,
          gradeLevel: `${selectedClass} (${selectedBoard})`,
          language: userProfile?.language || 'English',
          solutionType: 'detailed',
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (data.success && data.solution) {
        setSolution(prev => `${prev}\n\n---\n\n### 💬 Follow-Up Question: *${followUp}*\n\n${data.solution}`);
      }
    } catch (_) {}
    setIsLoadingAction(false);
  };

  // Explain More Simply (ELI5)
  const handleExplainSimply = async () => {
    setIsLoadingAction(true);
    try {
      const res = await fetch('/api/solver/solve-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject.name,
          topic: selectedTopic,
          question: `Explain this ${activeSubject.name} problem in the simplest possible terms (ELI5 style) with an easy everyday analogy:\n\n"${questionText}"`,
          gradeLevel: selectedClass,
          language: userProfile?.language || 'English',
          solutionType: 'conceptual',
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (data.success && data.solution) {
        setSolution(prev => `${prev}\n\n---\n\n### 💡 Simplified Explanation (ELI5)\n\n${data.solution}`);
      }
    } catch (_) {}
    setIsLoadingAction(false);
  };

  // Generate Similar Practice Questions
  const handleGenerateSimilar = async () => {
    setIsLoadingAction(true);
    try {
      const res = await fetch('/api/solver/solve-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject.name,
          topic: selectedTopic,
          question: `Generate 2 new similar practice questions with full step-by-step solutions based on:\n\n"${questionText}"`,
          gradeLevel: `${selectedClass} (${selectedBoard})`,
          language: userProfile?.language || 'English',
          solutionType: 'detailed',
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (data.success && data.solution) {
        setSolution(prev => `${prev}\n\n---\n\n### 📝 Similar Practice Problems & Derivations\n\n${data.solution}`);
      }
    } catch (_) {}
    setIsLoadingAction(false);
  };

  // Translate
  const handleTranslate = async (targetLang: string) => {
    setIsLoadingAction(true);
    try {
      const res = await fetch('/api/solver/solve-subject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: activeSubject.name,
          topic: selectedTopic,
          question: `Translate and present the complete solution for this problem into ${targetLang}:\n\n"${questionText}"`,
          gradeLevel: selectedClass,
          language: targetLang,
          solutionType: 'detailed',
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (data.success && data.solution) {
        setSolution(data.solution);
      }
    } catch (_) {}
    setIsLoadingAction(false);
  };

  // Save to Notes & Solutions
  const handleSave = async () => {
    if (!solution || !user) return;
    try {
      const res = await fetch('/api/solutions/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          title: `${activeSubject.id}: ${questionText ? questionText.slice(0, 35) + '...' : 'Solved Query'}`,
          subject: activeSubject.id,
          question: questionText,
          solution,
          tags: [activeSubject.id, selectedTopic, selectedClass, selectedBoard]
        })
      });
      if (res.ok) {
        setIsSaved(true);
        if (onSaveToNotes) {
          onSaveToNotes(`${activeSubject.id}: ${questionText.slice(0, 30)}`, solution);
        }
      }
    } catch (e) {
      console.error('Save solution error', e);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-20 font-sans">
      {/* ========================================================================= */}
      {/* 1. HORIZONTAL 23-SUBJECT SELECTOR CAROUSEL                                */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {ALL_23_SUBJECTS.map((sub) => {
          const Icon = sub.icon;
          const isSelected = sub.id === selectedSubjectId;
          return (
            <button
              key={sub.id}
              onClick={() => {
                setSelectedSubjectId(sub.id);
                setSolution(null);
                setError(null);
              }}
              className={`px-3.5 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 whitespace-nowrap transition-all shadow-2xs cursor-pointer ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-102 font-black'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{sub.name}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. DYNAMIC SUBJECT BANNER WITH QUICK TOPIC & GRADE PICKER                 */}
      {/* ========================================================================= */}
      <div className={`bg-gradient-to-r ${activeSubject.gradient} rounded-3xl p-6 sm:p-7 text-white shadow-xl`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-white/20 text-[11px] font-bold uppercase tracking-wider">
              <span>{activeSubject.category}</span>
              <span>•</span>
              <span>Study Top AI Solver</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black">
              {activeSubject.name} AI Solver
            </h1>
            <p className="text-white/90 text-xs sm:text-sm font-medium leading-relaxed">
              {activeSubject.description}
            </p>
          </div>

          {/* Quick Academic Settings */}
          <div className="flex flex-wrap items-center gap-2 bg-black/20 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shrink-0">
            <div>
              <span className="block text-[10px] font-bold text-white/70 uppercase">Grade</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-white/20 text-white font-bold text-xs rounded-xl px-2 py-1 outline-none border border-white/20"
              >
                {[6, 7, 8, 9, 10, 11, 12].map(c => (
                  <option key={c} value={`Class ${c}`} className="text-slate-900">Class {c}</option>
                ))}
                <option value="College / Competitive" className="text-slate-900">College / JEE / NEET</option>
              </select>
            </div>

            <div>
              <span className="block text-[10px] font-bold text-white/70 uppercase">Board</span>
              <select
                value={selectedBoard}
                onChange={(e) => setSelectedBoard(e.target.value)}
                className="bg-white/20 text-white font-bold text-xs rounded-xl px-2 py-1 outline-none border border-white/20"
              >
                <option value="CBSE" className="text-slate-900">CBSE</option>
                <option value="ICSE" className="text-slate-900">ICSE</option>
                <option value="State Board" className="text-slate-900">State Board</option>
                <option value="Universal" className="text-slate-900">Universal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Topic Chips */}
        <div className="mt-4 pt-4 border-t border-white/15 flex items-center gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[11px] font-bold text-white/80 shrink-0">Topics:</span>
          {activeSubject.topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedTopic === t
                  ? 'bg-white text-slate-950 font-black shadow-xs'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MULTI-MODAL QUESTION INPUT (Text, Voice, Camera, File Upload)          */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-md space-y-4">
        <div>
          <label className="block text-xs font-black uppercase tracking-wider text-slate-600 mb-2">
            Ask or Upload {activeSubject.name} Question:
          </label>
          <div className="relative">
            <textarea
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder={activeSubject.sampleQuestion || `Type or paste your ${activeSubject.name} question here...`}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-y"
            />
          </div>
        </div>

        {/* Live Camera Viewport */}
        {isCameraActive && (
          <div className="relative bg-black rounded-2xl overflow-hidden border border-slate-800">
            <video ref={videoRef} autoPlay playsInline className="w-full max-h-72 object-cover" />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>Snap Question</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Uploaded Images Preview Strip */}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {images.map((img, idx) => (
              <div key={idx} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-slate-300">
                <img src={img} alt="Question preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-md transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Tools & Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Upload File / PDF */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*,.pdf"
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>Attach Image / PDF</span>
            </button>

            {/* Camera Capture */}
            <button
              type="button"
              onClick={isCameraActive ? stopCamera : startCamera}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isCameraActive
                  ? 'bg-rose-50 border-rose-300 text-rose-700'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isCameraActive ? 'Close Camera' : 'Camera'}</span>
            </button>

            {/* Voice Input */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isListening
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse font-black'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-purple-600" />}
              <span>{isListening ? 'Listening…' : 'Voice'}</span>
            </button>
          </div>

          {/* Solve Submit Button */}
          <button
            type="button"
            onClick={() => handleSolve()}
            disabled={isLoading || (!questionText.trim() && images.length === 0)}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-md shadow-blue-500/20 active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Solving with AI…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Solve {activeSubject.id} Question</span>
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Unable to solve question</p>
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. STANDARDIZED 9-PART ORGANIZED ANSWER CARD                              */}
      {/* ========================================================================= */}
      {solution && (
        <OrganizedAnswerCard
          question={questionText || 'Image / Document Query'}
          subject={activeSubject.name}
          topic={selectedTopic}
          solution={solution}
          isSaved={isSaved}
          onSave={handleSave}
          onAskFollowUp={handleAskFollowUp}
          onExplainSimply={handleExplainSimply}
          onGenerateSimilar={handleGenerateSimilar}
          onTranslate={handleTranslate}
          isLoadingAction={isLoadingAction}
        />
      )}
    </div>
  );
};
