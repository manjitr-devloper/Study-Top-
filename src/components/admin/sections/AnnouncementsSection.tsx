import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Radio, 
  Send, 
  Trash2, 
  AlertCircle, 
  Info, 
  Flame,
  CheckCircle2
} from 'lucide-react';

interface AnnouncementsSectionProps {
  announcements: any[];
  onPublishAnnouncement: (title: string, content: string, priority: 'info' | 'important' | 'emergency') => Promise<void>;
  onDeleteAnnouncement: (id: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({
  announcements,
  onPublishAnnouncement,
  onDeleteAnnouncement,
  actionLoading,
  darkMode
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'info' | 'important' | 'emergency'>('info');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    await onPublishAnnouncement(title.trim(), content.trim(), priority);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Radio className="w-6 h-6 text-indigo-500" />
          <span>System Broadcasts &amp; Student Announcements</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Broadcast alerts, feature updates, and maintenance notifications to all student accounts in real time
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Compose Form */}
        <form onSubmit={handleSubmit} className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
            <Send className="w-4 h-4 text-indigo-500" />
            <span>Compose Broadcast</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Announcement Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Study Top AI 2.5 Release Notes"
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Priority Urgency
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            >
              <option value="info">Standard Information (Blue)</option>
              <option value="important">Important Update (Amber)</option>
              <option value="emergency">Emergency Alert (Red)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Message Content
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe the update for students..."
              className={`w-full p-3 rounded-xl text-xs font-medium border outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer disabled:opacity-50"
          >
            <Radio className="w-4 h-4" />
            <span>Broadcast to All Users</span>
          </button>
        </form>

        {/* Active Broadcasts List */}
        <div className={`p-6 rounded-3xl border shadow-xl lg:col-span-2 space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-800">
            Active System Broadcasts
          </h3>

          <div className="space-y-3">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-4 rounded-2xl border text-xs space-y-2 flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                  ann.priority === 'emergency'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                    : ann.priority === 'important'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                    : darkMode ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      ann.priority === 'emergency'
                        ? 'bg-rose-600 text-white'
                        : ann.priority === 'important'
                        ? 'bg-amber-500 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(ann.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">{ann.title}</h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ann.content}</p>
                </div>

                <button
                  disabled={actionLoading}
                  onClick={() => onDeleteAnnouncement(ann.id)}
                  className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200 self-end sm:self-start cursor-pointer"
                  title="Remove Announcement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {announcements.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No active announcements currently broadcast.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
