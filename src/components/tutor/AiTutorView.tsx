import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Lightbulb, 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  CheckCircle2, 
  BookOpen, 
  Loader2, 
  User, 
  Copy, 
  Check,
  ChevronDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface AiTutorViewProps {
  user: any;
  userProfile: any;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export const AiTutorView: React.FC<AiTutorViewProps> = ({ user, userProfile }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **Study Top AI Tutor**, created by Manjit Ranjan (Google Developer).

I'm here to help you truly understand difficult concepts in Mathematics, Science, English, Social Science, Coding, and more. 

💡 **How can I help you today?**
- Ask me to explain any difficult concept step-by-step
- Turn on **Hint Mode** if you want clues rather than direct answers
- Switch your learning level between *Very Easy*, *Beginner*, *Intermediate*, or *Exam Prep*
- Or ask me: *"Test me on Newton's laws with a practice problem!"*`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [level, setLevel] = useState<'very_easy' | 'beginner' | 'intermediate' | 'advanced' | 'exam_prep'>('intermediate');
  const [hintMode, setHintMode] = useState(false);
  const [subject, setSubject] = useState('General Academic');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Web Speech API Voice Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = userProfile?.language?.toLowerCase().includes('hindi') ? 'hi-IN' : 'en-US';

      recognition.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [userProfile?.language]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Mic start error', err);
      }
    }
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Strip markdown formatting for cleaner speech
    const cleanText = text.replace(/[*_#`[\]()$]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customMessage) setInput('');
    setIsLoading(true);

    try {
      // Build history
      const history = messages.slice(-8).map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }]
      }));

      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history,
          subject,
          level,
          hintMode,
          language: userProfile?.language || 'English',
          uid: user?.uid
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch response');
      }

      const assistantMsg: ChatMessage = {
        id: 'msg_' + Date.now(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Tutor chat error', err);
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: 'I encountered a brief connection issue. Please click retry or ask again!',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-4 pb-16 flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
      {/* Top Banner / Controls */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 md:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Study Top AI Tutor</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                100% Free
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Interactive school teacher & mentor • Explanations, hints, and Socratic learning
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Level Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Level:</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="very_easy">Very Easy (Class 6-8)</option>
              <option value="beginner">Beginner (Class 9-10)</option>
              <option value="intermediate">Intermediate (Class 11-12)</option>
              <option value="advanced">Advanced (College/Degree)</option>
              <option value="exam_prep">Exam Prep (Competitive)</option>
            </select>
          </div>

          {/* Hint Mode Toggle */}
          <button
            type="button"
            onClick={() => setHintMode(!hintMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
              hintMode
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Lightbulb className={`w-3.5 h-3.5 ${hintMode ? 'text-white' : 'text-amber-500'}`} />
            Hint Mode: {hintMode ? 'ON' : 'OFF'}
          </button>

          {/* Reset Chat */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear conversation history?')) {
                setMessages([messages[0]]);
              }
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            title="Reset Chat"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Quick Ask:
        </span>
        {[
          "Explain photosynthesis simply with an analogy",
          "How does binary search work in computer science?",
          "Give me a hint for solving quadratic equations",
          "Give me a practice question on trigonometry",
          "What were the key causes of World War 1?"
        ].map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSend(prompt)}
            className="px-3 py-1 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-full text-xs font-medium text-slate-600 whitespace-nowrap transition-all shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-4 md:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-50 border border-slate-100 text-slate-800 rounded-bl-none shadow-2xs'
                }`}
              >
                {!isUser ? (
                  <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed prose-headings:font-bold prose-headings:text-slate-900 prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-xl">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {m.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}

                {!isUser && (
                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-200/60 text-xs text-slate-400">
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-slate-700 flex items-center gap-1 transition-all"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === m.id ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => speakText(m.content)}
                      className="hover:text-slate-700 flex items-center gap-1 transition-all"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      Listen
                    </button>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 animate-pulse">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-medium text-slate-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              Tutor is crafting your explanation...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-sm flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={toggleMic}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-red-500 text-white animate-pulse'
              : 'hover:bg-slate-100 text-slate-500'
          }`}
          title="Voice Input"
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={hintMode ? "Ask for a hint or tell the tutor what you think the next step is..." : "Ask your teacher anything about any subject or topic..."}
          className="flex-1 px-2 py-2 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent focus:outline-none"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          Ask Tutor
        </button>
      </div>
    </div>
  );
};
