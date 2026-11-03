import React, { useState, useEffect } from 'react';
import { FilePlus, X, Sparkles, Loader2, BookOpen, Palette, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateNoteTemplate } from '../lib/gemini';
import { cn } from '../lib/utils';
import { t } from '../lib/i18n';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onCreate: (title: string, content: string) => void;
}

export const NewNoteModal: React.FC<NewNoteModalProps> = ({ isOpen, onClose, language, onCreate }) => {
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('Minimalist');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!topic.trim()) {
      onCreate('Untitled Note', '');
      onClose();
      return;
    }
    
    setIsGenerating(true);
    try {
      const markdown = await generateNoteTemplate(style, topic, language);
      onCreate(topic, markdown);
      onClose();
    } catch (e) {
      console.error(e);
      onCreate(topic, `# ${topic}\n\nStart typing here...`);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBlank = () => {
    onCreate(topic || 'Untitled Note', '');
    onClose();
  };

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
          className="bg-white rounded-[40px] w-full max-w-lg p-6 sm:p-10 shadow-2xl relative border border-slate-100"
        >
          <div className="flex items-center justify-between mb-6">
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
          
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                <FilePlus className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">New Note</h2>
                <p className="text-sm text-slate-500 font-medium">Create a beautiful starting point.</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Topic or Title</label>
              <div className="relative">
                <BookOpen className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. History of Rome..."
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition-all shadow-inner"
                />
              </div>
            </div>
            
            <div>
               <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Theme Style</label>
               <div className="grid grid-cols-2 gap-3">
                 {['Minimalist', 'Academic', 'Cornell', 'Creative'].map(s => (
                   <button
                     key={s}
                     onClick={() => setStyle(s)}
                     className={cn(
                       "flex items-center gap-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition-all",
                       style === s ? "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm" : "border-slate-100 text-slate-500 hover:border-slate-200"
                     )}
                   >
                     <Palette className="w-4 h-4" />
                     {s}
                   </button>
                 ))}
               </div>
            </div>

            <div className="pt-6 flex gap-4 h-14">
              <button 
                onClick={handleCreate}
                disabled={isGenerating}
                className="flex-1 bg-emerald-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[24px] hover:bg-emerald-700 transition shadow-xl shadow-emerald-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5" /> Generate Template</>}
              </button>
              <button 
                onClick={handleBlank}
                disabled={isGenerating}
                className="px-6 bg-slate-100 text-slate-500 font-black text-sm uppercase tracking-[0.1em] rounded-[24px] hover:bg-slate-200 transition active:scale-95 flex items-center justify-center whitespace-nowrap"
              >
                Blank
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
