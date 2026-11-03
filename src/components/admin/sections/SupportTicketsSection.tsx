import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LifeBuoy, 
  Send, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  User, 
  X,
  AlertCircle
} from 'lucide-react';
import { SupportTicket } from '../adminTypes';

interface SupportTicketsSectionProps {
  tickets: SupportTicket[];
  onReplyTicket: (ticketId: string, reply: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const SupportTicketsSection: React.FC<SupportTicketsSectionProps> = ({
  tickets,
  onReplyTicket,
  actionLoading,
  darkMode
}) => {
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    await onReplyTicket(activeTicket.id, replyText.trim());
    setReplyText('');
    setActiveTicket(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-indigo-500" />
          <span>Student Support &amp; Help Desk Inquiries</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Respond directly to student academic requests, technical feedback, and OCR queries
        </p>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <div
            key={t.id}
            className={`p-5 rounded-3xl border shadow-lg space-y-3 transition-all ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  #{t.id}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  t.status === 'open' 
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                }`}>
                  {t.status}
                </span>
                <span className="text-xs font-bold text-slate-500">• {t.userName} ({t.userEmail})</span>
              </div>

              <span className="text-[10px] text-slate-400">
                {new Date(t.createdAt).toLocaleString()}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">{t.subject}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                "{t.message}"
              </p>
            </div>

            {t.adminReply && (
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs">
                <span className="font-bold text-indigo-700 dark:text-indigo-300 block mb-0.5">
                  Super Admin Reply (Manjit Ranjan):
                </span>
                <p className="text-slate-700 dark:text-slate-200">{t.adminReply}</p>
              </div>
            )}

            {!t.adminReply && (
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => {
                    setActiveTicket(t);
                    setReplyText('');
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Reply to Student</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reply Modal */}
      <AnimatePresence>
        {activeTicket && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.form
              onSubmit={handleSendReply}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 ${
                darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black">Reply to #{activeTicket.id}: {activeTicket.userName}</h3>
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                <span className="font-bold text-slate-500 block mb-0.5">Student Inquiry:</span>
                <p className="text-slate-700 dark:text-slate-300">"{activeTicket.message}"</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">
                  Official Administrative Reply
                </label>
                <textarea
                  required
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type official guidance or resolution..."
                  className={`w-full p-3 rounded-2xl text-xs font-medium border outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Official Reply</span>
                </button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
