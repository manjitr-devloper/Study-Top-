import React, { useState } from 'react';
import { ChevronLeft, LayoutDashboard, Calculator as CalculatorIcon, Calendar as CalendarIcon, FileText, Sparkles, Search, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { CalculatorApp } from './CalculatorApp';
import { CalendarApp } from './CalendarApp';
import { ResultMakerApp } from './ResultMakerApp';
import { AiSearchApp } from './AiSearchApp';
import { WebSearchApp } from './WebSearchApp';
import { Note, Task } from '../../types';

interface OtherAppProps {
  onBack: () => void;
  notes: Note[];
  tasks: Task[];
  onResultClick?: (id: string, type: 'note' | 'task') => void;
}

export const OtherApp: React.FC<OtherAppProps> = ({ onBack, notes, tasks, onResultClick }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'calculator' | 'calendar' | 'resultMaker' | 'aiSearch' | 'webSearch'>('dashboard');

  const apps = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', desc: 'Overview of all mini-apps', color: 'text-blue-500', bg: 'bg-blue-100' },
    { id: 'webSearch', icon: Globe, label: 'Global Knowledge', desc: 'Google search grounded AI', color: 'text-cyan-500', bg: 'bg-cyan-100' },
    { id: 'aiSearch', icon: Search, label: 'Neural Search', desc: 'Offline AI deep search engine', color: 'text-purple-500', bg: 'bg-purple-100' },
    { id: 'calculator', icon: CalculatorIcon, label: 'Calculator', desc: 'Advanced math and calculations', color: 'text-orange-500', bg: 'bg-orange-100' },
    { id: 'calendar', icon: CalendarIcon, label: 'Calendar', desc: 'Manage your schedule effortlessly', color: 'text-indigo-500', bg: 'bg-indigo-100' },
    { id: 'resultMaker', icon: FileText, label: 'Result Maker', desc: 'Generate and track results', color: 'text-emerald-500', bg: 'bg-emerald-100' },
  ] as const;

  const isDarkMode = activeTab === 'aiSearch' || activeTab === 'webSearch';

  return (
    <div className={cn("max-w-6xl mx-auto h-full flex flex-col transition-colors duration-500", isDarkMode ? "text-white" : "")}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className={cn(
            "w-10 h-10 border rounded-2xl flex items-center justify-center transition-colors shadow-sm",
            isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className={cn("text-3xl font-black tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>App Hub</h2>
          <p className={cn("font-medium", isDarkMode ? "text-slate-400" : "text-slate-500")}>Explore and launch available tools</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar */}
        <div className="w-full md:w-64 flex flex-col gap-2 shrink-0">
          {apps.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-left group border",
                activeTab === item.id 
                  ? (isDarkMode ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "bg-slate-900 text-white border-slate-900 shadow-lg")
                  : (isDarkMode ? "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:bg-slate-800" : "bg-white text-slate-600 border-transparent hover:border-slate-200 hover:bg-slate-50 shadow-sm")
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                activeTab === item.id ? "text-white" : item.color
              )} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Dynamic Content Area */}
        <div className={cn(
          "flex-1 rounded-[32px] p-2 md:p-8 border shadow-sm relative overflow-hidden flex flex-col transition-colors duration-500",
          isDarkMode ? "bg-slate-950 border-slate-800" : "bg-white border-slate-200"
        )}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 h-full flex flex-col overflow-y-auto custom-scrollbar relative z-10"
            >
              {activeTab === 'dashboard' && (
                <div className="flex-1 flex flex-col p-4">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900">Welcome to App Hub</h3>
                      <p className="text-slate-500 font-medium mt-1">Select an app to get started</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apps.filter(app => app.id !== 'dashboard').map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => setActiveTab(item.id)}
                        className="group p-6 rounded-[24px] bg-slate-50 hover:bg-white border-2 border-transparent hover:border-slate-200 transition-all text-left shadow-sm hover:shadow-xl flex flex-col items-start"
                      >
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform", item.bg, item.color)}>
                          <item.icon className="w-7 h-7" />
                        </div>
                        <h4 className="text-xl font-black text-slate-900 mb-2">{item.label}</h4>
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'aiSearch' && (
                <div className="flex-1 min-h-[500px]">
                  <AiSearchApp onBack={() => setActiveTab('dashboard')} notes={notes} tasks={tasks} onResultClick={onResultClick} />
                </div>
              )}

              {activeTab === 'webSearch' && (
                <div className="flex-1 min-h-[500px]">
                  <WebSearchApp onBack={() => setActiveTab('dashboard')} />
                </div>
              )}

              {activeTab === 'calculator' && (
                <div className="flex-1 min-h-[500px]">
                  <CalculatorApp onBack={() => setActiveTab('dashboard')} />
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="flex-1 min-h-[500px]">
                  <CalendarApp onBack={() => setActiveTab('dashboard')} />
                </div>
              )}

              {activeTab === 'resultMaker' && (
                <div className="flex-1 min-h-[500px]">
                  <ResultMakerApp onBack={() => setActiveTab('dashboard')} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

