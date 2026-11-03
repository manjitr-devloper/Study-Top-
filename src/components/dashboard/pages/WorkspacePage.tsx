import React, { useState } from 'react';
import { 
  FolderPlus, 
  FileUp, 
  Folder, 
  FileText, 
  Trash2, 
  Search, 
  Download, 
  Eye, 
  Grid, 
  List, 
  ArrowUpDown, 
  HardDrive, 
  Plus, 
  File, 
  Image as ImageIcon,
  Check,
  Edit2,
  Calendar,
  X
} from 'lucide-react';
import { Note, StudyFolder } from '../../../types';

interface WorkspacePageProps {
  notes: Note[];
  folders: StudyFolder[];
  onOpenNote: (id: string) => void;
  onCreateNote: () => void;
  onCreateFolder?: (name: string, color: string) => void;
  onDeleteNote: (id: string) => void;
  onOpenExport: (note: Note) => void;
}

export const WorkspacePage: React.FC<WorkspacePageProps> = ({
  notes,
  folders: initialFolders,
  onOpenNote,
  onCreateNote,
  onCreateFolder,
  onDeleteNote,
  onOpenExport
}) => {
  const [folders, setFolders] = useState<StudyFolder[]>(initialFolders);
  const [selectedFolderId, setSelectedFolderId] = useState<string | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'name' | 'size'>('updated');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [isNewFolderModalOpen, setIsNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#3b82f6');
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  const colors = ['#3b82f6', '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6'];

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    const newFolder: StudyFolder = {
      id: 'folder_' + Date.now(),
      name: newFolderName.trim(),
      color: newFolderColor,
      createdAt: Date.now()
    };
    setFolders(prev => [...prev, newFolder]);
    if (onCreateFolder) onCreateFolder(newFolderName.trim(), newFolderColor);
    setNewFolderName('');
    setIsNewFolderModalOpen(false);
  };

  const filteredNotes = notes.filter(n => {
    if (n.isDeleted) return false;
    if (selectedFolderId !== 'all' && n.folderId !== selectedFolderId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
      if (!matchesSearch) return false;
    }
    // Date filter: Today, Last 7 days, Last 30 days
    if (dateFilter === 'today') {
      const startOfToday = new Date().setHours(0, 0, 0, 0);
      const noteTime = n.updatedAt || n.createdAt || 0;
      if (noteTime < startOfToday) return false;
    } else if (dateFilter === '7days') {
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const noteTime = n.updatedAt || n.createdAt || 0;
      if (noteTime < sevenDaysAgo) return false;
    } else if (dateFilter === '30days') {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const noteTime = n.updatedAt || n.createdAt || 0;
      if (noteTime < thirtyDaysAgo) return false;
    }
    return true;
  }).sort((a, b) => {
    if (sortBy === 'name') return (a.title || '').localeCompare(b.title || '');
    return b.updatedAt - a.updatedAt;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-900">
      {/* Workspace Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-extrabold uppercase tracking-wider">
              Personal Study Workspace
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900">My Workspace &amp; File Repository</h2>
          <p className="text-xs text-slate-500 mt-1">
            Organize study documents, textbooks, lecture slides, and AI-synthesized research notes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewFolderModalOpen(true)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-colors border border-slate-200"
          >
            <FolderPlus className="w-4 h-4 text-slate-600" />
            <span>New Folder</span>
          </button>

          <button
            onClick={onCreateNote}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs cursor-pointer flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create Note</span>
          </button>
        </div>
      </div>

      {/* Storage & Folder Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Storage Widget */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-600" />
                Workspace Quota
              </span>
              <span className="text-[11px] font-black text-slate-500">4.2 MB / 100 MB</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '4.2%' }} />
            </div>
            <p className="text-[11px] text-slate-400">95.8 MB cloud storage available</p>
          </div>
        </div>

        {/* Folders Overview */}
        <div className="md:col-span-3 flex items-center gap-3 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedFolderId('all')}
            className={`px-4 py-3 rounded-2xl border text-xs font-extrabold shrink-0 transition cursor-pointer flex items-center gap-2 ${
              selectedFolderId === 'all'
                ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Folder className="w-4 h-4 text-blue-600" />
            <span>All Documents ({notes.filter(n => !n.isDeleted).length})</span>
          </button>

          {folders.map(f => {
            const count = notes.filter(n => !n.isDeleted && n.folderId === f.id).length;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`px-4 py-3 rounded-2xl border text-xs font-extrabold shrink-0 transition cursor-pointer flex items-center gap-2 ${
                  selectedFolderId === f.id
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: f.color || '#3b82f6' }} />
                <span>{f.name}</span>
                <span className="text-[10px] text-slate-400 font-bold ml-1">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and View Controls Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 flex-1 max-w-md focus-within:bg-white focus-within:border-blue-500 transition">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, textbooks, and documents..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Date-Based Filtering Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              aria-label="Filter notes by date"
              className="bg-transparent border-none outline-none text-slate-700 font-bold cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 days</option>
              <option value="30days">Last 30 days</option>
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1 text-xs text-slate-500 font-bold bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent border-none outline-none text-slate-700 font-bold cursor-pointer"
            >
              <option value="updated">Recently Updated</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>
          </div>

          {/* Grid/List switch */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'grid' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-500'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Files Display */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-extrabold text-slate-700">No documents in this workspace</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create structured study notes or upload files to organize them here.
          </p>
          <button
            onClick={onCreateNote}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Note</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map(n => (
            <div
              key={n.id}
              onClick={() => onOpenNote(n.id)}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group shadow-2xs relative"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                      {n.title || 'Untitled Note'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setPreviewNote(n)}
                      className="p-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                      title="Quick Preview"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onOpenExport(n)}
                      className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                      title="Download / Export"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteNote(n.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                  {n.content?.replace(/[#*`_]/g, '') || 'Empty note content.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                {n.flashcards && n.flashcards.length > 0 && (
                  <span className="text-blue-600 font-bold">{n.flashcards.length} flashcards</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-2xs divide-y divide-slate-100">
          {filteredNotes.map(n => (
            <div
              key={n.id}
              onClick={() => onOpenNote(n.id)}
              className="p-4 hover:bg-slate-50 flex items-center justify-between gap-4 cursor-pointer transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-xs font-extrabold text-slate-900 truncate">{n.title || 'Untitled Note'}</h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-md">
                    {n.content?.replace(/[#*`_]/g, '') || 'No content written.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0" onClick={e => e.stopPropagation()}>
                <span>{new Date(n.updatedAt).toLocaleDateString()}</span>
                <button onClick={() => setPreviewNote(n)} className="p-1 text-slate-400 hover:text-blue-600">
                  <Eye className="w-4 h-4" />
                </button>
                <button onClick={() => onOpenExport(n)} className="p-1 text-slate-400 hover:text-slate-700">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={() => onDeleteNote(n.id)} className="p-1 text-slate-400 hover:text-rose-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm border border-slate-200 shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Create Study Folder</h3>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Folder Name</label>
              <input
                type="text"
                value={newFolderName}
                onChange={e => setNewFolderName(e.target.value)}
                placeholder="e.g. Organic Chemistry, Grade 10"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Folder Color</label>
              <div className="flex items-center gap-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewFolderColor(c)}
                    className="w-6 h-6 rounded-full border-2 transition cursor-pointer"
                    style={{ backgroundColor: c, borderColor: newFolderColor === c ? '#0f172a' : 'transparent' }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewFolderModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim()}
                className="px-4 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white cursor-pointer disabled:opacity-50"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Preview Modal */}
      {previewNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl border border-slate-200 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 truncate">{previewNote.title}</h3>
              <button onClick={() => setPreviewNote(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-4 overflow-y-auto flex-1 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {previewNote.content || 'Empty note content.'}
            </div>
            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  const id = previewNote.id;
                  setPreviewNote(null);
                  onOpenNote(id);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-extrabold hover:bg-blue-700 cursor-pointer"
              >
                Open in Full Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
