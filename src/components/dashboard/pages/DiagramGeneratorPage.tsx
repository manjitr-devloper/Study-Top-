import React, { useState } from 'react';
import { 
  Network, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Code, 
  Eye, 
  Loader2, 
  Plus, 
  Layers,
  RotateCw,
  BookOpen
} from 'lucide-react';
import { MermaidViewer } from '../../MermaidViewer';
import { generateDiagramCode } from '../../../lib/gemini';

export const DiagramGeneratorPage: React.FC<{
  language?: string;
  onSaveToNote?: (title: string, content: string) => void;
}> = ({
  language = 'English',
  onSaveToNote
}) => {
  const [topic, setTopic] = useState('');
  const [diagramType, setDiagramType] = useState('Flowchart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [diagramTitle, setDiagramTitle] = useState('Photosynthesis Process');
  const [diagramCode, setDiagramCode] = useState<string>(`graph TD
    A[Sunlight Energy] --> B[Chloroplasts in Leaf]
    C[Water H2O from Roots] --> B
    D[Carbon Dioxide CO2 from Air] --> B
    B --> E[Glucose C6H12O6 Stored Energy]
    B --> F[Oxygen O2 Released into Air]
    style B fill:#dbeafe,stroke:#3b82f6,stroke-width:2px`);
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [copied, setCopied] = useState(false);

  const diagramTypes = [
    'Flowchart',
    'Biology Concept Map',
    'Physics System Diagram',
    'Chemical Reaction Network',
    'Mind Map',
    'Sequence Diagram',
    'Class Hierarchy'
  ];

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);

    try {
      const res = await generateDiagramCode(topic.trim(), diagramType, language);
      if (res && res.code) {
        setDiagramTitle(res.title || topic.trim());
        setDiagramCode(res.code);
        setActiveTab('preview');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(diagramCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([diagramCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${diagramTitle.replace(/\s+/g, '_')}_diagram.mmd`;
    a.click();
  };

  const handleSaveToNote = () => {
    if (onSaveToNote) {
      const markdown = `## 📊 ${diagramTitle}\n\n\`\`\`mermaid\n${diagramCode}\n\`\`\`\n`;
      onSaveToNote(diagramTitle, markdown);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-extrabold uppercase tracking-wider">
            Visual Learning Studio
          </span>
          <h2 className="text-2xl font-black text-slate-900 mt-1">AI Educational Diagram Generator</h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate interactive flowcharts, mind maps, biological cycles, and chemical networks using Mermaid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 border border-slate-200"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Copy Code</span>
          </button>
          <button
            onClick={handleDownloadSvg}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export (.mmd)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Topic & Type Config */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs space-y-4">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Generate Diagram</h3>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Diagram Type
            </label>
            <select
              value={diagramType}
              onChange={(e) => setDiagramType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            >
              {diagramTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Topic or Scientific Concept
            </label>
            <textarea
              rows={4}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Krebs cycle in cellular respiration, or Hydraulic Brake System in Physics..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={!topic.trim() || isGenerating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Generate Diagram</span>
          </button>

          {/* Quick preset suggestions */}
          <div className="pt-2 border-t border-slate-100 space-y-1.5">
            <p className="text-[11px] font-bold text-slate-400">Popular Quick Ideas:</p>
            {['Water Cycle in Hydrology', 'Binary Search Tree Operations', 'Law of Conservation of Energy'].map(item => (
              <button
                key={item}
                onClick={() => setTopic(item)}
                className="w-full text-left text-xs text-blue-600 hover:underline block truncate"
              >
                • {item}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Visual Preview & Editor */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-900 truncate">
                {diagramTitle}
              </h3>

              {/* View Switcher */}
              <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'preview' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    activeTab === 'code' ? 'bg-white text-blue-700 shadow-2xs' : 'text-slate-600'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Mermaid Code</span>
                </button>
              </div>
            </div>

            {/* Visual Canvas */}
            {activeTab === 'preview' ? (
              <div className="bg-slate-50/50 rounded-2xl border border-slate-200/80 p-4 min-h-[340px] flex items-center justify-center overflow-x-auto">
                <MermaidViewer chart={diagramCode} />
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={14}
                  value={diagramCode}
                  onChange={(e) => setDiagramCode(e.target.value)}
                  className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-2xl outline-none leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Mermaid.js vector graph rendering</span>
            {onSaveToNote && (
              <button
                onClick={handleSaveToNote}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                + Insert into New Study Note
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
