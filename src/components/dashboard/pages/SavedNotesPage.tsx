import React, { useState } from 'react';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  FileText,
  Tag,
  ArrowRight
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export interface SavedNoteItem {
  id: string;
  title: string;
  content: string;
  category: 'AI Explanation' | 'Math Solution' | 'Summary' | 'Formula' | 'Quiz Q&A';
  dateSaved: number;
}

interface SavedNotesPageProps {
  onInsertIntoNote?: (title: string, content: string) => void;
}

export const SavedNotesPage: React.FC<SavedNotesPageProps> = ({
  onInsertIntoNote
}) => {
  const [savedItems, setSavedItems] = useState<SavedNoteItem[]>([
    {
      id: 'saved_1',
      title: 'Bernoulli’s Principle & Fluid Dynamics Explanation',
      content: `### Bernoulli’s Principle\nAs the speed of a moving fluid increases, the pressure within the fluid decreases simultaneously.\n\n**Governing Equation:**\n$$P + \\frac{1}{2}\\rho v^2 + \\rho gh = \\text{constant}$$\n\n- **Applications:** Aerodynamic airplane wings (airfoil lift), venturi meters, and atomizers.`,
      category: 'AI Explanation',
      dateSaved: Date.now() - 7200000
    },
    {
      id: 'saved_2',
      title: 'Quadratic Formula Derivation & Roots',
      content: `For any second-degree polynomial equation $ax^2 + bx + c = 0$:\n\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n- If $b^2 - 4ac > 0$: Two distinct real roots\n- If $b^2 - 4ac = 0$: Exactly one real root (repeated)\n- If $b^2 - 4ac < 0$: Two complex conjugate roots`,
      category: 'Math Solution',
      dateSaved: Date.now() - 86400000
    },
    {
      id: 'saved_3',
      title: 'Key Differences: Mitosis vs Meiosis',
      content: `| Feature | Mitosis | Meiosis |\n| --- | --- | --- |\n| Location | Somatic cells | Germ cells (gonads) |\n| Divisions | 1 division | 2 successive divisions |\n| Daughter Cells | 2 identical diploids (2n) | 4 varied haploids (n) |\n| Purpose | Growth & repair | Sexual reproduction |`,
      category: 'Summary',
      dateSaved: Date.now() - 172800000
    }
  ]);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredItems = savedItems.filter(item => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this saved item from your collection?')) {
      setSavedItems(prev => prev.filter(i => i.id !== id));
    }
  };

  const handleExport = (item: SavedNoteItem) => {
    const blob = new Blob([`# ${item.title}\nCategory: ${item.category}\nDate Saved: ${new Date(item.dateSaved).toLocaleString()}\n\n${item.content}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.replace(/\s+/g, '_')}.md`;
    a.click();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold uppercase tracking-wider">
            Curated Knowledge Base
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">Saved AI Snippets &amp; Notes</h2>
          <p className="text-xs text-slate-500 mt-1">
            Explicitly bookmarked AI answers, step-by-step math derivations, and high-yield summaries.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-500 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl shrink-0">
          {savedItems.length} Saved Snippets
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 flex-1 max-w-xs focus-within:bg-white focus-within:border-blue-500">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved content..."
            className="w-full bg-transparent border-none outline-none text-xs text-slate-800"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold overflow-x-auto pb-0.5">
          {['All', 'AI Explanation', 'Math Solution', 'Summary'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white shadow-2xs font-extrabold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Saved Items List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center space-y-3">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-extrabold text-slate-700">No saved items found</h4>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Click the bookmark icon on any AI assistant response to save key definitions or derivations here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs hover:border-amber-300 transition-all space-y-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase">
                    {item.category}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900">{item.title}</h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(item.id, item.content)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                    title="Copy Markdown"
                  >
                    {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleExport(item)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer"
                    title="Download snippet"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Rendered content */}
              <div className="prose prose-slate max-w-none text-xs sm:text-sm bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 leading-relaxed">
                <ReactMarkdown
                  remarkPlugins={[remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                >
                  {item.content}
                </ReactMarkdown>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                <span>Saved on {new Date(item.dateSaved).toLocaleDateString()}</span>
                {onInsertIntoNote && (
                  <button
                    onClick={() => onInsertIntoNote(item.title, item.content)}
                    className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
                  >
                    Create Note from this Snippet →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
