/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, Fragment, useCallback } from 'react';
import { 
  Plus, 
  BookOpen, 
  Search, 
  Sparkles,
  MessageSquare,
  Send,
  Languages,
  MapPin,
  Sidebar as SidebarIcon,
  ChevronLeft,
  ChevronRight,
  Brain,
  Trash2,
  FileText,
  Clock,
  LogOut,
  User,
  Chrome,
  Lightbulb,
  ListChecks,
  CheckCircle2,
  AlertCircle,
  Download,
  Youtube,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Calendar,
  Flag,
  Upload,
  FileUp,
  BarChart3,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  HelpCircle,
  Apple,
  Monitor,
  Target,
  Navigation,
  Archive,
  Star,
  Activity,
  Flame,
  LayoutDashboard,
  BrainCircuit,
  PieChart as PieChartIcon,
  Tent,
  MoreHorizontal,
  SpellCheck,
  Users,
  X,
  Key,
  Wand2,
  ListTodo,
  SplitSquareVertical,
  ImagePlus,
  Settings,
  Folder,
  FolderPlus,
  Tag,
  Filter,
  MoreVertical,
  Bot,
  Globe,
  ChevronDown,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  FileSpreadsheet,
  Network,
  GraduationCap,
  Layers,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import rehypeSlug from 'rehype-slug';
import { motion, AnimatePresence } from 'motion/react';
import { GlobalChatView } from './components/GlobalChatView';
import { DictionaryView } from './components/DictionaryView';
import { translateAndDefine } from './lib/gemini';
import { Note, Category, QuizQuestion, StudyGuide, UserProfile, Message, Task, TaskFolder, MasteryLevel, Priority, Classroom, QuizResult } from './types';
import { SUPPORTED_LANGUAGES } from './constants';
import { cn } from './lib/utils';
import { CollabEditor } from './components/CollabEditor';
import { WatchWidget } from './components/WatchWidget';
import { QuickEventWidget } from './components/QuickEventWidget';
import { AiAgentModal } from './components/AiAgentModal';
import { FocusTimerModal } from './components/FocusTimerModal';
import { NewNoteModal } from './components/NewNoteModal';
import { PointWiseNotesMakerModal } from './components/PointWiseNotesMakerModal';
import { DiagramMakerModal } from './components/DiagramMakerModal';
import { QaAnswerSolverModal } from './components/QaAnswerSolverModal';
import { MermaidViewer } from './components/MermaidViewer';
import { NoteSettingsModal } from './components/NoteSettingsModal';
import { ClassroomView } from './components/ClassroomView';
import { LoginPage } from './components/LoginPage';
import { PointWiseNoteViewer } from './components/notes/PointWiseNoteViewer';
import { supabaseService } from './lib/supabase';
import { stClient } from './lib/stCloudClient';
import { LanguageSelectorView } from './components/LanguageSelectorView';
import { SmartNoteCreatorModal } from './components/SmartNoteCreatorModal';
import { StudyTopAiAssistant } from './components/StudyTopAiAssistant';
import { FloatingAiTrigger } from './components/FloatingAiTrigger';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { StudyToolsHubModal } from './components/StudyToolsHubModal';
import { NotebookLMHome } from './components/NotebookLMHome';
import { NotebookLMStudio } from './components/NotebookLMStudio';
import { OtherApp } from './components/apps/OtherApp';
import { TutorialFlow } from './components/TutorialFlow';
import { AppSwitcherWidget } from './components/AppSwitcherWidget';
import { ExamCountdownWidget } from './components/ExamCountdownWidget';
import { CalendarApp } from './components/apps/CalendarApp';
import { CalculatorApp } from './components/apps/CalculatorApp';
import { ResultMakerApp } from './components/apps/ResultMakerApp';
import { t } from './lib/i18n';
import { LandingPage } from './components/landing/LandingPage';
import { StudyTopDashboard } from './components/dashboard/StudyTopDashboard';
import { SingleNoteEditor } from './components/notes/SingleNoteEditor';
import { DiagramStudioWorkspace } from './components/diagrams/DiagramStudioWorkspace';
import { CreateNotesWorkspace } from './components/create/CreateNotesWorkspace';
import { NoteExportCenter } from './components/export/NoteExportCenter';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import 'katex/dist/katex.min.css';
import { 
  summarizeNote, 
  generateQuiz, 
  generateMockTest,
  generateStudyGuide, 
  chatWithNote,
  processStudyImage,
  processStudyYoutube,
  defineWord,
  checkSpelling,
  SpellingIssue,
  generateProject,
  extractTasksFromNote,
  autoTagNote,
  breakDownTask,
  generateImageAI
} from './lib/gemini';
import { auth, db, googleProvider, appleProvider, microsoftProvider, handleFirestoreError, OperationType } from './lib/firebase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  getDoc,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  orderBy,
  where,
  arrayUnion
} from 'firebase/firestore';

const INITIAL_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Notes', icon: 'BookOpen' },
  { id: 'math', name: 'Mathematics', icon: 'Calculator' },
  { id: 'science', name: 'Science', icon: 'FlaskConical' },
  { id: 'history', name: 'History', icon: 'History' },
  { id: 'lit', name: 'Literature', icon: 'Book' },
];

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskFolders, setTaskFolders] = useState<TaskFolder[]>([]);
  const [activeTaskFolderId, setActiveTaskFolderId] = useState<string | 'all' | 'today'>('all');
  const [taskSearchQuery, setTaskSearchQuery] = useState('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskFolderModalOpen, setIsTaskFolderModalOpen] = useState(false);
  const [folderForm, setFolderForm] = useState({ name: '', color: '#6366f1' });
  const [editingFolder, setEditingFolder] = useState<TaskFolder | null>(null);
  const [localNoteEdits, setLocalNoteEdits] = useState<Record<string, Partial<Note>>>({});
  const localNoteEditsRef = useRef(localNoteEdits);
  
  useEffect(() => {
    localNoteEditsRef.current = localNoteEdits;
  }, [localNoteEdits]);

  const flushNoteUpdates = useCallback(() => {
    const edits = localNoteEditsRef.current;
    if (Object.keys(edits).length > 0) {
      Object.keys(edits).forEach(async (id) => {
        const updates = edits[id];
        if (Object.keys(updates).length > 0) {
          // 1. Sync to Study Top Cloud Database (ultra-fast own backend)
          stClient.notes.save({
            id,
            title: updates.title || 'Untitled Note',
            content: updates.content || '',
            tags: updates.tags
          }).catch(() => {});

          // 2. Sync to Firebase if authenticated in Firebase
          if (auth.currentUser) {
            const path = `users/${auth.currentUser.uid}/notes/${id}`;
            try {
              await updateDoc(doc(db, path), {
                ...updates,
                updatedAt: Date.now()
              });
            } catch (_) {}
          }
        }
      });
      setLocalNoteEdits({});
    }
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      flushNoteUpdates();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    const interval = setInterval(flushNoteUpdates, 30000);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
      flushNoteUpdates();
    };
  }, [flushNoteUpdates]);

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    location: '',
    priority: 'medium' as Priority,
    dueDate: '',
    time: '',
    tags: [] as string[],
    folderId: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [openNoteIds, setOpenNoteIds] = useState<string[]>([]);
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [isTasksView, setIsTasksView] = useState(false);
  const [isProjectsView, setIsProjectsView] = useState(false);
  const [isClassroomsView, setIsClassroomsView] = useState(false);
  const [isGlobalChatView, setIsGlobalChatView] = useState(false);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTag, setSearchTag] = useState('all');
  const [searchDate, setSearchDate] = useState('all');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isPreview, setIsPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isGenImageModalOpen, setIsGenImageModalOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [spellcheckIssues, setSpellcheckIssues] = useState<SpellingIssue[] | null>(null);
  const [activeSpellcheckIssue, setActiveSpellcheckIssue] = useState<number | null>(null);
  const [aiResult, setAiResult] = useState<{ type: 'summary' | 'quiz' | 'mock_test' | 'guide'; data: any; contextId?: string; contextType?: 'note' | 'category' } | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<Record<number, number>>({});
  const [dictionaryPopup, setDictionaryPopup] = useState<{ x: number, y: number, word: string, result?: any, loading?: boolean } | null>(null);
  const [isDictionaryView, setIsDictionaryView] = useState(false);
  const [isCalendarView, setIsCalendarView] = useState(false);
  const [isCalculatorView, setIsCalculatorView] = useState(false);
  const [isResultMakerView, setIsResultMakerView] = useState(false);
  const [isOtherAppView, setIsOtherAppView] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);
  
  // Import states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'camera' | 'youtube' | 'text' | 'upload' | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Chat states
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Projects & Assignments State
  const [projectStep, setProjectStep] = useState(1);
  const [projectForm, setProjectForm] = useState({
    type: 'Project',
    subject: '',
    title: '',
    command: '',
    outputFormat: 'PDF',
    style: 'Handwritten',
    files: [] as File[],
  });
  const [projectResult, setProjectResult] = useState<{content: string} | null>(null);
  const [isProjectGenerating, setIsProjectGenerating] = useState(false);

  // Onboarding states
  const [onboardingStep, setOnboardingStep] = useState<'profile' | 'language' | 'class' | null>(null);
  const [tempLanguage, setTempLanguage] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempPhoto, setTempPhoto] = useState('');
  const [collabConfig, setCollabConfig] = useState<{ noteId: string, password: string } | null>(() => {
    if (typeof window !== 'undefined') {
       const hash = window.location.hash;
       if (hash.startsWith('#collab?')) {
          const params = new URLSearchParams(hash.replace('#collab?', ''));
          const id = params.get('id');
          const key = params.get('key');
          if (id && key) {
            return { noteId: id, password: key };
          }
       }
    }
    return null;
  });
  const [collabShareModal, setCollabShareModal] = useState<string | null>(null);

  // Hidden Super Admin State & System Announcements
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [activeAnnouncement, setActiveAnnouncement] = useState<{ id: string; title: string; content: string; priority: string } | null>(null);
  const [isStudyToolsHubOpen, setIsStudyToolsHubOpen] = useState(false);

  useEffect(() => {
    const checkAdminHash = () => {
      if (typeof window !== 'undefined') {
        const hash = window.location.hash.toLowerCase();
        if (hash.includes('admin') || hash.includes('super-admin')) {
          setIsSuperAdminOpen(true);
        }
      }
    };
    checkAdminHash();
    window.addEventListener('hashchange', checkAdminHash);

    // Hidden shortcut: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setIsSuperAdminOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Fetch active system announcements
    fetch('/api/announcements/active')
      .then(r => r.json())
      .then(data => {
        if (data.announcements && data.announcements.length > 0) {
          setActiveAnnouncement(data.announcements[0]);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener('hashchange', checkAdminHash);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (collabConfig && !user) {
      // If we have a collab config but no user, we might want to still allow them to view it,
      // but without firestore sync. We'll handle this by forcing setSelectedNoteId.
      setSelectedNoteId(collabConfig.noteId);
      setOpenNoteIds(prev => prev.includes(collabConfig.noteId) ? prev : [...prev, collabConfig.noteId]);
    }
  }, [collabConfig, user]);

  const startCollabSession = (noteId: string) => {
    const randomKey = Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('');
    setCollabConfig({ noteId, password: randomKey });
    setCollabShareModal(`https://${window.location.host}/#collab?id=${noteId}&key=${randomKey}`);
  };
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthProcessing, setIsAuthProcessing] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState<string | null>(null);
  const [unauthView, setUnauthView] = useState<'landing' | 'login'>('login');
  const [isCreateWorkspaceOpen, setIsCreateWorkspaceOpen] = useState(false);
  const [isDiagramStudioOpen, setIsDiagramStudioOpen] = useState(false);
  const [exportingNote, setExportingNote] = useState<Note | null>(null);
  const [noteWorkspaceMode, setNoteWorkspaceMode] = useState<'editor' | 'studio'>('editor');

  // Focus Mode
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<'work' | 'break'>('work');
  const [isFocusTimerModalOpen, setIsFocusTimerModalOpen] = useState(false);

  const [isAiAgentModalOpen, setIsAiAgentModalOpen] = useState(false);
  const [isStudyTopAiOpen, setIsStudyTopAiOpen] = useState(false);
  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [isPointWiseModalOpen, setIsPointWiseModalOpen] = useState(false);
  const [isSmartNoteModalOpen, setIsSmartNoteModalOpen] = useState(false);
  const [smartNoteSource, setSmartNoteSource] = useState<'text' | 'camera' | 'images' | 'pdf' | 'youtube'>('text');
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);
  const [isQaModalOpen, setIsQaModalOpen] = useState(false);
  const [isFavouritesView, setIsFavouritesView] = useState(false);
  const [isSubjectsView, setIsSubjectsView] = useState(false);
  const [isNoteSettingsModalOpen, setIsNoteSettingsModalOpen] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(false);

  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const deltaX = touchEndX - touchStartX;
    
    // Swipe right to open sidebar
    if (deltaX > 80 && touchStartX < 50) { 
      // must start from edge
      setIsSidebarOpen(true);
    }
    
    // Swipe left to close sidebar
    if (deltaX < -80 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    
    setTouchStartX(null);
  };

  const handleProjectGenerate = async () => {
    setIsProjectGenerating(true);
    setProjectResult(null);
    try {
      const content = await generateProject(
        projectForm.type,
        projectForm.subject,
        projectForm.title,
        projectForm.command,
        projectForm.files,
        userProfile?.language || 'English',
        userProfile?.profession || 'Professional'
      );
      setProjectResult({ content });
      setProjectStep(2);
    } catch (e) {
      console.error(e);
      alert('Failed to generate project.');
    } finally {
      setIsProjectGenerating(false);
    }
  };

  const handleProjectExport = async () => {
    // Generate PDF/JPG/PNG based on projectForm.outputFormat
    const targetElement = document.getElementById('project-output-render');
    if (!targetElement) return;

    if (projectForm.outputFormat === 'PDF') {
      const canvas = await html2canvas(targetElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      const watermarkY = Math.min(heightLeft + pageHeight + 10, pageHeight - 10);
      pdf.setFontSize(8);
      pdf.setTextColor(200);
      pdf.text('Generated by ProNotes', pdfWidth / 2, watermarkY, { align: 'center' });
      pdf.save(`${projectForm.title || 'Project'}.pdf`);
    } else {
      const canvas = await html2canvas(targetElement, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL(`image/${projectForm.outputFormat.toLowerCase()}`);
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `${projectForm.title || 'Project'}.${projectForm.outputFormat.toLowerCase()}`;
      link.click();
    }
  };

  const openNote = (id: string) => {
    setOpenNoteIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setSelectedNoteId(id);
  };

  const closeNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenNoteIds(prev => {
      const newTabs = prev.filter(nId => nId !== id);
      if (selectedNoteId === id) {
        setSelectedNoteId(newTabs.length > 0 ? newTabs[newTabs.length - 1] : null);
      }
      return newTabs;
    });
  };

  const handleDefineWord = async () => {
    if (!dictionaryPopup) return;
    setDictionaryPopup(prev => prev ? { ...prev, loading: true } : null);
    try {
      const lang = userProfile?.language || 'English';
      const result = await defineWord(dictionaryPopup.word, selectedNote?.content || '', lang);
      setDictionaryPopup(prev => prev ? { ...prev, loading: false, result } : null);
    } catch (e) {
      setDictionaryPopup(prev => prev ? { ...prev, loading: false, result: { definition: 'Error loading definition' } } : null);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0 && text.length < 50) {
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setDictionaryPopup(prev => {
            if (prev && prev.word === text) return prev;
            return { 
               x: rect.left + (rect.width / 2), 
               y: rect.top - 10, 
               word: text,
            };
          });
        }
      } else {
        setDictionaryPopup(prev => {
          if (!prev) return null;
          if (prev.loading || prev.result) return prev;
          return null;
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.dictionary-popup')) return;
      if (window.getSelection()?.toString().trim() && (e.target as HTMLElement).closest('#note-content')) return;
      setDictionaryPopup(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  useEffect(() => {
    if (isFocusTimerModalOpen && "Notification" in window && Notification.permission !== "granted") {
       Notification.requestPermission();
    }
  }, [isFocusTimerModalOpen]);

  useEffect(() => {
    if (isTimerRunning && pomodoroTime > 0) {
      const timer = setInterval(() => {
        setPomodoroTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    } else if (pomodoroTime === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      // Try to send browser notification if allowed
      if (Notification.permission === "granted") {
        new Notification(`Time's up!`, {
          body: timerMode === 'work' ? "Great job focusing! Time for a break." : "Break is over! Ready to focus?",
          icon: "/favicon.ico"
        });
      }
      setTimerMode(prev => prev === 'work' ? 'break' : 'work');
      setPomodoroTime(timerMode === 'work' ? 5 * 60 : 25 * 60);
    }
  }, [isTimerRunning, pomodoroTime, timerMode]);

  useEffect(() => {
    // 1. If an auth state is immediately cached, apply it right away
    if (auth.currentUser) {
      setUser(auth.currentUser);
      setAuthLoading(false);
    }
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) setUser(u);
      setAuthLoading(false);
    });
    // Fast loading guard: Ensure preview never hangs on initial auth check
    const fastTimer = setTimeout(() => {
      setAuthLoading(false);
    }, 300);
    return () => {
      unsubscribe();
      clearTimeout(fastTimer);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setOnboardingStep(null);
      return;
    }

    let isMounted = true;
    const fetchProfile = async () => {
      // If user profile is already present in state or user is operating via self-owned ST Cloud auth,
      // no need to block on or query Firestore
      if (userProfile && userProfile.uid === user.uid) {
        setProfileLoading(false);
        return;
      }
      setProfileLoading(true);
      try {
        if (!auth.currentUser) {
          const initialProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.username || 'Student',
            photoURL: user.photoURL || null,
            language: user.language || localStorage.getItem('study_top_lang') || 'English',
            profession: user.profession || 'Student',
            lastLogin: Date.now()
          };
          setUserProfile(initialProfile);
          setProfileLoading(false);
          return;
        }

        // 2 second timeout guard so offline or slow Firestore never blocks the user
        const fetchPromise = getDoc(doc(db, 'users', user.uid));
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000));
        const profileDoc = await Promise.race([fetchPromise, timeoutPromise]) as any;

        if (!isMounted) return;

        if (profileDoc && profileDoc.exists && profileDoc.exists()) {
          const profileData = profileDoc.data() as UserProfile;
          setUserProfile(profileData);
          if (!profileData.language) {
            setOnboardingStep('language');
          } else if (!profileData.profession) {
            setOnboardingStep('class');
          } else if (!profileData.displayName) {
            setTempName(user.displayName || '');
            setTempPhoto(user.photoURL || '');
            setOnboardingStep('profile');
          }
        } else {
          // Create initial profile
          const initialProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || user.email?.split('@')[0] || 'User',
            photoURL: user.photoURL || null,
            lastLogin: Date.now()
          };
          try {
            await setDoc(doc(db, 'users', user.uid), initialProfile);
          } catch (_) {}
          if (!isMounted) return;
          setUserProfile(initialProfile);
          // First step right after login: Choose language
          setOnboardingStep('language');
        }
      } catch (error) {
        console.warn("Profile fetch fallback", error);
        if (!isMounted) return;
        // Offline or sandbox fallback profile so user can proceed to language selection immediately
        const fallbackProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || null,
          lastLogin: Date.now()
        };
        setUserProfile(fallbackProfile);
        setOnboardingStep('language');
      } finally {
        if (isMounted) setProfileLoading(false);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!searchQuery) return;
    const restrictedWords = ['abuse', 'hack', 'crack', 'porn', 'violence', 'hate', 'spam', 'kill', 'suicide', 'drugs'];
    const lowerQuery = searchQuery.toLowerCase();
    if (restrictedWords.some(word => lowerQuery.includes(word))) {
      handleLogout();
    }
  }, [searchQuery]);

  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    let isMounted = true;
    // 1. High-speed load from Study Top Cloud Database (<1ms response)
    stClient.notes.list().then((cloudNotes) => {
      if (isMounted && Array.isArray(cloudNotes) && cloudNotes.length > 0) {
        setNotes((prevNotes) => {
          const noteMap = new Map<string, Note>();
          prevNotes.forEach(n => noteMap.set(n.id, n));
          cloudNotes.forEach((cn: any) => {
            noteMap.set(cn.id, {
              id: cn.id,
              title: cn.title,
              content: cn.content,
              categoryId: cn.category_id || 'math',
              userId: cn.user_id || user.uid,
              createdAt: cn.created_at ? new Date(cn.created_at).getTime() : Date.now(),
              updatedAt: cn.updated_at ? new Date(cn.updated_at).getTime() : Date.now(),
              tags: cn.tags || []
            });
          });
          return Array.from(noteMap.values());
        });
      }
    }).catch(() => {});

    // 2. Also listen to Firestore if and only if valid Firebase user is present
    if (auth.currentUser && auth.currentUser.uid === user.uid && !auth.currentUser.isAnonymous) {
      const path = `users/${user.uid}/notes`;
      const q = query(
        collection(db, path),
        orderBy('updatedAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!isMounted) return;
        const fetchedNotes = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        })) as Note[];
        if (fetchedNotes.length > 0) {
          setNotes(fetchedNotes);
        }
      }, (error) => {
        console.warn("Firestore notes stream skipped, using ST Cloud store:", error?.message);
      });

      return () => {
        isMounted = false;
        unsubscribe();
      };
    }

    return () => {
      isMounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.uid || auth.currentUser.isAnonymous) {
      return;
    }

    const path = `users/${user.uid}/tasks`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Task[];
      setTasks(fetchedTasks);
    }, (error) => {
      console.warn("Firestore tasks skipped:", error?.message);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.uid || auth.currentUser.isAnonymous) {
      return;
    }

    const path = `users/${user.uid}/taskFolders`;
    const q = query(
      collection(db, path),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedFolders = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as TaskFolder[];
      setTaskFolders(fetchedFolders);
    }, (error) => {
      console.warn("Firestore taskFolders skipped:", error?.message);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !auth.currentUser || auth.currentUser.uid !== user.uid || auth.currentUser.isAnonymous) {
      return;
    }

    const path = `users/${user.uid}/quizResults`;
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuizResults(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as QuizResult));
    }, (error) => {
      console.warn("Firestore quizResults skipped:", error?.message);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || !userProfile || !auth.currentUser) return;
    const path = `classrooms`;
    let q;
    if (userProfile.profession === 'Teacher') {
      q = query(collection(db, path), where('teacherId', '==', user.uid));
    } else {
      q = query(collection(db, path), where('studentIds', 'array-contains', user.uid));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClassrooms(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Classroom).sort((a, b) => b.createdAt - a.createdAt));
    }, (error) => {
      console.warn("Classrooms stream notice:", error?.message);
    });
    return () => unsubscribe();
  }, [user, userProfile?.profession]);

  const handleQuickDemoLogin = async () => {
    setIsAuthProcessing(true);
    setAuthError(null);
    try {
      try {
        await signInAnonymously(auth);
      } catch (anonErr) {
        try {
          await signInWithEmailAndPassword(auth, 'demo@studytop.app', 'demo123456');
        } catch (signInErr) {
          await createUserWithEmailAndPassword(auth, 'demo@studytop.app', 'demo123456');
        }
      }
    } catch (err: any) {
      console.warn("Fast login error", err);
      const guestUser: any = {
        uid: 'guest_' + Date.now(),
        email: 'guest@studytop.app',
        displayName: 'Guest Student',
        photoURL: null,
      };
      setUser(guestUser);
      setUserProfile({
        uid: guestUser.uid,
        email: guestUser.email,
        displayName: guestUser.displayName,
        photoURL: null,
        lastLogin: Date.now()
      });
      setOnboardingStep('language');
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleAppleLogin = async () => {
    try {
      await signInWithPopup(auth, appleProvider);
    } catch (error) {
      console.error("Apple login failed", error);
    }
  };

  const handleMicrosoftLogin = async () => {
    try {
      await signInWithPopup(auth, microsoftProvider);
    } catch (error) {
      console.error("Microsoft login failed", error);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccessMsg(null);
    
    if (!email || !email.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (authMode !== 'forgot' && password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsAuthProcessing(true);
    try {
      if (authMode === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setAuthSuccessMsg('Password reset email sent. Check your inbox.');
      } else {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        if (authMode === 'login') {
          await signInWithEmailAndPassword(auth, email, password);
        } else {
          await createUserWithEmailAndPassword(auth, email, password);
        }
      }
    } catch (error: any) {
      console.error("Auth error", error);
      let errMsg = "An error occurred during authentication.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errMsg = "Invalid email or password.";
      } else if (error.code === 'auth/email-already-in-use') {
        errMsg = "An account already exists with this email.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "Password should be at least 6 characters.";
      }
      setAuthError(errMsg);
    } finally {
      setIsAuthProcessing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await stClient.auth.logout().catch(() => {});
      await signOut(auth).catch(() => {});
      setUser(null);
      setSelectedNoteId(null);
      setUserProfile(null);
      setOnboardingStep(null);
      setUnauthView('login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const handleProfileSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !tempName.trim()) return;
    setProfileLoading(true);
    try {
      const updates = {
        displayName: tempName,
        photoURL: tempPhoto
      };
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      if (!userProfile?.language) {
         setOnboardingStep('language');
      } else if (!userProfile?.profession) {
         setOnboardingStep('class');
      } else {
         setOnboardingStep(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLanguageSelect = (lang: string) => {
    setTempLanguage(lang);
    setOnboardingStep('class');
  };

  const handleClassSelect = async (classLvl: string) => {
    if (!user || !tempLanguage) return;
    setProfileLoading(true);
    try {
      const updates = {
        language: tempLanguage,
        profession: classLvl,
        lastLogin: Date.now()
      };
      await updateDoc(doc(db, 'users', user.uid), updates);
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
      setOnboardingStep(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const resetViews = () => {
    setIsTasksView(false);
    setIsProjectsView(false);
    setIsClassroomsView(false);
    setIsGlobalChatView(false);
    setIsDictionaryView(false);
    setIsCalendarView(false);
    setIsCalculatorView(false);
    setIsResultMakerView(false);
    setIsOtherAppView(false);
    setIsFavouritesView(false);
    setIsSubjectsView(false);
    setSelectedNoteId(null);
  };

  const navToDashboard = () => {
    resetViews();
    setActiveCategoryId('all');
    setIsSidebarOpen(false);
  };

  const navToFavourites = () => {
    resetViews();
    setIsFavouritesView(true);
    setIsSidebarOpen(false);
  };

  const navToSubjects = () => {
    resetViews();
    setIsSubjectsView(true);
    setIsSidebarOpen(false);
  };

  const navToTasks = () => {
    resetViews();
    setIsTasksView(true);
    setIsSidebarOpen(false);
  };

  const navToProjects = () => {
    resetViews();
    setIsProjectsView(true);
    setIsSidebarOpen(false);
  };

  const navToClassrooms = () => {
    resetViews();
    setIsClassroomsView(true);
    setIsSidebarOpen(false);
  };

  const navToGlobalChat = () => {
    resetViews();
    setIsGlobalChatView(true);
    setIsSidebarOpen(false);
  };

  const navToDictionary = () => {
    resetViews();
    setIsDictionaryView(true);
    setIsSidebarOpen(false);
  };

  const toggleFavorite = (noteId: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    const currentTags = note.tags || [];
    const isFav = currentTags.includes('favorite');
    const newTags = isFav ? currentTags.filter(t => t !== 'favorite') : [...currentTags, 'favorite'];
    updateNote(noteId, { tags: newTags });
  };

  const mergedNotes = useMemo(() => {
    return notes.map(note => localNoteEdits[note.id] ? { ...note, ...localNoteEdits[note.id] } as Note : note);
  }, [notes, localNoteEdits]);

  const allUsedTags = useMemo(() => {
    const tags = new Set<string>();
    mergedNotes.forEach(n => {
      if (n.tags) n.tags.forEach(t => tags.add(t));
    });
    return Array.from(tags).sort();
  }, [mergedNotes]);

  const filteredNotes = useMemo(() => {
    return mergedNotes.filter(note => {
      const matchesCategory = activeCategoryId === 'all' || note.categoryId === activeCategoryId;
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = searchTag === 'all' || (note.tags && note.tags.includes(searchTag));
      const matchesFav = !isFavouritesView || (note.tags && note.tags.includes('favorite'));
      
      let matchesDate = true;
      if (searchDate === '7days') {
         matchesDate = note.createdAt > Date.now() - 7 * 24 * 60 * 60 * 1000;
      } else if (searchDate === '30days') {
         matchesDate = note.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000;
      }

      return matchesCategory && matchesSearch && matchesTag && matchesDate && matchesFav;
    });
  }, [mergedNotes, activeCategoryId, searchQuery, searchTag, searchDate, isFavouritesView]);

  // Derived state for Dashboard & Analytics
  const urgentTask = useMemo(() => {
    return tasks
      .filter(t => !t.completed && t.dueDate && t.dueDate > Date.now())
      .sort((a, b) => a.dueDate! - b.dueDate!)[0];
  }, [tasks]);

  const startOfDay = new Date().setHours(0, 0, 0, 0);
  const dailyTasks = useMemo(() => {
    return tasks.filter(t => typeof t.dueDate === 'number' && new Date(t.dueDate).setHours(0,0,0,0) === startOfDay);
  }, [tasks, startOfDay]);

  const dailyProgress = dailyTasks.length
    ? Math.round((dailyTasks.filter(t => t.completed).length / dailyTasks.length) * 100)
    : 100;

  const categoryProgress = useMemo(() => {
    const defaultColors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    return INITIAL_CATEGORIES.slice(1).map((cat, idx) => {
      const catNotes = mergedNotes.filter(n => n.categoryId === cat.id);
      const color = defaultColors[idx % defaultColors.length];
      if (catNotes.length === 0) return { ...cat, count: 0, progress: 0, color };
      const scoreMap: Record<string, number> = { beginner: 25, intermediate: 50, advanced: 75, mastered: 100 };
      const score = catNotes.reduce((acc, n) => acc + (scoreMap[n.level || 'beginner'] || 25), 0);
      return { ...cat, count: catNotes.length, progress: Math.round(score / catNotes.length), color };
    }).sort((a, b) => b.count - a.count);
  }, [mergedNotes]);

  const reviewRecommendations = useMemo(() => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return mergedNotes
      .filter(n => n.updatedAt < threeDaysAgo && n.level !== 'mastered')
      .sort((a, b) => a.updatedAt - b.updatedAt);
  }, [mergedNotes]);

  const filteredTasks = useMemo(() => {
    let result = tasks;
    
    // Filter by Folder
    if (activeTaskFolderId === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      result = result.filter(t => t.dueDate && t.dueDate >= todayStart.getTime() && t.dueDate <= todayEnd.getTime());
    } else if (activeTaskFolderId !== 'all') {
      result = result.filter(t => t.folderId === activeTaskFolderId);
    }
    
    // Search
    if (taskSearchQuery.trim()) {
      const q = taskSearchQuery.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(q) || 
        t.description?.toLowerCase().includes(q) ||
        t.tags?.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Hide Completed
    if (hideCompleted) {
      result = result.filter(t => !t.completed);
    }
    
    return result.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [tasks, activeTaskFolderId, taskSearchQuery]);

  const quizTrendData = useMemo(() => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const trend = [];
    const now = new Date();
    
    // Create skeleton for last 7 days including today
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      trend.push({
        name: days[d.getDay()],
        date: d.getTime(),
        score: 0,
        count: 0
      });
    }

    // Populate with real data
    quizResults.forEach(qr => {
        const qrDate = new Date(qr.createdAt).setHours(0, 0, 0, 0);
        const dayMatch = trend.find(t => t.date === qrDate);
        if (dayMatch) {
            dayMatch.score += (qr.score / qr.total) * 100;
            dayMatch.count += 1;
        }
    });

    return trend.map(t => ({
      name: t.name,
      score: t.count > 0 ? Math.round(t.score / t.count) : 0
    }));
  }, [quizResults]);

  const subjectProgressData = useMemo(() => {
    return INITIAL_CATEGORIES.filter(c => c.id !== 'all').map(cat => {
      const catNotes = notes.filter(n => n.categoryId === cat.id).length;
      const catNoteIds = new Set(notes.filter(n => n.categoryId === cat.id).map(n => n.id));
      
      const catTasks = tasks.filter(t => t.completed && (
        (t.noteId && catNoteIds.has(t.noteId)) || 
        (taskFolders.find(f => f.id === t.folderId)?.name.toLowerCase() === cat.name.toLowerCase())
      )).length;

      return {
        name: cat.name,
        Notes: catNotes,
        Tasks: catTasks,
      };
    }).filter(d => d.Notes > 0 || d.Tasks > 0);
  }, [notes, tasks, taskFolders]);

  const selectedNote = useMemo(() => {
    const found = mergedNotes.find(n => n.id === selectedNoteId);
    if (found) return found;
    if (collabConfig && collabConfig.noteId === selectedNoteId) {
      return {
        id: collabConfig.noteId,
        title: 'Collaborative Note',
        content: '',
        categoryId: 'all',
        updatedAt: Date.now(),
        createdAt: Date.now(),
        tags: ['collaboration']
      } as Note;
    }
    return null;
  }, [mergedNotes, selectedNoteId, collabConfig]);

  const createNote = async (initialData: { categoryId?: string, title?: string, content?: string, tags?: string[], structuredData?: any } = {}) => {
    if (!user) return;
    const noteId = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newNote: Note = {
      id: noteId,
      title: initialData.title || 'Untitled Note',
      content: initialData.content || '',
      categoryId: (initialData.categoryId || (activeCategoryId === 'all' ? 'math' : activeCategoryId)) as any,
      userId: user.uid || user.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: initialData.tags ? initialData.tags.slice(0, 20) : [],
      structuredData: initialData.structuredData
    };
    
    // 1. Instant optimistic local update (ultra-fast 0ms latency)
    setNotes(prev => [newNote, ...prev]);
    setSelectedNoteId(noteId);
    setIsTasksView(false);
    setIsProjectsView(false);
    setIsClassroomsView(false);
    setIsDictionaryView(false);
    setIsFavouritesView(false);
    setIsSubjectsView(false);

    // 2. Supabase / PostgreSQL Database save
    supabaseService.saveNote({
      id: noteId,
      user_id: user.uid || user.id,
      title: newNote.title,
      content: newNote.content,
      subject: newNote.categoryId || 'General',
      structured_data: (initialData as any).structuredData,
      is_favorite: false
    }).catch(() => {});

    // 3. Sync to Firestore if authenticated in Firebase
    if (auth.currentUser && auth.currentUser.uid === user.uid && !auth.currentUser.isAnonymous) {
      const path = `users/${user.uid}/notes/${noteId}`;
      try {
        await setDoc(doc(db, `users/${user.uid}/notes`, noteId), {
          ...newNote,
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      } catch (error) {
        // quiet fallback
      }
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) return;
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n));
    setLocalNoteEdits(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...updates, updatedAt: Date.now() }
    }));
  };

  const deleteNote = async (id: string) => {
    if (!user) return;
    setLocalNoteEdits(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNotes(prev => prev.filter(n => n.id !== id));
    if (selectedNoteId === id) setSelectedNoteId(null);

    // Delete from Firestore if active
    if (auth.currentUser && auth.currentUser.uid === user.uid && !auth.currentUser.isAnonymous) {
      const path = `users/${user.uid}/notes/${id}`;
      try {
        await deleteDoc(doc(db, path));
      } catch (error) {
        // quiet fallback
      }
    }
  };

  const createTask = async (task: Partial<Task> & { title: string }) => {
    if (!user) return;
    const taskId = doc(collection(db, '_')).id;
    const path = `users/${user.uid}/tasks/${taskId}`;
    const newTask: Task = {
      id: taskId,
      title: task.title,
      description: task.description || '',
      location: task.location || '',
      noteId: task.noteId,
      dueDate: task.dueDate,
      priority: task.priority || 'medium',
      completed: false,
      userId: user.uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: task.tags || [],
      folderId: task.folderId
    };
    try {
      await setDoc(doc(db, path), newTask);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const createTaskFolder = async (folder: { name: string, color?: string }) => {
    if (!user) return;
    const folderId = doc(collection(db, '_')).id;
    const path = `users/${user.uid}/taskFolders/${folderId}`;
    const newFolder: TaskFolder = {
      id: folderId,
      name: folder.name,
      userId: user.uid,
      color: folder.color || '#6366f1',
      createdAt: Date.now()
    };
    try {
      await setDoc(doc(db, path), newFolder);
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const updateTaskFolder = async (id: string, updates: Partial<TaskFolder>) => {
    if (!user) return;
    const path = `users/${user.uid}/taskFolders/${id}`;
    try {
      await updateDoc(doc(db, path), updates);
    } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTaskFolder = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/taskFolders/${id}`;
    try {
      // Clear folderId from all tasks in this folder
      const folderTasks = tasks.filter(t => t.folderId === id);
      for (const t of folderTasks) {
        await updateTask(t.id, { folderId: '' });
      }
      await deleteDoc(doc(db, path));
      if (activeTaskFolderId === id) setActiveTaskFolderId('all');
    } catch (error) {
       handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      await updateDoc(doc(db, path), {
        ...updates,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    const path = `users/${user.uid}/tasks/${id}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const createClassroom = async (name: string) => {
    if (!user) return;
    const classroomId = doc(collection(db, '_')).id;
    // Generate a 6-digit uppercase join code
    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const newClassroom: Classroom = {
      id: classroomId,
      name,
      joinCode,
      teacherId: user.uid,
      studentIds: [],
      createdAt: Date.now()
    };
    
    try {
      await setDoc(doc(db, `classrooms/${classroomId}`), newClassroom);
      // Also create the joinCode mapping
      await setDoc(doc(db, `joinCodes/${joinCode}`), { code: joinCode, classroomId });
      setIsCreateClassModalOpen(false);
      setNewClassName('');
    } catch (error) {
       handleFirestoreError(error, OperationType.WRITE, `classrooms/${classroomId}`);
    }
  };

  const joinClassroom = async (code: string) => {
    if (!user) return;
    const cleanCode = code.trim().toUpperCase();
    try {
      const codeDoc = await getDoc(doc(db, `joinCodes/${cleanCode}`));
      if (!codeDoc.exists()) {
        alert("Invalid join code.");
        return;
      }
      const { classroomId } = codeDoc.data();
      const classroomRef = doc(db, `classrooms/${classroomId}`);
      const classroomDoc = await getDoc(classroomRef);
      
      if (!classroomDoc.exists()) {
        alert("Classroom not found.");
        return;
      }
      
      const classroomData = classroomDoc.data() as Classroom;
      if (classroomData.studentIds.includes(user.uid) || classroomData.teacherId === user.uid) {
        alert("You are already a member of this classroom.");
        return;
      }
      
      await updateDoc(classroomRef, {
        studentIds: arrayUnion(user.uid)
      });
      
      setIsJoinModalOpen(false);
      setJoinCodeInput('');
      alert(`Joined ${classroomData.name} successfully!`);
    } catch (error) {
       console.error("Join error", error);
       alert("Failed to join classroom. Please check your connection.");
    }
  };

  const handleSpellcheck = async () => {
    if (!selectedNote || !selectedNote.content.trim()) return;
    setAiLoading(true);
    setSpellcheckIssues(null);
    setActiveSpellcheckIssue(null);
    try {
      const lang = userProfile?.language || 'English';
      const issues = await checkSpelling(selectedNote.content, lang);
      setSpellcheckIssues(issues);
      if (issues.length > 0) {
        setActiveSpellcheckIssue(0);
      }
    } catch (error) {
      console.error("Spellcheck failed", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    try {
      const imgDataUrl = await generateImageAI(imagePrompt);
      const markdownImage = `\n\n![${imagePrompt}](${imgDataUrl})\n\n`;
      
      if (isProjectsView && projectResult) {
        setProjectResult({ ...projectResult, content: projectResult.content + markdownImage });
      } else if (selectedNote) {
        updateNote(selectedNote.id, { content: selectedNote.content + markdownImage });
      }
      setIsGenImageModalOpen(false);
      setImagePrompt('');
    } catch (e) {
      console.error(e);
      alert('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleExtractTasks = async () => {
    if (!selectedNote || !selectedNote.content.trim()) return;
    setAiLoading(true);
    try {
      const tasks = await extractTasksFromNote(selectedNote.content, userProfile?.language);
      if (tasks && tasks.length > 0) {
        tasks.forEach(t => {
           createTask({ title: t.title, priority: t.priority, dueDate: Date.now() + 86400000 });
        });
        setIsTasksView(true);
        setIsSidebarOpen(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAutoTag = async () => {
    if (!selectedNote || !selectedNote.content.trim()) return;
    setAiLoading(true);
    try {
      const allCats = [...INITIAL_CATEGORIES];
      const res = await autoTagNote(selectedNote.content, allCats, userProfile?.language);
      updateNote(selectedNote.id, {
         title: res.title,
         tags: res.tags,
         ...(INITIAL_CATEGORIES.find(c => c.id === res.categoryId) ? { categoryId: res.categoryId } : {})
      });
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handleBreakDownTask = async (task: Task) => {
    setAiLoading(true);
    try {
      const subTasks = await breakDownTask(task.title, userProfile?.language);
      if (subTasks && subTasks.length > 0) {
        subTasks.forEach(st => {
           createTask({ title: st, noteId: task.noteId, dueDate: task.dueDate, priority: task.priority });
        });
        deleteTask(task.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (activeSpellcheckIssue !== null && spellcheckIssues && selectedNote) {
      const issue = spellcheckIssues[activeSpellcheckIssue];
      const contextIndex = selectedNote.content.indexOf(issue.context);
      if (contextIndex !== -1) {
        const startIdx = selectedNote.content.indexOf(issue.original, contextIndex);
        if (startIdx !== -1 && startIdx <= contextIndex + issue.context.length) {
          if (editorTextareaRef.current) {
             editorTextareaRef.current.focus();
             editorTextareaRef.current.setSelectionRange(startIdx, startIdx + issue.original.length);
          }
        }
      }
    }
  }, [activeSpellcheckIssue, spellcheckIssues, selectedNote]);

  const applySpellcheckSuggestion = (issueIndex: number, suggestion: string) => {
    if (!selectedNote || !spellcheckIssues) return;
    const issue = spellcheckIssues[issueIndex];
    // Find the occurrence of issue.original in the content using the context
    let newContent = selectedNote.content;
    const contextIndex = newContent.indexOf(issue.context);
    
    if (contextIndex !== -1) {
      const startIdx = newContent.indexOf(issue.original, contextIndex);
      if (startIdx !== -1 && startIdx <= contextIndex + issue.context.length) {
         newContent = newContent.substring(0, startIdx) + suggestion + newContent.substring(startIdx + issue.original.length);
      }
    } else {
      // Fallback if context not found perfectly
      newContent = newContent.replace(issue.original, suggestion);
    }
    
    updateNote(selectedNote.id, { content: newContent });
    
    const newIssues = [...spellcheckIssues];
    newIssues.splice(issueIndex, 1);
    setSpellcheckIssues(newIssues.length > 0 ? newIssues : null);
    setActiveSpellcheckIssue(null);
  };

  const ignoreSpellcheckIssue = (issueIndex: number) => {
    if (!spellcheckIssues) return;
    const newIssues = [...spellcheckIssues];
    newIssues.splice(issueIndex, 1);
    setSpellcheckIssues(newIssues.length > 0 ? newIssues : null);
    setActiveSpellcheckIssue(null);
  };

  const handleCategoryQuiz = async (categoryId: string) => {
    const categoryNotes = mergedNotes.filter(n => n.categoryId === categoryId);
    if (!categoryNotes || categoryNotes.length === 0) {
      alert("No notes in this category yet. Create some notes first!");
      return;
    }
    const combinedContent = categoryNotes.map(n => n.content).join('\n\n').substring(0, 15000); // truncate if too huge
    
    setAiLoading(true);
    setAiResult(null);
    setSelectedQuizAnswers({});
    try {
      const lang = userProfile?.language || 'English';
      const prof = userProfile?.profession || 'Professional';
      const data = await generateQuiz(combinedContent, lang, prof);
      setAiResult({ type: 'quiz', data, contextId: categoryId, contextType: 'category' });
      setIsSidebarOpen(false); // open up the space for quiz
    } catch (error) {
      console.error(error);
      alert("Failed to generate category quiz.");
    } finally {
      setAiLoading(false);
    }
  };

  const saveQuizResult = async () => {
    if (!aiResult || (aiResult.type !== 'quiz' && aiResult.type !== 'mock_test')) return;
    if (!user) return;
    
    const quiz = aiResult.data as QuizQuestion[];
    let score = 0;
    quiz.forEach((q, i) => {
      if (selectedQuizAnswers[i] === q.correctAnswer) score++;
    });

    const resultId = doc(collection(db, '_')).id;
    const path = `users/${user.uid}/quizResults/${resultId}`;
    const newResult: QuizResult = {
      id: resultId,
      categoryId: aiResult.contextType === 'category' ? (aiResult.contextId || 'all') : (selectedNote?.categoryId || 'all'),
      score,
      total: quiz.length,
      userId: user.uid,
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, path), newResult);
      alert(`Quiz submitted! You got ${score} out of ${quiz.length} (${Math.round((score/quiz.length)*100)}%).`);
      
      // Auto-complete related task if it exists
      const quizTask = tasks.find(t => !t.completed && t.title.toLowerCase().includes('quiz'));
      if (quizTask) {
        updateTask(quizTask.id, { completed: true });
      }

      if (aiResult.contextType === 'category') {
          // just clear result
          setAiResult(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const handleAIAction = async (type: 'summary' | 'quiz' | 'mock_test' | 'guide' | 'chat' | 'spellcheck') => {
    if (!selectedNote || !selectedNote.content.trim()) return;
    
    if (type === 'chat') {
      setIsChatOpen(true);
      if (chatMessages.length === 0) {
        setChatMessages([{ role: 'model', content: `Hi! I'm your AI assistant. Ask me anything about "${selectedNote.title || 'this note'}".` }]);
      }
      return;
    }

    if (type === 'spellcheck') {
      handleSpellcheck();
      return;
    }

    setAiLoading(true);
    setAiResult(null);
    setSelectedQuizAnswers({});
    try {
      let data;
      const lang = userProfile?.language || 'English';
      const prof = userProfile?.profession || 'Professional';
      if (type === 'summary') data = await summarizeNote(selectedNote.content, lang, prof);
      if (type === 'quiz') data = await generateQuiz(selectedNote.content, lang, prof);
      if (type === 'mock_test') data = await generateMockTest(selectedNote.content, lang, prof);
      if (type === 'guide') {
        data = await generateStudyGuide(selectedNote.content, lang, prof);
        if (data && data.quickSummary) {
          updateNote(selectedNote.id, { quickSummary: data.quickSummary });
        }
      }
      setAiResult({ type, data, contextId: selectedNote.id, contextType: 'note' });
    } catch (error) {
      console.error(error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedNote || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const newMessages: Message[] = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessages(newMessages);
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: m.content }]
      }));
      const lang = userProfile?.language || 'English';
      const prof = userProfile?.profession || 'Professional';
      const response = await chatWithNote(selectedNote.content, userMessage, history, lang, prof);
      
      const taskMatches = [...response.matchAll(/\[ACTION:\s*CREATE_TASK\((.*?)\)\]/g)];
      if (taskMatches.length > 0) {
         taskMatches.forEach(m => createTask({ title: m[1], noteId: selectedNote.id }));
      }
      
      const cleanResponse = response.replace(/\[ACTION:[^\]]+\]/g, '').trim();
      setChatMessages([...newMessages, { role: 'model', content: cleanResponse }]);
    } catch (error) {
      console.error("Chat error", error);
      setChatMessages([...newMessages, { role: 'model', content: "I'm sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const injectAiResultToNote = () => {
    if (!selectedNote || !aiResult) return;
    
    let contentToAppend = "\n\n---\n";
    
    if (aiResult.type === 'summary') {
      contentToAppend += `## AI Summary\n${aiResult.data}`;
    } else if (aiResult.type === 'guide') {
      const guide = aiResult.data as StudyGuide;
      contentToAppend += `## AI Smart Brief\n\n### Summary\n${guide.summary}\n\n### Key Terms & Actions\n${guide.keyTerms.map(t => `- **${t.term}**: ${t.definition}`).join('\n')}\n\n### Core Concepts\n${guide.concepts.map(c => `#### ${c.title}\n${c.explanation}`).join('\n\n')}\n\n### Objectives\n${guide.learningObjectives.map(o => `- ${o}`).join('\n')}\n\n### Next Steps / Tips\n${guide.revisionTips.map(t => `- ${t}`).join('\n')}`;
    } else if (aiResult.type === 'quiz' || aiResult.type === 'mock_test') {
      const quiz = aiResult.data as QuizQuestion[];
      const title = aiResult.type === 'quiz' ? 'AI Quiz / Check' : 'AI Assessment';
      contentToAppend += `## ${title}\n\n${quiz.map((q, i) => `${i + 1}. ${q.question}\n   - ${q.options.join('\n   - ')}\n   *Correct Answer: ${q.options[q.correctAnswer]}*\n   *Explanation: ${q.explanation}*`).join('\n\n')}`;
    }

    updateNote(selectedNote.id, {
      content: selectedNote.content + contentToAppend
    });
    setAiResult(null);
  };

  const exportToPDF = async (targetId: string = 'note-content') => {
    if (!selectedNote) return;
    
    const element = document.getElementById(targetId);
    if (!element) return;

    try {
      setAiLoading(true);
      // html2canvas helps bypass the oklch parse error from html-to-image
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Parse Table of Contents
      const regex = /^(#{1,3})\s+(.*)$/gm;
      const headings = [];
      let match;
      while ((match = regex.exec(selectedNote.content)) !== null) {
        headings.push({ level: match[1].length, text: match[2].trim() });
      }

      // Add TOC page if there are headings
      if (headings.length > 0) {
        pdf.setFontSize(24);
        pdf.setTextColor(15, 23, 42); // slate-900
        pdf.text('Table of Contents', 20, 30);
        
        let y = 50;
        pdf.setFontSize(12);
        pdf.setTextColor(71, 85, 105); // slate-600
        
        headings.forEach(h => {
          if (y > pageHeight - 20) {
            pdf.addPage();
            y = 20;
          }
          const indent = (h.level - 1) * 10;
          pdf.text(h.text, 20 + indent, y);
          y += 10;
        });
        
        pdf.addPage();
      }

      // Add Image with Pagination for tall images
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      // Add Watermark
      const watermarkY = Math.min(heightLeft + pageHeight + 10, pageHeight - 10);
      pdf.setFontSize(8);
      pdf.setTextColor(200);
      pdf.text('Generated by AI Assistant • Protected by ProNotes', pdfWidth / 2, watermarkY, { align: 'center' });
      pdf.text(`Exported on ${new Date().toLocaleDateString()}`, pdfWidth / 2, watermarkY + 5, { align: 'center' });

      pdf.save(`${selectedNote.title || 'note'}-${targetId === 'note-content' ? 'note' : 'ai-analysis'}.pdf`);
    } catch (error) {
      console.error("PDF Export error", error);
    } finally {
      setAiLoading(false);
    }
  };

  const exportToMarkdown = () => {
    if (!selectedNote) return;
    const content = `# ${selectedNote.title || 'Note'}\n\n${selectedNote.content}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title || 'note'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToWord = () => {
    if (!selectedNote) return;
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${selectedNote.title}</title></head>
      <body>
        <h1>${selectedNote.title || 'Note'}</h1>
        ${selectedNote.content.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title || 'note'}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    if (!selectedNote) return;
    const content = `"Title","Content"\n"${(selectedNote.title || 'Note').replace(/"/g, '""')}","${selectedNote.content.replace(/"/g, '""')}"`;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedNote.title || 'note'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript && selectedNote) {
        updateNote(selectedNote.id, {
          content: selectedNote.content + (selectedNote.content.endsWith(' ') || selectedNote.content === '' ? '' : ' ') + finalTranscript
        });
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const toggleTextToSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    if (!selectedNote || !selectedNote.content) return;
    const utterance = new SpeechSynthesisUtterance(selectedNote.content);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleMultimodalImport = async (type: 'camera' | 'youtube' | 'text' | 'upload', data?: any) => {
    setIsImporting(true);
    try {
      let content = '';
      const lang = userProfile?.language || 'English';

      if ((type === 'camera' || type === 'upload') && data instanceof File) {
        content = await processStudyImage(data, lang);
      } else if (type === 'youtube') {
        content = await processStudyYoutube(youtubeUrl, lang);
      } else if (type === 'text') {
        content = importText;
      }

      if (content) {
        const noteId = doc(collection(db, '_')).id;
        const path = `users/${user?.uid}/notes/${noteId}`;
        const newNote = {
          id: noteId,
          title: type === 'youtube' ? 'YouTube Summary' : ((type === 'camera' || type === 'upload') ? 'Scanned Document' : 'Imported Text'),
          content: content,
          categoryId: activeCategoryId === 'all' ? 'math' : activeCategoryId,
          userId: user?.uid || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        await setDoc(doc(db, `users/${user?.uid}/notes`, noteId), newNote);
        openNote(noteId);
        setIsImportModalOpen(false);
        setImportType(null);
        setYoutubeUrl('');
        setImportText('');
      }
    } catch (error) {
      console.error("Import error", error);
    } finally {
      setIsImporting(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user && (onboardingStep === 'language' || !userProfile?.language)) {
    return (
      <LanguageSelectorView
        currentLanguage={userProfile?.language || 'English'}
        onSelectLanguage={async (lang) => {
          setTempLanguage(lang);
          localStorage.setItem('study_top_lang', lang);
          if (user) {
            try {
              const updates = {
                language: lang,
                profession: userProfile?.profession || 'Student',
                lastLogin: Date.now()
              };
              await updateDoc(doc(db, 'users', user.uid || user.id), updates).catch(() => {});
              setUserProfile(prev => prev ? { ...prev, ...updates } : ({
                uid: user.uid || user.id,
                email: user.email || '',
                displayName: user.displayName || 'Student',
                language: lang,
                profession: 'Student',
                lastLogin: Date.now()
              } as UserProfile));
            } catch (_) {}
          }
          setOnboardingStep(null);
        }}
        userEmail={user.email || ''}
      />
    );
  }

  if (isSuperAdminOpen) {
    return (
      <SuperAdminDashboard
        currentUser={user}
        onClose={() => {
          setIsSuperAdminOpen(false);
          if (window.location.hash.toLowerCase().includes('admin')) {
            window.location.hash = '';
          }
        }}
      />
    );
  }

  if (!user && !collabConfig) {
    if (unauthView === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => setUnauthView('login')}
          onSignIn={() => setUnauthView('login')}
          onExplore={() => setUnauthView('login')}
          onOpenAdmin={() => setIsSuperAdminOpen(true)}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={(loggedUser: FirebaseUser) => {
          setUser(loggedUser);
          setUserProfile({
            uid: loggedUser.uid,
            email: loggedUser.email || '',
            displayName: loggedUser.displayName || loggedUser.email?.split('@')[0] || 'Student',
            photoURL: loggedUser.photoURL || null,
            language: '', // opens language selector immediately next
            profession: 'Student',
            lastLogin: Date.now()
          });
          setOnboardingStep('language');
        }}
        onOpenAdmin={() => setIsSuperAdminOpen(true)}
        onExploreLanding={() => setUnauthView('landing')}
      />
    );
  }

  if (isCreateWorkspaceOpen) {
    return (
      <CreateNotesWorkspace
        onBack={() => setIsCreateWorkspaceOpen(false)}
        onCreateNote={(noteData) => {
          createNote({
            title: noteData.title,
            content: noteData.content,
            categoryId: noteData.categoryId,
            structuredData: noteData.structuredData
          });
          setIsCreateWorkspaceOpen(false);
        }}
        language={userProfile?.language}
      />
    );
  }

  if (isDiagramStudioOpen) {
    return (
      <DiagramStudioWorkspace
        onBack={() => setIsDiagramStudioOpen(false)}
        activeNote={selectedNote}
        onInsertIntoNote={(diagramMarkdown) => {
          if (selectedNote) {
            updateNote(selectedNote.id, {
              content: (selectedNote.content || '') + diagramMarkdown
            });
          }
        }}
        language={userProfile?.language}
      />
    );
  }

  if (exportingNote) {
    return (
      <NoteExportCenter
        note={exportingNote}
        onClose={() => setExportingNote(null)}
        language={userProfile?.language}
      />
    );
  }

  if (selectedNote) {
    return (
      <div className="min-h-screen w-full bg-slate-50 relative flex flex-col">
        <PointWiseNoteViewer
          note={selectedNote}
          onBack={() => setSelectedNoteId(null)}
          onDeleteNote={(id) => {
            deleteNote(id);
            setSelectedNoteId(null);
          }}
          language={userProfile?.language || 'English'}
        />
        {isStudyTopAiOpen && (
          <StudyTopAiAssistant
            isOpen={isStudyTopAiOpen}
            onClose={() => setIsStudyTopAiOpen(false)}
            activeNote={selectedNote}
            language={userProfile?.language || 'English'}
          />
        )}
        {!isStudyTopAiOpen && (
          <FloatingAiTrigger
            onClick={() => setIsStudyTopAiOpen(true)}
          />
        )}
      </div>
    );
  }


  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans selection:bg-blue-100 text-slate-900 relative">
      {userProfile && !userProfile.tutorialCompleted && localStorage.getItem('study_top_tutorial_done') !== 'true' && (
        <TutorialFlow 
          userProfile={userProfile} 
          onComplete={() => {
            localStorage.setItem('study_top_tutorial_done', 'true');
            setUserProfile(prev => prev ? { ...prev, tutorialCompleted: true } : null);
            if (user?.uid) {
              updateDoc(doc(db, 'users', user.uid), { tutorialCompleted: true }).catch(() => {});
            }
          }} 
        />
      )}

      {/* Active System Announcement banner */}
      {activeAnnouncement && (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 max-w-4xl mx-auto">
            <span className="bg-white/20 text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded">
              {activeAnnouncement.priority || 'Notice'}
            </span>
            <span className="font-semibold">{activeAnnouncement.title}:</span>
            <span className="text-blue-100 truncate">{activeAnnouncement.content}</span>
          </div>
          <button 
            onClick={() => setActiveAnnouncement(null)}
            className="text-white/80 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Study Top Post-Login Dashboard */}
      <StudyTopDashboard
        notes={notes}
        userProfile={userProfile}
        user={user}
        onOpenNote={(id) => {
          setSelectedNoteId(id);
          setNoteWorkspaceMode('editor');
        }}
        onCreateNewNote={() => setIsCreateWorkspaceOpen(true)}
        onOpenDiagramStudio={() => setIsDiagramStudioOpen(true)}
        onOpenAiAssistant={() => setIsStudyTopAiOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenAdmin={() => setIsSuperAdminOpen(true)}
        onDeleteNote={(id) => deleteNote(id)}
        onRestoreNote={(id) => {
          updateNote(id, { isDeleted: false, deletedAt: undefined });
        }}
        onPermanentlyDeleteNote={(id) => deleteNote(id)}
        onToggleFavorite={(id) => toggleFavorite(id)}
        onOpenExport={(note) => setExportingNote(note)}
        onSelectLanguage={() => setOnboardingStep('language')}
        onSignOut={handleLogout}
      />

      {/* Study Top AI Floating Assistant Drawer / Modal */}
      {isStudyTopAiOpen && (
        <StudyTopAiAssistant
          isOpen={isStudyTopAiOpen}
          onClose={() => setIsStudyTopAiOpen(false)}
          activeNote={null}
          language={userProfile?.language || 'English'}
        />
      )}

      {!isStudyTopAiOpen && (
        <FloatingAiTrigger
          onClick={() => setIsStudyTopAiOpen(true)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <NoteSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          note={notes[0] || null}
          categories={INITIAL_CATEGORIES}
          language={userProfile?.language || 'English'}
          onUpdate={(id, updates) => updateNote(id, updates)}
        />
      )}

      {/* Focus Timer Modal */}
      {isFocusTimerModalOpen && (
        <FocusTimerModal
          isOpen={isFocusTimerModalOpen}
          onClose={() => setIsFocusTimerModalOpen(false)}
          language={userProfile?.language || 'English'}
          onStartTimer={(duration, mode) => {
            setPomodoroTime(duration);
            setTimerMode(mode);
            setIsTimerRunning(true);
          }}
          isTimerRunning={isTimerRunning}
          pomodoroTime={pomodoroTime}
          timerMode={timerMode}
          stopTimer={() => setIsTimerRunning(false)}
        />
      )}

      {/* AI Agent Modal */}
      {isAiAgentModalOpen && (
        <AiAgentModal
          isOpen={isAiAgentModalOpen}
          onClose={() => setIsAiAgentModalOpen(false)}
          language={userProfile?.language || 'English'}
          onActionComplete={(actions) => {
            if (actions && actions.length > 0) {
              const summary = actions.map(a => `${a.type}: ${a.title || a.name || ''}`).join('\n');
              createNote({ title: 'AI Agent Tasks', content: summary });
            }
            setIsAiAgentModalOpen(false);
          }}
        />
      )}

      {/* Point-wise Notes Maker Modal */}
      {isPointWiseModalOpen && (
        <PointWiseNotesMakerModal
          isOpen={isPointWiseModalOpen}
          onClose={() => setIsPointWiseModalOpen(false)}
          userLanguage={userProfile?.language || 'English'}
          onSaveNote={(title, content, tags, categoryId) => {
            createNote({ title, content, tags, categoryId });
            setIsPointWiseModalOpen(false);
          }}
        />
      )}

      {/* Diagram Maker Modal */}
      {isDiagramModalOpen && (
        <DiagramMakerModal
          isOpen={isDiagramModalOpen}
          onClose={() => setIsDiagramModalOpen(false)}
          language={userProfile?.language || 'English'}
          onInsertIntoNote={(title, diagramMarkdown) => {
            createNote({
              title: title || 'New Diagram Note',
              content: diagramMarkdown
            });
            setIsDiagramModalOpen(false);
          }}
        />
      )}

      {/* Q&A Solver Modal */}
      {isQaModalOpen && (
        <QaAnswerSolverModal
          isOpen={isQaModalOpen}
          onClose={() => setIsQaModalOpen(false)}
          language={userProfile?.language || 'English'}
          onInsertIntoNote={(title, solutionMarkdown) => {
            createNote({
              title: title || 'Q&A Solution',
              content: solutionMarkdown
            });
            setIsQaModalOpen(false);
          }}
        />
      )}

      {/* Smart Note Creator Modal */}
      {isSmartNoteModalOpen && (
        <SmartNoteCreatorModal
          isOpen={isSmartNoteModalOpen}
          onClose={() => setIsSmartNoteModalOpen(false)}
          userLanguage={userProfile?.language || 'English'}
          onSaveNote={(newNote) => {
            createNote(newNote);
            setIsSmartNoteModalOpen(false);
          }}
          initialSource={smartNoteSource}
        />
      )}

      {/* Study Tools Hub Modal */}
      {isStudyToolsHubOpen && (
        <StudyToolsHubModal
          isOpen={isStudyToolsHubOpen}
          onClose={() => setIsStudyToolsHubOpen(false)}
          onOpenPointWise={() => setIsPointWiseModalOpen(true)}
          onOpenDiagram={() => setIsDiagramModalOpen(true)}
          onOpenQa={() => setIsQaModalOpen(true)}
          onOpenSmartNote={(source) => {
            setSmartNoteSource(source || 'text');
            setIsSmartNoteModalOpen(true);
          }}
          onOpenFocusTimer={() => setIsFocusTimerModalOpen(true)}
          onOpenCalculator={() => {}}
          onOpenCalendar={() => {}}
          onOpenResultMaker={() => {}}
        />
      )}
    </div>
  );
}
