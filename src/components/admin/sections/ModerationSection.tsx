import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldAlert, 
  Flag, 
  CheckCircle2, 
  XCircle, 
  Ban, 
  Plus, 
  Trash2, 
  Search,
  AlertTriangle
} from 'lucide-react';
import { ContentReport } from '../adminTypes';

interface ModerationSectionProps {
  reports: ContentReport[];
  bannedWords: string[];
  onAddBannedWord: (word: string) => void;
  onRemoveBannedWord: (word: string) => void;
  onResolveReport: (reportId: string, resolution: 'resolved' | 'dismissed') => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const ModerationSection: React.FC<ModerationSectionProps> = ({
  reports,
  bannedWords,
  onAddBannedWord,
  onRemoveBannedWord,
  onResolveReport,
  actionLoading,
  darkMode
}) => {
  const [newWord, setNewWord] = useState('');

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    onAddBannedWord(newWord.trim().toLowerCase());
    setNewWord('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-rose-500" />
          <span>Abuse Reports &amp; Content Moderation</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Review academic integrity flags, prompt injection attempts, and configure automated banned words
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Inbox */}
        <div className={`p-6 rounded-3xl border shadow-xl lg:col-span-2 space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Flag className="w-4 h-4 text-rose-500" />
              <span>Pending Flags &amp; Reports ({reports.filter(r => r.status === 'pending').length})</span>
            </h3>
          </div>

          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className={`p-4 rounded-2xl border text-xs space-y-2 ${
                  darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
                      #{report.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      report.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : report.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(report.reportedAt).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h4 className="font-black text-slate-900 dark:text-white">{report.targetTitle}</h4>
                  <p className="text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                    Reason: {report.reason}
                  </p>
                  <p className="text-slate-500 text-[11px] mt-0.5">Reported by: {report.reporterEmail}</p>
                </div>

                {report.status === 'pending' && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <button
                      disabled={actionLoading}
                      onClick={() => onResolveReport(report.id, 'dismissed')}
                      className="px-3 py-1 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] cursor-pointer"
                    >
                      Dismiss Flag
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => onResolveReport(report.id, 'resolved')}
                      className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer shadow-sm"
                    >
                      Enforce &amp; Resolve
                    </button>
                  </div>
                )}
              </div>
            ))}

            {reports.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                Zero open moderation reports. Student community is healthy!
              </div>
            )}
          </div>
        </div>

        {/* Banned Keywords Filter Manager */}
        <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Ban className="w-4 h-4 text-rose-500" />
            <span>Keyword Blacklist</span>
          </h3>
          <p className="text-xs text-slate-500">
            Terms blocked in Study Top notes and voice queries
          </p>

          <form onSubmit={handleAddWord} className="flex gap-2">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add keyword..."
              className={`flex-1 p-2 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <button
              type="submit"
              className="p-2 rounded-xl bg-rose-600 text-white cursor-pointer hover:bg-rose-700 shadow-sm"
              title="Add word"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {bannedWords.map((word) => (
              <span
                key={word}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
              >
                <span>{word}</span>
                <button
                  onClick={() => onRemoveBannedWord(word)}
                  className="hover:text-rose-900 dark:hover:text-rose-100 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
