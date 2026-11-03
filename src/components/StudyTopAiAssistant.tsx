import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Mic, 
  MicOff, 
  Send, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCw, 
  Copy, 
  Check, 
  BookOpen, 
  ListPlus, 
  Settings, 
  StopCircle,
  MessageSquare,
  Sparkle,
  Zap,
  HelpCircle,
  Flame,
  ArrowRight,
  History,
  PlusCircle,
  Clock,
  Trash2,
  ChevronLeft,
  ArrowLeft
} from 'lucide-react';
import { VoiceOrb3D, AssistantState } from './VoiceOrb3D';
import { AudioWaveform } from './AudioWaveform';
import { executeAiCommand } from '../lib/gemini';
import { Note } from '../types';
import { StudyTopLogo } from './StudyTopLogo';
import { auth, db } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface SavedChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

interface StudyTopAiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  language?: string;
  activeNote?: Note | null;
  onAppendToNote?: (text: string) => void;
  onCreateNoteFromAi?: (note: { title: string; content: string }) => void;
}

export const StudyTopAiAssistant: React.FC<StudyTopAiAssistantProps> = ({
  isOpen,
  onClose,
  language = 'English',
  activeNote,
  onAppendToNote,
  onCreateNoteFromAi
}) => {
  const [sessionId, setSessionId] = useState<string>(() => 'chat_' + Date.now());
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: activeNote 
        ? `Hi! I'm Study Top AI. I can see your note "${activeNote.title}". Want me to explain it step-by-step, generate practice questions, or synthesize quick revision notes? All our voice talks & chats are securely saved!`
        : `Hi! I'm Study Top AI, your friendly learning companion. What concept, formula, or exam topic would you like to explore today? Speak or type anytime!`,
      timestamp: Date.now()
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedSessions, setSavedSessions] = useState<SavedChatSession[]>([]);
  const [micError, setMicError] = useState<string | null>(null);
  const [isOrbExpanded, setIsOrbExpanded] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user's saved voice & chat sessions from Firestore
  const loadSavedSessions = async () => {
    if (!auth.currentUser) return;
    try {
      const q = query(
        collection(db, 'users', auth.currentUser.uid, 'aiChats'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      const snap = await getDocs(q);
      const list: SavedChatSession[] = [];
      snap.forEach(d => {
        list.push(d.data() as SavedChatSession);
      });
      setSavedSessions(list);
    } catch (e) {
      console.warn('Could not load saved AI sessions:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSavedSessions();
    }
  }, [isOpen]);

  // Handle ESC key to easily back out
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        stopVoice();
        stopSpeaking();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Initialize SpeechSynthesis Voices with strict deduplication
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const rawVoices = window.speechSynthesis.getVoices();
        const seen = new Set<string>();
        const uniqueVoices: SpeechSynthesisVoice[] = [];
        for (const voice of rawVoices) {
          const id = `${voice.voiceURI || ''}_${voice.name}_${voice.lang}`;
          if (!seen.has(id) && !seen.has(voice.name)) {
            seen.add(id);
            seen.add(voice.name);
            uniqueVoices.push(voice);
          }
        }
        const finalVoices = uniqueVoices.length > 0 ? uniqueVoices : rawVoices;
        setAvailableVoices(finalVoices);
        if (finalVoices.length > 0 && !selectedVoice) {
          const preferred = finalVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google'))) || finalVoices[0];
          setSelectedVoice(preferred.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Initialize SpeechRecognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language === 'Hindi' ? 'hi-IN' : 'en-US';

        recognition.onstart = () => {
          isListeningRef.current = true;
          setAssistantState('listening');
          setMicError(null);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const finalTranscript = event.results[i][0].transcript.trim();
              if (finalTranscript) {
                setLiveTranscript(finalTranscript);
                handleSendQuery(finalTranscript, true);
              }
            } else {
              currentInterim += event.results[i][0].transcript;
            }
          }
          if (currentInterim) {
            setLiveTranscript(currentInterim);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('Speech recognition error:', event.error);
          if (event.error === 'not-allowed') {
            setMicError('Microphone permission denied. Please allow microphone access in your browser settings.');
          } else if (event.error !== 'no-speech') {
            setMicError(`Voice input: ${event.error}`);
          }
          setAssistantState('idle');
          isListeningRef.current = false;
        };

        recognition.onend = () => {
          isListeningRef.current = false;
          if (assistantState === 'listening') {
            setAssistantState('idle');
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      stopVoice();
      stopSpeaking();
    };
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, assistantState]);

  // Stop speech synthesis (Interruption)
  const stopSpeaking = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (assistantState === 'speaking') {
      setAssistantState('idle');
    }
  };

  // Start voice listening
  const startVoice = () => {
    stopSpeaking();
    setMicError(null);
    setLiveTranscript('');
    if (!recognitionRef.current) {
      setMicError('Speech recognition is not supported in this browser. You can type in the chat box!');
      return;
    }
    try {
      recognitionRef.current.start();
    } catch (_) {
      recognitionRef.current.stop();
      setTimeout(() => {
        try { recognitionRef.current.start(); } catch (e) {}
      }, 150);
    }
  };

  // Stop voice listening
  const stopVoice = () => {
    if (recognitionRef.current && isListeningRef.current) {
      recognitionRef.current.stop();
    }
    isListeningRef.current = false;
    if (assistantState === 'listening') {
      setAssistantState('idle');
    }
  };

  // Toggle voice listening
  const toggleVoice = () => {
    if (assistantState === 'speaking') {
      stopSpeaking();
      startVoice();
      return;
    }
    if (assistantState === 'listening') {
      stopVoice();
    } else {
      startVoice();
    }
  };

  // Speak AI response with Web Speech API
  const speakText = (text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    stopSpeaking();
    const cleanSpeech = text
      .replace(/[*#_`~>[\]]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanSpeech) return;

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = speechRate;
    
    if (selectedVoice) {
      const voiceObj = availableVoices.find(v => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }

    utterance.onstart = () => {
      setAssistantState('speaking');
    };

    utterance.onend = () => {
      setAssistantState('idle');
    };

    utterance.onerror = () => {
      setAssistantState('idle');
    };

    window.speechSynthesis.speak(utterance);
  };

  // Send query to Gemini AI & PERMANENTLY STORE IN FIRESTORE + SERVER VAULT
  const handleSendQuery = async (queryText: string, isVoiceInput = false) => {
    const text = queryText.trim();
    if (!text) return;

    stopVoice();
    stopSpeaking();

    const userMessage: Message = {
      id: 'usr_' + Date.now() + Math.random().toString(36).substring(2, 5),
      role: 'user',
      content: text,
      timestamp: Date.now()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInputPrompt('');
    setLiveTranscript('');
    setAssistantState('processing');

    // Build context with active note if present
    const contextPrompt = activeNote
      ? `[CONTEXT: The student is viewing their note titled "${activeNote.title}". Note content: "${activeNote.content.slice(0, 3000)}"]\nStudent question: ${text}`
      : text;

    const historyForAi = nextMessages.slice(-6).map(m => ({
      role: (m.role === 'user' ? 'user' : 'model') as 'user' | 'model',
      text: m.content
    }));

    const systemPersona = `You are Study Top AI, a friendly, encouraging, highly intelligent study companion created for students by Manjit Ranjan.
- Explain concepts step by step in simple, intuitive language with memorable real-life analogies.
- Adapt to the student's language preference (${language}). If they speak Hindi or Hinglish, answer naturally in Hindi or friendly Hinglish.
- If asked for notes, flashcards, or practice questions, format them with crisp bullet points, definitions, and bold key terms.
- Be supportive, warm, and concise by default, offering deeper explanations if asked.`;

    try {
      const response = await executeAiCommand(contextPrompt, historyForAi, language, systemPersona);
      const reply = response.reply || "I'm right here with you! Could you ask that again?";

      const assistantMessage: Message = {
        id: 'ast_' + Date.now() + Math.random().toString(36).substring(2, 5),
        role: 'assistant',
        content: reply,
        timestamp: Date.now()
      };

      const finalMessages = [...nextMessages, assistantMessage];
      setMessages(finalMessages);
      setAssistantState('speaking');
      speakText(reply);

      // =========================================================================
      // DATA STORAGE: PERMANENTLY PERSIST VOICE & CHAT TALKS
      // =========================================================================
      const currentUid = auth.currentUser?.uid;
      const currentEmail = auth.currentUser?.email || 'anonymous@study-top.local';

      // 1. Record in backend server storage vault
      fetch('/api/voice-chat/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUid || 'anonymous',
          userEmail: currentEmail,
          mode: isVoiceInput ? 'voice' : 'chat',
          prompt: text,
          reply: reply,
          tokensEstimate: Math.ceil((text.length + reply.length) / 4)
        })
      }).catch(() => {});

      // 2. Persist session in Firestore under /users/{uid}/aiChats/{sessionId}
      if (currentUid) {
        const chatDocRef = doc(db, 'users', currentUid, 'aiChats', sessionId);
        setDoc(chatDocRef, {
          id: sessionId,
          userId: currentUid,
          title: text.slice(0, 60),
          messages: finalMessages.slice(-40),
          mode: isVoiceInput ? 'voice' : 'chat',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }, { merge: true }).catch(err => console.warn('Firestore aiChat save error:', err));
      }

    } catch (err: any) {
      console.error('Study Top AI Error:', err);
      const fallbackReply = "I encountered a brief connection issue. Please feel free to try asking again!";
      setMessages(prev => [...prev, {
        id: 'ast_err_' + Date.now() + Math.random().toString(36).substring(2, 5),
        role: 'assistant',
        content: fallbackReply,
        timestamp: Date.now()
      }]);
      setAssistantState('idle');
    }
  };

  // Start fresh study session
  const handleStartNewSession = () => {
    stopVoice();
    stopSpeaking();
    const newId = 'chat_' + Date.now();
    setSessionId(newId);
    setMessages([
      {
        id: 'welcome_' + Date.now(),
        role: 'assistant',
        content: `Started a fresh talk! What concept or topic would you like to explore now?`,
        timestamp: Date.now()
      }
    ]);
    setShowHistory(false);
  };

  // Resume past saved session
  const handleLoadSession = (session: SavedChatSession) => {
    stopVoice();
    stopSpeaking();
    setSessionId(session.id);
    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages);
    }
    setShowHistory(false);
  };

  // Delete past saved session
  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, 'users', auth.currentUser.uid, 'aiChats', sid));
      setSavedSessions(prev => prev.filter(s => s.id !== sid));
    } catch (err) {
      console.warn('Could not delete session:', err);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            stopVoice();
            stopSpeaking();
            onClose();
          }
        }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-2 sm:p-4 font-sans"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white rounded-[28px] sm:rounded-[36px] w-full max-w-3xl h-[94dvh] sm:h-[88vh] shadow-2xl border border-white flex flex-col overflow-hidden relative"
        >
          {/* ========================================================= */}
          {/* 1. TOP HEADER BAR                                          */}
          {/* ========================================================= */}
          <div className="px-3 sm:px-6 py-3.5 border-b border-slate-100 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              {/* PROMINENT BACK BUTTON: Always enables user to back out from AI Chat! */}
              <button
                type="button"
                onClick={() => {
                  stopVoice();
                  stopSpeaking();
                  onClose();
                }}
                className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200 shadow-2xs"
                title="Back to Notebooks / Exit AI Chat"
              >
                <ChevronLeft className="w-4 h-4 text-slate-800 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="shrink-0 flex items-center justify-center">
                <StudyTopLogo size="sm" variant="icon" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight truncate">
                    Study Top AI
                  </h2>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200/60 shrink-0 hidden xs:flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live Voice & Chat
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                  {activeNote ? `Context: ${activeNote.title}` : 'Voice talks & chats stored permanently'}
                </p>
              </div>
            </div>

            {/* Quick Header Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Saved Voice & Chat Talks History Drawer Toggle */}
              <button
                type="button"
                onClick={() => {
                  loadSavedSessions();
                  setShowHistory(!showHistory);
                }}
                className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  showHistory 
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Saved Voice & Chat Talks"
              >
                <History className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden sm:inline">Saved Talks</span>
              </button>

              {/* Mute Audio Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isMuted) stopSpeaking();
                  setIsMuted(!isMuted);
                }}
                className={`p-2 rounded-xl border transition-all ${
                  isMuted 
                    ? 'bg-rose-50 border-rose-200 text-rose-600' 
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title={isMuted ? 'Voice Muted (Click to enable)' : 'Voice Sound On'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Voice & Speech Settings Toggle */}
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-xl border transition-all ${
                  showSettings ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
                title="Voice Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => {
                  stopVoice();
                  stopSpeaking();
                  onClose();
                }}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                title="Close Assistant"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* SAVED TALKS & CHATS DRAWER (Persistent Storage Access)    */}
          {/* ========================================================= */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-indigo-950/95 text-white p-4 border-b border-indigo-900/60 overflow-hidden shrink-0 z-20 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-cyan-200">
                      Your Stored Voice &amp; Chat Talks ({savedSessions.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartNewSession}
                    className="py-1 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>New Talk</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {savedSessions.map((s, idx) => (
                    <div
                      key={`session-${s.id || idx}-${idx}`}
                      onClick={() => handleLoadSession(s)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                        sessionId === s.id
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-100'
                          : 'bg-indigo-900/40 hover:bg-indigo-900/70 border-indigo-800/60 text-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">"{s.title || 'Study Session'}"</p>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(s.updatedAt || s.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer shrink-0"
                        title="Delete Stored Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  {savedSessions.length === 0 && (
                    <div className="col-span-2 text-center py-4 text-xs text-slate-400">
                      No saved study conversations yet. Any voice talk or question you ask will automatically be saved here!
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================= */}
          {/* VOICE SETTINGS COLLAPSIBLE DRAWER                         */}
          {/* ========================================================= */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 py-3 bg-slate-50 border-b border-slate-200/80 text-xs overflow-hidden shrink-0 space-y-2 z-10"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Speech Rate:</span>
                    <input
                      type="range"
                      min="0.75"
                      max="1.5"
                      step="0.05"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-24 accent-blue-600 cursor-pointer"
                    />
                    <span className="font-mono text-slate-500 font-bold">{speechRate}x</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-600">Voice:</span>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none max-w-[200px] truncate"
                    >
                      {availableVoices.map((v, idx) => (
                        <option key={`${v.voiceURI || v.name}_${v.lang}_${idx}`} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================= */}
          {/* 3. UNIFIED HERO LIVE VOICE HUB (Orb + Waveform + Mic)     */}
          {/* ========================================================= */}
          <div className="shrink-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-3.5 border-b border-indigo-900/60 shadow-inner relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute -top-12 left-1/4 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 right-1/4 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Mic Error Banner */}
            {micError && (
              <div className="mb-2 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-center justify-between">
                <span>{micError}</span>
                <button type="button" onClick={() => setMicError(null)} className="underline text-xs ml-2 cursor-pointer">Dismiss</button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 relative z-10">
              {/* Left: 3D Reactive Voice Orb + Waveform */}
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div 
                  onClick={() => setIsOrbExpanded(!isOrbExpanded)}
                  className="cursor-pointer hover:scale-105 transition-transform shrink-0"
                  title="Click to toggle orb size"
                >
                  <VoiceOrb3D state={assistantState} size={isOrbExpanded ? "md" : "sm"} />
                </div>

                <div className="min-w-0">
                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mb-1">
                    {assistantState === 'listening' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 font-black text-[11px] animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                        Listening...
                      </span>
                    ) : assistantState === 'processing' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-400/40 text-violet-300 font-black text-[11px] animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                        Thinking & Reasoning...
                      </span>
                    ) : assistantState === 'speaking' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-black text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                        Speaking Aloud...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 font-bold text-[11px]">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        Live Voice Ready
                      </span>
                    )}
                  </div>

                  {/* Audio Waveform */}
                  <div className="flex items-center gap-2">
                    <AudioWaveform 
                      isActive={assistantState === 'listening' || assistantState === 'speaking'} 
                      mode={assistantState === 'listening' ? 'listening' : 'speaking'}
                      barCount={16}
                    />
                  </div>

                  {/* Live transcript or status line */}
                  <div className="mt-1">
                    {liveTranscript ? (
                      <p className="text-xs text-cyan-200 font-semibold truncate max-w-[220px] sm:max-w-md italic">
                        "{liveTranscript}"
                      </p>
                    ) : assistantState === 'speaking' ? (
                      <p className="text-[11px] text-blue-200/90 font-medium truncate max-w-[220px] sm:max-w-md">
                        {messages[messages.length - 1]?.content.slice(0, 90)}...
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                        Tap microphone to speak, or type in chat below
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Live Voice Action Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Interrupt / Stop Speaking Button */}
                {assistantState === 'speaking' && (
                  <button
                    type="button"
                    onClick={stopSpeaking}
                    className="py-2 px-3 sm:px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                )}

                {/* Primary Voice Mic Button */}
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg active:scale-95 transition-all cursor-pointer ${
                    assistantState === 'listening'
                      ? 'bg-rose-500 text-white shadow-rose-500/40 ring-4 ring-rose-400/40 animate-pulse'
                      : 'bg-gradient-to-tr from-cyan-400 via-blue-600 to-indigo-600 text-white shadow-blue-500/30 hover:scale-105'
                  }`}
                  title={assistantState === 'listening' ? 'Tap to stop listening' : 'Tap to speak with live voice'}
                >
                  {assistantState === 'listening' ? (
                    <MicOff className="w-6 h-6" />
                  ) : (
                    <Mic className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. CONVERSATIONAL CHAT STREAM (Same Screen!)              */}
          {/* ========================================================= */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/60 custom-scrollbar">
            {messages.map((msg, idx) => (
              <motion.div
                key={`ast-msg-${msg.id || idx}-${idx}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] sm:max-w-[80%] rounded-[24px] p-4 text-xs sm:text-sm font-medium leading-relaxed shadow-xs ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Action buttons on AI response */}
                  {msg.role === 'assistant' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold text-slate-500">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => speakText(msg.content)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Listen aloud"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-blue-600" />
                          <span>Listen</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="flex items-center gap-1 hover:text-blue-600 transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>

                      {/* Append to note or Save note */}
                      <div className="flex items-center gap-2">
                        {onAppendToNote && activeNote && (
                          <button
                            type="button"
                            onClick={() => onAppendToNote(`\n\n### Study Top AI Summary\n${msg.content}`)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-black"
                          >
                            <ListPlus className="w-3.5 h-3.5" />
                            <span>Add to note</span>
                          </button>
                        )}
                        {onCreateNoteFromAi && (
                          <button
                            type="button"
                            onClick={() => onCreateNoteFromAi({
                              title: 'AI Note · ' + new Date().toLocaleDateString(),
                              content: msg.content
                            })}
                            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer font-black"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>Save as note</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {/* Thinking / Processing State Bubble */}
            {assistantState === 'processing' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start"
              >
                <div className="bg-white border border-indigo-100 rounded-[24px] rounded-tl-xs p-4 shadow-sm flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <span className="text-xs font-bold text-slate-600">
                    Study Top AI is synthesizing your explanation...
                  </span>
                </div>
              </motion.div>
            )}

            <div ref={chatScrollRef} />
          </div>

          {/* ========================================================= */}
          {/* 5. BOTTOM UNIFIED CHAT & VOICE INPUT BAR                  */}
          {/* ========================================================= */}
          <div className="p-3 sm:p-4 bg-white border-t border-slate-200/80 shrink-0 space-y-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            {/* Quick Topic Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              {[
                "Explain step-by-step",
                "Generate 3 practice MCQs",
                "Summarize key definitions",
                "Explain in Hindi / Hinglish",
                "Give real-life examples"
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleSendQuery(chip, false)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer active:scale-95"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Form with Direction & Bidirectional Plaintext Hardening */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuery(inputPrompt, false);
              }}
              className="flex items-center gap-2"
            >
              {/* Mic shortcut in chat bar */}
              <button
                type="button"
                onClick={toggleVoice}
                className={`p-3 rounded-2xl transition-all cursor-pointer shrink-0 ${
                  assistantState === 'listening'
                    ? 'bg-rose-50 text-rose-600 border border-rose-300 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
                title="Tap to speak"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Chat Input: Protected against text scrambling / jumping to opposite side */}
              <input
                ref={inputRef}
                type="text"
                dir="auto"
                style={{ unicodeBidi: 'plaintext', textAlign: 'start' }}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={inputPrompt}
                onFocus={() => {
                  if (assistantState === 'listening') {
                    stopVoice();
                  }
                }}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder={activeNote ? `Ask about "${activeNote.title}" or speak...` : "Ask any study question, topic, or concept..."}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 transition-all placeholder:text-slate-400 text-left"
              />

              {/* Send Button */}
              <button
                type="submit"
                disabled={!inputPrompt.trim() || assistantState === 'processing'}
                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold shadow-md shadow-blue-500/25 active:scale-95 disabled:opacity-40 transition-all cursor-pointer shrink-0"
                title="Send query"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
