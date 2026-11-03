import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Languages, 
  BookOpen, 
  Volume2, 
  ArrowRightLeft,
  Sparkles,
  ChevronDown,
  History,
  Languages as LangIcon,
  X
} from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants';
import { translateAndDefine } from '../lib/gemini';
import { cn } from '../lib/utils';

interface DictionaryViewProps {
  onBack: () => void;
  onCreateTask: (task: { title: string; description: string; priority: 'low' | 'medium' | 'high'; tags: string[] }) => Promise<void>;
  onSearchComplete?: () => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({ onBack, onCreateTask, onSearchComplete }) => {
  const [query, setQuery] = useState('');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [result, setResult] = useState<{
    translation: string;
    definition: string;
    type: string;
    phonetic: string;
    examples: string[];
  } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [showLangDropdown, setShowLangDropdown] = useState(false);

  const handleAddToLearningList = async () => {
    if (!result || isAdding) return;
    setIsAdding(true);
    try {
      await onCreateTask({
        title: `Learn: ${query} (${result.translation})`,
        description: `Definition: ${result.definition}\nExamples: ${result.examples.join(', ')}`,
        priority: 'medium',
        tags: ['vocabulary', result.type.toLowerCase()]
      });
      alert('Added to your tasks!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    try {
      const data = await translateAndDefine(query, targetLang);
      setResult(data);
      onSearchComplete?.();
      if (!history.includes(query)) {
        setHistory([query, ...history].slice(0, 5));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <p className="text-brand-600 text-[10px] font-black uppercase tracking-[0.2em] mb-2 px-1">Global Vocabulary</p>
           <h2 className="text-4xl font-black text-slate-900 tracking-tight">Smart Dictionary</h2>
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-3 bg-white border border-slate-200 px-5 py-3 rounded-2xl shadow-sm hover:border-brand-500 transition-all font-bold text-slate-700"
          >
            <Languages className="w-5 h-5 text-brand-500" />
            <span>{targetLang}</span>
            <ChevronDown className={cn("w-4 h-4 transition-transform", showLangDropdown && "rotate-180")} />
          </button>
          
          <AnimatePresence>
            {showLangDropdown && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-3xl shadow-2xl z-50 p-2 max-h-[400px] overflow-y-auto custom-scrollbar"
              >
                <div className="p-2 sticky top-0 bg-white border-b border-slate-50 mb-2">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 px-2">Select Target Language</p>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {SUPPORTED_LANGUAGES.map((lang, idx) => (
                    <button
                      key={`${lang.code}-${idx}`}
                      onClick={() => {
                        setTargetLang(lang.name);
                        setShowLangDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all",
                        targetLang === lang.name ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-x-0 -bottom-2 bg-brand-500/10 h-4 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="relative flex items-center gap-4 bg-white p-2 rounded-[32px] border-2 border-slate-100 group-focus-within:border-brand-500 shadow-xl shadow-slate-200/50 transition-all">
          <div className="pl-6 pointer-events-none">
            <Search className="w-6 h-6 text-slate-400 group-focus-within:text-brand-500 transition-colors" />
          </div>
          <input 
            type="text"
            placeholder="Type any word or phrase to define & translate..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent py-4 text-lg font-bold text-slate-800 outline-none placeholder:text-slate-300"
          />
          <button 
            type="submit"
            disabled={loading || !query.trim()}
            className="bg-brand-600 text-white px-8 py-4 rounded-[24px] font-black text-sm uppercase tracking-widest hover:bg-brand-700 transition shadow-lg shadow-brand-100 disabled:opacity-50 active:scale-95 flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Quick Check
              </>
            )}
          </button>
        </div>
      </form>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[48px] p-8 md:p-12 border border-slate-100 shadow-2xl relative overflow-hidden"
          >
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-50/50 rounded-full blur-3xl -mr-32 -mt-32"></div>
            
            <div className="relative space-y-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                 <div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="px-3 py-1 bg-brand-50 text-brand-600 rounded-full text-[10px] font-black uppercase tracking-widest">{query}</span>
                      <ArrowRightLeft className="w-4 h-4 text-slate-300" />
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">{targetLang}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none mb-4">
                      {result.translation}
                    </h1>
                    <div className="flex items-center gap-4 text-slate-400 font-bold">
                       <span className="text-brand-500 uppercase tracking-widest text-xs">{result.type}</span>
                       <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                       <span>{result.phonetic}</span>
                       <button className="p-2 hover:bg-slate-50 rounded-full text-brand-600 transition-colors">
                         <Volume2 className="w-5 h-5" />
                       </button>
                    </div>
                 </div>
                 
                 <div className="flex gap-2">
                    <button 
                      onClick={handleAddToLearningList}
                      disabled={isAdding}
                      className="flex items-center gap-2 px-6 py-3.5 bg-brand-50 text-brand-700 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-100 transition-all border border-brand-100 disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                       <History className="w-4 h-4" />
                       {isAdding ? 'Syncing...' : 'Add to Learn List'}
                    </button>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-12 pt-10 border-t border-slate-50">
                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                          <BookOpen className="w-4 h-4" />
                       </div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Definition</h3>
                    </div>
                    <p className="text-lg text-slate-600 leading-relaxed font-medium">
                      {result.definition}
                    </p>
                 </div>

                 <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <Sparkles className="w-4 h-4" />
                       </div>
                       <h3 className="font-black text-sm uppercase tracking-widest text-slate-900">Examples</h3>
                    </div>
                    <div className="space-y-3">
                       {result.examples.map((example, idx) => (
                         <div key={idx} className="bg-slate-50 p-4 rounded-2xl text-sm italic text-slate-600 border border-slate-100/50">
                           "{example}"
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
             <div className="bg-brand-600 p-8 rounded-[40px] text-white space-y-6 shadow-xl shadow-brand-100">
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                   <LangIcon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-black">Multi-Language Support</h3>
                <p className="text-brand-100 text-sm leading-relaxed font-medium">
                  Translate between Hindi, English and over 100 other languages. Get deep linguistic insights instantly.
                </p>
                <div className="pt-4 flex flex-wrap gap-2">
                   {['English', 'Hindi', 'Spanish', 'French', 'Japanese', 'German'].map(l => (
                     <span key={l} className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold">{l}</span>
                   ))}
                </div>
             </div>

             <div className="bg-white p-8 rounded-[40px] border border-slate-100 space-y-6">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                   <History className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-black text-slate-900">Recent Searches</h3>
                <div className="space-y-3">
                   {history.length > 0 ? history.map(h => (
                     <button 
                       key={h}
                       onClick={() => { setQuery(h); handleSearch(); }}
                       className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-100 group"
                     >
                        <span className="text-sm font-bold text-slate-700">{h}</span>
                        <ArrowRightLeft className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
                     </button>
                   )) : (
                     <p className="text-slate-400 text-xs font-medium py-10 text-center italic">Your recently searched words will appear here.</p>
                   )}
                </div>
             </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
