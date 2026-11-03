import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCw, 
  CheckCircle, 
  HelpCircle, 
  Shuffle, 
  ArrowLeft, 
  ArrowRight, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  Award, 
  BookOpen, 
  Layers,
  Save,
  Check,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NoteFlashcard } from '../../types';

interface FlashcardQuizModalProps {
  noteTitle: string;
  flashcards: NoteFlashcard[];
  onUpdateFlashcards: (updatedCards: NoteFlashcard[]) => void;
  onClose: () => void;
  onOpenNote?: () => void;
}

export const FlashcardQuizModal: React.FC<FlashcardQuizModalProps> = ({
  noteTitle,
  flashcards,
  onUpdateFlashcards,
  onClose,
  onOpenNote
}) => {
  const [deck, setDeck] = useState<NoteFlashcard[]>(() => {
    // Normalize existing cards (support front/back or question/answer)
    return flashcards.map(c => ({
      id: c.id || 'card_' + Math.random().toString(36).substring(2, 9),
      front: c.front || c.question || 'Front',
      back: c.back || c.answer || 'Back',
      mastered: !!c.mastered,
      createdAt: c.createdAt || Date.now()
    }));
  });

  const [mode, setMode] = useState<'quiz' | 'manage'>('quiz');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  const [sessionResults, setSessionResults] = useState<{ [id: string]: boolean }>({});

  // Form state for adding/editing card in manage mode
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');

  // Keep parent in sync whenever deck updates
  const handleDeckChange = (newDeck: NoteFlashcard[]) => {
    setDeck(newDeck);
    onUpdateFlashcards(newDeck);
  };

  const currentCard = deck[currentIndex];

  // Keyboard navigation for smooth quiz experience
  useEffect(() => {
    if (mode !== 'quiz' || quizFinished || !currentCard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        setIsFlipped(prev => !prev);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMarkCard(true);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleMarkCard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, quizFinished, currentCard, currentIndex, isFlipped]);

  const handleMarkCard = (mastered: boolean) => {
    if (!currentCard) return;

    const updatedSession = { ...sessionResults, [currentCard.id]: mastered };
    setSessionResults(updatedSession);

    // Update mastered state in deck
    const updatedDeck = deck.map((c, i) => 
      i === currentIndex ? { ...c, mastered } : c
    );
    handleDeckChange(updatedDeck);

    // Move to next card or finish quiz
    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...deck].sort(() => Math.random() - 0.5);
    setDeck(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setQuizFinished(false);
    setSessionResults({});
  };

  const handleRestartQuiz = (missedOnly: boolean = false) => {
    if (missedOnly) {
      const missedCards = deck.filter(c => !sessionResults[c.id]);
      if (missedCards.length > 0) {
        setDeck(missedCards);
      }
    }
    setCurrentIndex(0);
    setIsFlipped(false);
    setQuizFinished(false);
    setSessionResults({});
  };

  const handleSaveCard = () => {
    if (!cardFront.trim() || !cardBack.trim()) return;

    if (editingCardId) {
      // Editing existing
      const updated = deck.map(c => 
        c.id === editingCardId 
          ? { ...c, front: cardFront.trim(), back: cardBack.trim() } 
          : c
      );
      handleDeckChange(updated);
      setEditingCardId(null);
    } else {
      // Adding new
      const newCard: NoteFlashcard = {
        id: 'card_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        front: cardFront.trim(),
        back: cardBack.trim(),
        mastered: false,
        createdAt: Date.now()
      };
      handleDeckChange([...deck, newCard]);
    }

    setCardFront('');
    setCardBack('');
  };

  const handleStartEdit = (card: NoteFlashcard) => {
    setEditingCardId(card.id);
    setCardFront(card.front);
    setCardBack(card.back);
  };

  const handleDeleteCard = (id: string) => {
    const updated = deck.filter(c => c.id !== id);
    handleDeckChange(updated);
    if (currentIndex >= updated.length && updated.length > 0) {
      setCurrentIndex(updated.length - 1);
    }
  };

  // Progress calculations
  const totalCards = deck.length;
  const currentCardNum = totalCards > 0 ? currentIndex + 1 : 0;
  const progressPercent = totalCards > 0 ? (currentCardNum / totalCards) * 100 : 0;
  const masteredCount = deck.filter(c => c.mastered).length;
  const sessionMasteredCount = Object.values(sessionResults).filter(Boolean).length;
  const sessionScorePercent = totalCards > 0 ? Math.round((sessionMasteredCount / totalCards) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans text-slate-900">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-base text-slate-900 truncate">
                {noteTitle || 'Study Note'} — Flashcards Deck
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {totalCards} {totalCards === 1 ? 'card' : 'cards'} • {masteredCount} mastered ({totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0}%)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="bg-slate-200/80 p-0.5 rounded-xl flex items-center text-xs font-bold">
              <button
                onClick={() => setMode('quiz')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === 'quiz' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quiz Mode
              </button>
              <button
                onClick={() => setMode('manage')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  mode === 'manage' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Manage Deck ({totalCards})
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto">
          {mode === 'quiz' ? (
            totalCards === 0 ? (
              /* Empty Deck State */
              <div className="py-12 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">No Flashcards in this Deck</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Select any text inside your note and click <strong>"Set Front"</strong> or <strong>"Set Back"</strong>, or add cards manually!
                  </p>
                </div>
                <button
                  onClick={() => setMode('manage')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Flashcard</span>
                </button>
              </div>
            ) : quizFinished ? (
              /* Quiz Completion Screen */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-6"
              >
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
                  <Award className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Quiz Completed! 🎉</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Great job exercising your active recall on "{noteTitle}".
                  </p>
                </div>

                {/* Score Box */}
                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <p className="text-xs text-slate-500 font-semibold uppercase">Total Cards</p>
                    <p className="text-xl font-black text-slate-900 mt-1">{totalCards}</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
                    <p className="text-xs text-emerald-600 font-semibold uppercase">Got It (Mastered)</p>
                    <p className="text-xl font-black text-emerald-700 mt-1">{sessionMasteredCount}</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                    <p className="text-xs text-amber-600 font-semibold uppercase">Score</p>
                    <p className="text-xl font-black text-amber-700 mt-1">{sessionScorePercent}%</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center gap-3 pt-4">
                  <button
                    onClick={() => handleRestartQuiz(false)}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Study Entire Deck Again</span>
                  </button>

                  {sessionMasteredCount < totalCards && (
                    <button
                      onClick={() => handleRestartQuiz(true)}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2"
                    >
                      <RotateCw className="w-4 h-4" />
                      <span>Review Missed Cards ({totalCards - sessionMasteredCount})</span>
                    </button>
                  )}

                  <button
                    onClick={() => setMode('manage')}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Cards</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Active Flashcard Quiz View */
              <div className="space-y-6">
                {/* Progress bar & Counter */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[11px]">
                        Card {currentCardNum} of {totalCards}
                      </span>
                      {currentCard.mastered && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Mastered
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShuffle}
                        className="text-slate-400 hover:text-slate-700 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                        title="Shuffle card order"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>Shuffle</span>
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* 3D Flip Flashcard */}
                <div 
                  className="relative h-72 sm:h-80 w-full cursor-pointer select-none perspective-1000"
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="w-full h-full relative preserve-3d"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Front of Card */}
                    <div 
                      className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 transition-all backface-hidden bg-gradient-to-br from-white to-blue-50/40 ${
                        isFlipped ? 'pointer-events-none' : 'border-blue-200 shadow-lg'
                      }`}
                      style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-extrabold uppercase tracking-wider">
                          Front • Question / Term
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Click to flip 🔄
                        </span>
                      </div>

                      <div className="my-auto text-center px-4">
                        <p className="text-base sm:text-lg font-bold text-slate-800 leading-relaxed">
                          {currentCard.front}
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="text-[11px] text-slate-400 inline-flex items-center gap-1 bg-white/80 px-3 py-1 rounded-full border border-slate-200">
                          <RotateCw className="w-3 h-3 text-blue-500" /> Spacebar or click to reveal answer
                        </span>
                      </div>
                    </div>

                    {/* Back of Card */}
                    <div 
                      className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 flex flex-col justify-between border-2 transition-all backface-hidden bg-gradient-to-br from-white to-emerald-50/40 ${
                        !isFlipped ? 'pointer-events-none' : 'border-emerald-300 shadow-lg'
                      }`}
                      style={{ 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider">
                          Back • Answer / Explanation
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Click to flip back 🔄
                        </span>
                      </div>

                      <div className="my-auto text-center px-4">
                        <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                          {currentCard.back}
                        </p>
                      </div>

                      <div className="text-center">
                        <span className="text-[11px] text-emerald-600 font-bold">
                          ✓ Verified from Note Text
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Rating Controls & Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleMarkCard(false)}
                      className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                    >
                      <RotateCw className="w-4 h-4 text-amber-600" />
                      <span>Need Review (← Left)</span>
                    </button>

                    <button
                      onClick={() => handleMarkCard(true)}
                      className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs hover:shadow-sm"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-100" />
                      <span>Got It / Mastered (Right →)</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      onClick={() => {
                        if (currentIndex > 0) {
                          setIsFlipped(false);
                          setCurrentIndex(prev => prev - 1);
                        }
                      }}
                      disabled={currentIndex === 0}
                      className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous Card</span>
                    </button>

                    <button
                      onClick={() => setIsFlipped(!isFlipped)}
                      className="font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>{isFlipped ? 'Show Front' : 'Show Answer'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (currentIndex < deck.length - 1) {
                          setIsFlipped(false);
                          setCurrentIndex(prev => prev + 1);
                        } else {
                          setQuizFinished(true);
                        }
                      }}
                      className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Skip / Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            /* Manage Deck Mode */
            <div className="space-y-6">
              {/* Add / Edit Card Form */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Plus className="w-4 h-4 text-blue-600" />
                    <span>{editingCardId ? 'Edit Flashcard' : 'Add New Flashcard'}</span>
                  </h4>
                  {editingCardId && (
                    <button
                      onClick={() => {
                        setEditingCardId(null);
                        setCardFront('');
                        setCardBack('');
                      }}
                      className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                      Front (Question, Concept, or Formula)
                    </label>
                    <textarea
                      rows={2}
                      value={cardFront}
                      onChange={(e) => setCardFront(e.target.value)}
                      placeholder="e.g. What is the First Law of Thermodynamics?"
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-extrabold text-slate-600 uppercase mb-1">
                      Back (Answer, Definition, or Key Explanation)
                    </label>
                    <textarea
                      rows={2}
                      value={cardBack}
                      onChange={(e) => setCardBack(e.target.value)}
                      placeholder="e.g. Energy cannot be created or destroyed, only transformed (ΔU = Q - W)."
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <button
                    onClick={handleSaveCard}
                    disabled={!cardFront.trim() || !cardBack.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{editingCardId ? 'Update Flashcard' : 'Add to Deck'}</span>
                  </button>
                </div>
              </div>

              {/* Cards List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Deck Cards ({deck.length})
                  </h4>
                </div>

                {deck.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No flashcards created yet. Use the form above or highlight text in the note.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {deck.map((card, idx) => (
                      <div
                        key={card.id}
                        className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-colors flex items-start justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-900 line-clamp-1">
                              {card.front}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2 pl-7">
                            {card.back}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleStartEdit(card)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 cursor-pointer"
                            title="Edit Card"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCard(card.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer"
                            title="Delete Card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Keyboard shortcuts: [Space] Flip • [←] Need Review • [→] Mastered</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
