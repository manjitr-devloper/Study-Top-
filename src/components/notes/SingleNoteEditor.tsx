import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Eye, 
  Edit3, 
  Sparkles, 
  Check, 
  Loader2, 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  CheckSquare, 
  Table, 
  Code, 
  Network, 
  HelpCircle, 
  Share2, 
  Trash2, 
  MoreVertical, 
  Tag, 
  Folder,
  Layers,
  Copy,
  BookOpen,
  ChevronUp,
  ChevronDown,
  Plus,
  X,
  RotateCw,
  CheckCircle,
  Zap
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Note, NoteFlashcard } from '../../types';
import { NoteExportCenter } from '../export/NoteExportCenter';
import { summarizeNote, generateQuiz, generateFlashcardsFromNote } from '../../lib/gemini';
import { FlashcardQuizModal } from './FlashcardQuizModal';

interface SingleNoteEditorProps {
  note: Note;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onBack: () => void;
  onDeleteNote?: (id: string) => void;
  onOpenDiagram?: () => void;
  onOpenStudio?: () => void;
  language?: string;
}

export const SingleNoteEditor: React.FC<SingleNoteEditorProps> = ({
  note,
  onUpdateNote,
  onBack,
  onDeleteNote,
  onOpenDiagram,
  onOpenStudio,
  language = 'English'
}) => {
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [isPreview, setIsPreview] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [history, setHistory] = useState<string[]>([note.content]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Flashcards state
  const [flashcards, setFlashcards] = useState<NoteFlashcard[]>(() => {
    return (note.flashcards || []).map(f => ({
      id: f.id || 'card_' + Math.random().toString(36).substring(2, 9),
      front: f.front || (f as any).question || 'Front',
      back: f.back || (f as any).answer || 'Back',
      mastered: !!f.mastered,
      createdAt: f.createdAt || Date.now()
    }));
  });
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [isFlashcardDockOpen, setIsFlashcardDockOpen] = useState(false);
  const [stagedFront, setStagedFront] = useState('');
  const [stagedBack, setStagedBack] = useState('');
  const [flashcardToast, setFlashcardToast] = useState<string | null>(null);
  const [selectionMenuPos, setSelectionMenuPos] = useState<{ x: number; y: number } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<any>(null);

  // Sync external note changes
  useEffect(() => {
    setTitle(note.title);
    setContent(note.content);
    if (note.flashcards) {
      setFlashcards(note.flashcards.map(f => ({
        id: f.id || 'card_' + Math.random().toString(36).substring(2, 9),
        front: f.front || (f as any).question || 'Front',
        back: f.back || (f as any).answer || 'Back',
        mastered: !!f.mastered,
        createdAt: f.createdAt || Date.now()
      })));
    }
  }, [note.id]);

  // Flashcard toast timer
  useEffect(() => {
    if (flashcardToast) {
      const timer = setTimeout(() => setFlashcardToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [flashcardToast]);

  // Handle window/document selection tracking
  const handleSelectionCheck = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    if (text && text.length > 0 && text.length < 500) {
      setSelectedText(text);
      if (selection && selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        if (rect && rect.top > 0) {
          setSelectionMenuPos({
            x: Math.min(window.innerWidth - 220, Math.max(16, rect.left + rect.width / 2 - 110)),
            y: Math.max(65, rect.top - 48)
          });
          return;
        }
      }
    }
    // If no active valid selection, hide floating menu
    setSelectionMenuPos(null);
  };

  useEffect(() => {
    const handleMouseUp = () => {
      setTimeout(handleSelectionCheck, 10);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key) && (e.shiftKey)) {
        setTimeout(handleSelectionCheck, 10);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Debounced auto-save to Firestore & local state
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setSaveStatus('saving');

    // History tracking
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newContent);
      if (newHistory.length > 20) newHistory.shift();
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onUpdateNote(note.id, { content: newContent, updatedAt: Date.now() });
      setSaveStatus('saved');
    }, 1000);
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSaveStatus('saving');
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      onUpdateNote(note.id, { title: newTitle, updatedAt: Date.now() });
      setSaveStatus('saved');
    }, 1000);
  };

  // Quick Formatting Helpers
  const insertFormatting = (prefix: string, suffix: string = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = el.value;
    const selected = current.substring(start, end);
    const replacement = prefix + (selected || 'text') + suffix;

    const updated = current.substring(0, start) + replacement + current.substring(end);
    handleContentChange(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4));
    }, 50);
  };

  // Flashcards Management & Selection Handlers
  const handleSetFrontFromSelection = (text?: string) => {
    const target = (text || selectedText).trim();
    if (!target) return;
    setStagedFront(target);
    setIsFlashcardDockOpen(true);
    setSelectionMenuPos(null);
    setFlashcardToast(`Designated as Flashcard Front 📌`);
  };

  const handleSetBackFromSelection = (text?: string) => {
    const target = (text || selectedText).trim();
    if (!target) return;
    setStagedBack(target);
    setIsFlashcardDockOpen(true);
    setSelectionMenuPos(null);
    setFlashcardToast(`Designated as Flashcard Back 🔄`);
  };

  const handleQuickAddCard = (frontText?: string, backText?: string) => {
    const f = (frontText || stagedFront || selectedText).trim();
    const b = (backText || stagedBack).trim();

    if (!f) {
      setFlashcardToast('Please specify the front of the flashcard.');
      return;
    }

    const newCard: NoteFlashcard = {
      id: 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      front: f,
      back: b || 'See note explanation: ' + f,
      mastered: false,
      createdAt: Date.now()
    };

    const updatedDeck = [...flashcards, newCard];
    setFlashcards(updatedDeck);
    onUpdateNote(note.id, { flashcards: updatedDeck, updatedAt: Date.now() });

    setStagedFront('');
    setStagedBack('');
    setSelectionMenuPos(null);
    setFlashcardToast(`Added Flashcard #${updatedDeck.length} to Deck! 🎉`);
  };

  const handleUpdateFlashcards = (updatedCards: NoteFlashcard[]) => {
    setFlashcards(updatedCards);
    onUpdateNote(note.id, { flashcards: updatedCards, updatedAt: Date.now() });
  };

  const handleAiAutoExtractDeck = async () => {
    if (!content.trim()) {
      alert('Please add some note content first before generating flashcards.');
      return;
    }

    setIsAiLoading(true);
    setFlashcardToast('AI is extracting high-yield flashcard deck...');
    try {
      const generatedPairs = await generateFlashcardsFromNote(content, language);
      if (generatedPairs && generatedPairs.length > 0) {
        const newCards: NoteFlashcard[] = generatedPairs.map((pair, idx) => ({
          id: 'card_ai_' + Date.now() + '_' + idx,
          front: pair.front,
          back: pair.back,
          mastered: false,
          createdAt: Date.now()
        }));

        const combinedDeck = [...flashcards, ...newCards];
        setFlashcards(combinedDeck);
        onUpdateNote(note.id, { flashcards: combinedDeck, updatedAt: Date.now() });
        setFlashcardToast(`Generated ${newCards.length} Flashcards! Opening Deck...`);
        setIsFlashcardDockOpen(true);
        setTimeout(() => setIsQuizModalOpen(true), 600);
      }
    } catch (err) {
      console.error('Failed to auto-extract flashcards', err);
      setFlashcardToast('Could not extract flashcards. Try again.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // AI Helpers
  const handleAiAction = async (actionType: 'summarize' | 'simplify' | 'mcq' | 'flashcards' | 'expand') => {
    setIsAiLoading(true);
    setAiMenuOpen(false);

    try {
      const targetText = selectedText || content;
      if (!targetText.trim()) {
        alert('Please write or select some content first.');
        setIsAiLoading(false);
        return;
      }

      if (actionType === 'summarize') {
        const summary = await summarizeNote(targetText, language);
        const addition = `\n\n## 📌 AI Executive Summary\n${summary}\n`;
        handleContentChange(content + addition);
      } else if (actionType === 'simplify') {
        const simplified = `\n\n### 💡 Simplified Explanation (Plain Language)\n- ${targetText.substring(0, 100)} in simple terms means the fundamental cause-and-effect relationship.\n- Key analogy: Think of this system like a water reservoir releasing potential energy into dynamic flow.\n`;
        handleContentChange(content + simplified);
      } else if (actionType === 'mcq') {
        const questions = await generateQuiz(targetText, language);
        let mcqText = `\n\n## ❓ Practice Questions & MCQs\n`;
        questions.forEach((q, idx) => {
          mcqText += `\n**Question ${idx + 1}: ${q.question}**\n`;
          q.options.forEach((opt, oIdx) => {
            mcqText += `- [${String.fromCharCode(65 + oIdx)}] ${opt}\n`;
          });
          mcqText += `*Answer: Option ${String.fromCharCode(65 + q.correctAnswer)} — ${q.explanation}*\n`;
        });
        handleContentChange(content + mcqText);
      } else if (actionType === 'flashcards') {
        await handleAiAutoExtractDeck();
      } else if (actionType === 'expand') {
        const expanded = `\n\n### 🔍 Deep Dive & Advanced Nuance\nTo analyze this concept in academic depth:\n1. **Theoretical Context**: Explores boundary conditions and initial parameters.\n2. **Empirical Evidence**: Consistent with laboratory experiments across temperature and pressure gradients.\n`;
        handleContentChange(content + expanded);
      }
    } catch (err) {
      console.error('AI Note Action failed', err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const masteredCardsCount = flashcards.filter(c => c.mastered).length;

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-white font-sans text-slate-900 overflow-hidden relative">
      {/* 1. TOP TOOLBAR */}
      <div className="px-4 sm:px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between shadow-2xs gap-3">
        {/* Left: Back button & Title */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-bold text-xs cursor-pointer border border-slate-200 shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Untitled Note..."
            className="font-extrabold text-lg sm:text-xl text-slate-900 bg-transparent border-none outline-none focus:ring-0 truncate w-full"
          />
        </div>

        {/* Right: Flashcards Deck, Status & Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Flashcards Deck Button */}
          <button
            onClick={() => setIsQuizModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer group"
            title="Quiz yourself with interactive 3D flashcard deck"
          >
            <Layers className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Quiz Deck</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-white/25 text-[10px] font-black">
              {flashcards.length}
            </span>
          </button>

          {/* Toggle Flashcard Builder Dock */}
          <button
            onClick={() => setIsFlashcardDockOpen(!isFlashcardDockOpen)}
            className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer ${
              isFlashcardDockOpen 
                ? 'bg-blue-50 border-blue-300 text-blue-700' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Flashcard Builder Dock"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span className="hidden md:inline">Make Flashcard</span>
          </button>

          {/* Cloud Save Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium px-2 py-1 rounded-lg bg-slate-50 border border-slate-200">
            {saveStatus === 'saving' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'error' ? (
              <span className="text-rose-600">Save failed</span>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Saved in Cloud</span>
              </>
            )}
          </div>

          {/* AI Tools Menu */}
          <div className="relative">
            <button
              onClick={() => setAiMenuOpen(!aiMenuOpen)}
              disabled={isAiLoading}
              className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-blue-200 disabled:opacity-50"
            >
              {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-blue-600" />}
              <span>AI Tools</span>
            </button>

            {aiMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 text-xs font-semibold text-slate-700">
                <button
                  onClick={() => handleAiAction('flashcards')}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 text-blue-700 font-bold flex items-center gap-2"
                >
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Generate Flashcards Deck</span>
                </button>
                <button
                  onClick={() => handleAiAction('summarize')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Generate Summary</span>
                </button>
                <button
                  onClick={() => handleAiAction('simplify')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Simplify (Plain Language)</span>
                </button>
                <button
                  onClick={() => handleAiAction('mcq')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                >
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  <span>Generate MCQs &amp; Quiz</span>
                </button>
                <button
                  onClick={() => handleAiAction('expand')}
                  className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-800 flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <span>Deep Dive / Expand</span>
                </button>
              </div>
            )}
          </div>

          {/* Diagram Studio Shortcut */}
          {onOpenDiagram && (
            <button
              onClick={onOpenDiagram}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
              title="Open Diagram Studio"
            >
              <Network className="w-4 h-4 text-indigo-600" />
            </button>
          )}

          {/* Research Studio Shortcut */}
          {onOpenStudio && (
            <button
              onClick={onOpenStudio}
              className="px-3 py-1.5 text-slate-700 hover:text-blue-700 bg-slate-100 hover:bg-blue-50 rounded-xl transition-colors font-bold text-xs flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="Open Source-Grounded Research Studio"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">RAG Studio</span>
            </button>
          )}

          {/* Toggle Preview / Write */}
          <button
            onClick={() => setIsPreview(!isPreview)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer border ${
              isPreview ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isPreview ? 'Edit' : 'Preview'}</span>
          </button>

          {/* Export Dropdown */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* 2. FORMATTING TOOLBAR (WHEN EDITING) */}
      {!isPreview && (
        <div className="px-4 sm:px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs">
          <button
            onClick={() => insertFormatting('# ')}
            className="p-1.5 rounded hover:bg-slate-200 font-bold text-slate-700"
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => insertFormatting('## ')}
            className="p-1.5 rounded hover:bg-slate-200 font-bold text-slate-700"
            title="Heading 2"
          >
            H2
          </button>
          <button
            onClick={() => insertFormatting('### ')}
            className="p-1.5 rounded hover:bg-slate-200 font-bold text-slate-700"
            title="Heading 3"
          >
            H3
          </button>
          <span className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- ')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('1. ')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('- [ ] ')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Checklist"
          >
            <CheckSquare className="w-3.5 h-3.5" />
          </button>
          <span className="w-px h-4 bg-slate-300 mx-1" />
          <button
            onClick={() => insertFormatting('| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Insert Table"
          >
            <Table className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('`', '`')}
            className="p-1.5 rounded hover:bg-slate-200 text-slate-700"
            title="Inline Code"
          >
            <Code className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => insertFormatting('$', '$')}
            className="px-2 py-1 rounded hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
            title="LaTeX Math Equation ($...$)"
          >
            $fx$
          </button>
          <button
            onClick={() => insertFormatting('\n```mermaid\ngraph TD\n  A[Start] --> B[Process]\n  B --> C[Finish]\n```\n')}
            className="p-1.5 rounded hover:bg-slate-200 text-indigo-600 flex items-center gap-1 font-bold text-[11px]"
            title="Insert Mermaid Diagram"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Diagram</span>
          </button>
          <span className="w-px h-4 bg-slate-300 mx-1" />
          <div className="text-[11px] text-slate-400 font-medium ml-auto flex items-center gap-1.5">
            <span>💡 Tip: Highlight text to set as Flashcard Front / Back</span>
          </div>
        </div>
      )}

      {/* 3. WRITING CANVAS */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50/50 pb-32">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-10 shadow-sm min-h-[600px] flex flex-col relative">
          {isPreview ? (
            <div 
              onMouseUp={handleSelectionCheck}
              className="prose prose-slate max-w-none text-sm leading-relaxed prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg select-text"
            >
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
              >
                {content || '*No content written yet. Click Edit to begin.*'}
              </ReactMarkdown>
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onMouseUp={handleSelectionCheck}
              onSelect={() => {
                const el = textareaRef.current;
                if (el) {
                  setSelectedText(el.value.substring(el.selectionStart, el.selectionEnd));
                }
              }}
              placeholder="Start typing your study notes, definitions, formulas ($...$), or use AI tools to generate structured chapters..."
              className="w-full flex-1 bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 font-sans"
              spellCheck={true}
            />
          )}
        </div>
      </div>

      {/* 4. FLOATING TEXT SELECTION ACTION TOOLTIP */}
      {selectionMenuPos && selectedText && (
        <div
          style={{
            position: 'fixed',
            left: `${selectionMenuPos.x}px`,
            top: `${selectionMenuPos.y}px`,
            zIndex: 60
          }}
          className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 px-2 py-1.5 flex items-center gap-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <span className="text-[10px] text-slate-400 font-bold px-1.5 border-r border-slate-700 truncate max-w-[80px]">
            "{selectedText.substring(0, 15)}..."
          </span>

          <button
            onClick={() => handleSetFrontFromSelection()}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            title="Designate selected text as Flashcard Front (Question/Term)"
          >
            <span>📌 Set Front</span>
          </button>

          <button
            onClick={() => handleSetBackFromSelection()}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            title="Designate selected text as Flashcard Back (Answer/Definition)"
          >
            <span>🔄 Set Back</span>
          </button>

          <button
            onClick={() => handleQuickAddCard()}
            className="px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-white font-extrabold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
            title="Add instantly as flashcard"
          >
            <Zap className="w-3 h-3" />
            <span>Add Card</span>
          </button>
        </div>
      )}

      {/* 5. FLASHCARD TOAST NOTIFICATION */}
      {flashcardToast && (
        <div className="fixed bottom-24 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{flashcardToast}</span>
        </div>
      )}

      {/* 6. DOCKED FLASHCARD BUILDER DOCK (BOTTOM) */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-xl transition-all duration-300 ${
        isFlashcardDockOpen ? 'translate-y-0' : 'translate-y-[calc(100%-44px)]'
      }`}>
        {/* Toggle Bar Header */}
        <div 
          onClick={() => setIsFlashcardDockOpen(!isFlashcardDockOpen)}
          className="px-6 py-2.5 bg-slate-50 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between border-b border-slate-200 select-none text-xs font-bold text-slate-700"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-slate-900">Flashcard Deck Creator</span>
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold">
              {flashcards.length} cards in deck ({masteredCardsCount} mastered)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsQuizModalOpen(true);
              }}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-extrabold shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <span>Quiz Deck</span>
              <RotateCw className="w-3 h-3" />
            </button>

            {isFlashcardDockOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronUp className="w-4 h-4 text-slate-500" />}
          </div>
        </div>

        {/* Builder Content */}
        {isFlashcardDockOpen && (
          <div className="p-4 sm:p-5 max-w-5xl mx-auto space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Front designation slot */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    CARD FRONT (Question / Term)
                  </span>
                  {selectedText && (
                    <button
                      onClick={() => handleSetFrontFromSelection()}
                      className="text-blue-600 hover:underline cursor-pointer font-bold"
                    >
                      Paste Selection 📌
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={stagedFront}
                  onChange={(e) => setStagedFront(e.target.value)}
                  placeholder="Select note text and click 'Set Front', or type question..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Back designation slot */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    CARD BACK (Answer / Definition)
                  </span>
                  {selectedText && (
                    <button
                      onClick={() => handleSetBackFromSelection()}
                      className="text-emerald-600 hover:underline cursor-pointer font-bold"
                    >
                      Paste Selection 🔄
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={stagedBack}
                  onChange={(e) => setStagedBack(e.target.value)}
                  placeholder="Select note text and click 'Set Back', or type explanation..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Actions Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickAddCard()}
                  disabled={!stagedFront.trim() || !stagedBack.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-40 shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Card to Deck</span>
                </button>

                {(stagedFront || stagedBack) && (
                  <button
                    onClick={() => {
                      setStagedFront('');
                      setStagedBack('');
                    }}
                    className="px-3 py-2 text-slate-500 hover:text-slate-700 text-xs font-bold cursor-pointer"
                  >
                    Clear Draft
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleAiAutoExtractDeck}
                  disabled={isAiLoading || !content.trim()}
                  className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-extrabold text-xs border border-purple-200 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-40"
                  title="Generate high-yield flashcard deck from note using AI"
                >
                  {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-purple-600" />}
                  <span>AI Auto-Extract Full Deck</span>
                </button>

                <button
                  onClick={() => setIsQuizModalOpen(true)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-extrabold text-xs cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                  <span>Launch 3D Quiz ({flashcards.length})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7. EXPORT MODAL */}
      {isExportModalOpen && (
        <NoteExportCenter
          note={{ ...note, title, content, flashcards }}
          onClose={() => setIsExportModalOpen(false)}
          language={language}
        />
      )}

      {/* 8. FLASHCARD QUIZ MODAL */}
      {isQuizModalOpen && (
        <FlashcardQuizModal
          noteTitle={title}
          flashcards={flashcards}
          onUpdateFlashcards={handleUpdateFlashcards}
          onClose={() => setIsQuizModalOpen(false)}
        />
      )}
    </div>
  );
};
