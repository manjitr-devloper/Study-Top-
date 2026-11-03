import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  Sparkles, 
  Plus, 
  FileText, 
  FileUp, 
  Youtube, 
  Camera, 
  Trash2, 
  Check, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Headphones, 
  Send, 
  Copy, 
  Download, 
  Share2, 
  Edit3, 
  CheckSquare, 
  Square, 
  ListOrdered, 
  HelpCircle, 
  BookOpen, 
  Clock, 
  Layers, 
  ChevronRight, 
  ExternalLink,
  ChevronDown,
  Loader2,
  Mic,
  BookmarkPlus,
  RefreshCw,
  Search,
  X
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Note, NotebookSource, AudioOverviewData, StudioNoteItem } from '../types';
import { 
  chatWithNotebookSources, 
  generateAudioOverviewScript, 
  generateStudioGuide 
} from '../lib/gemini';

interface NotebookLMStudioProps {
  note: Note;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onBack: () => void;
  onOpenStudyTools: () => void;
  onOpenPointWise: () => void;
  onOpenDiagram: () => void;
  onOpenSmartNote: (source?: 'text' | 'camera' | 'images' | 'pdf' | 'youtube') => void;
  language: string;
}

export const NotebookLMStudio: React.FC<NotebookLMStudioProps> = ({
  note,
  onUpdateNote,
  onBack,
  onOpenStudyTools,
  onOpenPointWise,
  onOpenDiagram,
  onOpenSmartNote,
  language
}) => {
  // Mobile Tab view: 'sources' | 'chat' | 'notes'
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat' | 'notes'>('chat');

  // Title state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(note.title);

  // Sources State
  const sources: NotebookSource[] = note.sources && note.sources.length > 0
    ? note.sources
    : [
        {
          id: 'src_primary',
          title: note.title ? `${note.title} (Primary Document)` : 'Primary Document',
          type: 'text',
          content: note.content || 'Start taking notes or add sources to ground your AI assistant.',
          selected: true,
          dateAdded: note.createdAt || Date.now(),
          size: `${Math.round((note.content || '').length / 1024 * 10) / 10} KB`
        }
      ];

  const selectedSources = sources.filter(s => s.selected);

  // Studio Notes State
  const studioNotes: StudioNoteItem[] = note.studioNotes && note.studioNotes.length > 0
    ? note.studioNotes
    : [
        {
          id: 'note_1',
          title: 'Main Notes & Outline',
          content: note.content || 'Use this studio note to synthesize key learnings and prepare for exams.',
          updatedAt: note.updatedAt || Date.now(),
          pinned: true
        }
      ];

  const [activeStudioNoteId, setActiveStudioNoteId] = useState<string>(studioNotes[0]?.id || 'note_1');
  const activeStudioNote = studioNotes.find(n => n.id === activeStudioNoteId) || studioNotes[0];

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{
    id: string;
    role: 'user' | 'model';
    content: string;
    citations?: { index: number; sourceTitle: string; quote: string }[];
    timestamp: number;
  }>>([
    {
      id: 'welcome',
      role: 'model',
      content: `Welcome to **${note.title || 'your Notebook'}**! I am your Study Top research assistant grounded in your **${selectedSources.length} selected source(s)**.\n\nAsk me questions, generate study guides, or click **Audio Overview** above to hear a deep-dive conversation between two AI hosts.`,
      timestamp: Date.now()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio Overview State
  const [audioOverview, setAudioOverview] = useState<AudioOverviewData>(
    note.audioOverview || { status: 'idle' }
  );
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Add Source Modal State
  const [isAddSourceModalOpen, setIsAddSourceModalOpen] = useState(false);
  const [addSourceType, setAddSourceType] = useState<'text' | 'pdf' | 'youtube'>('text');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceContent, setNewSourceContent] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');

  // Selected Source Inspection Modal
  const [inspectingSource, setInspectingSource] = useState<NotebookSource | null>(null);

  // Quick Citation Popup
  const [activeCitation, setActiveCitation] = useState<{ index: number; sourceTitle: string; quote: string } | null>(null);

  // Studio Guide Generating
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Sync title updates
  const handleSaveTitle = () => {
    if (titleInput.trim() && titleInput !== note.title) {
      onUpdateNote(note.id, { title: titleInput.trim(), updatedAt: Date.now() });
    }
    setIsEditingTitle(false);
  };

  // Toggle Source Selection
  const toggleSourceSelection = (sourceId: string) => {
    const updated = sources.map(s => s.id === sourceId ? { ...s, selected: !s.selected } : s);
    onUpdateNote(note.id, { sources: updated, updatedAt: Date.now() });
  };

  // Toggle All Sources Selection
  const toggleSelectAllSources = () => {
    const allSelected = sources.every(s => s.selected);
    const updated = sources.map(s => ({ ...s, selected: !allSelected }));
    onUpdateNote(note.id, { sources: updated, updatedAt: Date.now() });
  };

  // Delete Source
  const handleDeleteSource = (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Remove this source from notebook?')) {
      const updated = sources.filter(s => s.id !== sourceId);
      onUpdateNote(note.id, { sources: updated, updatedAt: Date.now() });
    }
  };

  // Add New Source
  const handleCreateSource = () => {
    if (!newSourceTitle.trim()) return;
    const newSource: NotebookSource = {
      id: 'src_' + Date.now(),
      title: newSourceTitle.trim(),
      type: addSourceType,
      content: newSourceContent.trim() || `Source link: ${newSourceUrl}`,
      url: newSourceUrl,
      selected: true,
      dateAdded: Date.now(),
      size: `${Math.round((newSourceContent || '').length / 1024 * 10) / 10} KB`
    };
    const updated = [...sources, newSource];
    onUpdateNote(note.id, { sources: updated, updatedAt: Date.now() });
    setIsAddSourceModalOpen(false);
    setNewSourceTitle('');
    setNewSourceContent('');
    setNewSourceUrl('');
  };

  // Handle Send Chat
  const handleSendMessage = async (customText?: string) => {
    const query = customText || chatInput;
    if (!query.trim() || isChatLoading) return;

    const userMsg = {
      id: 'msg_' + Date.now(),
      role: 'user' as const,
      content: query.trim(),
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    if (!customText) setChatInput('');
    setIsChatLoading(true);

    try {
      const sourcesForAi = selectedSources.map(s => ({
        title: s.title,
        content: s.content
      }));

      const historyForAi = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const result = await chatWithNotebookSources(
        query.trim(),
        sourcesForAi,
        historyForAi,
        language
      );

      const aiMsg = {
        id: 'ai_' + Date.now(),
        role: 'model' as const,
        content: result.text,
        citations: result.citations,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, aiMsg]);
    } catch (e: any) {
      setChatMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'model' as const,
          content: 'Sorry, I encountered an error connecting to the AI model. Please verify your selected sources and try again.',
          timestamp: Date.now()
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Save AI response as a Studio Note
  const handleSaveToNote = (content: string, title?: string) => {
    const newNote: StudioNoteItem = {
      id: 'note_' + Date.now(),
      title: title || `AI Synthesis - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      content,
      updatedAt: Date.now()
    };
    const updated = [newNote, ...studioNotes];
    onUpdateNote(note.id, { studioNotes: updated, updatedAt: Date.now() });
    setActiveStudioNoteId(newNote.id);
    setMobileTab('notes');
  };

  // Generate Audio Overview (NotebookLM Deep Dive)
  const handleGenerateAudioOverview = async () => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source to generate an Audio Overview.');
      return;
    }
    setIsAudioGenerating(true);
    try {
      const sourcesForAi = selectedSources.map(s => ({
        title: s.title,
        content: s.content
      }));

      const script = await generateAudioOverviewScript(sourcesForAi, language);

      const audioData: AudioOverviewData = {
        status: 'ready',
        title: script.title,
        duration: script.dialogue.length * 7,
        transcript: script.dialogue.map(d => ({ speaker: d.speaker, text: d.text }))
      };

      setAudioOverview(audioData);
      onUpdateNote(note.id, { audioOverview: audioData, updatedAt: Date.now() });
    } catch (e) {
      console.error('Audio overview error', e);
      alert('Failed to generate Audio Overview. Please try again.');
    } finally {
      setIsAudioGenerating(false);
    }
  };

  // Play Speech Synthesis of Dialogue
  const togglePlayAudio = () => {
    if (isPlayingAudio) {
      window.speechSynthesis?.cancel();
      setIsPlayingAudio(false);
      return;
    }

    if (!audioOverview.transcript || audioOverview.transcript.length === 0) {
      handleGenerateAudioOverview();
      return;
    }

    setIsPlayingAudio(true);
    let index = currentSpeakerIndex >= audioOverview.transcript.length ? 0 : currentSpeakerIndex;

    const playNext = () => {
      if (!audioOverview.transcript || index >= audioOverview.transcript.length) {
        setIsPlayingAudio(false);
        setCurrentSpeakerIndex(0);
        return;
      }

      setCurrentSpeakerIndex(index);
      const line = audioOverview.transcript[index];
      const utterance = new SpeechSynthesisUtterance(line.text);
      utterance.rate = 1.05;
      // Vary pitch between Alex and Sam
      utterance.pitch = line.speaker === 'Alex' ? 1.15 : 0.95;

      utterance.onend = () => {
        index++;
        playNext();
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis?.speak(utterance);
    };

    playNext();
  };

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Generate Studio Guide (Study Guide, FAQ, Briefing, Timeline)
  const handleGenerateGuide = async (type: 'study-guide' | 'faq' | 'briefing' | 'timeline') => {
    if (selectedSources.length === 0) {
      alert('Please select at least one source.');
      return;
    }
    setIsGeneratingGuide(true);
    try {
      const sourcesForAi = selectedSources.map(s => ({
        title: s.title,
        content: s.content
      }));
      const guide = await generateStudioGuide(type, sourcesForAi, language);
      handleSaveToNote(guide.content, guide.title);
    } catch (e) {
      alert('Failed to generate studio guide.');
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // Update Active Studio Note content
  const handleUpdateStudioNoteContent = (newContent: string) => {
    const updated = studioNotes.map(n => n.id === activeStudioNoteId ? { ...n, content: newContent, updatedAt: Date.now() } : n);
    onUpdateNote(note.id, { studioNotes: updated, content: newContent, updatedAt: Date.now() });
  };

  // Create new blank Studio Note
  const handleCreateNewStudioNote = () => {
    const newNote: StudioNoteItem = {
      id: 'note_' + Date.now(),
      title: `Note ${studioNotes.length + 1}`,
      content: '',
      updatedAt: Date.now()
    };
    const updated = [newNote, ...studioNotes];
    onUpdateNote(note.id, { studioNotes: updated, updatedAt: Date.now() });
    setActiveStudioNoteId(newNote.id);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] max-w-full overflow-hidden bg-[#f8fafd] text-[#1f1f1f] font-sans">
      {/* 1. TOP NOTEBOOKLM APP BAR */}
      <header className="h-14 px-3 sm:px-6 bg-white border-b border-[#dadce0] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="py-1.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 border border-slate-200 shadow-2xs"
            title="Back to all notebooks"
          >
            <ArrowLeft className="w-4 h-4 text-slate-700 stroke-[2.5]" />
            <span className="font-extrabold">Back</span>
          </button>

          {/* Notebook Title (Inline Editable) */}
          <div className="flex items-center gap-2 min-w-0">
            {isEditingTitle ? (
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                autoFocus
                className="px-2 py-0.5 text-base font-bold text-[#1f1f1f] bg-slate-100 rounded-lg outline-none border border-blue-500 max-w-[280px] sm:max-w-md truncate"
              />
            ) : (
              <div 
                onClick={() => setIsEditingTitle(true)}
                className="group flex items-center gap-1.5 cursor-pointer max-w-[240px] sm:max-w-md truncate"
                title="Click to rename"
              >
                <h1 className="text-base sm:text-lg font-bold text-[#1f1f1f] tracking-tight truncate">
                  {note.title || 'Untitled Notebook'}
                </h1>
                <Edit3 className="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </div>
            )}

            {/* Grounding Status Pill */}
            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200 shrink-0">
              <Sparkles className="w-3 h-3 text-blue-600" />
              {selectedSources.length} source{selectedSources.length === 1 ? '' : 's'} grounded
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Study Tools Launcher */}
          <button
            onClick={onOpenStudyTools}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
            title="Open Study Tools Hub"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Study Tools</span>
          </button>

          {/* Share Notebook */}
          <button
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href);
              alert('Notebook link copied to clipboard!');
            }}
            className="p-2 rounded-full text-[#5f6368] hover:text-[#1f1f1f] hover:bg-slate-100 transition-colors"
            title="Share notebook link"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Download Notes */}
          <button
            onClick={() => {
              const blob = new Blob([activeStudioNote?.content || note.content || ''], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${(note.title || 'notebook').toLowerCase().replace(/\s+/g, '_')}_notes.md`;
              a.click();
            }}
            className="p-2 rounded-full text-[#5f6368] hover:text-[#1f1f1f] hover:bg-slate-100 transition-colors"
            title="Export as Markdown"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. MOBILE TABS SWITCHER (NotebookLM 3-Panel Switcher on Small Screens) */}
      <div className="lg:hidden flex items-center justify-around bg-white border-b border-[#dadce0] px-2 py-1.5 text-xs font-bold text-[#5f6368] shrink-0">
        <button
          onClick={() => setMobileTab('sources')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            mobileTab === 'sources' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Sources ({sources.length})
        </button>
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            mobileTab === 'chat' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Chat & Audio
        </button>
        <button
          onClick={() => setMobileTab('notes')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
            mobileTab === 'notes' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          Studio Notes ({studioNotes.length})
        </button>
      </div>

      {/* 3. THREE-PANEL NOTEBOOKLM WORKSPACE CONTAINER */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* ====================================================================
            LEFT PANEL: SOURCES (NotebookLM Sources Column)
           ==================================================================== */}
        <section
          aria-label="Notebook Sources"
          className={`w-full lg:w-72 xl:w-80 bg-white border-r border-[#dadce0] flex flex-col shrink-0 overflow-hidden ${
            mobileTab === 'sources' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Sources Header */}
          <div className="p-4 border-b border-[#dadce0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Sources
                <span className="text-xs text-[#5f6368] font-normal">({sources.length})</span>
              </h2>
              <p className="text-[11px] text-[#5f6368] mt-0.5">
                {selectedSources.length} of {sources.length} active for AI
              </p>
            </div>

            <button
              onClick={() => setIsAddSourceModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Add PDF, Video, or Text source"
            >
              <Plus className="w-3.5 h-3.5" />
              Add source
            </button>
          </div>

          {/* Quick Select All Toggle */}
          {sources.length > 1 && (
            <div className="px-4 py-2 bg-slate-50 border-b border-[#dadce0] flex items-center justify-between text-xs text-[#5f6368]">
              <span>Grounding Selection</span>
              <button
                onClick={toggleSelectAllSources}
                className="font-semibold text-blue-600 hover:underline"
              >
                {sources.every(s => s.selected) ? 'Deselect all' : 'Select all'}
              </button>
            </div>
          )}

          {/* Sources List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
            {sources.length === 0 ? (
              <div className="p-6 text-center text-[#5f6368]">
                <FileUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">No sources yet</p>
                <p className="text-[11px] text-slate-400 mt-1">Upload a PDF, paste text, or scan notes to ground AI.</p>
              </div>
            ) : (
              sources.map((source, index) => (
                <div
                  key={`src-${source.id || index}-${index}`}
                  onClick={() => setInspectingSource(source)}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    source.selected 
                      ? 'bg-blue-50/50 border-blue-200 hover:border-blue-300 shadow-2xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Selection Checkbox */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSourceSelection(source.id);
                      }}
                      className="mt-0.5 text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
                      title={source.selected ? "Disable source for grounding" : "Enable source for grounding"}
                    >
                      {source.selected ? (
                        <CheckSquare className="w-4 h-4 fill-blue-600 text-white" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-blue-600">[{index + 1}]</span>
                        <h3 className="text-xs font-bold text-[#1f1f1f] truncate">
                          {source.title}
                        </h3>
                      </div>
                      <p className="text-[11px] text-[#5f6368] line-clamp-2 leading-relaxed">
                        {source.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="capitalize">{source.type} {source.size ? `· ${source.size}` : ''}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteSource(source.id, e)}
                          className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1"
                          title="Delete source"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Source Actions Footer */}
          <div className="p-3 bg-slate-50 border-t border-[#dadce0] flex items-center justify-between text-xs">
            <button
              onClick={() => handleGenerateGuide('study-guide')}
              disabled={isGeneratingGuide || selectedSources.length === 0}
              className="w-full py-2 bg-white hover:bg-slate-100 text-[#1f1f1f] font-semibold rounded-lg border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isGeneratingGuide ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span>Create Source Guide</span>
            </button>
          </div>
        </section>

        {/* ====================================================================
            CENTER PANEL: CHAT & AUDIO OVERVIEW (NotebookLM Core Studio)
           ==================================================================== */}
        <section
          aria-label="NotebookLM Chat & Audio Studio"
          className={`flex-1 bg-[#f8fafd] flex flex-col overflow-hidden ${
            mobileTab === 'chat' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Studio Top Banner: AUDIO OVERVIEW (NotebookLM Deep Dive) */}
          <div className="p-3 sm:p-4 bg-white border-b border-[#dadce0] shrink-0">
            <div className="bg-gradient-to-r from-violet-50 via-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-3 sm:p-4 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                        Audio Overview: Deep Dive
                      </h3>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                        AI Podcast
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                      {audioOverview.status === 'ready' 
                        ? audioOverview.title || "Two AI hosts discuss and unpack your sources."
                        : "Two AI hosts will have an engaging, conversational discussion based on your sources."}
                    </p>
                  </div>
                </div>

                {/* Audio Controls */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {audioOverview.status === 'ready' && (
                    <button
                      onClick={() => setShowTranscript(prev => !prev)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                      {showTranscript ? 'Hide transcript' : 'Transcript'}
                    </button>
                  )}

                  <button
                    onClick={togglePlayAudio}
                    disabled={isAudioGenerating}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isAudioGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-300" />
                        <span>Generating...</span>
                      </>
                    ) : isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                        <span>{audioOverview.status === 'ready' ? 'Listen' : 'Generate'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Transcript Drawer */}
              <AnimatePresence>
                {showTranscript && audioOverview.transcript && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 pt-3 border-t border-indigo-100 max-h-48 overflow-y-auto space-y-2 text-xs text-slate-700 custom-scrollbar"
                  >
                    {audioOverview.transcript.map((line, idx) => (
                      <div 
                        key={`trans-${idx}-${line.speaker}`} 
                        className={`p-2 rounded-lg transition-colors ${
                          isPlayingAudio && currentSpeakerIndex === idx ? 'bg-indigo-100/70 font-semibold' : 'bg-white/60'
                        }`}
                      >
                        <span className="font-bold text-indigo-700 mr-2">{line.speaker}:</span>
                        <span>{line.text}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Studio Guides Row */}
            <div className="flex items-center gap-2 mt-3 overflow-x-auto hide-scrollbar pb-1">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Quick Guides:</span>
              {[
                { id: 'study-guide', label: 'Study Guide', icon: BookOpen },
                { id: 'faq', label: 'FAQ', icon: HelpCircle },
                { id: 'briefing', label: 'Briefing Doc', icon: FileText },
                { id: 'timeline', label: 'Timeline', icon: Clock },
              ].map((item, gIdx) => (
                <button
                  key={`guide-${item.id}-${gIdx}`}
                  onClick={() => handleGenerateGuide(item.id as any)}
                  disabled={isGeneratingGuide || selectedSources.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-200 shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <item.icon className="w-3 h-3 text-slate-500" />
                  <span>{item.label}</span>
                </button>
              ))}
              <button
                onClick={onOpenPointWise}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 shrink-0 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Point-Wise Notes</span>
              </button>
              <button
                onClick={onOpenDiagram}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-medium border border-purple-200 shrink-0 transition-colors cursor-pointer"
              >
                <Layers className="w-3 h-3 text-purple-600" />
                <span>Diagram</span>
              </button>
            </div>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
            {chatMessages.map((msg, mIdx) => (
              <div
                key={`msg-${msg.id || mIdx}-${mIdx}`}
                className={`flex gap-3 max-w-3xl ${msg.role === 'user' ? 'ml-auto justify-end' : 'mr-auto justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-xs' 
                    : 'bg-white text-slate-800 border border-[#dadce0] shadow-2xs rounded-tl-xs'
                }`}>
                  <div className="prose prose-sm max-w-none prose-slate">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>

                  {/* Inline Citations Drawer */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-400">Sources:</span>
                      {msg.citations.map((c, i) => (
                        <button
                          key={`cit-${c.index}-${i}`}
                          onClick={() => setActiveCitation(c)}
                          className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          [{c.index}] {c.sourceTitle.slice(0, 16)}...
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message Action Bar */}
                  {msg.role === 'model' && msg.id !== 'welcome' && (
                    <div className="mt-3 pt-2 flex items-center gap-2 border-t border-slate-100 text-slate-400 text-xs">
                      <button
                        onClick={() => handleSaveToNote(msg.content)}
                        className="inline-flex items-center gap-1 hover:text-blue-600 transition-colors p-1"
                        title="Save response to Studio Notes"
                      >
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>Save to Note</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(msg.content);
                          alert('Copied to clipboard');
                        }}
                        className="inline-flex items-center gap-1 hover:text-slate-700 transition-colors p-1"
                        title="Copy text"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                  <Sparkles className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white border border-[#dadce0] rounded-2xl px-4 py-3 shadow-2xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Synthesizing from {selectedSources.length} sources...</span>
                </div>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white border-t border-[#dadce0] shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="max-w-3xl mx-auto flex items-center gap-2 bg-[#f8fafd] border border-[#dadce0] rounded-2xl p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:shadow-md transition-all"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={selectedSources.length > 0 ? "Ask a question about your sources..." : "Add sources to chat with AI..."}
                className="flex-1 px-3 py-2 text-xs sm:text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400"
              />

              <button
                type="submit"
                disabled={!chatInput.trim() || isChatLoading}
                className="w-9 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-colors shadow-2xs cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <p className="text-[10px] text-center text-slate-400 mt-2">
              Study Top may occasionally generate inaccurate information. Grounded in your selected sources.
            </p>
          </div>
        </section>

        {/* ====================================================================
            RIGHT PANEL: STUDIO NOTES & SCRATCHPAD (NotebookLM Notes Column)
           ==================================================================== */}
        <section
          aria-label="Studio Notes & Scratchpad"
          className={`w-full lg:w-80 xl:w-96 bg-white border-l border-[#dadce0] flex flex-col shrink-0 overflow-hidden ${
            mobileTab === 'notes' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Notes Header */}
          <div className="p-4 border-b border-[#dadce0] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1f1f1f] flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Studio Notes
                <span className="text-xs text-[#5f6368] font-normal">({studioNotes.length})</span>
              </h2>
              <p className="text-[11px] text-[#5f6368] mt-0.5 truncate">
                Saved synthesis & study materials
              </p>
            </div>

            <button
              onClick={handleCreateNewStudioNote}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
              title="Add blank note"
            >
              <Plus className="w-3.5 h-3.5" />
              New note
            </button>
          </div>

          {/* Notes Selector Pills */}
          {studioNotes.length > 1 && (
            <div className="flex items-center gap-1.5 p-2 bg-slate-50 border-b border-[#dadce0] overflow-x-auto hide-scrollbar">
              {studioNotes.map((n, sIdx) => (
                <button
                  key={`sn-${n.id || sIdx}-${sIdx}`}
                  onClick={() => setActiveStudioNoteId(n.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-colors ${
                    activeStudioNoteId === n.id 
                      ? 'bg-indigo-600 text-white shadow-2xs' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {n.title.slice(0, 16)}
                </button>
              ))}
            </div>
          )}

          {/* Active Note Editor & Preview */}
          <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar">
            {activeStudioNote ? (
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <input
                    type="text"
                    value={activeStudioNote.title}
                    onChange={(e) => {
                      const updated = studioNotes.map(n => n.id === activeStudioNoteId ? { ...n, title: e.target.value } : n);
                      onUpdateNote(note.id, { studioNotes: updated });
                    }}
                    className="text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full pb-0.5 truncate"
                  />
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                    {new Date(activeStudioNote.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <textarea
                  value={activeStudioNote.content}
                  onChange={(e) => handleUpdateStudioNoteContent(e.target.value)}
                  placeholder="Write notes, synthesize key points, or click 'Save to Note' from AI responses..."
                  className="flex-1 w-full bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 text-xs leading-relaxed text-slate-800 outline-none focus:border-blue-500 focus:bg-white resize-none custom-scrollbar min-h-[240px]"
                />

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{activeStudioNote.content.split(/\s+/).filter(Boolean).length} words</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeStudioNote.content);
                        alert('Copied note to clipboard');
                      }}
                      className="hover:text-slate-700"
                    >
                      Copy
                    </button>
                    {studioNotes.length > 1 && (
                      <button
                        onClick={() => {
                          if (confirm('Delete this studio note?')) {
                            const updated = studioNotes.filter(n => n.id !== activeStudioNoteId);
                            onUpdateNote(note.id, { studioNotes: updated });
                            setActiveStudioNoteId(updated[0]?.id || '');
                          }
                        }}
                        className="hover:text-red-500"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No note selected. Click 'New note' to create one.
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 4. MODALS */}

      {/* ADD SOURCE MODAL */}
      <AnimatePresence>
        {isAddSourceModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Add Source</h3>
                    <p className="text-xs text-slate-500">Ground your AI assistant in textbook chapters, articles, or videos</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsAddSourceModalOpen(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Source Type Selector */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[
                  { id: 'text', label: 'Paste Text', icon: FileText },
                  { id: 'pdf', label: 'Upload PDF', icon: FileUp },
                  { id: 'youtube', label: 'YouTube Video', icon: Youtube }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setAddSourceType(tab.id as any)}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      addSourceType === tab.id 
                        ? 'bg-blue-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Form Body */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Source Title</label>
                  <input
                    type="text"
                    value={newSourceTitle}
                    onChange={(e) => setNewSourceTitle(e.target.value)}
                    placeholder="e.g. Chapter 4: Thermodynamics, Lecture 2..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {addSourceType === 'youtube' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">YouTube URL</label>
                    <input
                      type="url"
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {addSourceType === 'youtube' ? 'Key Notes or Transcript' : 'Source Content / Text'}
                  </label>
                  <textarea
                    rows={6}
                    value={newSourceContent}
                    onChange={(e) => setNewSourceContent(e.target.value)}
                    placeholder="Paste article text, lecture notes, textbook excerpts, or syllabus details..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddSourceModalOpen(false);
                    onOpenSmartNote(addSourceType === 'youtube' ? 'youtube' : (addSourceType === 'pdf' ? 'pdf' : 'text'));
                  }}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Use Smart Scanner OCR instead →
                </button>

                <button
                  type="button"
                  onClick={handleCreateSource}
                  disabled={!newSourceTitle.trim()}
                  className="px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                >
                  Attach to Notebook
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INSPECT SOURCE MODAL */}
      <AnimatePresence>
        {inspectingSource && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-bold text-slate-900 truncate max-w-md">
                    {inspectingSource.title}
                  </h3>
                </div>
                <button
                  onClick={() => setInspectingSource(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 text-xs sm:text-sm text-slate-800 leading-relaxed custom-scrollbar whitespace-pre-wrap">
                {inspectingSource.content}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
                <span>Added: {new Date(inspectingSource.dateAdded).toLocaleDateString()}</span>
                <button
                  onClick={() => setInspectingSource(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-full transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CITATION SNIPPET MODAL */}
      <AnimatePresence>
        {activeCitation && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-2xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl border border-slate-200"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600">
                  <span>Source [{activeCitation.index}]</span>
                  <span>·</span>
                  <span className="text-slate-900 truncate max-w-[200px]">{activeCitation.sourceTitle}</span>
                </div>
                <button
                  onClick={() => setActiveCitation(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-600 italic leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{activeCitation.quote}"
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setActiveCitation(null)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
