import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  Search, 
  Flag, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Mic, 
  Paperclip,
  X
} from 'lucide-react';
import { NoteMetadata } from '../adminTypes';

interface NotesManagementSectionProps {
  notes: NoteMetadata[];
  onNoteAction: (noteId: string, action: string, reason?: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const NotesManagementSection: React.FC<NotesManagementSectionProps> = ({
  notes,
  onNoteAction,
  actionLoading,
  darkMode
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [previewNote, setPreviewNote] = useState<NoteMetadata | null>(null);

  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase()) || n.ownerEmail.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || n.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-500" />
            <span>Notes Catalog &amp; Content Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Review metadata, LaTeX formatting, OCR outputs, and academic integrity across student notes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className={`pl-9 pr-3 py-2 rounded-xl text-xs font-bold outline-none border transition-all ${
                darkMode 
                  ? 'bg-slate-900 border-slate-800 text-white focus:border-purple-500' 
                  : 'bg-white border-slate-200 text-slate-900 focus:border-purple-500'
              }`}
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
              darkMode 
                ? 'bg-slate-900 border-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700'
            }`}
          >
            <option value="all">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Biology">Biology</option>
            <option value="Computer Science">Computer Science</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Notes Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-black uppercase text-[10px] tracking-wider border-b ${
              darkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3.5 px-5">Title &amp; Format</th>
                <th className="py-3.5 px-4">Subject</th>
                <th className="py-3.5 px-4">Author</th>
                <th className="py-3.5 px-4">Words</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${
              darkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'
            }`}>
              {filteredNotes.map((note) => (
                <tr key={note.id} className={`transition-colors ${
                  darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}>
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{note.title}</span>
                      {note.hasAudio && (
                        <span title="Includes AI Voice audio" className="p-1 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-600 text-[10px]">
                          <Mic className="w-3 h-3" />
                        </span>
                      )}
                      {note.hasPdf && (
                        <span title="Includes PDF attachment" className="p-1 rounded bg-purple-100 dark:bg-purple-950 text-purple-600 text-[10px]">
                          <Paperclip className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{note.format}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      {note.category}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{note.ownerName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{note.ownerEmail}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {note.wordCount.toLocaleString()}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      note.flagged 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-300' 
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}>
                      {note.flagged ? 'Flagged Review' : 'Published'}
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPreviewNote(note)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                        title="View Note Metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {note.flagged ? (
                        <button
                          disabled={actionLoading}
                          onClick={() => onNoteAction(note.id, 'unflag', 'Approved by admin')}
                          className="px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold cursor-pointer"
                          title="Unflag and approve"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          disabled={actionLoading}
                          onClick={() => onNoteAction(note.id, 'flag', 'Flagged for review')}
                          className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-[11px] font-bold cursor-pointer"
                          title="Flag for review"
                        >
                          Flag
                        </button>
                      )}

                      <button
                        disabled={actionLoading}
                        onClick={() => onNoteAction(note.id, 'delete', 'Removed by admin')}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 cursor-pointer"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note Detail Modal */}
      <AnimatePresence>
        {previewNote && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl relative ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button
                onClick={() => setPreviewNote(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                  {previewNote.category}
                </span>
                <span className="text-xs text-slate-500 font-mono">ID: {previewNote.id}</span>
              </div>

              <h3 className="text-lg font-black">{previewNote.title}</h3>
              <p className="text-xs text-slate-500 mt-1">Author: {previewNote.ownerName} ({previewNote.ownerEmail})</p>

              <div className="grid grid-cols-2 gap-3 mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Word Count</span>
                  <span className="font-bold">{previewNote.wordCount} words</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Format</span>
                  <span className="font-bold">{previewNote.format}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Audio Attached</span>
                  <span className="font-bold">{previewNote.hasAudio ? 'Yes' : 'No'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">PDF Attached</span>
                  <span className="font-bold">{previewNote.hasPdf ? 'Yes' : 'No'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => setPreviewNote(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
