import React, { useState } from 'react';
import { ChevronLeft, Globe, Sparkles, Send, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';
import { searchWithGoogle } from '../../lib/gemini';

interface WebSearchAppProps {
  onBack: () => void;
}

export const WebSearchApp: React.FC<WebSearchAppProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<{answer: string, sources: any[]} | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setResult(null);

    try {
      const res = await searchWithGoogle(query, 'English');
      setResult(res);
    } catch (e) {
      console.error(e);
      setResult({ answer: "An error occurred during the deep search.", sources: [] });
    } finally {
      setIsSearching(false);
    }
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

      <div className="w-full max-w-4xl flex-1 flex flex-col relative z-10 mt-6 sm:mt-8">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           className="text-center mb-8"
        >
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-6 border border-white/10">
            <Globe className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-4">
            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Knowledge</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg max-w-md mx-auto">
            Deep scan the entire web using Google Search grounding. Powered by Gemini.
          </p>
        </motion.div>

        <form onSubmit={handleSearch} className="mb-8 w-full relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
          <div className="relative flex items-center bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-2">
            <Globe className="w-6 h-6 text-slate-500 ml-4 hidden sm:block" />
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything currently on the web..."
              className="flex-1 bg-transparent border-none text-white text-xl font-medium px-4 py-3 focus:outline-none placeholder:text-slate-600"
            />
            <button 
              type="submit"
              disabled={isSearching || !query.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold transition-all flex items-center gap-2"
            >
              {isSearching ? <Sparkles className="w-5 h-5 animate-pulse" /> : <Send className="w-5 h-5" />}
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
                 className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 space-y-4"
               >
                 <Globe className="w-12 h-12 animate-spin opacity-50" />
                 <p className="font-medium tracking-widest text-sm uppercase animate-pulse">Scouring the web...</p>
               </motion.div>
             ) : result ? (
               <motion.div 
                 key="results"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col gap-6 pb-12 w-full max-w-3xl mx-auto"
               >
                 <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
                   <div className="prose prose-invert prose-blue max-w-none prose-headings:font-bold prose-a:text-blue-400 hover:prose-a:text-blue-300">
                     <ReactMarkdown>{result.answer}</ReactMarkdown>
                   </div>
                 </div>

                 {result.sources && result.sources.length > 0 && (
                   <div className="mt-4">
                     <div className="flex items-center gap-2 mb-4 text-slate-400 px-2">
                       <LinkIcon className="w-4 h-4" />
                       <h3 className="text-sm font-bold tracking-widest uppercase text-slate-400">Sources</h3>
                     </div>
                     <div className="flex flex-wrap gap-2">
                       {Array.from(new Set(result.sources)).map((src: any, idx: number) => (
                         <a 
                           key={idx}
                           href={src}
                           target="_blank"
                           rel="noopener noreferrer"
                           className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800 rounded-xl px-4 py-2 text-sm text-slate-300 flex items-center gap-2 transition-all max-w-[300px]"
                         >
                           <span className="truncate">{src.replace(/^https?:\/\//, '').split('/')[0]}</span>
                           <ExternalLink className="w-3 h-3 shrink-0 opacity-50" />
                         </a>
                       ))}
                     </div>
                   </div>
                 )}
               </motion.div>
             ) : null}
           </AnimatePresence>
        </div>
      </div>
      
      {/* Aesthetic background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden rounded-[32px] z-0">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px] -ml-[300px] -mt-[300px]"></div>
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] -mr-[300px] -mb-[300px]"></div>
      </div>
    </div>
  );
};
