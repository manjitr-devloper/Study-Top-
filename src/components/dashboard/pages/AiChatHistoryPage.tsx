import React, { useState } from 'react';
import { 
  MessageSquare, 
  Search, 
  Trash2, 
  Edit2, 
  Star, 
  ArrowRight, 
  Download, 
  Check, 
  Calendar,
  Sparkles,
  X
} from 'lucide-react';

export interface ChatSessionItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
  isFavorite?: boolean;
}

interface AiChatHistoryPageProps {
  onContinueChat: (session: ChatSessionItem) => void;
}

export const AiChatHistoryPage: React.FC<AiChatHistoryPageProps> = ({
  onContinueChat
}) => {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([
    {
      id: 'session_1',
      title: 'Thermodynamics & Carnot Engine Efficiency',
      lastMessage: 'The theoretical maximum efficiency is given by η = 1 - (Tc / Th).',
      timestamp: Date.now() - 3600000,
      isFavorite: true
    },
    {
      id: 'session_2',
      title: 'Quadratic Roots & Discriminant Analysis',
      lastMessage: 'Since Δ = b² - 4ac > 0, the equation yields two distinct real roots.',
      timestamp: Date.now() - 86400000,
      isFavorite: false
    },
    {
      id: 'session_3',
      title: 'Photosynthesis Light vs Dark Reactions',
      lastMessage: 'Light-dependent reactions occur in the thylakoid membranes generating ATP and NADPH.',
      timestamp: Date.now() - 172800000,
      isFavorite: true
    }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredSessions = sessions.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.lastMessage.toLowerCase().includes(q);
  });

  const handleDelete = (id: string) => {
    if (confirm('Delete this conversation from history?')) {
      setSessions(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleToggleFavorite = (id: string) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  const handleStartRename = (session: ChatSessionItem) => {
    setEditingId(session.id);
    setEditTitle(session.title);
  };

  const handleSaveRename = () => {
    if (!editTitle.trim() || !editingId) return;
    setSessions(prev => prev.map(s => s.id === editingId ? { ...s, title: editTitle.trim() } : s));
    setEditingId(null);
  };

  const handleExport = (session: ChatSessionItem) => {
    const content = `# ${session.title}\nDate: ${new Date(session.timestamp).toLocaleString()}\n\n---\nLast Message:\n${session.lastMessage}\n`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
            Conversations Log
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">AI Chat History</h2>
          <p className="text-xs text-slate-500 mt-1">
            Review past academic conversations, questions, and problem-solving sessions.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shrink-0">
          {sessions.length} Saved Conversations
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus-within:bg-white focus-within:border-blue-500">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversation topics or content..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List */}
      {filteredSessions.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-700">No chat sessions found</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Your conversations with the Study Top AI Assistant will be preserved here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 hover:border-blue-300 hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleFavorite(session.id)}
                    className={`p-1 rounded-lg ${session.isFavorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}
                    title="Toggle Favorite"
                  >
                    <Star className="w-4 h-4 fill-current" />
                  </button>

                  {editingId === session.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-900 w-full"
                        autoFocus
                      />
                      <button onClick={handleSaveRename} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {session.title}
                    </h3>
                  )}
                </div>

                <p className="text-xs text-slate-500 line-clamp-1 pl-7">
                  {session.lastMessage}
                </p>

                <div className="text-[11px] text-slate-400 pl-7 flex items-center gap-3">
                  <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{new Date(session.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => handleStartRename(session)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                  title="Rename Title"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleExport(session)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                  title="Export Transcript"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDelete(session.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer"
                  title="Delete Conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onContinueChat(session)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <span>Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
