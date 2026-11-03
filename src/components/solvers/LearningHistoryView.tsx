import React, { useState, useEffect } from 'react';
import { 
  History, 
  Clock, 
  CheckCircle, 
  Sparkles, 
  Calculator, 
  BookOpen, 
  Atom, 
  GraduationCap, 
  FileSearch, 
  Calendar,
  Loader2,
  TrendingUp,
  Activity
} from 'lucide-react';

interface HistoryItem {
  id: string;
  uid: string;
  action: string;
  toolName: string;
  subject?: string;
  details: string;
  timestamp: number;
}

interface LearningHistoryViewProps {
  user: any;
}

export const LearningHistoryView: React.FC<LearningHistoryViewProps> = ({ user }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/solutions/history/${user.uid}`);
      const data = await res.json();
      if (data.success && data.history) {
        setHistory(data.history);
      }
    } catch (e) {
      console.error('Fetch history error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const getToolIcon = (toolName: string) => {
    if (toolName.toLowerCase().includes('math')) return Calculator;
    if (toolName.toLowerCase().includes('science')) return Atom;
    if (toolName.toLowerCase().includes('tutor')) return GraduationCap;
    if (toolName.toLowerCase().includes('image') || toolName.toLowerCase().includes('pdf') || toolName.toLowerCase().includes('ocr')) return FileSearch;
    return BookOpen;
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Academic Timeline
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Your Learning & Solving History</h1>
        <p className="text-slate-300 text-sm mt-1">
          Chronological record of problems solved, concepts learned, and AI tools used.
        </p>
      </div>

      {/* History List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading learning history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Learning History Recorded Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Start asking questions in Math Solver, AI Tutor, or Multi-Subject Solvers to track your learning milestones here.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 pl-6 space-y-6 ml-3">
            {history.map((item) => {
              const Icon = getToolIcon(item.toolName);
              return (
                <div key={item.id} className="relative group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-xs" />
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 hover:border-blue-300 hover:bg-blue-50/20 transition-all space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                          <Icon className="w-3.5 h-3.5" />
                        </span>
                        <span className="text-xs font-bold text-slate-900">{item.toolName}</span>
                        {item.subject && (
                          <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-semibold text-slate-600">
                            {item.subject}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 pl-8">
                      {item.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
