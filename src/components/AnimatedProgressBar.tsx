import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, XCircle, RefreshCw, Loader2, Sparkles } from 'lucide-react';

export type ProgressStatus = 'idle' | 'loading' | 'cancelling' | 'cancelled' | 'success' | 'error';

export interface AnimatedProgressBarProps {
  status: ProgressStatus;
  stageText: string;
  subText?: string;
  progress?: number; // 0 - 100 for determinate mode, or undefined for truthful indeterminate mode
  errorMessage?: string;
  onCancel?: () => void;
  onRetry?: () => void;
  cancelDisabled?: boolean;
  accent?: 'blue' | 'violet' | 'emerald';
  showCancelButton?: boolean;
  className?: string;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  status,
  stageText,
  subText,
  progress,
  errorMessage,
  onCancel,
  onRetry,
  cancelDisabled = false,
  accent = 'blue',
  showCancelButton = true,
  className = ''
}) => {
  if (status === 'idle') return null;

  const isDeterminate = typeof progress === 'number' && progress >= 0 && progress <= 100;
  const isCancelling = status === 'cancelling';
  const isCancelled = status === 'cancelled';
  const isSuccess = status === 'success';
  const isError = status === 'error';
  const isLoading = status === 'loading';

  const accentGradients = {
    blue: 'from-blue-600 via-indigo-600 to-violet-600',
    violet: 'from-violet-600 via-purple-600 to-indigo-600',
    emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
  };

  const glowColors = {
    blue: 'shadow-[0_0_20px_rgba(79,70,229,0.35)]',
    violet: 'shadow-[0_0_20px_rgba(147,51,234,0.35)]',
    emerald: 'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
  };

  return (
    <div className={`w-full bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-slate-100 shadow-xl transition-all ${className}`}>
      {/* Top Header: Current Task & Percentage / Indicator */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {isLoading && (
              <div className="relative flex items-center justify-center w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping opacity-75" />
              </div>
            )}
            {isCancelling && (
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
            {isCancelled && (
              <div className="w-7 h-7 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            )}
            {isSuccess && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </motion.div>
            )}
            {isError && (
              <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
                <AlertCircle className="w-4 h-4" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-800 tracking-tight truncate">
              {isCancelling ? 'Cancelling process…' : isCancelled ? 'Process cancelled' : isError ? 'Operation failed' : isSuccess ? 'Completed successfully!' : stageText}
            </h4>
            {subText && (
              <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                {subText}
              </p>
            )}
          </div>
        </div>

        {/* Percentage badge or Stage badge */}
        <div className="shrink-0">
          {isDeterminate ? (
            <span className="text-xs font-black tabular-nums px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
              {Math.round(progress)}%
            </span>
          ) : isSuccess ? (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              100%
            </span>
          ) : isLoading ? (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100 animate-pulse">
              Processing
            </span>
          ) : null}
        </div>
      </div>

      {/* The Animated Progress Track */}
      <div className="relative w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
        {/* Track fill */}
        {isSuccess ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.5)]"
          />
        ) : isError ? (
          <div className="h-full w-full bg-rose-400 rounded-full" />
        ) : isCancelled ? (
          <div className="h-full w-full bg-slate-300 rounded-full opacity-60" />
        ) : isDeterminate ? (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`h-full bg-gradient-to-r ${accentGradients[accent]} rounded-full ${glowColors[accent]}`}
          />
        ) : (
          /* Truthful Indeterminate Stage Bar with moving wave particles */
          <div className="relative w-full h-full overflow-hidden rounded-full">
            <motion.div
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: 'easeInOut'
              }}
              className={`absolute top-0 bottom-0 w-1/2 bg-gradient-to-r ${accentGradients[accent]} rounded-full ${glowColors[accent]}`}
            />
          </div>
        )}
      </div>

      {/* Error message callout if failed */}
      {isError && errorMessage && (
        <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="flex-1">{errorMessage}</span>
        </div>
      )}

      {/* Bottom Action Footer (Cancel / Retry buttons) */}
      <div className="mt-3.5 flex items-center justify-between gap-3 pt-2 border-t border-slate-100/80">
        <div className="text-[11px] text-slate-400 font-medium">
          {isLoading ? (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              Live AI pipeline active
            </span>
          ) : isCancelled ? (
            <span>Your input is preserved safely.</span>
          ) : isError ? (
            <span>You can retry anytime.</span>
          ) : isSuccess ? (
            <span className="text-emerald-600 font-semibold">Ready for workspace</span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          {isError && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </button>
          )}

          {isCancelled && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black tracking-wide flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </button>
          )}

          {showCancelButton && (isLoading || isCancelling) && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={cancelDisabled || isCancelling}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-bold transition-all disabled:opacity-50 active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Cancelling…</span>
                </>
              ) : (
                <span>Cancel</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
