import React from 'react';
import { 
  Star, 
  FileText, 
  Sparkles, 
  RotateCcw, 
  BookOpen, 
  ArrowRight,
  Calculator,
  Download,
  Layers
} from 'lucide-react';
import { Note } from '../../../types';

interface FavoritesPageProps {
  notes: Note[];
  onOpenNote: (id: string) => void;
  onOpenTool: (toolId: string) => void;
  onToggleFavorite: (id: string) => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  notes,
  onOpenNote,
  onOpenTool,
  onToggleFavorite
}) => {
  const favoriteNotes = notes.filter(n => !n.isDeleted && (n.isFavorite || n.tags?.includes('favorite')));

  const favoriteTools = [
    { id: 'math-solver', name: 'Step-by-Step Math Solver', desc: 'Verified algebra, geometry & calculus steps', icon: Calculator, color: 'text-indigo-600 bg-indigo-50' },
    { id: 'flashcards', name: 'Interactive 3D Flashcards', desc: 'Spaced repetition active recall decks', icon: RotateCcw, color: 'text-purple-600 bg-purple-50' },
    { id: 'ai-assistant', name: 'AI Academic Assistant', desc: 'Gemini-powered concept explaining & formulas', icon: Sparkles, color: 'text-blue-600 bg-blue-50' }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider">
            Favorites Collection
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Starred &amp; Favourites</h2>
          <p className="text-xs text-slate-500 mt-1">
            Fast access to your highest-yield notes, preferred study tools, and priority decks.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shrink-0">
          {favoriteNotes.length} Starred Notes
        </div>
      </div>

      {/* Favorite Tools Quick Access */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Frequently Starred Study Tools</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {favoriteTools.map(tool => (
            <div
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-start gap-3.5 group shadow-2xs"
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${tool.color} group-hover:scale-105 transition-transform`}>
                <tool.icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {tool.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Starred Notes List */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Starred Study Notes</h3>
        {favoriteNotes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
            <Star className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-extrabold text-slate-700">No favorite notes yet</h4>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Click the star icon on any note card to pin it here for quick exam review.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteNotes.map(n => (
              <div
                key={n.id}
                onClick={() => onOpenNote(n.id)}
                className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group shadow-2xs relative"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-amber-600 transition-colors line-clamp-1">
                      {n.title || 'Untitled Note'}
                    </h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(n.id);
                      }}
                      className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      title="Remove from favorites"
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                    {n.content?.replace(/[#*`_]/g, '') || 'No content written.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                  <span className="text-blue-600 font-bold group-hover:underline inline-flex items-center gap-1">
                    <span>Study Note</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
