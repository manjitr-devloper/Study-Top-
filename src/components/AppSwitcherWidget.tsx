import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutGrid, Calendar, Calculator, FileText, Rocket } from 'lucide-react';
import { cn } from '../lib/utils'; // if exists, else we'll handle

interface AppSwitcherProps {
  onOpenCalendar: () => void;
  onOpenCalculator: () => void;
  onOpenResultMaker: () => void;
  onOpenOtherApp: () => void;
}

export const AppSwitcherWidget: React.FC<AppSwitcherProps> = ({
  onOpenCalendar,
  onOpenCalculator,
  onOpenResultMaker,
  onOpenOtherApp
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const apps = [
    { name: 'App Hub', icon: Rocket, onClick: onOpenOtherApp, color: 'text-indigo-500', bg: 'bg-indigo-50' }
  ];

  return (
    <div className="relative z-50" ref={widgetRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
        title="Apps"
      >
        <LayoutGrid className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-12 w-72 bg-white rounded-3xl shadow-xl border border-slate-100 p-4"
          >
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 px-2">Apps</h3>
            <div className="grid grid-cols-3 gap-2">
              {apps.map((app) => (
                <button
                  key={app.name}
                  onClick={() => {
                    app.onClick();
                    setIsOpen(false);
                  }}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${app.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                    <app.icon className={`w-6 h-6 ${app.color}`} />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 text-center leading-tight">
                    {app.name}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
