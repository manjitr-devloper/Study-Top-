import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  Copy, 
  FolderPlus, 
  ExternalLink, 
  Layers, 
  Clock, 
  FileText, 
  Loader2,
  X,
  Check
} from 'lucide-react';
import { stClient } from '../../lib/stCloudClient';

interface NotebookItem {
  id: string;
  title: string;
  subject: string;
  coverGradient: string;
  sourcesCount: number;
  notesCount: number;
  lastModified: number;
  createdAt: number;
}

export const NotebooksManagerView: React.FC<{
  onOpenNotebook?: (notebook: NotebookItem) => void;
  onCreateNoteInNotebook?: (notebookId: string) => void;
}> = ({ onOpenNotebook, onCreateNoteInNotebook }) => {
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // New notebook form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Mathematics');
  const [newGradient, setNewGradient] = useState('from-blue-600 to-indigo-700');

  const gradients = [
    { label: 'Royal Blue', value: 'from-blue-600 to-indigo-700' },
    { label: 'Emerald Forest', value: 'from-emerald-600 to-teal-700' },
    { label: 'Sunset Amber', value: 'from-amber-600 to-orange-700' },
    { label: 'Berry Purple', value: 'from-purple-600 to-fuchsia-700' },
    { label: 'Ruby Crimson', value: 'from-rose-600 to-pink-700' },
    { label: 'Midnight Slate', value: 'from-slate-700 to-slate-900' }
  ];

  const fetchNotebooks = async () => {
    setIsLoading(true);
    try {
      const data = await stClient.notebooks.list();
      setNotebooks(data || []);
    } catch (e) {
      console.warn('Failed to fetch notebooks:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await stClient.notebooks.create({
        title: newTitle.trim(),
        subject: newSubject,
        coverGradient: newGradient
      });
      setNotebooks(prev => [created, ...prev]);
      setIsCreateModalOpen(false);
      setNewTitle('');
    } catch (err: any) {
      alert('Error creating notebook: ' + err.message);
    }
  };

  const handleDeleteNotebook = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this notebook?')) return;
    try {
      await stClient.notebooks.delete(id);
      setNotebooks(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const filteredNotebooks = notebooks.filter(n => 
    (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.subject || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>My Notebooks</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize study chapters, uploaded PDFs, exam notes, and mind maps in custom binders.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none w-44 sm:w-60 transition"
            />
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Notebook</span>
          </button>
        </div>
      </div>

      {/* Notebooks Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-bold">Loading your study notebooks...</span>
        </div>
      ) : filteredNotebooks.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNotebooks.map(nb => (
            <div
              key={nb.id}
              onClick={() => onOpenNotebook && onOpenNotebook(nb)}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex flex-col overflow-hidden"
            >
              {/* Cover Gradient */}
              <div className={`h-28 bg-gradient-to-r ${nb.coverGradient || 'from-blue-600 to-indigo-700'} p-4 flex flex-col justify-between text-white relative`}>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-black/20 backdrop-blur-md self-start">
                  {nb.subject}
                </span>

                <div className="flex items-center justify-between z-10">
                  <span className="text-xs font-bold text-white/90">
                    {nb.notesCount || 0} Notes
                  </span>
                  <button
                    onClick={(e) => handleDeleteNotebook(nb.id, e)}
                    className="p-1.5 rounded-lg bg-black/20 hover:bg-rose-600 text-white transition cursor-pointer"
                    title="Delete Notebook"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {nb.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(nb.lastModified).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>{nb.sourcesCount || 0} Sources</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                  <span>Open Notebook Workspace</span>
                  <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto space-y-3">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No notebooks found</h3>
          <p className="text-xs text-slate-400">
            Create your first notebook to organize chapters, equations, and textbook notes.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Create Notebook
          </button>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Create New Study Notebook</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotebook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notebook Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 4 — Optics"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject</label>
                <select
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-blue-500 outline-none"
                >
                  {['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'Geography', 'Computer Science'].map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Cover Gradient</label>
                <div className="grid grid-cols-3 gap-2">
                  {gradients.map(g => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setNewGradient(g.value)}
                      className={`h-12 rounded-xl bg-gradient-to-r ${g.value} flex items-center justify-center transition-all cursor-pointer ${
                        newGradient === g.value ? 'ring-2 ring-blue-600 ring-offset-2' : ''
                      }`}
                    >
                      {newGradient === g.value && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                >
                  Create Binder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
