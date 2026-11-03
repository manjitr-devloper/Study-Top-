import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { 
  ArrowLeft, 
  Sparkles, 
  Network, 
  Download, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Copy, 
  Check, 
  Code, 
  FileText, 
  Loader2, 
  AlertCircle,
  Eye,
  Plus
} from 'lucide-react';
import jsPDF from 'jspdf';
import { Note } from '../../types';
import { generateDiagramCode } from '../../lib/gemini';

interface DiagramStudioWorkspaceProps {
  onBack: () => void;
  activeNote?: Note | null;
  onInsertIntoNote?: (diagramMarkdown: string) => void;
  language?: string;
}

// Preset Diagram Examples
const DIAGRAM_PRESETS = [
  {
    id: 'bio_respiration',
    title: 'Cellular Respiration Pathway',
    type: 'Biology',
    code: `graph TD
    A[Glucose C6H12O6] -->|Glycolysis in Cytoplasm| B[2 Pyruvate + 2 ATP + 2 NADH]
    B -->|Mitochondrial Matrix| C[Acetyl-CoA Oxidation]
    C -->|Krebs Citric Acid Cycle| D[6 NADH + 2 FADH2 + 2 ATP + 4 CO2]
    D -->|Inner Membrane Cristae| E[Electron Transport Chain & Chemiosmosis]
    E -->|Proton Gradient & ATP Synthase| F[~32 to 34 ATP + 6 H2O]`
  },
  {
    id: 'chem_reaction',
    title: 'Chemical Equilibrium & Le Chatelier',
    type: 'Chemistry',
    code: `graph LR
    R[Reactants: N2 + 3H2] <-->|Exothermic ΔH < 0| P[Products: 2NH3]
    R -->|Increase Pressure| P
    P -->|Increase Temperature| R
    R -->|Add Iron Catalyst| P`
  },
  {
    id: 'phys_carnot',
    title: 'Carnot Heat Engine Cycle',
    type: 'Physics',
    code: `graph TD
    S1[State 1: Isothermal Expansion @ TH] -->|Absorb Heat QH| S2[State 2: Adiabatic Expansion]
    S2 -->|Temperature drops to TC| S3[State 3: Isothermal Compression @ TC]
    S3 -->|Reject Heat QC| S4[State 4: Adiabatic Compression]
    S4 -->|Work done on system| S1`
  },
  {
    id: 'cs_binary_search',
    title: 'Binary Search Algorithm',
    type: 'Computer Science',
    code: `flowchart TD
    Start([Start with sorted array]) --> SetBounds[Set low = 0, high = n - 1]
    SetBounds --> CheckLoop{low <= high?}
    CheckLoop -- Yes --> CalcMid[mid = low + high / 2]
    CalcMid --> CheckEqual{arr mid == target?}
    CheckEqual -- Yes --> Found([Target Found at mid])
    CheckEqual -- No --> CheckLess{arr mid < target?}
    CheckLess -- Yes --> MoveRight[low = mid + 1]
    CheckLess -- No --> MoveLeft[high = mid - 1]
    MoveRight --> CheckLoop
    MoveLeft --> CheckLoop
    CheckLoop -- No --> NotFound([Target Not in Array])`
  },
  {
    id: 'history_timeline',
    title: 'Scientific Revolution Timeline',
    type: 'Timeline',
    code: `timeline
    title Scientific Milestones
    1543 : Copernicus publishes Heliocentrism
    1609 : Galileo uses astronomical telescope
    1687 : Newton publishes Principia Mathematica
    1859 : Darwin publishes Origin of Species
    1905 : Einstein publishes Special Relativity`
  }
];

export const DiagramStudioWorkspace: React.FC<DiagramStudioWorkspaceProps> = ({
  onBack,
  activeNote,
  onInsertIntoNote,
  language = 'English'
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedType, setSelectedType] = useState('Flowchart');
  const [diagramCode, setDiagramCode] = useState(DIAGRAM_PRESETS[0].code);
  const [diagramTitle, setDiagramTitle] = useState(DIAGRAM_PRESETS[0].title);
  const [svgOutput, setSvgOutput] = useState<string>('');
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedCode, setCopiedCode] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize mermaid configuration
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      fontFamily: 'Inter, system-ui, sans-serif',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    });
  }, []);

  // Render diagram whenever diagramCode changes
  useEffect(() => {
    let active = true;
    const render = async () => {
      if (!diagramCode || !diagramCode.trim()) {
        setSvgOutput('');
        setRenderError(null);
        return;
      }
      setRenderError(null);
      const cleanCode = diagramCode.replace(/```mermaid/g, '').replace(/```/g, '').trim();
      const uniqueId = `mermaid_diag_${Math.random().toString(36).substring(2, 9)}`;

      try {
        const { svg } = await mermaid.render(uniqueId, cleanCode);
        if (active) {
          setSvgOutput(svg);
          setRenderError(null);
        }
      } catch (err: any) {
        if (active) {
          console.warn('Mermaid rendering syntax issue:', err);
          setRenderError(
            err?.message || 'Diagram syntax error. Please edit the Mermaid code directly or regenerate.'
          );
        }
      }
    };

    render();
    return () => {
      active = false;
    };
  }, [diagramCode]);

  // Helper to extract cleanly styled SVG with embedded self-contained CSS styles and calculated dimensions
  const prepareCleanSvgString = (): { svgString: string; width: number; height: number } | null => {
    if (!containerRef.current) return null;
    const svgEl = containerRef.current.querySelector('svg');
    if (!svgEl) return null;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    clone.setAttribute('version', '1.1');

    let boxWidth = 1000;
    let boxHeight = 650;
    try {
      const bbox = (svgEl as any).getBBox ? (svgEl as any).getBBox() : null;
      if (bbox && bbox.width > 0 && bbox.height > 0) {
        boxWidth = Math.ceil(bbox.width + 48);
        boxHeight = Math.ceil(bbox.height + 48);
      } else {
        const rect = svgEl.getBoundingClientRect();
        boxWidth = Math.max(Math.ceil(rect.width), 800);
        boxHeight = Math.max(Math.ceil(rect.height), 500);
      }
    } catch (_) {
      const rect = svgEl.getBoundingClientRect();
      boxWidth = Math.max(Math.ceil(rect.width), 800);
      boxHeight = Math.max(Math.ceil(rect.height), 500);
    }

    clone.setAttribute('width', `${boxWidth}`);
    clone.setAttribute('height', `${boxHeight}`);

    if (!clone.getAttribute('viewBox')) {
      clone.setAttribute('viewBox', `0 0 ${boxWidth} ${boxHeight}`);
    }

    // Embed standalone styles to preserve fonts, labels, node fills, and edge lines across any SVG reader
    const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleEl.textContent = `
      text, tspan, .nodeLabel, .label, div, p, span {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        font-size: 13px !important;
        font-weight: 600 !important;
        fill: #0f172a !important;
        color: #0f172a !important;
      }
      .node rect, .node circle, .node ellipse, .node polygon, .node path {
        fill: #f8fafc !important;
        stroke: #2563eb !important;
        stroke-width: 1.5px !important;
      }
      .edgePath path {
        stroke: #64748b !important;
        stroke-width: 1.5px !important;
        fill: none !important;
      }
      .edgeLabel {
        background-color: #ffffff !important;
        fill: #334155 !important;
        font-size: 11px !important;
        font-weight: 600 !important;
      }
      marker path {
        fill: #64748b !important;
        stroke: none !important;
      }
    `;
    clone.insertBefore(styleEl, clone.firstChild);

    const serializer = new XMLSerializer();
    const rawSvg = serializer.serializeToString(clone);
    const svgString = rawSvg.startsWith('<?xml') ? rawSvg : `<?xml version="1.0" encoding="UTF-8"?>\n${rawSvg}`;

    return { svgString, width: boxWidth, height: boxHeight };
  };

  // Generate Diagram with Gemini API
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setRenderError(null);

    try {
      // 1. Server-side Gemini API call
      const response = await fetch('/api/notebook/studio/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'diagram',
          diagramType: selectedType,
          prompt: prompt.trim(),
          language
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.diagramCode) {
          setDiagramCode(data.diagramCode);
          setDiagramTitle(data.title || prompt);
          setIsGenerating(false);
          return;
        }
      }

      // 2. Client-side Gemini API fallback
      const clientResult = await generateDiagramCode(prompt.trim(), selectedType, language);
      if (clientResult && clientResult.code) {
        setDiagramCode(clientResult.code);
        setDiagramTitle(clientResult.title || prompt);
        setIsGenerating(false);
        return;
      }
    } catch (err) {
      console.warn('Diagram generation network issue, using client Gemini:', err);
      try {
        const clientResult = await generateDiagramCode(prompt.trim(), selectedType, language);
        if (clientResult && clientResult.code) {
          setDiagramCode(clientResult.code);
          setDiagramTitle(clientResult.title || prompt);
        }
      } catch (_) {
        setDiagramCode(`flowchart TD\n    Concept["${prompt.substring(0, 30)}"] --> KeyPrinciple["Core Principle"]\n    KeyPrinciple --> Result["Outcome / Application"]`);
        setDiagramTitle(prompt);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Download SVG directly with download trigger
  const downloadSvg = () => {
    const prepared = prepareCleanSvgString();
    const cleanFileName = `${(diagramTitle || 'diagram').replace(/[^a-zA-Z0-9_-]/g, '_')}_diagram.svg`;

    if (!prepared) {
      if (!svgOutput) return;
      const blob = new Blob([svgOutput], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess('SVG downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3500);
      return;
    }

    const blob = new Blob([prepared.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('SVG vector exported with preserved labels & shapes!');
    setTimeout(() => setDownloadSuccess(null), 3500);
  };

  // Download PNG
  const downloadPng = () => {
    const prepared = prepareCleanSvgString();
    if (!prepared) return;
    const { svgString, width: svgWidth, height: svgHeight } = prepared;

    const scale = 2.5;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = Math.max(Math.round(svgWidth * scale), 1600);
    const canvasHeight = Math.max(Math.round(svgHeight * scale), 1100);

    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const blobUrl = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      ctx.drawImage(img, 40, 40, canvasWidth - 80, canvasHeight - 80);
      URL.revokeObjectURL(blobUrl);

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${(diagramTitle || 'diagram').replace(/[^a-zA-Z0-9_-]/g, '_')}_diagram.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess('PNG image exported successfully!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    };

    img.src = blobUrl;
  };

  // Download PDF directly with download trigger
  const downloadPdf = async () => {
    const prepared = prepareCleanSvgString();
    if (!prepared) return;

    try {
      setDownloadSuccess('Preparing high-resolution PDF study diagram...');
      const { svgString, width: svgWidth, height: svgHeight } = prepared;

      const scale = 2.5;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get 2d canvas context');

      const canvasWidth = Math.max(Math.round(svgWidth * scale), 1600);
      const canvasHeight = Math.max(Math.round(svgHeight * scale), 1100);

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const blobUrl = URL.createObjectURL(svgBlob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvasWidth, canvasHeight);
          ctx.drawImage(img, 40, 40, canvasWidth - 80, canvasHeight - 80);
          resolve();
        };
        img.onerror = (e) => reject(e);
        img.src = blobUrl;
      });
      URL.revokeObjectURL(blobUrl);

      const imgData = canvas.toDataURL('image/png', 1.0);
      const orientation = svgWidth >= svgHeight ? 'landscape' : 'portrait';
      const pdf = new jsPDF(orientation, 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Formal Academic Header
      pdf.setFontSize(15);
      pdf.setTextColor(15, 23, 42);
      pdf.text(diagramTitle, 15, 16);

      pdf.setFontSize(9);
      pdf.setTextColor(100, 116, 139);
      pdf.text(
        'Study Top Diagram Studio · Created by Manjit Ranjan (Google Developer)',
        15,
        22
      );

      const maxDrawWidth = pageWidth - 30;
      const maxDrawHeight = pageHeight - 38;

      let drawWidth = maxDrawWidth;
      let drawHeight = (canvasHeight * drawWidth) / canvasWidth;

      if (drawHeight > maxDrawHeight) {
        drawHeight = maxDrawHeight;
        drawWidth = (canvasWidth * drawHeight) / canvasHeight;
      }

      const drawX = 15 + (maxDrawWidth - drawWidth) / 2;
      const drawY = 28 + (maxDrawHeight - drawHeight) / 2;

      pdf.addImage(imgData, 'PNG', drawX, drawY, drawWidth, drawHeight);

      const cleanFileName = `${(diagramTitle || 'diagram').replace(/[^a-zA-Z0-9_-]/g, '_')}_diagram.pdf`;
      pdf.save(cleanFileName);

      setDownloadSuccess('PDF study diagram downloaded successfully!');
      setTimeout(() => setDownloadSuccess(null), 3500);
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Could not render PDF directly. Falling back to SVG download.');
      downloadSvg();
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(diagramCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleInsert = () => {
    if (onInsertIntoNote) {
      const markdown = `\n\n### Diagram: ${diagramTitle}\n\`\`\`mermaid\n${diagramCode.trim()}\n\`\`\`\n\n`;
      onInsertIntoNote(markdown);
      setDownloadSuccess('Diagram inserted into current note!');
      setTimeout(() => setDownloadSuccess(null), 3000);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 flex flex-col font-sans ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1.5 font-bold text-xs cursor-pointer border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-blue-600" />
              <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                Diagram Studio
              </h1>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Turn complex study concepts into clear interactive diagrams
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {activeNote && onInsertIntoNote && (
            <button
              onClick={handleInsert}
              className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Insert into Note</span>
            </button>
          )}

          {/* Export Dropdown buttons */}
          <button
            onClick={downloadPng}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            title="Download PNG Image"
          >
            PNG
          </button>
          <button
            onClick={downloadPdf}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            title="Download PDF Sheet"
          >
            PDF
          </button>
          <button
            onClick={downloadSvg}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            title="Download SVG Vector"
          >
            SVG
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className="bg-emerald-50 border-b border-emerald-200 text-emerald-800 px-4 py-2 text-xs font-semibold flex items-center justify-between">
          <span>{downloadSuccess}</span>
          <button onClick={() => setDownloadSuccess(null)} className="text-emerald-700 hover:text-emerald-900">×</button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Prompt & Controls Panel */}
        <div className="w-full lg:w-96 bg-white border-r border-slate-200 p-5 overflow-y-auto space-y-6">
          {/* AI Generator Box */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Generate New Diagram
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Krebs cycle steps, Photosynthesis light reaction, Binary search tree algorithm, or History timeline..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Flowchart">Flowchart</option>
                  <option value="MindMap">Mind Map</option>
                  <option value="Timeline">Timeline</option>
                  <option value="ScienceProcess">Science Process</option>
                  <option value="Hierarchy">Hierarchy / Tree</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Action</label>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Generate</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              Curated Science &amp; Academic Presets
            </span>
            <div className="space-y-1.5">
              {DIAGRAM_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setDiagramTitle(p.title);
                    setDiagramCode(p.code);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs font-semibold transition-all border ${
                    diagramTitle === p.title
                      ? 'bg-blue-50 text-blue-900 border-blue-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{p.title}</span>
                    <span className="text-[10px] text-slate-400 font-medium ml-2">{p.type}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Code Editor Toggle */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <button
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-between cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                <span>Edit Mermaid Syntax</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">
                {showCodeEditor ? 'Hide Editor' : 'Open Editor'}
              </span>
            </button>

            {showCodeEditor && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>Direct live code edit</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={diagramCode}
                  onChange={(e) => setDiagramCode(e.target.value)}
                  className="w-full bg-slate-900 text-slate-100 font-mono text-[11px] p-3 rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400 leading-relaxed"
                  spellCheck={false}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Preview Canvas */}
        <div className="flex-1 flex flex-col bg-slate-100/60 p-4 sm:p-6 overflow-hidden">
          {/* Canvas Floating Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-2.5 mb-3 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-800">{diagramTitle}</span>
              <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                Mermaid 12.2
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.4))}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-slate-600 w-12 text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 2.5))}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm overflow-auto flex items-center justify-center relative">
            {renderError ? (
              <div className="max-w-md p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs space-y-2 text-center">
                <AlertCircle className="w-6 h-6 text-rose-600 mx-auto" />
                <div className="font-bold">Syntax Rendering Notice</div>
                <p className="leading-relaxed">{renderError}</p>
                <button
                  onClick={() => setShowCodeEditor(true)}
                  className="px-3 py-1 bg-white border border-rose-300 rounded text-rose-900 font-bold hover:bg-rose-100 cursor-pointer"
                >
                  Edit Code Syntax
                </button>
              </div>
            ) : svgOutput ? (
              <div
                ref={containerRef}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                className="transition-transform duration-150 flex items-center justify-center max-w-full"
                dangerouslySetInnerHTML={{ __html: svgOutput }}
              />
            ) : (
              <div className="text-center text-slate-400 space-y-2">
                <Network className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">No diagram rendered yet. Choose a preset or generate one.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
