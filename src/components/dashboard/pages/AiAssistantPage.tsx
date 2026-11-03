import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  RotateCw, 
  Paperclip, 
  Bookmark, 
  Download, 
  Trash2, 
  Loader2,
  FileText,
  User,
  Bot
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { executeAiCommand } from '../../../lib/gemini';

interface AiMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AiAssistantPageProps {
  language?: string;
  onSaveToNotes?: (title: string, content: string) => void;
}

export const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
  language = 'English',
  onSaveToNotes
}) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your **Study Top AI Academic Assistant**.\n\nYou can ask me to:\n- Explain complex physics, chemistry, biology, or math concepts step-by-step\n- Solve equations with verified formulas ($E = mc^2$, $\\Delta U = Q - W$)\n- Generate chapter revision summaries and flashcards\n- Critique and format your essays or homework questions\n\nHow can I help your studies today?`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [savedMessageId, setSavedMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice recognition support
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your question.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language === 'Hindi' ? 'hi-IN' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Text to Speech playback
  const handleSpeak = (id: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeakingId === id) {
        window.speechSynthesis.cancel();
        setIsSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#`_$\\]/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.onend = () => setIsSpeakingId(null);
      utterance.onerror = () => setIsSpeakingId(null);
      setIsSpeakingId(id);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || input;
    if (!textToSend.trim() || isLoading) return;

    let finalPrompt = textToSend.trim();
    if (attachedFileName) {
      finalPrompt = `[Attached Context: ${attachedFileName}]\n${finalPrompt}`;
    }

    const userMsg: AiMessage = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: finalPrompt,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setAttachedFileName(null);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.content
      }));

      const res = await executeAiCommand(finalPrompt, history, language);
      const aiReply = res?.reply || 'I processed your question. Let me know if you would like more details!';

      const assistantMsg: AiMessage = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: aiReply,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: 'Sorry, I encountered a temporary connection issue. Please retry your question.',
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

  const handleSaveToNotes = (msg: AiMessage) => {
    if (onSaveToNotes) {
      onSaveToNotes(`Study Top AI Note: ${msg.content.substring(0, 30)}...`, msg.content);
    }
    setSavedMessageId(msg.id);
    setTimeout(() => setSavedMessageId(null), 2500);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachedFileName(file.name);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden font-sans text-slate-900">
      {/* Assistant Header */}
      <div className="px-6 py-4 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>Study Top AI Academic Assistant</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                Active
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Personalized concept explanations, step-by-step problem solver &amp; LaTeX formulas
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            if (confirm('Start a new clean chat session?')) {
              setMessages([messages[0]]);
            }
          }}
          className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/70 transition cursor-pointer"
          title="Clear Conversation"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-3xl ${m.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
          >
            {m.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-4 sm:p-5 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs shadow-sm max-w-lg'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs w-full'
              }`}
            >
              <div className="prose prose-slate max-w-none text-xs sm:text-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {m.content}
                </ReactMarkdown>
              </div>

              {/* Message Action Footer for Assistant Replies */}
              {m.role === 'assistant' && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSpeak(m.id, m.content)}
                      className={`p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer ${
                        isSpeakingId === m.id ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:text-slate-700'
                      }`}
                      title={isSpeakingId === m.id ? 'Stop audio' : 'Listen with Speech'}
                    >
                      {isSpeakingId === m.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => handleSaveToNotes(m)}
                      className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 transition cursor-pointer"
                      title="Save to Notes repository"
                    >
                      {savedMessageId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Bookmark className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {m.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 mt-1 shadow-2xs">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto items-center">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-600 shadow-2xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span>Analyzing sources and formulating explanation...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Footer */}
      <div className="p-4 bg-white border-t border-slate-200 shrink-0 space-y-2">
        {attachedFileName && (
          <div className="flex items-center justify-between px-3 py-1 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-700 font-bold max-w-sm">
            <span className="truncate">Attached: {attachedFileName}</span>
            <button onClick={() => setAttachedFileName(null)} className="text-blue-500 hover:text-blue-800 ml-2">
              ×
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {/* File attachment button */}
          <label className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0">
            <Paperclip className="w-4 h-4" />
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt,image/*" />
          </label>

          {/* Voice Input button */}
          <button
            onClick={handleToggleVoiceInput}
            className={`p-2.5 rounded-xl border transition cursor-pointer shrink-0 ${
              isListening 
                ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse' 
                : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800'
            }`}
            title={isListening ? 'Listening...' : 'Voice Dictation'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask any question, formula, or concept explanation (e.g., Explain Doppler Effect)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-40 shadow-xs"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
