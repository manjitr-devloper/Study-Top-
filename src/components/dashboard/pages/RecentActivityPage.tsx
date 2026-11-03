import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Trash2, 
  FileText, 
  Sparkles, 
  HelpCircle, 
  RotateCcw, 
  CheckCircle, 
  Download, 
  Filter,
  ArrowRight,
  Calendar,
  Layers
} from 'lucide-react';
import { Note } from '../../../types';

interface ActivityItem {
  id: string;
  type: 'note_created' | 'note_edited' | 'ai_summary' | 'math_solved' | 'flashcard_quiz' | 'file_export';
  title: string;
  description: string;
  timestamp: number;
  noteId?: string;
  category: 'Notes' | 'AI Tools' | 'Flashcards' | 'Export';
}

interface RecentActivityPageProps {
  notes: Note[];
  onOpenNote: (id: string) => void;
}

export const RecentActivityPage: React.FC<RecentActivityPageProps> = ({
  notes,
  onOpenNote
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [cleared, setCleared] = useState(false);

  // Derive genuine dynamic activity items from actual user notes & timestamp updates
  const activities: ActivityItem[] = cleared ? [] : notes.flatMap(n => {
    const list: ActivityItem[] = [];
    if (n.createdAt) {
      list.push({
        id: `created_${n.id}`,
        type: 'note_created',
        title: `Created note "${n.title || 'Untitled Note'}"`,
        description: `New academic note added to your study repository`,
        timestamp: n.createdAt,
        noteId: n.id,
        category: 'Notes'
      });
    }
    if (n.updatedAt && n.updatedAt !== n.createdAt) {
      list.push({
        id: `edited_${n.id}`,
        type: 'note_edited',
        title: `Updated "${n.title || 'Untitled Note'}"`,
        description: `Content modified and synced with cloud persistence`,
        timestamp: n.updatedAt,
        noteId: n.id,
        category: 'Notes'
      });
    }
    if (n.flashcards && n.flashcards.length > 0) {
      list.push({
        id: `flashcards_${n.id}`,
        type: 'flashcard_quiz',
        title: `Created Flashcards deck for "${n.title || 'Untitled Note'}"`,
        description: `${n.flashcards.length} active recall cards generated`,
        timestamp: n.updatedAt - 120000,
        noteId: n.id,
        category: 'Flashcards'
      });
    }
    return list;
  }).sort((a, b) => b.timestamp - a.timestamp);

  const filteredActivities = activities.filter(act => {
    if (filterCategory !== 'All' && act.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return act.title.toLowerCase().includes(q) || act.description.toLowerCase().includes(q);
    }
    return true;
  });

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear your local activity timeline?')) {
      setCleared(true);
    }
  };

  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'note_created':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'note_edited':
        return <Clock className="w-4 h-4 text-indigo-600" />;
      case 'flashcard_quiz':
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      case 'ai_summary':
      case 'math_solved':
        return <Sparkles className="w-4 h-4 text-amber-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider">
            Study Timeline
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Recent Learning Activity</h2>
          <p className="text-xs text-slate-500 mt-1">
            Audit history of your notes, AI questions, flashcard quizzes, and study sessions.
          </p>
        </div>

        {activities.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-4 py-2 rounded-xl border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-extrabold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 flex-1 max-w-xs focus-within:bg-white focus-within:border-blue-500">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {['All', 'Notes', 'Flashcards', 'AI Tools'].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Timeline */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Clock className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-700">No activity recorded</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Your recent notes creation, edits, and quiz attempts will automatically appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {filteredActivities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline node */}
                <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-blue-500 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-blue-600" />
                </div>

                <div className="bg-slate-50/70 group-hover:bg-blue-50/40 p-4 rounded-2xl border border-slate-200/80 transition-all flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {getIcon(act.type)}
                      <h4 className="text-xs font-black text-slate-900 truncate">
                        {act.title}
                      </h4>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                        {act.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium pl-6">
                      {act.description}
                    </p>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="text-[11px] font-bold text-slate-400 block">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                    {act.noteId && (
                      <button
                        onClick={() => onOpenNote(act.noteId!)}
                        className="text-xs font-extrabold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Open</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
