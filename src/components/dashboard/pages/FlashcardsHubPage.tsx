import React, { useState } from 'react';
import { 
  RotateCcw, 
  Plus, 
  Layers, 
  Sparkles, 
  CheckCircle, 
  BookOpen, 
  ArrowRight,
  Shuffle,
  Award
} from 'lucide-react';
import { Note, NoteFlashcard } from '../../../types';
import { FlashcardQuizModal } from '../../notes/FlashcardQuizModal';

interface FlashcardsHubPageProps {
  notes: Note[];
  onOpenNote: (id: string) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
}

export const FlashcardsHubPage: React.FC<FlashcardsHubPageProps> = ({
  notes,
  onOpenNote,
  onUpdateNote
}) => {
  const [activeQuizDeck, setActiveQuizDeck] = useState<{ noteId: string; title: string; cards: NoteFlashcard[] } | null>(null);

  // Collect notes that have flashcards or provide quick flashcard decks
  const notesWithFlashcards = notes.filter(n => !n.isDeleted && n.flashcards && n.flashcards.length > 0);

  // Total statistics
  const totalCards = notes.reduce((acc, n) => acc + (n.flashcards?.length || 0), 0);
  const totalMastered = notes.reduce((acc, n) => acc + (n.flashcards?.filter(c => c.mastered)?.length || 0), 0);

  const handleLaunchQuiz = (note: Note) => {
    setActiveQuizDeck({
      noteId: note.id,
      title: note.title || 'Untitled Note',
      cards: note.flashcards || []
    });
  };

  const handleUpdateQuizDeck = (updatedCards: NoteFlashcard[]) => {
    if (!activeQuizDeck) return;
    onUpdateNote(activeQuizDeck.noteId, { flashcards: updatedCards, updatedAt: Date.now() });
    setActiveQuizDeck(prev => prev ? { ...prev, cards: updatedCards } : null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold uppercase tracking-wider">
            Active Recall &amp; Spaced Repetition
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Flashcards Study Decks</h2>
          <p className="text-xs text-slate-500 mt-1">
            Test yourself with 3D flip card animations, track mastered terms, and reinforce memory retention.
          </p>
        </div>

        {/* Global stats pills */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Total Cards</span>
            <span className="text-base font-black text-slate-900">{totalCards}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-center">
            <span className="text-[10px] font-bold text-emerald-600 uppercase block">Mastered</span>
            <span className="text-base font-black text-emerald-700">{totalMastered}</span>
          </div>
        </div>
      </div>

      {/* Note Decks Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Your Flashcard Decks ({notesWithFlashcards.length})
          </h3>
        </div>

        {notesWithFlashcards.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-4 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900">No Flashcard Decks Created Yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Open any note, highlight text to designate <strong>"Set Front"</strong> and <strong>"Set Back"</strong>, or click <strong>AI Auto-Extract Deck</strong>.
              </p>
            </div>
            {notes.length > 0 && (
              <button
                onClick={() => onOpenNote(notes[0].id)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
              >
                <span>Open "{notes[0].title || 'Note'}" to Add Cards</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notesWithFlashcards.map(note => {
              const cards = note.flashcards || [];
              const mastered = cards.filter(c => c.mastered).length;
              const percent = cards.length > 0 ? Math.round((mastered / cards.length) * 100) : 0;

              return (
                <div
                  key={note.id}
                  className="bg-white rounded-3xl border border-slate-200/90 p-6 hover:border-purple-300 hover:shadow-md transition-all flex flex-col justify-between shadow-2xs space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black uppercase">
                        {cards.length} Flashcards
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {percent}% Mastered
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 line-clamp-1">
                      {note.title || 'Untitled Note'}
                    </h4>

                    {/* Progress bar */}
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 pt-1">
                      Sample Q: {cards[0]?.front}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenNote(note.id)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Edit in Note
                    </button>

                    <button
                      onClick={() => handleLaunchQuiz(note)}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Quiz Deck</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quiz Modal */}
      {activeQuizDeck && (
        <FlashcardQuizModal
          noteTitle={activeQuizDeck.title}
          flashcards={activeQuizDeck.cards}
          onUpdateFlashcards={handleUpdateQuizDeck}
          onClose={() => setActiveQuizDeck(null)}
          onOpenNote={() => onOpenNote(activeQuizDeck.noteId)}
        />
      )}
    </div>
  );
};
