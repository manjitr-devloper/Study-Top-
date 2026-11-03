import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Play, X } from 'lucide-react';

interface CancelConfirmModalProps {
  isOpen: boolean;
  onContinue: () => void;
  onConfirmCancel: () => void;
  title?: string;
  description?: string;
}

export const CancelConfirmModal: React.FC<CancelConfirmModalProps> = ({
  isOpen,
  onContinue,
  onConfirmCancel,
  title = "Cancel this process?",
  description = "Your note may not be completed. You can try again later."
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100 relative overflow-hidden"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                {description}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={onContinue}
              className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Continue Processing
            </button>
            <button
              type="button"
              onClick={onConfirmCancel}
              className="py-3 px-4 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-2xl text-xs font-bold transition-all active:scale-95"
            >
              Cancel Process
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
