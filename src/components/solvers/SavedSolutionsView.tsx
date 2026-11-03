import React, { useState, useEffect } from 'react';
import { 
  Bookmark, 
  Search, 
  Trash2, 
  Copy, 
  Check, 
  Download, 
  BookOpen, 
  Calendar, 
  ChevronRight, 
  Tag, 
  Filter, 
  Clock, 
  Loader2,
  X,
  FileText
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface SavedSolution {
  id: string;
  uid: string;
  title: string;
  subject: string;
  question: string;
  solution: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

interface SavedSolutionsViewProps {
  user: any;
  onOpenSolution?: (solution: SavedSolution) => void;
}

export const SavedSolutionsView: React.FC<SavedSolutionsViewProps> = ({ user }) => {
  const [solutions, setSolutions] = useState<SavedSolution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedSolution, setSelectedSolution] = useState<SavedSolution | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSavedSolutions();
  }, [user]);

  const fetchSavedSolutions = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/solutions/saved/${user.uid}`);
      const data = await res.json();
      if (data.success && data.solutions) {
        setSolutions(data.solutions);
      }
    } catch (e) {
      console.error('Fetch saved solutions error', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved solution?')) return;
    try {
      const res = await fetch(`/api/solutions/saved/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSolutions(prev => prev.filter(s => s.id !== id));
        if (selectedSolution?.id === id) setSelectedSolution(null);
      }
    } catch (err) {
      console.error('Delete error', err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredSolutions = solutions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.solution.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'All' || s.subject.toLowerCase() === selectedSubject.toLowerCase();
    return matchesSearch && matchesSubject;
  });

  const subjectsList = ['All', ...Array.from(new Set(solutions.map(s => s.subject)))];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <Bookmark className="w-5 h-5 text-yellow-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
            Study Repository
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Saved Solutions & Solved Problems</h1>
        <p className="text-blue-100 text-sm mt-1">
          Access all your previously solved Mathematics, Science, and Subject questions offline anytime.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search solved problems, formulas, equations..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {subjectsList.map((sub) => (
            <button
              key={sub}
              onClick={() => setSelectedSubject(sub)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedSubject.toLowerCase() === sub.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {/* Solutions Grid / Detail View */}
      {selectedSolution ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <button
              onClick={() => setSelectedSolution(null)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              ← Back to Solutions List
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(selectedSolution.solution)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={(e) => handleDelete(selectedSolution.id, e)}
                className="px-3 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-semibold flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>

          <div>
            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-wider">
              {selectedSolution.subject}
            </span>
            <h2 className="text-xl font-black text-slate-900 mt-2">{selectedSolution.title}</h2>
            <p className="text-xs text-slate-400 mt-1">Saved on {new Date(selectedSolution.createdAt).toLocaleDateString()}</p>
          </div>

          <div className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed prose-headings:font-bold prose-pre:bg-slate-900 prose-pre:text-white prose-pre:rounded-2xl">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {selectedSolution.solution}
            </ReactMarkdown>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {isLoading ? (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-medium">Loading saved solutions...</p>
            </div>
          ) : filteredSolutions.length === 0 ? (
            <div className="col-span-full bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Bookmark className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No Saved Solutions Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Solve problems in the Math Solver or Multi-Subject Solvers and click &quot;Save Solution&quot; to build your personal formula and solution archive.
              </p>
            </div>
          ) : (
            filteredSolutions.map((sol) => (
              <div
                key={sol.id}
                onClick={() => setSelectedSolution(sol)}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-3 group"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                    {sol.subject}
                  </span>
                  <button
                    onClick={(e) => handleDelete(sol.id, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete solution"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                  {sol.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2">
                  {sol.solution.replace(/[*_#`[\]()$]/g, '').slice(0, 140)}...
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-400">
                  <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
                  <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View Solution →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
