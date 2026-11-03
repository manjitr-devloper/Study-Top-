import React, { useState, useEffect } from 'react';
import { Settings, X, Tag, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Note, Category } from '../types';
import { t } from '../lib/i18n';

interface NoteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  categories: Category[];
  language: string;
  onUpdate: (id: string, updates: Partial<Note>) => void;
}

export const NoteSettingsModal: React.FC<NoteSettingsModalProps> = ({ isOpen, onClose, note, categories, language, onUpdate }) => {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setCategoryId(note.categoryId);
      setTags(note.tags || []);
    }
  }, [note, isOpen]);

  if (!isOpen || !note) return null;

  const handleSave = () => {
    onUpdate(note.id, { title, categoryId, tags });
    onClose();
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[40px] w-full max-w-md p-10 shadow-2xl relative border border-slate-100"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600">
                <Settings className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t(language, "Note Settings")}</h2>
                <p className="text-sm text-slate-500 font-medium">{t(language, "Customize and organize your note")}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Title</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
            
            <div>
               <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Category</label>
               <div className="relative">
                 <Folder className="w-4 h-4 absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                 <select
                   value={categoryId}
                   onChange={(e) => setCategoryId(e.target.value)}
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all appearance-none"
                 >
                   {categories.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                   ))}
                 </select>
               </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3 ml-1">Tags</label>
              <div className="bg-slate-50 border-2 border-slate-100 rounded-2xl p-2 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-inner">
                <div className="flex flex-wrap gap-2 mb-2 p-2 empty:hidden">
                  {tags.map(tag => (
                    <span key={tag} className="bg-indigo-50 text-indigo-600 pl-3 pr-2 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-indigo-100">
                      {tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-rose-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative pl-3">
                   <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                   <input
                     type="text"
                     value={tagInput}
                     onChange={(e) => setTagInput(e.target.value)}
                     onKeyDown={addTag}
                     placeholder={t(language, "Type a tag and press Enter")}
                     className="w-full bg-transparent px-8 py-2 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400"
                   />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                onClick={handleSave}
                className="w-full py-5 bg-indigo-600 text-white font-black text-sm uppercase tracking-[0.2em] rounded-[24px] hover:bg-indigo-700 transition shadow-xl shadow-indigo-200 active:scale-95"
              >
                {t(language, "Save Changes")}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
