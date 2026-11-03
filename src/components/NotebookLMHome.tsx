import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Search, 
  FileText, 
  FileUp, 
  Youtube, 
  Camera, 
  Star, 
  MoreVertical, 
  BookOpen, 
  Clock, 
  Layers, 
  ShieldCheck, 
  ArrowRight, 
  Trash2, 
  Grid, 
  List, 
  Filter, 
  Headphones, 
  Zap, 
  TrendingUp, 
  CheckCircle2,
  ExternalLink,
  Brain,
  HelpCircle,
  Lock,
  Key
} from 'lucide-react';
import { Note, UserProfile } from '../types';

interface NotebookLMHomeProps {
  notes: Note[];
  userProfile: UserProfile | null;
  onSelectNotebook: (id: string) => void;
  onCreateNewNotebook: (initialTitle?: string, initialContent?: string) => void;
  onDeleteNotebook: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onOpenStudyTools: () => void;
  onOpenSuperAdmin: () => void;
  onOpenPointWise: () => void;
  onOpenDiagram: () => void;
  onOpenQa: () => void;
  onOpenSmartNote: (source?: 'text' | 'camera' | 'images' | 'pdf' | 'youtube') => void;
}

export const NotebookLMHome: React.FC<NotebookLMHomeProps> = ({
  notes,
  userProfile,
  onSelectNotebook,
  onCreateNewNotebook,
  onDeleteNotebook,
  onToggleFavorite,
  onOpenStudyTools,
  onOpenSuperAdmin,
  onOpenPointWise,
  onOpenDiagram,
  onOpenQa,
  onOpenSmartNote
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'starred' | 'sources'>('all');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter notebooks
  const filteredNotes = notes.filter(n => {
    const matchesSearch = 
      (n.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (n.content || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterMode === 'starred') return n.tags?.includes('favorite');
    if (filterMode === 'sources') return (n.sources && n.sources.length > 0) || (n.content && n.content.length > 100);
    return true;
  });

  // Featured Curated Study Notebooks (Google NotebookLM signature feature)
  const featuredNotebooks = [
    {
      id: 'example_bio',
      title: '🧬 AP Biology: Cell Respiration & Photosynthesis',
      desc: 'Textbook chapters, ATP cycle diagrams, glycolysis pathway, and light-dependent reactions.',
      sourcesCount: 3,
      notesCount: 8,
      sampleContent: `# Cellular Respiration & Energy Synthesis
Key Stages:
1. Glycolysis (Cytoplasm): Glucose -> 2 Pyruvate + 2 ATP + 2 NADH
2. Krebs Cycle (Mitochondrial Matrix): Acetyl-CoA oxidation yielding 6 NADH, 2 FADH2, 2 ATP
3. Electron Transport Chain & Chemiosmosis: Oxidative phosphorylation generating ~32-34 ATP via ATP Synthase rotor.

Photosynthesis Counterpart:
6 CO2 + 6 H2O + Light -> C6H12O6 + 6 O2. Light reactions in thylakoid membranes; Calvin cycle in stroma.`,
      tag: 'Biology'
    },
    {
      id: 'example_phys',
      title: '⚡ Quantum Mechanics & Wave-Particle Duality',
      desc: 'De Broglie wavelength, Heisenberg uncertainty principle, and Schrödinger wave equation.',
      sourcesCount: 4,
      notesCount: 6,
      sampleContent: `# Quantum Physics & Wave Mechanics
Key Foundations:
- Planck-Einstein Relation: $E = hf = \\frac{hc}{\\lambda}$
- De Broglie Wavelength: $\\lambda = \\frac{h}{p} = \\frac{h}{mv}$
- Heisenberg Uncertainty Principle: $\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$
- Time-Independent Schrödinger Equation: $-\\frac{\\hbar^2}{2m} \\nabla^2 \\psi + V\\psi = E\\psi$`,
      tag: 'Physics'
    },
    {
      id: 'example_calc',
      title: '📐 Calculus: Derivatives, Integrals & Optimization',
      desc: 'Fundamental theorem of calculus, Taylor series expansions, and related rates.',
      sourcesCount: 2,
      notesCount: 5,
      sampleContent: `# Calculus Foundations
1. Limit Definition of Derivative:
$$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

2. Fundamental Theorem of Calculus:
$$\\int_{a}^{b} f(x)\\,dx = F(b) - F(a)$$

3. Common Derivative Rules:
- Product Rule: $(uv)' = u'v + uv'$
- Quotient Rule: $\\left(\\frac{u}{v}\\right)' = \\frac{u'v - uv'}{v^2}$
- Chain Rule: $\\frac{d}{dx}[f(g(x))] = f'(g(x))g'(x)$`,
      tag: 'Mathematics'
    },
    {
      id: 'example_hist',
      title: '🏛️ Modern Revolutions & Global World Order',
      desc: 'Comparative historical analysis of the American, French, and Industrial Revolutions.',
      sourcesCount: 3,
      notesCount: 7,
      sampleContent: `# Modern World Revolutions (1776 - 1917)
Chronology & Causes:
- 1789: Storming of the Bastille & Declaration of the Rights of Man.
- 1848: Spring of Nations democratic uprisings across Europe.
- Industrial Revolution: Shift from agrarian economies to steam-powered mechanization.
- Core Impact: Rise of constitutional governance, urbanization, and modern nation-states.`,
      tag: 'History'
    }
  ];

  return (
    <div className="min-h-full pb-16 bg-[#f8fafd] text-[#1f1f1f] font-sans">
      
      {/* 1. HERO / WELCOME BANNER (Google NotebookLM Minimalist Elegant Style) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#dadce0]">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 border border-violet-200/80 text-violet-700 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
              <span>Grounded Academic AI Collaborator</span>
              <span className="text-violet-400">·</span>
              <span className="text-[11px] font-bold text-violet-600">Created by Manjit Ranjan</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1f1f1f] tracking-tight">
              Study Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">Notebooks</span>
            </h1>
            <p className="text-sm sm:text-base text-[#5f6368] mt-1.5 max-w-2xl leading-relaxed">
              Ground Gemini AI in your PDFs, textbooks, slides, and lectures. Generate instant study guides, grounded citations, and conversational Audio Overviews.
            </p>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => onCreateNewNotebook()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Notebook</span>
            </button>

            <button
              onClick={onOpenStudyTools}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 shadow-2xs active:scale-95 transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Study Tools Hub</span>
            </button>
          </div>
        </div>

        {/* 2. SEARCH & FILTER CONTROLS (Google NotebookLM Style) */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notebooks, sources, and study notes..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-[#dadce0] rounded-full outline-none focus:border-blue-500 focus:shadow-xs transition-all text-[#1f1f1f] placeholder:text-[#5f6368]"
            />
          </div>

          {/* Filter Tabs & Layout Switcher */}
          <div className="flex items-center gap-2">
            <div className="inline-flex p-1 bg-white border border-[#dadce0] rounded-full text-xs font-semibold">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  filterMode === 'all' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({notes.length})
              </button>
              <button
                onClick={() => setFilterMode('starred')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  filterMode === 'starred' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Starred
              </button>
              <button
                onClick={() => setFilterMode('sources')}
                className={`px-3 py-1 rounded-full transition-colors cursor-pointer ${
                  filterMode === 'sources' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                With Sources
              </button>
            </div>

            <div className="hidden sm:inline-flex p-1 bg-white border border-[#dadce0] rounded-full">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded-full transition-colors ${viewLayout === 'grid' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}
                title="Grid view"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-full transition-colors ${viewLayout === 'list' ? 'bg-slate-100 text-blue-600' : 'text-slate-400'}`}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. NOTEBOOKS GRID (The Core of Google NotebookLM) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className={viewLayout === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
          
          {/* CARD 1: THE ICONIC "+ NEW NOTEBOOK" CARD */}
          <div
            onClick={() => onCreateNewNotebook()}
            className="group relative min-h-[190px] rounded-3xl border-2 border-dashed border-[#dadce0] hover:border-blue-500 bg-white hover:bg-blue-50/20 p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:shadow-md active:scale-98"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center transition-all shadow-xs mb-3">
              <Plus className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[#1f1f1f] group-hover:text-blue-600 transition-colors">
              New notebook
            </h3>
            <p className="text-xs text-[#5f6368] mt-1 max-w-[200px]">
              Upload sources or paste notes to start a new workspace
            </p>
          </div>

          {/* USER NOTEBOOKS CARDS */}
          {filteredNotes.map((item, idx) => {
            const sourcesCount = item.sources?.length || (item.content ? 1 : 0);
            const notesCount = item.studioNotes?.length || 1;
            const isStarred = item.tags?.includes('favorite');

            return (
              <div
                key={`notebook-${item.id || idx}-${idx}`}
                onClick={() => onSelectNotebook(item.id)}
                className="group relative bg-white border border-[#dadce0] hover:border-blue-400 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-lg transition-all cursor-pointer min-h-[190px]"
              >
                <div>
                  {/* Top Row: Tag & Star */}
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                      Notebook
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className="p-1 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                      <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-500' : ''}`} />
                    </button>
                  </div>

                  {/* Notebook Title */}
                  <h3 className="text-base font-bold text-[#1f1f1f] group-hover:text-blue-600 transition-colors line-clamp-1 tracking-tight">
                    {item.title || 'Untitled Notebook'}
                  </h3>

                  {/* Clean Content Preview */}
                  <p className="text-xs text-[#5f6368] mt-1.5 line-clamp-3 leading-relaxed">
                    {item.content || 'Grounded workspace ready. Add sources or start chatting with AI.'}
                  </p>
                </div>

                {/* Card Footer: Metadata with · Separators (Anti-AI-slop rule) */}
                <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-[11px] text-[#5f6368]">
                  <div className="flex items-center gap-1.5">
                    <span>{sourcesCount} source{sourcesCount === 1 ? '' : 's'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{notesCount} note{notesCount === 1 ? '' : 's'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this notebook?')) {
                          onDeleteNotebook(item.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity p-1"
                      title="Delete notebook"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. FEATURED / EXAMPLE NOTEBOOKS (NotebookLM Signature Feature) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h2 className="text-lg font-bold text-[#1f1f1f] tracking-tight">
              Featured Study Notebooks
            </h2>
          </div>
          <p className="text-xs text-[#5f6368] mt-0.5">
            Explore pre-configured example notebooks to experience the full NotebookLM studio workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredNotebooks.map((ex, idx) => (
            <div
              key={`featured-${ex.id || idx}-${idx}`}
              onClick={() => onCreateNewNotebook(ex.title, ex.sampleContent)}
              className="group bg-white border border-[#dadce0] hover:border-indigo-400 rounded-3xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all cursor-pointer min-h-[180px]"
            >
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                  {ex.tag}
                </span>
                <h3 className="text-sm font-bold text-[#1f1f1f] group-hover:text-indigo-600 transition-colors mt-2 line-clamp-2 leading-snug">
                  {ex.title}
                </h3>
                <p className="text-xs text-[#5f6368] mt-1.5 line-clamp-2 leading-relaxed">
                  {ex.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#f1f3f4] flex items-center justify-between text-[11px] text-[#5f6368]">
                <span>{ex.sourcesCount} sources · {ex.notesCount} notes</span>
                <span className="text-indigo-600 font-bold group-hover:translate-x-0.5 transition-transform">Explore →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. ACADEMIC STUDY INSIGHTS & CLOUDFLARE SECURITY STATUS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-3xl p-5 border border-[#dadce0] shadow-2xs">
            <div className="flex items-center gap-2 mb-1 text-blue-600">
              <Zap className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Grounding Engine</h4>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">Gemini 2.5</p>
            <p className="text-xs text-slate-500 mt-0.5">Strict source attribution with in-text citation markers.</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#dadce0] shadow-2xs">
            <div className="flex items-center gap-2 mb-1 text-emerald-600">
              <ShieldCheck className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Cloudflare Protection</h4>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">WAF & SSL Strict</p>
            <p className="text-xs text-slate-500 mt-0.5">Encrypted Firestore vault & DDoS edge protection.</p>
          </div>

          <div className="bg-white rounded-3xl p-5 border border-[#dadce0] shadow-2xs">
            <div className="flex items-center gap-2 mb-1 text-violet-600">
              <Headphones className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Audio Overview</h4>
            </div>
            <p className="text-2xl font-black text-slate-900 mt-1">Deep Dive Studio</p>
            <p className="text-xs text-slate-500 mt-0.5">Two AI hosts discuss your sources with transcripts.</p>
          </div>
        </div>
      </section>

      {/* 6. ADMIN LOGIN / SUPER ADMIN GATEWAY (At the last of the home page) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 mb-4">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-2xl border border-slate-800">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Login
                </span>
                <span className="text-xs text-amber-200/90 font-semibold bg-amber-500/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                  Only Admin: Manjit Ranjan
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Private Cloudflare WAF Shield
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Super Admin System & Activity Controller
              </h3>
              
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Backend-verified administrative control panel. Access real-time user management, voice session logs, file storage monitoring, AI usage diagnostics, and emergency lockdown controls.
              </p>

              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-4 text-[11px] font-semibold text-slate-400">
                <span className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-xl">
                  <Lock className="w-3 h-3 text-amber-400" />
                  Passcode Secured
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-xl">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Zero-Trust Verified
                </span>
                <span className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/60 px-2.5 py-1 rounded-xl">
                  <Key className="w-3 h-3 text-cyan-400" />
                  Role-Based Access
                </span>
              </div>
            </div>

            {/* Clear Primary Admin Login Action */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto">
              <button
                onClick={onOpenSuperAdmin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-400/20 active:scale-95 cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                <span>Admin Login</span>
                <ArrowRight className="w-4 h-4 ml-1 text-slate-950" />
              </button>
              <p className="text-[11px] text-center text-slate-400 font-medium">
                Authorized access only · Owner verification
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ATTRACTIVE FOOTER WITH ADMIN SHORTCUT */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-6 border-t border-[#dadce0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5f6368]">
        <p>© {new Date().getFullYear()} Study Top · Next-Gen AI Notebook & Research Collaborator</p>
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={onOpenSuperAdmin}
            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-amber-600 font-bold transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
            <span>Admin Login</span>
          </button>
          <span className="text-slate-300">·</span>
          <p>Created by <strong className="text-[#1f1f1f]">Manjit Ranjan ( Google Developer)</strong></p>
        </div>
      </footer>
    </div>
  );
};
