import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Volume2,
  VolumeX,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Paperclip,
  Camera,
  Mic,
  MicOff,
  Square,
  Search,
  BookOpen,
  Calculator,
  FlaskConical,
  Wand2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Download,
  FileText,
  Image as ImageIcon,
  X,
  FileUp,
  Pin,
  Archive,
  Edit2,
  ArrowDown,
  Settings,
  HelpCircle,
  Clock,
  Sparkle,
  GraduationCap,
  Layers,
  Code2,
  FileSpreadsheet
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { mindClient } from '../../lib/mindClient';
import jsPDF from 'jspdf';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  mode?: string;
  toolUsed?: string;
  feedback?: 'like' | 'dislike' | null;
  files?: { name: string; type: string; size: string }[];
  isStreaming?: boolean;
}

export interface ConversationSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isArchived?: boolean;
  mode: string;
  messages: ChatMessage[];
}

export type ResponseMode =
  | 'quick'
  | 'detailed'
  | 'step-by-step'
  | 'exam'
  | 'research'
  | 'simple'
  | 'professional';

const RESPONSE_MODES: { id: ResponseMode; label: string; desc: string }[] = [
  { id: 'detailed', label: 'Detailed Explanation', desc: 'In-depth academic concepts & examples' },
  { id: 'quick', label: 'Quick Answer', desc: 'Fast, crisp bullet points' },
  { id: 'step-by-step', label: 'Step-by-Step Learning', desc: 'Numbered derivation & problem solving' },
  { id: 'exam', label: 'Exam Preparation', desc: 'High-yield points, keywords & marking tips' },
  { id: 'research', label: 'Research Mode', desc: 'Academic literature & theoretical rigor' },
  { id: 'simple', label: 'Simple Language', desc: 'Easy metaphors for fast comprehension' },
  { id: 'professional', label: 'Professional Answer', desc: 'Scholarly, formal educator tone' }
];

const SUGGESTED_PROMPTS = [
  {
    icon: Sparkles,
    color: 'text-amber-500 bg-amber-50 border-amber-200',
    title: 'Explain a difficult topic',
    desc: 'Break down complex concepts with intuitive everyday analogies',
    prompt: 'Explain the principle of Quantum Superposition in simple terms with everyday analogies.'
  },
  {
    icon: Calculator,
    color: 'text-blue-500 bg-blue-50 border-blue-200',
    title: 'Solve a mathematics problem',
    desc: 'Step-by-step algebraic derivation with formulas and reasoning',
    prompt: 'Solve the integral \\int x \\sin(x) dx step-by-step using integration by parts with every intermediate step explained.'
  },
  {
    icon: FileText,
    color: 'text-purple-500 bg-purple-50 border-purple-200',
    title: 'Make notes from a topic',
    desc: 'Structured point-wise summary, definitions & formulas',
    prompt: 'Create high-yield, point-wise study notes for Thermodynamics with primary laws, state functions, and formulas.'
  },
  {
    icon: BookOpen,
    color: 'text-emerald-500 bg-emerald-50 border-emerald-200',
    title: 'Summarize a chapter',
    desc: 'Crisp chapter overview, historical context & impact',
    prompt: 'Provide a structured summary of The French Revolution including causes, key milestones timeline, and long-term consequences.'
  },
  {
    icon: GraduationCap,
    color: 'text-indigo-500 bg-indigo-50 border-indigo-200',
    title: 'Prepare for an examination',
    desc: 'High-frequency exam checklist & top 5 model questions',
    prompt: 'Generate an Exam Revision Checklist and 5 high-frequency questions for Class 10 Science: Chemical Reactions & Equations.'
  },
  {
    icon: HelpCircle,
    color: 'text-rose-500 bg-rose-50 border-rose-200',
    title: 'Generate practice questions',
    desc: 'Challenging multiple choice questions with explanations',
    prompt: 'Generate 4 challenging multiple-choice questions (MCQs) on Cell Division (Mitosis vs Meiosis) with marked answers and explanations.'
  },
  {
    icon: ImageIcon,
    color: 'text-cyan-500 bg-cyan-50 border-cyan-200',
    title: 'Explain scientific diagrams',
    desc: 'Understand diagrams, pathways, and visual systems',
    prompt: 'Explain the visual structure of the Human Nephron and illustrate the filtration pathway using a Mermaid diagram.'
  },
  {
    icon: Layers,
    color: 'text-teal-500 bg-teal-50 border-teal-200',
    title: 'Research an academic topic',
    desc: 'Deep theoretical background & scientific consensus',
    prompt: 'Provide an in-depth academic research briefing on CRISPR-Cas9 gene editing, its biochemical mechanism, and current therapeutic trials.'
  }
];

const STUDY_TOOLS_CATALOG = [
  {
    category: 'Study Tools',
    icon: BookOpen,
    color: 'text-blue-600',
    items: [
      { name: 'AI Notes Maker', prompt: 'Create complete point-wise revision notes on: ' },
      { name: 'Chapter Summarizer', prompt: 'Summarize this chapter into high-yield takeaways: ' },
      { name: 'Question Answer Generator', prompt: 'Generate 5 high-yield exam questions with model answers for: ' },
      { name: 'MCQ Generator', prompt: 'Create 5 multiple choice questions with explanations for: ' },
      { name: 'Flashcard Generator', prompt: 'Create 6 front-and-back study flashcards for: ' },
      { name: 'Exam Prep Assistant', prompt: 'Create an exam revision checklist and high-scoring tips for: ' },
      { name: 'Homework Helper', prompt: 'Help me understand and solve this homework problem: ' },
      { name: 'Essay Writer', prompt: 'Draft a well-structured academic essay with an introduction, thesis, and evidence on: ' },
      { name: 'Grammar Checker', prompt: 'Check the grammar, tone, and sentence structure of this text: ' },
      { name: 'Translation Assistant', prompt: 'Translate and explain the academic terms in this text: ' },
      { name: 'Dictionary & Vocabulary', prompt: 'Provide definitions, etymology, phonetic pronunciation, and example sentences for: ' }
    ]
  },
  {
    category: 'Mathematics Tools',
    icon: Calculator,
    color: 'text-emerald-600',
    items: [
      { name: 'Step-by-step Math Solver', prompt: 'Solve this mathematical problem step by step with full derivations: ' },
      { name: 'Algebra Solver', prompt: 'Solve and factor this algebraic equation step by step: ' },
      { name: 'Geometry Solver', prompt: 'Calculate the geometric properties, theorems, and proofs for: ' },
      { name: 'Trigonometry Solver', prompt: 'Prove the identity or evaluate the trigonometric function: ' },
      { name: 'Calculus Solver', prompt: 'Evaluate this derivative/integral showing every step: ' },
      { name: 'Equation Solver', prompt: 'Find all real and complex solutions for this equation: ' },
      { name: 'Graph Explanation', prompt: 'Explain the behavior, intercepts, asymptotes, and shape of this function: ' }
    ]
  },
  {
    category: 'Science Tools',
    icon: FlaskConical,
    color: 'text-purple-600',
    items: [
      { name: 'Physics Problem Solver', prompt: 'Solve this physics problem stating laws, formula, SI units, and calculations: ' },
      { name: 'Chemistry Equation Balancer', prompt: 'Balance this chemical equation, state reaction conditions, and describe the mechanism: ' },
      { name: 'Biology Explainer', prompt: 'Explain this biological process, terminology, and significance: ' },
      { name: 'Scientific Diagram Generator', prompt: 'Generate a Mermaid flowchart diagram depicting the process of: ' },
      { name: 'Formula Explainer', prompt: 'Derive and explain the variables, units, and applications of this formula: ' }
    ]
  },
  {
    category: 'Advanced AI Tools',
    icon: Wand2,
    color: 'text-indigo-600',
    items: [
      { name: 'Deep Research', prompt: 'Conduct deep academic research on this topic with theoretical context: ' },
      { name: 'Document Analysis', prompt: 'Analyze this uploaded document, extract key facts, and identify important themes: ' },
      { name: 'Code Assistant', prompt: 'Write and explain clean, well-commented code in Python/JavaScript for: ' },
      { name: 'Table Generator', prompt: 'Create a structured comparative table comparing: ' }
    ]
  }
];

export const DedicatedAiChatView: React.FC<{
  userProfile?: any;
  onNavigateToNotes?: (content?: string, title?: string) => void;
  onNavigateToMath?: (problem?: string) => void;
}> = ({ userProfile, onNavigateToNotes, onNavigateToMath }) => {
  // Sessions & Active Conversation
  const [sessions, setSessions] = useState<ConversationSession[]>(() => {
    try {
      const saved = localStorage.getItem('studytop_ai_conversations_v2');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'session_default',
        title: 'New Conversation',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode: 'detailed',
        messages: []
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'session_default';
  });

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession?.messages || [];

  // UI States
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMode, setSelectedMode] = useState<ResponseMode>('detailed');
  const [toolsMenuOpen, setToolsMenuOpen] = useState(false);
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // File Upload State
  const [uploadedFiles, setUploadedFiles] = useState<{
    name: string;
    type: string;
    size: string;
    textContent?: string;
    base64?: string;
    mimeType?: string;
  }[]>([]);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Voice Speech Recognition & Synthesis
  const [isListening, setIsListening] = useState(false);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Save sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('studytop_ai_conversations_v2', JSON.stringify(sessions));
    } catch (e) {
      console.warn('Storage limit reached for chat history');
    }
  }, [sessions]);

  // Auto-scroll logic
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, isLoading]);

  // Handle scroll detection for Scroll to Bottom button
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollBottom(true);
    } else {
      setShowScrollBottom(false);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  // Speech Recognition Setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
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
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please try Google Chrome or Safari.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  // Text-to-Speech Read Aloud
  const handleReadAloud = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (activeSpeakingId === msgId) {
      window.speechSynthesis.cancel();
      setActiveSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#`$\\]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setActiveSpeakingId(null);
    utterance.onerror = () => setActiveSpeakingId(null);

    setActiveSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // File Upload Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFile(true);
    const newFiles: typeof uploadedFiles = [];

    Array.from(files).forEach(file => {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const isImage = file.type.startsWith('image/');

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedFiles(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type,
              size: `${sizeMB} MB`,
              base64: (reader.result as string).split(',')[1],
              mimeType: file.type
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = () => {
          setUploadedFiles(prev => [
            ...prev,
            {
              name: file.name,
              type: file.type || 'text/plain',
              size: `${sizeMB} MB`,
              textContent: reader.result as string
            }
          ]);
        };
        reader.readAsText(file);
      }
    });

    setIsProcessingFile(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Session Management
  const handleNewChat = () => {
    const newSession: ConversationSession = {
      id: `session_${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mode: selectedMode,
      messages: []
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setInput('');
    setUploadedFiles([]);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      handleNewChat();
      return;
    }
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);
    if (activeSessionId === sessionId) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleTogglePinSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, isPinned: !s.isPinned } : s))
    );
  };

  const handleRenameSession = (sessionId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setSessions(prev =>
      prev.map(s => (s.id === sessionId ? { ...s, title: newTitle.trim() } : s))
    );
  };

  // Core Send Message Action
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if ((!query && uploadedFiles.length === 0) || isLoading) return;

    abortControllerRef.current = false;

    // Attachments snapshot
    const currentFiles = [...uploadedFiles];
    const imagePayload = currentFiles.find(f => f.base64);
    const textDoc = currentFiles.find(f => f.textContent)?.textContent;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: query || `Please analyze the uploaded document (${currentFiles[0]?.name})`,
      timestamp: Date.now(),
      files: currentFiles.map(f => ({ name: f.name, type: f.type, size: f.size }))
    };

    // Update session title if first message
    const isFirstMessage = messages.length === 0;
    const newTitle = isFirstMessage
      ? query.slice(0, 32) + (query.length > 32 ? '...' : '')
      : activeSession.title;

    // Add user message to state
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            title: newTitle,
            updatedAt: Date.now(),
            messages: [...s.messages, userMessage]
          };
        }
        return s;
      })
    );

    setInput('');
    setUploadedFiles([]);
    setIsLoading(true);

    try {
      // Build conversation history format for API
      const history = messages.slice(-8).map(m => ({
        role: m.role === 'user' ? ('user' as const) : ('model' as const),
        parts: [{ text: m.content }]
      }));

      const res = await mindClient.chat({
        message: userMessage.content,
        history,
        documentText: textDoc,
        imageBase64: imagePayload?.base64,
        imageMimeType: imagePayload?.mimeType,
        mode: selectedMode,
        language: 'English'
      });

      if (abortControllerRef.current) return;

      const assistantMessage: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'Analysis completed by Study Top AI.',
        timestamp: Date.now(),
        mode: selectedMode
      };

      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              updatedAt: Date.now(),
              messages: [...s.messages, assistantMessage]
            };
          }
          return s;
        })
      );
    } catch (err: any) {
      if (abortControllerRef.current) return;
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Connection Notice:** Unable to reach Study Top AI services (${err.message || 'Network timeout'}). Please verify your connection or click **Retry** below.`,
        timestamp: Date.now()
      };
      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: [...s.messages, errMsg]
            };
          }
          return s;
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Stop Generation
  const handleStopGeneration = () => {
    abortControllerRef.current = true;
    setIsLoading(false);
  };

  // Regenerate Response
  const handleRegenerate = async (messageId: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex <= 0) return;
    const lastUserMsg = messages[msgIndex - 1];
    if (lastUserMsg.role === 'user') {
      // Remove assistant message and retry
      setSessions(prev =>
        prev.map(s => {
          if (s.id === activeSessionId) {
            return {
              ...s,
              messages: s.messages.filter((_, idx) => idx !== msgIndex)
            };
          }
          return s;
        })
      );
      handleSendMessage(lastUserMsg.content);
    }
  };

  // Edit Message
  const handleSaveEdit = (msgId: string) => {
    if (!editingContent.trim()) return;
    const msgIndex = messages.findIndex(m => m.id === msgId);
    if (msgIndex === -1) return;

    // Truncate messages after edited message and regenerate
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.slice(0, msgIndex)
          };
        }
        return s;
      })
    );
    setEditingMessageId(null);
    handleSendMessage(editingContent);
    setEditingContent('');
  };

  // Copy Message Content
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Feedback (Like/Dislike)
  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setSessions(prev =>
      prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.map(m =>
              m.id === msgId ? { ...m, feedback: m.feedback === type ? null : type } : m
            )
          };
        }
        return s;
      })
    );
  };

  // Export Single Answer or Full Conversation as PDF
  const handleExportPDF = (title: string, content: string) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 41, 59);
    doc.text('Study Top 2.0 — AI Learning Report', 15, 20);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on ${new Date().toLocaleDateString()} | User: ${userProfile?.displayName || 'Student'}`, 15, 27);

    doc.setDrawColor(226, 232, 240);
    doc.line(15, 32, 195, 32);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(title.slice(0, 50), 15, 42);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);

    const splitText = doc.splitTextToSize(content.replace(/[*#`]/g, ''), 180);
    doc.text(splitText, 15, 50);

    doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`);
  };

  // Export Full Conversation as TXT
  const handleExportTXT = () => {
    const fullText = messages
      .map(
        m =>
          `[${m.role.toUpperCase()} - ${new Date(m.timestamp).toLocaleTimeString()}]:\n${m.content}\n\n--------------------\n`
      )
      .join('\n');

    const blob = new Blob([fullText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title.replace(/[^a-z0-9]/gi, '_')}_chat.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered Sessions for Sidebar
  const filteredSessions = sessions.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* 1. COLLAPSIBLE CONVERSATION SIDEBAR */}
      <aside
        className={`${
          sidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0'
        } transition-all duration-300 ease-in-out border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-hidden z-20`}
      >
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={handleNewChat}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Collapse Sidebar"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* Search Chats */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-100 border border-transparent focus:border-indigo-300 focus:bg-white text-xs outline-none transition"
            />
          </div>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Conversations
          </div>

          {filteredSessions.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-slate-400">
              No conversations found.
            </div>
          ) : (
            filteredSessions.map(session => {
              const isActive = session.id === activeSessionId;
              return (
                <div
                  key={session.id}
                  onClick={() => setActiveSessionId(session.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition ${
                    isActive
                      ? 'bg-indigo-50/80 text-indigo-950 font-semibold border border-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <Bot
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? 'text-indigo-600' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{session.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={e => handleTogglePinSession(session.id, e)}
                      title={session.isPinned ? 'Unpin' : 'Pin chat'}
                      className={`p-1 rounded hover:bg-slate-200 transition ${
                        session.isPinned ? 'text-indigo-600 opacity-100' : 'text-slate-400'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={e => handleDeleteSession(session.id, e)}
                      title="Delete chat"
                      className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => setShowSettingsModal(true)}
            className="flex items-center gap-1.5 hover:text-slate-800 transition"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>AI Settings</span>
          </button>
          <span className="text-[10px] font-mono text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded">
            MIND 1.0
          </span>
        </div>
      </aside>

      {/* 2. MAIN CHAT WORKSPACE */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/60 relative">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                title="Open Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 truncate max-w-[200px] sm:max-w-md">
                  {activeSession.title}
                </span>
                <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {RESPONSE_MODES.find(m => m.id === selectedMode)?.label}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Selector Dropdown */}
            <div className="relative">
              <button
                onClick={() => setModeMenuOpen(!modeMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Mode:</span>
                <span>{RESPONSE_MODES.find(m => m.id === selectedMode)?.label.split(' ')[0]}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {modeMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-30">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Response Mode
                  </div>
                  {RESPONSE_MODES.map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setSelectedMode(mode.id);
                        setModeMenuOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl text-xs transition ${
                        selectedMode === mode.id
                          ? 'bg-indigo-50 text-indigo-900 font-bold'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{mode.label}</span>
                        {selectedMode === mode.id && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Export TXT */}
            {messages.length > 0 && (
              <button
                onClick={handleExportTXT}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title="Export Conversation as TXT"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* Message Container or Empty State */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 space-y-6"
        >
          {messages.length === 0 ? (
            /* 3. NEW CHAT HOME SCREEN */
            <div className="max-w-3xl mx-auto py-8 sm:py-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-indigo-200 mb-4 animate-bounce-subtle">
                <Bot className="w-8 h-8" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                What can I help you learn today?
              </h1>
              <p className="text-sm text-slate-500 max-w-md mt-2">
                Your intelligent AI study companion. Ask questions, solve math formulas, summarize chapters, or analyze uploaded notes.
              </p>

              {/* Suggested Prompt Cards */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 text-left">
                {SUGGESTED_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-md transition text-left flex items-start gap-3 cursor-pointer"
                    >
                      <div className={`p-2.5 rounded-xl border shrink-0 ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {item.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                const isSpeaking = activeSpeakingId === msg.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 sm:gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm mt-0.5">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-4 transition ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {/* Attached File Badges on User Message */}
                      {msg.files && msg.files.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2.5 pb-2 border-b border-indigo-400/40">
                          {msg.files.map((file, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-700/60 text-[10px] font-mono text-indigo-100"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{file.name}</span>
                              <span>({file.size})</span>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Message Content */}
                      {isUser ? (
                        editingMessageId === msg.id ? (
                          <div className="space-y-2">
                            <textarea
                              value={editingContent}
                              onChange={e => setEditingContent(e.target.value)}
                              className="w-full p-2 rounded-lg bg-indigo-700 text-white text-xs outline-none resize-none"
                              rows={3}
                            />
                            <div className="flex justify-end gap-2 text-[10px]">
                              <button
                                onClick={() => setEditingMessageId(null)}
                                className="px-2 py-1 rounded bg-indigo-800 hover:bg-indigo-900 transition"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(msg.id)}
                                className="px-2 py-1 rounded bg-white text-indigo-900 font-bold transition"
                              >
                                Save &amp; Resend
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>
                        )
                      ) : (
                        <div className="prose prose-sm max-w-none prose-slate text-xs sm:text-sm leading-relaxed overflow-x-auto">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                return (
                                  <code
                                    className={`${className} bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono text-[11px]`}
                                    {...props}
                                  >
                                    {children}
                                  </code>
                                );
                              },
                              table({ children }) {
                                return (
                                  <div className="overflow-x-auto my-2">
                                    <table className="min-w-full text-xs divide-y divide-slate-200 border border-slate-200">
                                      {children}
                                    </table>
                                  </div>
                                );
                              }
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {/* Action Bar for Assistant Messages */}
                      {!isUser && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-slate-400 text-xs">
                          <div className="flex items-center gap-1">
                            {/* Copy button */}
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="p-1.5 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Read Aloud Text-to-Speech */}
                            <button
                              onClick={() => handleReadAloud(msg.id, msg.content)}
                              className={`p-1.5 rounded-lg transition ${
                                isSpeaking
                                  ? 'text-indigo-600 bg-indigo-50 animate-pulse'
                                  : 'hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                            >
                              {isSpeaking ? (
                                <VolumeX className="w-3.5 h-3.5" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Regenerate */}
                            <button
                              onClick={() => handleRegenerate(msg.id)}
                              className="p-1.5 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Regenerate answer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            {/* Like / Dislike */}
                            <button
                              onClick={() => handleFeedback(msg.id, 'like')}
                              className={`p-1.5 rounded-lg transition ${
                                msg.feedback === 'like'
                                  ? 'text-emerald-600 bg-emerald-50'
                                  : 'hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Good response"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'dislike')}
                              className={`p-1.5 rounded-lg transition ${
                                msg.feedback === 'dislike'
                                  ? 'text-rose-600 bg-rose-50'
                                  : 'hover:text-slate-700 hover:bg-slate-100'
                              }`}
                              title="Poor response"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Export as PDF */}
                            <button
                              onClick={() => handleExportPDF(activeSession.title, msg.content)}
                              className="p-1.5 rounded-lg hover:text-slate-700 hover:bg-slate-100 transition"
                              title="Export this answer as PDF"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Cross-Integration Shortcuts */}
                          <div className="flex items-center gap-1.5">
                            {onNavigateToNotes && (
                              <button
                                onClick={() =>
                                  onNavigateToNotes(msg.content, activeSession.title)
                                }
                                className="px-2 py-1 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] transition flex items-center gap-1"
                                title="Send to Notes Maker"
                              >
                                <BookOpen className="w-3 h-3" />
                                <span>Save to Notes</span>
                              </button>
                            )}

                            {onNavigateToMath && (
                              <button
                                onClick={() => onNavigateToMath(msg.content.slice(0, 100))}
                                className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[10px] transition flex items-center gap-1"
                                title="Send to Math Solver"
                              >
                                <Calculator className="w-3 h-3" />
                                <span>Math Solver</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Edit option for User Message */}
                      {isUser && (
                        <div className="mt-1 flex justify-end">
                          <button
                            onClick={() => {
                              setEditingMessageId(msg.id);
                              setEditingContent(msg.content);
                            }}
                            className="text-[10px] text-indigo-200 hover:text-white transition flex items-center gap-1"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                            <span>Edit</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Loading Typing Indicator */}
              {isLoading && (
                <div className="flex gap-3 items-center">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 flex items-center gap-2 shadow-sm">
                    <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span>Study Top AI is analyzing your question...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Scroll to Bottom Floating Button */}
        {showScrollBottom && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-8 p-2.5 rounded-full bg-white border border-slate-200 shadow-md text-slate-600 hover:text-indigo-600 hover:bg-slate-50 transition z-10"
            title="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        )}

        {/* 4. ADVANCED MESSAGE COMPOSER */}
        <div className="p-3 sm:p-4 border-t border-slate-200/90 bg-white/95 backdrop-blur-md shrink-0">
          <div className="max-w-3xl mx-auto space-y-2">
            {/* Uploaded Files Preview Tags */}
            {uploadedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-1">
                {uploadedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 font-medium"
                  >
                    {file.type.startsWith('image/') ? (
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    )}
                    <span className="truncate max-w-[140px] font-mono text-[11px]">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeUploadedFile(i)}
                      className="text-indigo-400 hover:text-rose-600 transition"
                      title="Remove attachment"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer Box */}
            <div className="relative rounded-2xl border border-slate-300 bg-white shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  } else if (e.key === 'Escape' && isLoading) {
                    e.preventDefault();
                    handleStopGeneration();
                  }
                }}
                placeholder="Ask anything from your syllabus, math problem, or upload notes (Enter to send, Shift+Enter for new line)..."
                rows={1}
                className="w-full resize-none border-0 bg-transparent px-2 pt-1 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none max-h-40"
              />

              {/* Bottom Composer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
                <div className="flex items-center gap-1">
                  {/* File Upload Trigger */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.docx,.txt"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Attach PDF, Document, or Image"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Camera Upload Trigger */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                    title="Capture image from camera"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  {/* Voice Input Trigger */}
                  <button
                    onClick={toggleVoiceInput}
                    className={`p-1.5 rounded-lg transition ${
                      isListening
                        ? 'text-rose-600 bg-rose-50 animate-pulse'
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                    title={isListening ? 'Stop listening' : 'Voice input (Speech to text)'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>

                  {/* Tools Menu Trigger */}
                  <div className="relative">
                    <button
                      onClick={() => setToolsMenuOpen(!toolsMenuOpen)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        toolsMenuOpen
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                      title="Open Educational AI Tools Menu"
                    >
                      <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Tools</span>
                    </button>

                    {/* Tools Drawer Dropdown */}
                    {toolsMenuOpen && (
                      <div className="absolute left-0 bottom-full mb-2 w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-2xl p-3 z-30 space-y-3">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-900">Study Top Tools</span>
                          <button
                            onClick={() => setToolsMenuOpen(false)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {STUDY_TOOLS_CATALOG.map((cat, idx) => {
                          const Icon = cat.icon;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                <Icon className={`w-3.5 h-3.5 ${cat.color}`} />
                                <span>{cat.category}</span>
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {cat.items.map((tool, tIdx) => (
                                  <button
                                    key={tIdx}
                                    onClick={() => {
                                      setInput(tool.prompt);
                                      setToolsMenuOpen(false);
                                      textareaRef.current?.focus();
                                    }}
                                    className="text-left px-2 py-1.5 rounded-lg text-xs hover:bg-indigo-50 hover:text-indigo-900 text-slate-700 transition truncate"
                                  >
                                    {tool.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Stop Generation or Send Button */}
                  {isLoading ? (
                    <button
                      onClick={handleStopGeneration}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition shadow-sm"
                      title="Stop generating answer"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!input.trim() && uploadedFiles.length === 0}
                      className={`p-2 rounded-xl transition ${
                        input.trim() || uploadedFiles.length > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                      title="Send message (Enter)"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400">
              Study Top MIND 1.0 delivers curriculum-aligned educational answers. Verify vital formulas before exams.
            </div>
          </div>
        </div>
      </main>

      {/* 5. AI SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">AI Chat Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default Learning Mode</label>
                <select
                  value={selectedMode}
                  onChange={e => setSelectedMode(e.target.value as ResponseMode)}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-medium outline-none"
                >
                  {RESPONSE_MODES.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.label} — {m.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Intelligence Engine</label>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between">
                  <span>MIND 1.0 (Gemini 2.5 Multi-Candidate)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Conversation Storage</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Delete all stored conversation history?')) {
                        localStorage.removeItem('studytop_ai_conversations_v2');
                        setSessions([
                          {
                            id: `session_${Date.now()}`,
                            title: 'New Conversation',
                            createdAt: Date.now(),
                            updatedAt: Date.now(),
                            mode: 'detailed',
                            messages: []
                          }
                        ]);
                        setShowSettingsModal(false);
                      }
                    }}
                    className="flex-1 py-2 px-3 rounded-xl border border-rose-200 text-rose-600 font-bold hover:bg-rose-50 transition"
                  >
                    Clear All Chat History
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
