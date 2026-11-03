import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { Loader2, AlertCircle, Copy, Check, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

interface MermaidViewerProps {
  chart: string;
  className?: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, system-ui, sans-serif',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    curve: 'basis'
  }
});

export const MermaidViewer: React.FC<MermaidViewerProps> = ({ chart, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let isMounted = true;
    const renderChart = async () => {
      if (!chart || !chart.trim()) {
        setSvg('');
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const uniqueId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

      try {
        // Clean chart text if wrapped in backticks
        const cleanChart = chart.replace(/```mermaid/g, '').replace(/```/g, '').trim();
        const { svg: renderedSvg } = await mermaid.render(uniqueId, cleanChart);
        if (isMounted) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Mermaid render error:", err);
          setError("Could not render diagram visually. Raw code provided below.");
          setLoading(false);
        }
      }
    };

    renderChart();
    return () => {
      isMounted = false;
    };
  }, [chart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-indigo-100/60 p-4 shadow-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-indigo-100/50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-bold text-indigo-950 uppercase tracking-wider">Concept Diagram</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.5))}
            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white rounded-lg border border-slate-200/80 shadow-xs hover:bg-indigo-50 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-bold text-slate-500 px-1">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 2))}
            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white rounded-lg border border-slate-200/80 shadow-xs hover:bg-indigo-50 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 bg-white rounded-lg border border-slate-200/80 shadow-xs hover:bg-indigo-50 transition-all"
            title="Reset Zoom"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-white hover:bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200 shadow-xs transition-all ml-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Code'}</span>
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-indigo-600">
          <Loader2 className="w-8 h-8 animate-spin mb-2" />
          <span className="text-xs font-semibold text-slate-500">Rendering visual diagram...</span>
        </div>
      )}

      {error ? (
        <div className="p-4 bg-rose-50/70 border border-rose-100 rounded-xl text-rose-700 text-xs">
          <div className="flex items-center gap-2 mb-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-500" />
            <span>{error}</span>
          </div>
          <pre className="p-3 bg-white/80 rounded-lg text-slate-700 font-mono text-[11px] overflow-x-auto border border-rose-100">
            {chart}
          </pre>
        </div>
      ) : (
        <div className="overflow-x-auto py-2 custom-scrollbar">
          <div
            ref={containerRef}
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            className="transition-transform duration-200 flex justify-center min-w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      )}
    </div>
  );
};
