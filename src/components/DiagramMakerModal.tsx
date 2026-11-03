import React, { useState } from 'react';
import { Network, X, Sparkles, Loader2, Copy, Check, Save, Download, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateConceptDiagram } from '../lib/gemini';
import { MermaidViewer } from './MermaidViewer';

interface DiagramMakerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
  onInsertIntoNote?: (title: string, diagramMarkdown: string) => void;
}

export const DiagramMakerModal: React.FC<DiagramMakerModalProps> = ({
  isOpen,
  onClose,
  language,
  onInsertIntoNote
}) => {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Science');
  const [diagramType, setDiagramType] = useState<'mindmap' | 'flowchart' | 'hierarchy'>('flowchart');
  const [isGenerating, setIsGenerating] = useState(false);
  const [mermaidCode, setMermaidCode] = useState<string>('');
  const [editMode, setEditMode] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    try {
      const code = await generateConceptDiagram(`${diagramType} diagram of ${topic.trim()}`, subject, language);
      setMermaidCode(code);
    } catch (err) {
      console.error("Diagram error", err);
      alert("Failed to generate diagram. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (!mermaidCode || !onInsertIntoNote) return;
    const content = `## Concept Diagram: ${topic}\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`;
    onInsertIntoNote(topic || 'Diagram', content);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`\`\`\`mermaid\n${mermaidCode}\n\`\`\``);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div 
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[120] flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-[32px] md:rounded-[40px] w-full max-w-3xl shadow-2xl border border-indigo-100 flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-6 py-4 sm:py-5 text-white flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer border border-white/20 shadow-2xs shrink-0"
                title="Back to Notebooks"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>Back</span>
              </button>

              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                <Network className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black tracking-tight truncate">AI Concept Diagram & Mindmap Maker</h3>
                <p className="text-[11px] sm:text-xs text-indigo-100 truncate">Visualize complex chapters with clean, structured diagrams</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 cursor-pointer">
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Topic or Concept</label>
                <input
                  type="text"
                  placeholder="e.g. Photosynthesis Cycle, Indian Constitution Branches, Water Cycle..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-2">Diagram Type</label>
                <select
                  value={diagramType}
                  onChange={(e: any) => setDiagramType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="flowchart">Flowchart / Process</option>
                  <option value="mindmap">Mindmap / Breakdown</option>
                  <option value="hierarchy">Hierarchy / Tree</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !topic.trim()}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Diagram
              </button>
            </div>

            {mermaidCode && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">Diagram Preview</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 px-2 py-1"
                    >
                      {editMode ? 'View Diagram' : 'Edit Mermaid Code'}
                    </button>
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1 rounded-lg"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {editMode ? (
                  <textarea
                    rows={8}
                    value={mermaidCode}
                    onChange={(e) => setMermaidCode(e.target.value)}
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-4 rounded-xl outline-none"
                  />
                ) : (
                  <MermaidViewer chart={mermaidCode} />
                )}

                {onInsertIntoNote && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Add Diagram to Notes
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
