import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Globe, Check, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { SUPPORTED_LANGUAGES } from '../constants';

interface LanguageSelectorViewProps {
  currentLanguage?: string;
  onSelectLanguage: (language: string) => void;
  userEmail?: string;
}

const POPULAR_LANGUAGES = [
  { name: 'English', native: 'English', flag: '🇬🇧' },
  { name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { name: 'French', native: 'Français', flag: '🇫🇷' },
  { name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { name: 'Japanese', native: '日本語', flag: '🇯🇵' },
  { name: 'Chinese', native: '中文', flag: '🇨🇳' },
  { name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { name: 'Swahili', native: 'Kiswahili', flag: '🇰🇪' },
  { name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' }
];

export const LanguageSelectorView: React.FC<LanguageSelectorViewProps> = ({
  currentLanguage = 'English',
  onSelectLanguage,
  userEmail
}) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(currentLanguage);

  const filteredLanguages = SUPPORTED_LANGUAGES.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    onSelectLanguage(selected);
  };

  const selectedPopular = POPULAR_LANGUAGES.find(p => p.name === selected);

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans">
      {/* Background ambient lighting */}
      <div className="fixed top-0 left-1/3 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Responsive Card Container: Guaranteed Visible Header & Sticky Bottom Bar on Mobile */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-xl bg-white/95 backdrop-blur-2xl rounded-[28px] sm:rounded-[36px] border border-white shadow-2xl relative flex flex-col h-[94dvh] sm:h-auto sm:max-h-[88vh] overflow-hidden"
      >
        {/* ======================================================== */}
        {/* 1. FIXED / SHRINK-0 HEADER                               */}
        {/* ======================================================== */}
        <div className="shrink-0 p-4 sm:p-6 pb-3 border-b border-slate-100 bg-white/60 backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/25 shrink-0">
                <Globe className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Step 2: Language
                  </span>
                </div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  Choose Study Language
                </h2>
              </div>
            </div>

            {/* Quick Top Next Button (Visible on mobile & desktop so user can tap right away!) */}
            <button
              type="button"
              onClick={handleConfirm}
              className="py-2 px-3.5 sm:py-2.5 sm:px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1.5 line-clamp-1 sm:line-clamp-none">
            Notes, questions, and flashcards will be synthesized in your selected language.
          </p>
        </div>

        {/* ======================================================== */}
        {/* 2. SCROLLABLE MIDDLE BODY                                */}
        {/* ======================================================== */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {/* Popular Quick-Select Chips */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
              Popular Languages (Quick Pick)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_LANGUAGES.map((lang, idx) => (
                <button
                  key={`${lang.name}-${idx}`}
                  type="button"
                  onClick={() => setSelected(lang.name)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all cursor-pointer active:scale-98 ${
                    selected === lang.name
                      ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-xs ring-2 ring-blue-500/10'
                      : 'bg-slate-50/80 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span className="text-base">{lang.flag}</span>
                    <span className="truncate">{lang.name}</span>
                  </span>
                  {selected === lang.name && (
                    <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 100+ global languages..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Full Language Scroll List */}
          <div className="space-y-1.5 border border-slate-100 rounded-2xl p-2 bg-slate-50/50 max-h-[190px] overflow-y-auto custom-scrollbar">
            {filteredLanguages.map((lang, idx) => (
              <button
                key={`${lang.code}-${idx}`}
                type="button"
                onClick={() => setSelected(lang.name)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all text-left active:scale-98 cursor-pointer ${
                  selected === lang.name
                    ? 'bg-white border-blue-500 text-blue-900 shadow-sm'
                    : 'bg-white/70 hover:bg-white border-slate-200/60 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{lang.name}</span>
                </div>
                {selected === lang.name ? (
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md shrink-0">Selected</span>
                ) : (
                  <span className="text-[10px] text-slate-400 uppercase font-mono shrink-0">{lang.code}</span>
                )}
              </button>
            ))}
            {filteredLanguages.length === 0 && (
              <div className="text-center py-6 text-xs font-medium text-slate-400">
                No language found matching "{search}"
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. STICKY PINNED BOTTOM BAR (GUARANTEED VISIBLE ON MOBILE) */}
        {/* ======================================================== */}
        <div className="shrink-0 sticky bottom-0 bg-white/95 backdrop-blur-md p-3 sm:p-4 border-t border-slate-200/90 shadow-[0_-8px_25px_rgba(0,0,0,0.06)] z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Selected Language Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100/90 rounded-xl border border-slate-200/70">
              <span className="text-base">{selectedPopular?.flag || '🌐'}</span>
              <div className="text-xs text-slate-600 truncate">
                Target Language: <strong className="text-slate-900 font-black">{selected}</strong>
              </div>
            </div>

            {/* Prominent High-Contrast Electric Next Button */}
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full sm:w-auto py-3.5 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl sm:rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 active:scale-95 transition-all cursor-pointer min-h-[48px]"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Enter Study Workspace</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
