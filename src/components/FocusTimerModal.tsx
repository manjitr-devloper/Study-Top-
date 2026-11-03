import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, Trash2, X, Plus, Bell, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface FocusTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onStartTimer: (duration: number, mode: 'work' | 'break') => void;
  isTimerRunning: boolean;
  pomodoroTime: number;
  timerMode: 'work' | 'break';
  stopTimer: () => void;
}

export const FocusTimerModal: React.FC<FocusTimerModalProps> = ({ 
  isOpen, onClose, language, onStartTimer, 
  isTimerRunning, pomodoroTime, timerMode, stopTimer 
}) => {
  const [customMinutes, setCustomMinutes] = useState('25');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const startCustom = (mode: 'work' | 'break') => {
    let min = parseInt(customMinutes);
    if (isNaN(min) || min <= 0) min = 25;
    onStartTimer(min * 60, mode);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[40px] w-full max-w-sm p-6 sm:p-8 shadow-2xl relative border border-slate-100"
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t(language, "Focus Timer")}</h2>
              <p className="text-sm text-slate-500 font-medium">Create custom timers with alerts.</p>
            </div>
          </div>

          {isTimerRunning ? (
            <div className="text-center py-6">
              <div className="text-6xl font-black font-mono text-slate-800 mb-4 tracking-tighter">
                {Math.floor(pomodoroTime / 60).toString().padStart(2, '0')}:{(pomodoroTime % 60).toString().padStart(2, '0')}
              </div>
              <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-8">{timerMode.toUpperCase()} MODE</p>
              
              <button 
                onClick={stopTimer}
                className="w-full py-4 bg-rose-50 text-rose-600 font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2"
              >
                <Pause className="w-5 h-5" />
                Stop Timer
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 text-center">Set Custom Duration (Mins)</label>
                <input 
                  type="number"
                  min="1"
                  max="120"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-full text-center text-5xl font-black text-slate-900 bg-transparent outline-none mb-6 border-b-2 border-slate-200 focus:border-indigo-500 transition-colors pb-2"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => startCustom('work')}
                    className="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" /> Work
                  </button>
                  <button 
                    onClick={() => startCustom('break')}
                    className="py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition flex items-center justify-center gap-2"
                  >
                    <Bell className="w-4 h-4" /> Break
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[15, 25, 50].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => { setCustomMinutes(preset.toString()); onStartTimer(preset * 60, 'work'); }}
                    className="py-3 bg-white border-2 border-slate-100 rounded-xl font-bold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 transition-colors"
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
