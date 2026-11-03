import React, { useState } from 'react';
import { ChevronLeft, Search, Sparkles, BrainCircuit, FileText, CheckSquare, SearchX, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Note, Task } from '../../types';

interface AiSearchAppProps {
  onBack: () => void;
  notes: Note[];
  tasks: Task[];
  onResultClick?: (id: string, type: 'note' | 'task') => void;
}

export const AiSearchApp: React.FC<AiSearchAppProps> = ({ onBack, notes, tasks, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<{ id: string; title: string; contentSnippet: string; score: number; type: 'note' | 'task' }[] | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      setResults(null);
      return;
    }

    setIsSearching(true);

    setTimeout(() => {
      const q = query.toLowerCase();
      
      const matchedNotes = notes.map(note => {
        let score = 0;
        if (note.title.toLowerCase().includes(q)) score += 10;
        if (note.content.toLowerCase().includes(q)) {
          const occurrences = (note.content.toLowerCase().match(new RegExp(q, 'g')) || []).length;
          score += occurrences;
        }
        
        const lowerContent = note.content.toLowerCase();
        const matchIndex = lowerContent.indexOf(q);
        let snippet = note.content;
        if (matchIndex > -1) {
          const start = Math.max(0, matchIndex - 60);
          const end = Math.min(note.content.length, matchIndex + q.length + 60);
          snippet = (start > 0 ? '...' : '') + note.content.substring(start, end) + (end < note.content.length ? '...' : '');
        } else {
           snippet = snippet.substring(0, 120) + '...';
        }

        return { id: note.id, title: note.title, contentSnippet: snippet, score, type: 'note' as const };
      });

      const matchedTasks = tasks.map(task => {
        let score = 0;
        if (task.title.toLowerCase().includes(q)) score += 10;
        if (task.description && task.description.toLowerCase().includes(q)) score += 5;
        
        let snippet = task.description || 'Task snippet unavailable';
        return { id: task.id, title: task.title, contentSnippet: snippet, score, type: 'task' as const };
      });

      const combined = [...matchedNotes, ...matchedTasks]
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      setResults(combined);
      setIsSearching(false);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col items-center">
      <div className="w-full flex items-center mb-8 relative">
        <button 
          onClick={onBack}
          className="w-10 h-10 bg-slate-900/50 hover:bg-slate-800 border items-center justify-center text-white border-white/10 rounded-2xl flex transition-all shadow-sm absolute left-0 hidden md:flex"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full max-w-2xl flex-1 flex flex-col relative z-10 mt-6 sm:mt-12">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-8"
        >
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-amber-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-6 border border-white/10">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
            Neural <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Search</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-md mx-auto">
            Deep scan your notes using offline intelligence. Lightning fast, completely private.
          </p>
        </motion.div>

        <form onSubmit={handleSearch} className="mb-10 w-full relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-2">
            <Search className="w-6 h-6 text-slate-500 ml-4 hidden sm:block" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What are you looking for?"
              className="flex-1 bg-transparent border-none text-white text-xl font-medium px-4 py-3 sm:py-4 focus:outline-none placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              {isSearching ? 'Scanning...' : 'Search'}
            </button>
          </div>
        </form>

        <div className="flex-1 overflow-y-auto custom-scrollbar w-full relative min-h-[300px]">
           <AnimatePresence mode="wait">
             {isSearching ? (
               <motion.div 
                 key="searching"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 className="absolute inset-0 flex flex-col items-center justify-center text-indigo-400 space-y-4"
               >
                 <Sparkles className="w-8 h-8 animate-pulse" />
                 <p className="font-medium tracking-widest text-sm uppercase">Synthesizing Data...</p>
               </motion.div>
             ) : results && results.length > 0 ? (
               <motion.div 
                 key="results"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col gap-4 pb-12 w-full"
               >
                 <div className="flex items-center gap-3 mb-2 text-slate-400">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span className="font-bold text-sm tracking-widest uppercase text-indigo-400">Insight Results</span>
                 </div>
                 {results.map((result, idx) => (
                   <motion.div 
                     initial={{ opacity: 0, y: 20 }}
                     animate={{ opacity: 1, y: 0 }}
                     transition={{ delay: idx * 0.1 }}
                     key={result.id}
                     onClick={() => onResultClick && onResultClick(result.id, result.type)}
                     className="bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
                   >
                     <div className="flex items-start gap-4">
                       <div className={cn(
                         "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-all",
                         result.type === 'note' 
                           ? "bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10"
                           : "bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-amber-500/10"
                       )}>
                         {result.type === 'note' ? <FileText className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
                       </div>
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <h3 className="text-xl font-bold text-white leading-tight">{result.title}</h3>
                           <span className={cn(
                             "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
                             result.type === 'note' ? "bg-indigo-500/20 text-indigo-400" : "bg-amber-500/20 text-amber-400"
                           )}>
                             {result.type}
                           </span>
                         </div>
                         <p className="text-slate-400 leading-relaxed text-sm">
                           {result.contentSnippet}
                         </p>
                       </div>
                     </div>
                   </motion.div>
                 ))}
               </motion.div>
             ) : results && results.length === 0 ? (
               <motion.div 
                 key="no-results"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute inset-0 flex flex-col items-center justify-center text-slate-500"
               >
                 <BrainCircuit className="w-12 h-12 mb-4 opacity-20" />
                 <p className="font-medium">No resonant matches found.</p>
               </motion.div>
             ) : null}
           </AnimatePresence>
        </div>
      </div>
      
      {/* Aesthetic background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden rounded-[32px] z-0">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[120px] -mr-[400px] -mt-[400px]"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -ml-[300px] -mb-[300px]"></div>
      </div>
    </div>
  );
};
