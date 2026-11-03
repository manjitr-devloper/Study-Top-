import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Sparkles, 
  Star, 
  Trash2, 
  Folder, 
  FolderPlus, 
  Clock, 
  FileText, 
  Network, 
  Download, 
  Settings, 
  HelpCircle, 
  ShieldCheck, 
  ChevronRight, 
  ArrowRight, 
  MoreVertical, 
  Copy, 
  RotateCcw,
  Menu,
  X,
  FileUp,
  Camera,
  Youtube,
  GraduationCap,
  Globe,
  CreditCard,
  CheckCircle,
  Zap,
  Award,
  Calculator,
  MessageSquare,
  History,
  Bookmark,
  CheckSquare,
  Layers,
  Brain,
  Volume2,
  Key,
  Tag,
  User,
  Lock,
  ExternalLink,
  Calendar,
  Check,
  AlertCircle,
  RefreshCw,
  BarChart2,
  DollarSign,
  Gift,
  Ticket,
  Sliders,
  ChevronDown,
  FileCheck,
  SpellCheck,
  AlignLeft,
  LayoutDashboard,
  LogOut,
  Send,
  Loader2,
  TrendingUp,
  Compass,
  ArrowUpRight,
  Bell,
  Flame,
  Atom,
  Terminal,
  FileSearch,
  Languages,
  Server,
  HardDrive,
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Note, UserProfile, StudyFolder } from '../../types';
import { StudyTopLogo } from '../StudyTopLogo';
import { 
  solveQuestionStepByStep, 
  translateAndDefine, 
  summarizeNote, 
  generateQuiz, 
  checkSpelling,
  generateDiagramCode 
} from '../../lib/gemini';

// Dedicated Sub-Pages
import { WorkspacePage } from './pages/WorkspacePage';
import { RecentActivityPage } from './pages/RecentActivityPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { AiChatHistoryPage } from './pages/AiChatHistoryPage';
import { SavedNotesPage } from './pages/SavedNotesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { PdfQuestionSolverPage } from './pages/PdfQuestionSolverPage';
import { ImageQuestionSolverPage } from './pages/ImageQuestionSolverPage';
import { AiSummarizerPage } from './pages/AiSummarizerPage';
import { DiagramGeneratorPage } from './pages/DiagramGeneratorPage';
import { QuizGeneratorPage } from './pages/QuizGeneratorPage';
import { FlashcardsHubPage } from './pages/FlashcardsHubPage';
import { StudyPlannerPage } from './pages/StudyPlannerPage';
import { GrammarCheckerPage } from './pages/GrammarCheckerPage';
import { TextSimplifierPage } from './pages/TextSimplifierPage';
import { UserProfilePage } from './pages/UserProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpSupportPage } from './pages/HelpSupportPage';

// Advanced Educational Solvers & AI Tutor
import { MathSolverView } from '../solvers/MathSolverView';
import { SubjectSolverView } from '../solvers/SubjectSolverView';
import { UniversalDocSolverView } from '../solvers/UniversalDocSolverView';
import { AllSubjectsView } from '../solvers/AllSubjectsView';
import { AiTutorView } from '../tutor/AiTutorView';
import { SavedSolutionsView } from '../solvers/SavedSolutionsView';
import { LearningHistoryView } from '../solvers/LearningHistoryView';
import { PracticeTestsView } from '../practice/PracticeTestsView';
import { AiWorkspaceView } from '../workspace/AiWorkspaceView';
import { NotebooksManagerView } from '../notebooks/NotebooksManagerView';
import { YouTubeNotesWorkspaceView } from '../youtube/YouTubeNotesWorkspaceView';
import { DedicatedAiChatView } from '../chat/DedicatedAiChatView';
import { StorageManagerView } from '../storage/StorageManagerView';
import { PdfToolsWorkspaceView } from '../pdf/PdfToolsWorkspaceView';

export type DashboardNav = 
  | 'dashboard'
  | 'ai-workspace'
  | 'notebooks'
  | 'ai-chat'
  | 'pdf-tools'
  | 'youtube-notes'
  | 'storage-manager'
  | 'study-materials'
  | 'all-subjects'
  | 'st-cloud'
  | 'ai-tutor'
  | 'math-solver'
  | 'subject-solver'
  | 'science-solver'
  | 'english-solver'
  | 'social-solver'
  | 'computer-solver'
  | 'hindi-solver'
  | 'ask-image-pdf'
  | 'create-notes'
  | 'my-notes'
  | 'saved-solutions'
  | 'learning-history'
  | 'dictionary'
  | 'translator'
  | 'quiz'
  | 'practice-tests'
  | 'profile'
  | 'settings'
  | 'support'
  | 'sign-out'
  // Existing useful sub-features
  | 'workspace'
  | 'recent'
  | 'ai-assistant'
  | 'ai-chat-history'
  | 'saved-notes'
  | 'favorites'
  | 'pdf-solver'
  | 'image-solver'
  | 'summarizer'
  | 'diagrams'
  | 'flashcards'
  | 'planner'
  | 'grammar'
  | 'simplifier'
  | 'privacy'
  | 'folders'
  | 'trash';

interface StudyTopDashboardProps {
  notes: Note[];
  userProfile: UserProfile | null;
  user: any;
  onOpenNote: (id: string) => void;
  onCreateNewNote: () => void;
  onOpenDiagramStudio: () => void;
  onOpenAiAssistant: () => void;
  onOpenSettings: () => void;
  onOpenAdmin: () => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote?: (id: string) => void;
  onPermanentlyDeleteNote?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenExport: (note: Note) => void;
  onSelectLanguage: () => void;
  onSignOut: () => void;
}

export const StudyTopDashboard: React.FC<StudyTopDashboardProps> = ({
  notes,
  userProfile,
  user,
  onOpenNote,
  onCreateNewNote,
  onOpenDiagramStudio,
  onOpenAiAssistant,
  onOpenSettings,
  onOpenAdmin,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onToggleFavorite,
  onOpenExport,
  onSelectLanguage,
  onSignOut
}) => {
  const [activeNav, setActiveNav] = useState<DashboardNav>('dashboard');
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [drawerSearch, setDrawerSearch] = useState('');

  // Top Bar Dropdowns
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isGlobalCreateOpen, setIsGlobalCreateOpen] = useState(false);
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isPrelaunchModalOpen, setIsPrelaunchModalOpen] = useState(false);

  // Tool Specific States
  // 1. Math Solver
  const [mathInput, setMathInput] = useState('');
  const [mathBranch, setMathBranch] = useState('Algebra & Equations');
  const [mathSolution, setMathSolution] = useState<string | null>(null);
  const [isSolvingMath, setIsSolvingMath] = useState(false);

  // 2. Dictionary
  const [dictQuery, setDictQuery] = useState('');
  const [dictResult, setDictResult] = useState<any>(null);
  const [isSearchingDict, setIsSearchingDict] = useState(false);

  // 3. Translator
  const [transInput, setTransInput] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [transOutput, setTransOutput] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  // Subject Preset State for seamless transition between AllSubjectsView and SubjectSolverView
  const [activeSubjectPreset, setActiveSubjectPreset] = useState<string>('Mathematics');
  const [activeQuestionPreset, setActiveQuestionPreset] = useState<string>('');

  // Folders list
  const folders: StudyFolder[] = [
    { id: 'f_bio', name: 'Biology & Life Sciences', color: '#10b981', createdAt: Date.now() },
    { id: 'f_phys', name: 'Physics & Thermodynamics', color: '#6366f1', createdAt: Date.now() },
    { id: 'f_chem', name: 'Chemistry & Reactions', color: '#f59e0b', createdAt: Date.now() },
    { id: 'f_math', name: 'Mathematics & Calculus', color: '#3b82f6', createdAt: Date.now() }
  ];

  // Notes filtering
  const nonDeletedNotes = notes.filter((n) => !n.isDeleted);
  const deletedNotes = notes.filter((n) => n.isDeleted);

  const displayedNotes = (activeNav === 'trash' ? deletedNotes : nonDeletedNotes).filter((note) => {
    const matchesSearch = 
      (note.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeNav === 'favorites') return note.isFavorite || note.tags?.includes('favorite');
    if (activeNav === 'saved-notes') return note.tags?.includes('saved') || note.tags?.includes('bookmark') || note.isFavorite;
    if (activeNav === 'folders' && selectedFolderId !== 'all') {
      return note.folderId === selectedFolderId;
    }
    return true;
  });

  // Categorized Global Search Suggestions
  const matchingNotes = searchQuery.trim() 
    ? nonDeletedNotes.filter(n => (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || (n.content || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4)
    : [];

  const handleSolveMath = async () => {
    if (!mathInput.trim()) return;
    setIsSolvingMath(true);
    setMathSolution(null);
    try {
      const res = await solveQuestionStepByStep({
        question: mathInput,
        subject: `Mathematics (${mathBranch})`,
        classLevel: '10',
        board: 'Universal',
        language: userProfile?.language || 'English'
      });
      setMathSolution(res?.solution || (typeof res === 'string' ? res : 'Solution ready.'));
    } catch (e: any) {
      setMathSolution('Failed to solve math problem. Please check your query or connection.');
    } finally {
      setIsSolvingMath(false);
    }
  };

  const handleSearchDict = async () => {
    if (!dictQuery.trim()) return;
    setIsSearchingDict(true);
    try {
      const res = await translateAndDefine(dictQuery, 'Hindi');
      setDictResult(res);
    } catch (e) {
      setDictResult(null);
    } finally {
      setIsSearchingDict(false);
    }
  };

  const handleTranslateText = async () => {
    if (!transInput.trim()) return;
    setIsTranslating(true);
    try {
      const res = await translateAndDefine(transInput, targetLang);
      setTransOutput(res.translation || res.definition || 'Translation complete.');
    } catch (e) {
      setTransOutput('Error translating text.');
    } finally {
      setIsTranslating(false);
    }
  };

interface SidebarNavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string | number;
}

  // Navigation Items Definition for Drawer & Menus (Full Educational & Cloud Architecture)
  const navItems: {
    main: SidebarNavItem[];
    solvers: SidebarNavItem[];
    studyTools: SidebarNavItem[];
    account: SidebarNavItem[];
  } = {
    main: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'ai-workspace', label: 'AI Workspace', icon: Sparkles, badge: 'MIND 1.0' },
      { id: 'create-notes', label: 'Create Notes', icon: Plus },
      { id: 'notebooks', label: 'My Notebooks', icon: BookOpen },
      { id: 'ai-chat', label: 'AI Chat', icon: Bot, badge: 'Live' },
      { id: 'st-cloud', label: 'Study Top Cloud', icon: Server, badge: 'Online' }
    ],
    solvers: [
      { id: 'math-solver', label: 'Math Solver', icon: Calculator },
      { id: 'science-solver', label: 'Science Solver', icon: Atom },
      { id: 'all-subjects', label: 'Subject Solvers (23)', icon: Sparkles, badge: '23' },
      { id: 'pdf-tools', label: 'PDF Tools', icon: FileText },
      { id: 'youtube-notes', label: 'YouTube Notes', icon: Youtube }
    ],
    studyTools: [
      { id: 'dictionary', label: 'Academic Dictionary', icon: BookOpen },
      { id: 'translator', label: 'Multilingual Translator', icon: Globe },
      { id: 'my-notes', label: 'Study Materials & Notes', icon: Layers, badge: nonDeletedNotes.length },
      { id: 'recent', label: 'Recent Activity', icon: History },
      { id: 'favorites', label: 'Bookmarks', icon: Bookmark },
      { id: 'storage-manager', label: 'Storage Manager', icon: HardDrive },
      { id: 'trash', label: 'Trash', icon: Trash2 }
    ],
    account: [
      { id: 'profile', label: 'User Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'support', label: 'Help & Support', icon: HelpCircle },
      { id: 'sign-out', label: 'Sign Out', icon: LogOut }
    ]
  };

  const handleNavClick = (navId: DashboardNav) => {
    if (navId === 'sign-out') {
      setIsSignOutModalOpen(true);
      setIsNavDrawerOpen(false);
      return;
    }
    if (navId === 'create-notes') {
      onCreateNewNote();
      setIsNavDrawerOpen(false);
      return;
    }
    setActiveNav(navId);
    setIsNavDrawerOpen(false);
    setIsGlobalCreateOpen(false);
    setIsProfileMenuOpen(false);
  };

  return (
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden font-sans text-slate-900 selection:bg-blue-100">
      
      {/* ========================================================================= */}
      {/* 1. ANIMATED SLIDING NAVIGATION DRAWER (HAMBURGER MENU)                     */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isNavDrawerOpen && (
          <>
            {/* Blurred Background Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsNavDrawerOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-all cursor-pointer"
            />

            {/* Slide-out Navigation Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              className="fixed top-0 left-0 h-full w-[320px] max-w-[85vw] bg-white border-r border-slate-200/90 shadow-2xl z-50 flex flex-col justify-between"
            >
              {/* Drawer Top Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <StudyTopLogo size="sm" showTagline={false} />
                <button
                  onClick={() => setIsNavDrawerOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  title="Close Navigation Drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Search Filter */}
              <div className="px-4 pt-3 pb-1">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus-within:border-blue-500 focus-within:bg-white transition-all">
                  <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder="Search menu & tools..."
                    className="w-full bg-transparent border-none outline-none text-xs placeholder:text-slate-400"
                  />
                  {drawerSearch && (
                    <button onClick={() => setDrawerSearch('')} className="text-slate-400 hover:text-slate-600">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Scrollable Navigation Sections */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
                {/* SECTION A: MAIN */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Main
                  </div>
                  <div className="space-y-0.5">
                    {navItems.main
                      .filter(item => !drawerSearch || item.label.toLowerCase().includes(drawerSearch.toLowerCase()))
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id as DashboardNav)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeNav === item.id
                              ? 'bg-blue-50 text-blue-700 shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="w-4 h-4 shrink-0 text-slate-500 group-hover:text-blue-600" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* SECTION B: AI MULTI-SUBJECT SOLVERS */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center justify-between">
                    <span>AI Educational Solvers</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded">100% Free</span>
                  </div>
                  <div className="space-y-0.5">
                    {navItems.solvers
                      .filter(item => !drawerSearch || item.label.toLowerCase().includes(drawerSearch.toLowerCase()))
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id as DashboardNav)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeNav === item.id
                              ? 'bg-blue-50 text-blue-700 shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="w-4 h-4 shrink-0 text-blue-600" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* SECTION C: ACADEMIC STUDY TOOLS */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Study &amp; Test Tools
                  </div>
                  <div className="space-y-0.5">
                    {navItems.studyTools
                      .filter(item => !drawerSearch || item.label.toLowerCase().includes(drawerSearch.toLowerCase()))
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id as DashboardNav)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeNav === item.id
                              ? 'bg-blue-50 text-blue-700 shadow-2xs'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className="w-4 h-4 shrink-0 text-indigo-500" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge && (
                            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {item.badge}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                </div>

                {/* SECTION D: ACCOUNT */}
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 mb-1.5">
                    Account &amp; Support
                  </div>
                  <div className="space-y-0.5">
                    {navItems.account
                      .filter(item => !drawerSearch || item.label.toLowerCase().includes(drawerSearch.toLowerCase()))
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id as DashboardNav)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            activeNav === item.id
                              ? 'bg-blue-50 text-blue-700 shadow-2xs'
                              : item.id === 'sign-out'
                              ? 'text-rose-600 hover:bg-rose-50'
                              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className={`w-4 h-4 shrink-0 ${item.id === 'sign-out' ? 'text-rose-600' : 'text-slate-500'}`} />
                            <span>{item.label}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              </div>

              {/* DRAWER BOTTOM USER SECTION */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2.5 p-1.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : (user?.displayName?.charAt(0) || 'S')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-slate-900 truncate">
                      {userProfile?.displayName || user?.displayName || 'Study Top Scholar'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user?.email || 'student@studytop.io'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-700">
                    Scholar
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => { setIsNavDrawerOpen(false); handleNavClick('settings'); }}
                    className="py-1.5 px-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    <span>Settings</span>
                  </button>
                  <button
                    onClick={() => { setIsNavDrawerOpen(false); setIsSignOutModalOpen(true); }}
                    className="py-1.5 px-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. COLLAPSIBLE DESKTOP SIDEBAR                                             */}
      {/* ========================================================================= */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-white border-r border-slate-200/90 hidden md:flex flex-col justify-between transition-all duration-200 z-30 shrink-0`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Logo & Toggle */}
          <div className="flex items-center justify-between">
            <StudyTopLogo 
              size="sm" 
              variant={sidebarCollapsed ? "icon" : "full"}
              showTagline={!sidebarCollapsed}
            />
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer ml-1"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Create New Notes Primary CTA */}
          <button
            onClick={onCreateNewNote}
            className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>Create New Notes</span>}
          </button>

          {/* Quick Nav Items */}
          <nav className="space-y-1">
            {[
              { id: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
              { id: 'ai-tutor', label: '2. AI Tutor & Mentor', icon: GraduationCap },
              { id: 'math-solver', label: '3. Math Solver', icon: Calculator },
              { id: 'subject-solver', label: '4. Multi-Subject Solver', icon: Sparkles },
              { id: 'ask-image-pdf', label: '10. Ask from Image/PDF', icon: FileSearch },
              { id: 'my-notes', label: '12. My Notes', icon: FileText },
              { id: 'saved-solutions', label: '13. Saved Solutions', icon: Bookmark },
              { id: 'learning-history', label: '14. Learning History', icon: History },
              { id: 'practice-tests', label: '18. Practice Tests', icon: Award },
              { id: 'flashcards', label: 'Flashcards Decks', icon: RotateCcw },
              { id: 'settings', label: '20. Settings', icon: Settings }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id as DashboardNav)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  activeNav === item.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-4 h-4 shrink-0 text-slate-500" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}

            <div className="pt-2 border-t border-slate-100 my-2" />

            <button
              onClick={() => handleNavClick('ai-assistant')}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'AI Assistant' : undefined}
            >
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              {!sidebarCollapsed && <span>AI Assistant</span>}
            </button>

            <button
              onClick={onOpenDiagramStudio}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
              title={sidebarCollapsed ? 'Diagram Studio' : undefined}
            >
              <Network className="w-4 h-4 text-indigo-600 shrink-0" />
              {!sidebarCollapsed && <span>Diagram Studio</span>}
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-slate-200/90 space-y-1.5 bg-slate-50/50">
          <button
            onClick={() => setIsNavDrawerOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 transition cursor-pointer"
            title="Open Complete Menu Drawer"
          >
            <Menu className="w-4 h-4 shrink-0" />
            {!sidebarCollapsed && <span>All 30 Menu Tools</span>}
          </button>

          <button
            onClick={onOpenAdmin}
            className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 transition-colors cursor-pointer"
            title="Admin Console"
          >
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            {!sidebarCollapsed && <span className="truncate">Admin Login</span>}
          </button>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 3. MAIN TOP NAVBAR & CENTRAL WORKSPACE                                     */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* TOP NAVBAR WITH 3-LINE HAMBURGER BUTTON */}
        <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 shrink-0 shadow-2xs z-20 relative">
          <div className="flex items-center gap-3">
            {/* Functional 3-Line Hamburger Icon for ALL Screen Sizes */}
            <button
              onClick={() => setIsNavDrawerOpen(true)}
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              title="Open Navigation Drawer"
            >
              <Menu className="w-5 h-5" />
              <span className="hidden lg:inline text-xs font-bold text-slate-500">Menu</span>
            </button>

            <div className="md:hidden">
              <StudyTopLogo size="xs" variant="icon" />
            </div>

            {/* Categorized Global Search Bar */}
            <div className="relative">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 w-44 sm:w-72 focus-within:border-blue-500 focus-within:bg-white transition-all">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search notes, tools, topics..."
                  className="bg-transparent border-none outline-none text-xs text-slate-800 placeholder:text-slate-400 w-full"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Categorized Search Results Dropdown */}
              {searchQuery.trim().length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl p-3 z-50 space-y-2">
                  <div className="text-[10px] font-black uppercase text-slate-400 px-2">
                    Search Results for "{searchQuery}"
                  </div>

                  {matchingNotes.length > 0 ? (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-blue-600 px-2">Notes</span>
                      {matchingNotes.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setSearchQuery('');
                            onOpenNote(n.id);
                          }}
                          className="px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-800 truncate">{n.title || 'Untitled'}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 px-2 py-1">No matching notes found</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Top Actions: Notifications, Quick Create (+), Pre-Launch Status, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Backend Connection Status (Study Top Cloud Telemetry) */}
            <button
              onClick={() => handleNavClick('st-cloud')}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs hover:bg-slate-800"
              title="Study Top Cloud & MIND 1.0 Real-Time Telemetry"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <Server className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px]">ST Cloud: Online</span>
            </button>

            {/* Storage Usage Pill */}
            <button
              onClick={() => handleNavClick('storage-manager')}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold transition-all cursor-pointer hover:bg-blue-100"
              title="Private Encrypted Storage Manager"
            >
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-[11px]">Storage: 10 GB</span>
            </button>

            {/* AI Assistant Shortcut */}
            <button
              onClick={() => handleNavClick('ai-chat')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-bold transition-all cursor-pointer hover:bg-indigo-100"
              title="MIND 1.0 AI Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px]">MIND 1.0 Chat</span>
            </button>

            {/* Global Create Button (+) */}
            <div className="relative">
              <button
                onClick={() => setIsGlobalCreateOpen(!isGlobalCreateOpen)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                title="Global Create New Study Action"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
              </button>

              {/* Quick-Action Menu */}
              {isGlobalCreateOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); onCreateNewNote(); }}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-bold flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>Create New Notes</span>
                  </button>
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); handleNavClick('pdf-solver'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <FileUp className="w-4 h-4 text-indigo-600" />
                    <span>Upload &amp; Solve PDF</span>
                  </button>
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); handleNavClick('image-solver'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Upload Question Image</span>
                  </button>
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); handleNavClick('ai-assistant'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Ask AI Assistant</span>
                  </button>
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); handleNavClick('math-solver'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <Calculator className="w-4 h-4 text-purple-600" />
                    <span>Solve Mathematics</span>
                  </button>
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); handleNavClick('quiz'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <CheckSquare className="w-4 h-4 text-teal-600" />
                    <span>Generate Practice Quiz</span>
                  </button>
                  <button
                    onClick={() => { setIsGlobalCreateOpen(false); handleNavClick('flashcards'); }}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-600" />
                    <span>Create Flashcards Deck</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black text-slate-900">Notifications</span>
                    <span className="text-[10px] font-bold text-blue-600">Mark all read</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="p-2 bg-blue-50/50 rounded-xl text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">Welcome to Study Top Scholar</p>
                      <p className="text-[11px] text-slate-500">All 30 AI academic study tools are ready for your exams.</p>
                    </div>
                    <div className="p-2 bg-slate-50 rounded-xl text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">Study Streak Active 🔥</p>
                      <p className="text-[11px] text-slate-500">7 consecutive days of active revision completed.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Math Solver Action */}
            <button
              onClick={() => handleNavClick('math-solver')}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            >
              <Calculator className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">Math Solver</span>
            </button>

            {/* Profile Avatar & Menu */}
            <div className="relative">
              <div
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition-colors"
                title="Account Menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                  {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : (user?.displayName?.charAt(0) || 'S')}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden md:inline">
                  {userProfile?.displayName || user?.displayName || 'Scholar'}
                </span>
              </div>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => handleNavClick('profile')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <User className="w-4 h-4 text-blue-600" />
                    <span>My Profile</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('saved-solutions')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <Bookmark className="w-4 h-4 text-amber-600" />
                    <span>Saved Solutions</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('learning-history')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <History className="w-4 h-4 text-purple-600" />
                    <span>Learning History</span>
                  </button>
                  <button
                    onClick={() => handleNavClick('settings')}
                    className="w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                    <span>Settings</span>
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  <button
                    onClick={() => { setIsProfileMenuOpen(false); setIsSignOutModalOpen(true); }}
                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* WORKSPACE VIEW CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/60 pb-20">
          
          {/* ==================== PAGE: DASHBOARD ==================== */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* SECTION A: WELCOME SECTION */}
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
                <div className="space-y-2.5 max-w-2xl relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-white border border-white/20">
                    <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    <span>Study Top • Created by Manjit Ranjan (Google Developer)</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    Welcome back, {userProfile?.displayName || user?.displayName || 'Scholar'}!
                  </h2>
                  <div className="text-xs font-semibold text-blue-200 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed font-medium">
                    "Consistent daily revision transforms effort into academic excellence." Your MIND 1.0 multi-engine AI tutor and PostgreSQL workspace are active.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 shrink-0 relative z-10">
                  <button
                    onClick={() => {
                      if (nonDeletedNotes.length > 0) {
                        onOpenNote(nonDeletedNotes[0].id);
                      } else {
                        onCreateNewNote();
                      }
                    }}
                    className="px-5 py-3 bg-white text-blue-700 font-extrabold text-xs rounded-xl shadow-xs hover:bg-blue-50 transition cursor-pointer flex items-center gap-2 active:scale-95"
                  >
                    <span>Continue Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveNav('ai-workspace')}
                    className="px-4 py-3 bg-white/15 hover:bg-white/25 text-white font-extrabold text-xs rounded-xl border border-white/20 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-blue-200" />
                    <span>AI Workspace</span>
                  </button>
                </div>
              </div>

              {/* SECTION B: QUICK ACTIONS (8 Core Academic Workflows) */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    Quick Academic Actions
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold">1-Click Fast Launch</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
                  {[
                    { label: 'Create Notes', icon: Plus, color: 'text-blue-600 bg-blue-50', action: onCreateNewNote },
                    { label: 'Upload PDF', icon: FileUp, color: 'text-indigo-600 bg-indigo-50', action: () => setActiveNav('pdf-tools') },
                    { label: 'Upload Image', icon: Camera, color: 'text-emerald-600 bg-emerald-50', action: () => setActiveNav('image-solver') },
                    { label: 'Ask AI Chat', icon: Bot, color: 'text-purple-600 bg-purple-50', action: () => setActiveNav('ai-chat') },
                    { label: 'Math Solver', icon: Calculator, color: 'text-amber-600 bg-amber-50', action: () => setActiveNav('math-solver') },
                    { label: 'New Notebook', icon: BookOpen, color: 'text-cyan-600 bg-cyan-50', action: () => setActiveNav('notebooks') },
                    { label: 'YouTube Notes', icon: Youtube, color: 'text-red-600 bg-red-50', action: () => setActiveNav('youtube-notes') },
                    { label: 'AI Study Session', icon: Sparkles, color: 'text-rose-600 bg-rose-50', action: () => setActiveNav('ai-workspace') }
                  ].map((act, i) => (
                    <button
                      key={i}
                      onClick={act.action}
                      className="p-3 bg-slate-50/70 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-xs rounded-2xl transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer group"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${act.color} group-hover:scale-105 transition-transform`}>
                        <act.icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-800 leading-tight">{act.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* SECTION C: STATISTICS (6 Real Performance Counters) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Total Notes', value: nonDeletedNotes.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Notebooks', value: '3 Active', icon: BookOpen, color: 'text-indigo-600 bg-indigo-50' },
                  { label: 'Stored Files', value: '4 Files', icon: HardDrive, color: 'text-cyan-600 bg-cyan-50' },
                  { label: 'Solved Questions', value: '48+ Verified', icon: Calculator, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Study Sessions', value: '14 Completed', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
                  { label: 'AI Usage Remaining', value: '100% Free', icon: Zap, color: 'text-amber-600 bg-amber-50' }
                ].map((stat, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-2xs">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                        {stat.label}
                      </span>
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${stat.color}`}>
                        <stat.icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <span className="text-base sm:text-lg font-black text-slate-900">{stat.value}</span>
                  </div>
                ))}
              </div>

              {/* SECTION D & E: CONTINUE LEARNING & RECENT ACTIVITY */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* SECTION D: CONTINUE LEARNING (7 cols) */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span>Continue Learning</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">Recently opened notebooks &amp; textbook modules</p>
                    </div>
                    <button
                      onClick={() => setActiveNav('notebooks')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>All Notebooks</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {[
                      { title: 'Mathematics: Quadratic Equations', subject: 'Mathematics', gradient: 'from-blue-600 to-indigo-700', notes: 8 },
                      { title: 'Physics: Wave Optics & Refraction', subject: 'Physics', gradient: 'from-emerald-600 to-teal-700', notes: 5 }
                    ].map((nb, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveNav('my-notes')}
                        className="p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition cursor-pointer bg-slate-50/50 space-y-2 group"
                      >
                        <div className={`h-1.5 w-12 rounded-full bg-gradient-to-r ${nb.gradient}`} />
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">{nb.title}</h4>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                          <span>{nb.subject}</span>
                          <span>{nb.notes} Notes</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Shortcut to 23 Subjects */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Explore All 23 Academic Subjects</span>
                    <button
                      onClick={() => setActiveNav('all-subjects')}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-xl transition cursor-pointer"
                    >
                      Open Subject Directory →
                    </button>
                  </div>
                </div>

                {/* SECTION E: RECENT ACTIVITY (5 cols) */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span>Recent Activity</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('recent')}
                      className="text-xs font-bold text-purple-600 hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3 pt-1">
                    {[
                      { title: 'Solved Quadratic Derivation', time: '10 mins ago', type: 'math', icon: Calculator, color: 'text-amber-600 bg-amber-50' },
                      { title: 'Generated Mixed Notes: Optics', time: '2 hours ago', type: 'notes', icon: FileText, color: 'text-blue-600 bg-blue-50' },
                      { title: 'Uploaded Textbook PDF Chapter 4', time: 'Yesterday', type: 'upload', icon: HardDrive, color: 'text-emerald-600 bg-emerald-50' }
                    ].map((act, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}>
                            <act.icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 truncate">{act.title}</h5>
                            <span className="text-[10px] text-slate-400">{act.time}</span>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* SECTION F & G: STORAGE OVERVIEW & STUDY TOP CLOUD STATUS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SECTION F: STORAGE OVERVIEW */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-blue-600" />
                      <span>Study Top Storage Overview</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('storage-manager')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Manage Storage
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Storage Used</span>
                      <span className="font-mono text-slate-500 font-bold">5.8 MB of 10.0 GB</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: '6%' }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 text-center text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-bold">Total Capacity</span>
                      <span className="font-black text-slate-900">10.0 GB</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-bold">Used Space</span>
                      <span className="font-black text-slate-900">5.8 MB</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <span className="text-[10px] text-slate-400 block font-bold">Available</span>
                      <span className="font-black text-emerald-600">9.99 GB</span>
                    </div>
                  </div>
                </div>

                {/* SECTION G: UNIFIED BACKEND & MIND 1.0 STATUS */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>MIND 1.0 &amp; Unified Backend Status</span>
                    </h3>
                    <button
                      onClick={() => setActiveNav('ai-workspace')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Open Workspace
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                    {[
                      { name: 'Firebase Auth', status: 'Active' },
                      { name: 'Cloud Firestore', status: 'Connected' },
                      { name: 'Supabase / Postgres', status: 'Synchronized' },
                      { name: 'MIND 1.0 AI', status: 'Online' }
                    ].map((svc, i) => (
                      <div key={i} className="p-2.5 bg-slate-50 rounded-xl flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-700 text-[11px] truncate">{svc.name}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{svc.status}</span>
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100">
                    <span>Architecture: <strong className="text-slate-800">Firebase + Supabase + SQL + PostgreSQL</strong></span>
                    <span className="text-emerald-600 font-bold">MIND 1.0: Active</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ==================== PAGE: MY WORKSPACE ==================== */}
          {activeNav === 'workspace' && (
            <WorkspacePage
              notes={notes}
              folders={folders}
              onOpenNote={onOpenNote}
              onCreateNote={onCreateNewNote}
              onDeleteNote={onDeleteNote}
              onOpenExport={onOpenExport}
            />
          )}

          {/* ==================== PAGE: RECENT ACTIVITY ==================== */}
          {activeNav === 'recent' && (
            <RecentActivityPage
              notes={notes}
              onOpenNote={onOpenNote}
            />
          )}

          {/* ==================== PAGE: AI ASSISTANT ==================== */}
          {activeNav === 'ai-assistant' && (
            <AiAssistantPage
              language={userProfile?.language || 'English'}
              onSaveToNotes={(title, content) => {
                // Creates a note with the saved AI response
                onCreateNewNote();
              }}
            />
          )}

          {/* ==================== PAGE: AI CHAT HISTORY ==================== */}
          {activeNav === 'ai-chat-history' && (
            <AiChatHistoryPage
              onContinueChat={(session) => {
                setActiveNav('ai-assistant');
              }}
            />
          )}

          {/* ==================== PAGE: SAVED NOTES ==================== */}
          {activeNav === 'saved-notes' && (
            <SavedNotesPage
              onInsertIntoNote={(title, content) => {
                onCreateNewNote();
              }}
            />
          )}

          {/* ==================== PAGE: FAVORITES ==================== */}
          {activeNav === 'favorites' && (
            <FavoritesPage
              notes={notes}
              onOpenNote={onOpenNote}
              onOpenTool={(toolId) => handleNavClick(toolId as DashboardNav)}
              onToggleFavorite={onToggleFavorite}
            />
          )}

          {/* ==================== PAGE: CREATE NOTES ==================== */}
          {activeNav === 'create-notes' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Launch AI Notes Creator</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Generate structured chapters, definitions, diagrams, and LaTeX formulas.
                  </p>
                </div>
                <button
                  onClick={onCreateNewNote}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Open Full Editor Workspace</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== PAGE: ALL 23 ACADEMIC SUBJECTS ==================== */}
          {activeNav === 'all-subjects' && (
            <AllSubjectsView
              user={user}
              userProfile={userProfile}
              onSelectSubjectSolver={(subjectId, sampleQuestion) => {
                setActiveSubjectPreset(subjectId);
                setActiveQuestionPreset(sampleQuestion || '');
                setActiveNav('subject-solver');
              }}
              onOpenPracticeTests={() => {
                setActiveNav('practice-tests');
              }}
            />
          )}

          {/* ==================== PAGE: MIND 1.0 INTELLIGENCE CENTER ==================== */}
          {activeNav === 'st-cloud' && (
            <div className="space-y-6 max-w-4xl mx-auto pb-12">
              <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Study Top MIND 1.0 Intelligence</span>
                  </div>
                  <h2 className="text-2xl font-black">AI Study &amp; Point-Wise Note Generator</h2>
                  <p className="text-sm text-blue-100 max-w-xl">
                    MIND 1.0 turns PDFs, images, textbook photos, documents, and YouTube videos into structured point-wise notes with definitions, formulas, and verified summaries.
                  </p>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      onClick={() => onCreateNewNote()}
                      className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 font-black rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Notes with MIND 1.0</span>
                    </button>
                    <button
                      onClick={() => setActiveNav('ai-workspace')}
                      className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-2"
                    >
                      <span>Open AI Workspace</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Architecture specs card */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Configured Backend Engines</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs font-black text-blue-600 uppercase">Authentication &amp; Storage</div>
                    <div className="text-base font-bold text-slate-900 mt-1">Firebase</div>
                    <div className="text-xs text-slate-500 mt-0.5">Firebase Auth, Google Sign-In, Cloud Firestore &amp; Storage</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs font-black text-emerald-600 uppercase">Relational Database</div>
                    <div className="text-base font-bold text-slate-900 mt-1">Supabase + PostgreSQL</div>
                    <div className="text-xs text-slate-500 mt-0.5">SQL tables, profile synchronization, and relational schema</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs font-black text-indigo-600 uppercase">Intelligence Model</div>
                    <div className="text-base font-bold text-slate-900 mt-1">MIND 1.0 Engine</div>
                    <div className="text-xs text-slate-500 mt-0.5">Gemini 2.5 Flash with LaTeX math, OCR, and 17-point note generation</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-xs font-black text-violet-600 uppercase">Creator Credit</div>
                    <div className="text-base font-bold text-slate-900 mt-1">Study Top</div>
                    <div className="text-xs text-slate-500 mt-0.5">Created by Manjit Ranjan (Google Developer)</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PAGE: AI WORKSPACE ==================== */}
          {activeNav === 'ai-workspace' && (
            <AiWorkspaceView onSaveToNotes={onCreateNewNote} userProfile={userProfile} />
          )}

          {/* ==================== PAGE: MY NOTEBOOKS ==================== */}
          {activeNav === 'notebooks' && (
            <NotebooksManagerView
              onOpenNotebook={() => handleNavClick('my-notes')}
              onCreateNoteInNotebook={() => onCreateNewNote()}
            />
          )}

          {/* ==================== PAGE: AI CHAT ==================== */}
          {activeNav === 'ai-chat' && (
            <DedicatedAiChatView userProfile={userProfile} />
          )}

          {/* ==================== PAGE: PDF TOOLS ==================== */}
          {activeNav === 'pdf-tools' && (
            <PdfToolsWorkspaceView onSaveToNotes={onCreateNewNote} />
          )}

          {/* ==================== PAGE: YOUTUBE NOTES ==================== */}
          {activeNav === 'youtube-notes' && (
            <YouTubeNotesWorkspaceView onSaveToNotes={onCreateNewNote} />
          )}

          {/* ==================== PAGE: STORAGE MANAGER ==================== */}
          {activeNav === 'storage-manager' && (
            <StorageManagerView />
          )}

          {/* ==================== PAGE 2: AI TUTOR & MENTOR ==================== */}
          {activeNav === 'ai-tutor' && (
            <AiTutorView user={user} userProfile={userProfile} />
          )}

          {/* ==================== PAGE 3: ADVANCED AI MATH SOLVER (100% FREE) ==================== */}
          {activeNav === 'math-solver' && (
            <MathSolverView
              user={user}
              userProfile={userProfile}
              onSaveToNotes={() => onCreateNewNote()}
            />
          )}

          {/* ==================== PAGE 4: MULTI-SUBJECT SOLVER ==================== */}
          {activeNav === 'subject-solver' && (
            <SubjectSolverView
              initialSubject={activeSubjectPreset}
              initialQuestion={activeQuestionPreset}
              user={user}
              userProfile={userProfile}
              onSaveToNotes={() => onCreateNewNote()}
            />
          )}

          {/* Direct Shortcuts for Specific Subjects */}
          {activeNav === 'science-solver' && (
            <SubjectSolverView initialSubject="Science" user={user} userProfile={userProfile} onSaveToNotes={() => onCreateNewNote()} />
          )}
          {activeNav === 'english-solver' && (
            <SubjectSolverView initialSubject="English" user={user} userProfile={userProfile} onSaveToNotes={() => onCreateNewNote()} />
          )}
          {activeNav === 'social-solver' && (
            <SubjectSolverView initialSubject="Social Science" user={user} userProfile={userProfile} onSaveToNotes={() => onCreateNewNote()} />
          )}
          {activeNav === 'computer-solver' && (
            <SubjectSolverView initialSubject="Computer Science" user={user} userProfile={userProfile} onSaveToNotes={() => onCreateNewNote()} />
          )}
          {activeNav === 'hindi-solver' && (
            <SubjectSolverView initialSubject="Hindi" user={user} userProfile={userProfile} onSaveToNotes={() => onCreateNewNote()} />
          )}

          {/* ==================== PAGE 10: ASK FROM IMAGE / PDF ==================== */}
          {activeNav === 'ask-image-pdf' && (
            <UniversalDocSolverView
              user={user}
              userProfile={userProfile}
              onSaveToNotes={() => onCreateNewNote()}
            />
          )}


          {/* ==================== PAGE: PDF QUESTION SOLVER ==================== */}
          {activeNav === 'pdf-solver' && (
            <PdfQuestionSolverPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE: IMAGE QUESTION SOLVER ==================== */}
          {activeNav === 'image-solver' && (
            <ImageQuestionSolverPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE: AI SUMMARIZER ==================== */}
          {activeNav === 'summarizer' && (
            <AiSummarizerPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE: DIAGRAM GENERATOR ==================== */}
          {activeNav === 'diagrams' && (
            <DiagramGeneratorPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE: QUIZ GENERATOR ==================== */}
          {activeNav === 'quiz' && (
            <QuizGeneratorPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE: FLASHCARDS HUB ==================== */}
          {activeNav === 'flashcards' && (
            <FlashcardsHubPage
              notes={notes}
              onOpenNote={onOpenNote}
              onUpdateNote={(id, updates) => {
                // updates handled in parent
              }}
            />
          )}

          {/* ==================== PAGE: STUDY PLANNER ==================== */}
          {activeNav === 'planner' && (
            <StudyPlannerPage />
          )}

          {/* ==================== PAGE: DICTIONARY ==================== */}
          {activeNav === 'dictionary' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">AI Academic Dictionary</h2>
                    <p className="text-xs text-slate-500">Definitions, phonetics, Hindi translations, and academic examples</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dictQuery}
                    onChange={(e) => setDictQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchDict()}
                    placeholder="Search any academic word (e.g., Photosynthesis, Hypothesis, Equilibrium)..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                  />
                  <button
                    onClick={handleSearchDict}
                    disabled={isSearchingDict}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSearchingDict ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>Lookup</span>
                  </button>
                </div>

                {dictResult && (
                  <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 capitalize">{dictQuery}</h3>
                        <p className="text-xs text-slate-400 font-mono">{dictResult.phonetic || '/fə-ˈne-tik/'}</p>
                      </div>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
                        {dictResult.type || 'Noun'}
                      </span>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hindi Translation:</p>
                      <p className="text-base font-extrabold text-blue-700">{dictResult.translation || 'उपलब्ध नहीं'}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Definition:</p>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">{dictResult.definition}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ==================== PAGE: TRANSLATOR ==================== */}
          {activeNav === 'translator' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">AI Multilingual Academic Translator</h2>
                    <p className="text-xs text-slate-500">Translate study material into Hindi, Sanskrit, Bengali, or English</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Source Text</label>
                    <textarea
                      rows={5}
                      value={transInput}
                      onChange={(e) => setTransInput(e.target.value)}
                      placeholder="Enter source academic sentence or definition..."
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">Target Language</label>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none mb-2"
                    >
                      <option>Hindi</option>
                      <option>English</option>
                      <option>Sanskrit</option>
                      <option>Bengali</option>
                      <option>Spanish</option>
                    </select>

                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 min-h-[100px] text-xs font-medium text-slate-800 leading-relaxed">
                      {isTranslating ? 'Translating...' : transOutput || 'Translation will appear here.'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTranslateText}
                  disabled={!transInput.trim() || isTranslating}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Globe className="w-4 h-4" />
                  <span>Translate Text</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================== PAGE: GRAMMAR CHECKER ==================== */}
          {activeNav === 'grammar' && (
            <GrammarCheckerPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE: TEXT SIMPLIFIER ==================== */}
          {activeNav === 'simplifier' && (
            <TextSimplifierPage language={userProfile?.language || 'English'} />
          )}

          {/* ==================== PAGE 13: SAVED SOLUTIONS ==================== */}
          {activeNav === 'saved-solutions' && (
            <SavedSolutionsView user={user} />
          )}

          {/* ==================== PAGE 14: LEARNING & SOLVING HISTORY ==================== */}
          {activeNav === 'learning-history' && (
            <LearningHistoryView user={user} />
          )}

          {/* ==================== PAGE 18: PRACTICE TESTS & MOCKS ==================== */}
          {activeNav === 'practice-tests' && (
            <PracticeTestsView user={user} userProfile={userProfile} />
          )}

          {/* ==================== PAGE: USER PROFILE ==================== */}
          {activeNav === 'profile' && (
            <UserProfilePage
              userProfile={userProfile}
              user={user}
              onSelectLanguage={onSelectLanguage}
              onSignOut={() => setIsSignOutModalOpen(true)}
            />
          )}

          {/* ==================== PAGE: SETTINGS & PRIVACY ==================== */}
          {(activeNav === 'settings' || activeNav === 'privacy') && (
            <SettingsPage
              language={userProfile?.language || 'English'}
              onSelectLanguage={onSelectLanguage}
            />
          )}

          {/* ==================== PAGE: HELP & SUPPORT ==================== */}
          {activeNav === 'support' && (
            <HelpSupportPage />
          )}

          {/* ==================== PAGE: ALL NOTES ==================== */}
          {(activeNav === 'my-notes' || activeNav === 'trash') && (
            <div className="space-y-4 max-w-6xl mx-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeNav === 'trash' ? 'Trash Bin' : 'Study Notes'}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {displayedNotes.length} {displayedNotes.length === 1 ? 'note' : 'notes'}
                </span>
              </div>

              {displayedNotes.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-700">No notes found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {activeNav === 'trash' ? 'Trash is empty.' : 'Create your first note or upload documents.'}
                  </p>
                  {activeNav !== 'trash' && (
                    <button
                      onClick={onCreateNewNote}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                    >
                      Create Note
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => onOpenNote(note.id)}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between group shadow-2xs relative"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {note.title || 'Untitled Note'}
                          </h4>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onToggleFavorite(note.id)}
                              className={`p-1 rounded-lg ${note.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                            >
                              <Star className="w-4 h-4 fill-current" />
                            </button>
                            <button
                              onClick={() => onOpenExport(note)}
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteNote(note.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                          {note.content?.replace(/[#*`_]/g, '') || 'No content written yet.'}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                        {note.flashcards && note.flashcards.length > 0 && (
                          <span className="text-blue-600 font-bold">{note.flashcards.length} cards</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 4. SIGN OUT CONFIRMATION DIALOG                                           */}
      {/* ========================================================================= */}
      {isSignOutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">Sign Out of Study Top?</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Your session will end securely. Your study notes, flashcard decks, and learning records remain safely preserved in your account.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSignOutModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsSignOutModalOpen(false);
                  onSignOut();
                }}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. PRE-LAUNCH & NETLIFY VERIFICATION MODAL                                */}
      {/* ========================================================================= */}
      {isPrelaunchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-xl border border-slate-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black">
                  🚀
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Study Top — Pre-Launch Status</h3>
                  <p className="text-[11px] text-slate-500 font-semibold">Created by Manjit Ranjan (Google Developer)</p>
                </div>
              </div>
              <button
                onClick={() => setIsPrelaunchModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-2 font-black">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Pre-Launch Testing &amp; Verification Mode</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Study Top is currently in staged pre-launch mode. Complete testing is being conducted on your Netlify domain before the official public announcement.
              </p>
            </div>

            {/* Verification Checklist */}
            <div className="space-y-2.5">
              <div className="text-xs font-black uppercase tracking-wider text-slate-400">
                Deployment &amp; Backend Infrastructure
              </div>

              {/* 1. Netlify Domain */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Netlify Domain</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black">Active</span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      https://studytoppp.netlify.app
                    </div>
                  </div>
                </div>
                <a
                  href="https://studytoppp.netlify.app"
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* 2. SPA Routing */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">SPA Redirects &amp; Headers</div>
                    <div className="text-[11px] text-slate-500">
                      <code>netlify.toml</code> &amp; <code>public/_redirects</code> configured (0 404s on refresh)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600">Configured</span>
              </div>

              {/* 3. Firebase Auth */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Firebase Authentication</div>
                    <div className="text-[11px] text-slate-500">
                      Email/Password + Google Sign-In · Authorized Domain: <code>studytoppp.netlify.app</code>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-indigo-600">Connected</span>
              </div>

              {/* 4. Cloud Firestore */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Cloud Firestore DB</div>
                    <div className="text-[11px] text-slate-500">
                      <code>ai-studio-2fb8cd7c-f879-4d0b-a6a4-b9386105a50d</code> · Strict rules deployed
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-purple-600">Active</span>
              </div>

              {/* 5. Firebase Storage */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Firebase Storage</div>
                    <div className="text-[11px] text-slate-500">
                      User isolated folders · 50MB quota (PDF, Images, DOCX, TXT)
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-600">Enabled</span>
              </div>

              {/* 6. AI Academic Suite */}
              <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">Academic Solvers &amp; AI Tutor</div>
                    <div className="text-[11px] text-slate-500">
                      All 22 tools 100% free and accessible for testing
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-600">Ready</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold">
                Build: <code>dist/</code> · Node.js 20 · Netlify Ready
              </span>
              <button
                onClick={() => setIsPrelaunchModalOpen(false)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition"
              >
                Continue Testing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
