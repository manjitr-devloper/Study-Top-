import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  Upload, 
  FileText, 
  RotateCcw, 
  Download, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Brain, 
  BookOpen, 
  Calculator, 
  CheckSquare, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { stClient } from '../../lib/stCloudClient';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export const AiWorkspaceView: React.FC<{
  onSaveToNotes?: (title: string, content: string) => void;
  userProfile?: any;
}> = ({ onSaveToNotes, userProfile }) => {
  const [prompt, setPrompt] = useState('');
  const [selectedTask, setSelectedTask] = useState<'explain' | 'summary' | 'flashcards' | 'quiz' | 'step_by_step'>('explain');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setPrompt(prev => prev ? `${prev}\n\n[Attached File: ${file.name}]\n${text.slice(0, 3000)}` : `Analyze this study document (${file.name}):\n${text.slice(0, 3000)}`);
    };
    reader.readAsText(file);
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      let taskPrompt = prompt;
      if (selectedTask === 'summary') {
        taskPrompt = `Generate a concise, high-yield chapter summary with key takeaways for:\n${prompt}`;
      } else if (selectedTask === 'flashcards') {
        taskPrompt = `Generate 5 high-yield active recall flashcards (Question & Answer pairs) based on:\n${prompt}`;
      } else if (selectedTask === 'quiz') {
        taskPrompt = `Generate a 4-question multiple choice practice quiz with correct answers and explanations for:\n${prompt}`;
      } else if (selectedTask === 'step_by_step') {
        taskPrompt = `Explain step-by-step with verified derivations and clear reasoning:\n${prompt}`;
      }

      const res = await stClient.ai.chat({
        message: taskPrompt,
        grade: userProfile?.grade || 'Class 10'
      });

      setResponse(res.reply || 'Analysis completed by MIND 1.0.');
    } catch (err: any) {
      setError(err.message || 'MIND 1.0 generation failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-white border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-blue-200" />
            <span>Study Top Mind 1.0 Multi-Engine AI Workspace</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            AI Academic Workspace
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed font-medium">
            Explain difficult topics, synthesize chapter summaries, build active recall flashcard decks, and verify step-by-step problem solutions.
          </p>
        </div>
      </div>

      {/* Task Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {[
          { id: 'explain', label: 'Explain Topic', icon: Brain, desc: 'Conceptual clarity' },
          { id: 'summary', label: 'Summary Notes', icon: FileText, desc: 'High-yield points' },
          { id: 'flashcards', label: 'Flashcards', icon: RotateCcw, desc: 'Active recall' },
          { id: 'quiz', label: 'Practice Quiz', icon: CheckSquare, desc: 'Assess mastery' },
          { id: 'step_by_step', label: 'Step-by-Step', icon: Calculator, desc: 'Verified solutions' }
        ].map(task => (
          <button
            key={task.id}
            onClick={() => setSelectedTask(task.id as any)}
            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer shadow-2xs ${
              selectedTask === task.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
            }`}
          >
            <task.icon className={`w-4 h-4 mb-1.5 ${selectedTask === task.id ? 'text-white' : 'text-blue-600'}`} />
            <div className="text-xs font-black">{task.label}</div>
            <div className={`text-[10px] mt-0.5 ${selectedTask === task.id ? 'text-blue-100' : 'text-slate-400'}`}>
              {task.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Input Box & Actions */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b border-slate-100 pb-3">
          <span>Enter Study Material, Question, or Topic:</span>
          {fileName && (
            <span className="text-[11px] text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-md">
              Attached: {fileName}
            </span>
          )}
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Paste textbook notes, ask about a physics concept, or enter a topic to generate study materials..."
          rows={5}
          className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 outline-none transition resize-none"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <label className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            <span>Attach Document / Text</span>
            <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={handleExecute}
            disabled={isLoading || !prompt.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer disabled:opacity-60 shadow-xs"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>MIND 1.0 Processing...</span>
              </>
            ) : (
              <>
                <span>Generate with MIND 1.0</span>
                <Send className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-xs text-rose-700">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Response Display Card */}
      {response && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                MIND 1.0 Verified Response
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              {onSaveToNotes && (
                <button
                  onClick={() => onSaveToNotes(prompt.slice(0, 40) || 'AI Workspace Study Note', response)}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-xs font-bold text-blue-700 transition flex items-center gap-1.5 cursor-pointer border border-blue-200"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Save to Notes</span>
                </button>
              )}
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-slate-800 text-xs leading-relaxed space-y-2">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {response}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};
