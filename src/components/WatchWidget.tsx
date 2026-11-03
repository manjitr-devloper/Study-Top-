import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw, X, Timer } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function WatchWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  
  // Stopwatch state
  const [mode, setMode] = useState<'clock' | 'stopwatch'>('clock');
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning) {
      interval = setInterval(() => {
        setStopwatchTime(prev => prev + 10);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  const formatStopwatch = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors",
          isOpen ? "bg-brand-100 text-brand-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        <Clock className="w-4 h-4" />
        <span className="hidden sm:inline">
          {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden"
          >
            <div className="flex bg-slate-50 p-1 border-b border-slate-100">
              <button
                onClick={() => setMode('clock')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1",
                  mode === 'clock' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Clock className="w-3 h-3" />
                Clock
              </button>
              <button
                onClick={() => setMode('stopwatch')}
                className={cn(
                  "flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-1",
                  mode === 'stopwatch' ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Timer className="w-3 h-3" />
                Timer
              </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[160px]">
              {mode === 'clock' ? (
                <div className="text-center">
                  <div className="text-4xl font-black text-slate-800 tabular-nums tracking-tighter">
                    {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </div>
                  <div className="text-sm font-medium text-slate-400 mt-1">
                    {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ) : (
                <div className="text-center w-full">
                  <div className="text-4xl font-black text-slate-800 tabular-nums tracking-tighter">
                    {formatStopwatch(stopwatchTime)}
                  </div>
                  <div className="flex items-center justify-center gap-3 mt-6">
                    <button
                      onClick={() => setIsRunning(!isRunning)}
                      className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center text-white transition-all active:scale-95",
                        isRunning ? "bg-rose-500 hover:bg-rose-600 shadow-lg shadow-rose-200" : "bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-200"
                      )}
                    >
                      {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                    </button>
                    <button
                      onClick={() => {
                        setIsRunning(false);
                        setStopwatchTime(0);
                      }}
                      className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
