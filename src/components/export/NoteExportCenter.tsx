import React, { useState, useRef } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  Check, 
  Printer, 
  Layers, 
  ArrowLeft,
  Sparkles,
  BookOpen
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Note } from '../../types';
import { useSubscription } from '../../lib/subscription';

interface NoteExportCenterProps {
  note: Note;
  onClose: () => void;
  language?: string;
}

export const NoteExportCenter: React.FC<NoteExportCenterProps> = ({
  note,
  onClose,
  language = 'English'
}) => {
  const { isStudentPlus, isPro, planId } = useSubscription();
  const [activeTab, setActiveTab] = useState<'preview' | 'pdf' | 'png' | 'txt'>('preview');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Generate Genuine PDF
  const handleExportPDF = async () => {
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const element = previewRef.current;
      if (!element) throw new Error('Preview element not found');

      // Capture high-res canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pdfWidth - 20; // 10mm margins on left/right
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 15; // 15mm top margin

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, Math.min(imgHeight, pdfHeight - 25));
      heightLeft -= (pdfHeight - 25);

      // Multi-page handling
      let pageNumber = 1;
      while (heightLeft > 0) {
        pdf.addPage();
        pageNumber++;
        position = 10 - (pageNumber - 1) * (pdfHeight - 25);
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 25);
      }

      const cleanTitle = (note.title || 'Study_Note').replace(/[^a-zA-Z0-9_-]/g, '_');
      pdf.save(`${cleanTitle}_StudyTop.pdf`);
      setExportSuccess('PDF document downloaded successfully!');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      console.error('PDF export error:', err);
      // Fallback simple text PDF
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text(note.title || 'Study Note', 15, 20);
      pdf.setFontSize(10);
      const splitText = pdf.splitTextToSize(note.content || '', 180);
      pdf.text(splitText, 15, 30);
      pdf.save(`${(note.title || 'Study_Note').replace(/\s+/g, '_')}.pdf`);
      setExportSuccess('PDF downloaded successfully!');
      setTimeout(() => setExportSuccess(null), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate Genuine PNG
  const handleExportPNG = async () => {
    setIsExporting(true);
    setExportSuccess(null);

    try {
      const element = previewRef.current;
      if (!element) throw new Error('Preview element not found');

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = pngUrl;
      const cleanTitle = (note.title || 'Study_Note').replace(/[^a-zA-Z0-9_-]/g, '_');
      link.download = `${cleanTitle}_StudyTop.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess('High-resolution PNG downloaded!');
      setTimeout(() => setExportSuccess(null), 4000);
    } catch (err: any) {
      console.error('PNG export error:', err);
      alert('Unable to capture PNG. Please try PDF or TXT export.');
    } finally {
      setIsExporting(false);
    }
  };

  // Generate Clean UTF-8 TXT
  const handleExportTXT = () => {
    const header = `===========================================================\nSTUDY TOP — ACADEMIC STUDY NOTES\nCreated by Manjit Ranjan (Google Developer)\nTitle: ${note.title || 'Untitled'}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}\n===========================================================\n\n`;
    const fullText = header + (note.content || 'No content.');

    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanTitle = (note.title || 'Study_Note').replace(/[^a-zA-Z0-9_-]/g, '_');
    link.download = `${cleanTitle}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportSuccess('Clean text file downloaded!');
    setTimeout(() => setExportSuccess(null), 4000);
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 leading-tight">
              Export Center: {note.title || 'Untitled Note'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Study Top · Created by Manjit Ranjan (Google Developer)
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls Bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'preview' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Document Preview
            </button>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'pdf' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PDF Settings
            </button>
            <button
              onClick={() => setActiveTab('png')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'png' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              PNG Image
            </button>
            <button
              onClick={() => setActiveTab('txt')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'txt' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plain Text (TXT)
            </button>
          </div>

          {/* Quick Action Button for current tab */}
          <div className="flex items-center gap-2">
            {activeTab === 'preview' && (
              <button
                onClick={handlePrint}
                className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>
            )}

            <button
              onClick={() => {
                if (activeTab === 'pdf' || activeTab === 'preview') handleExportPDF();
                else if (activeTab === 'png') handleExportPNG();
                else if (activeTab === 'txt') handleExportTXT();
              }}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting ? 'Generating...' : `Download ${activeTab.toUpperCase()}`}
              </span>
            </button>
          </div>
        </div>

        {exportSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
          {activeTab === 'preview' || activeTab === 'pdf' ? (
            <div className="max-w-2xl mx-auto bg-white border border-slate-200/90 rounded-xl p-8 sm:p-12 shadow-md">
              {/* Printable Ref Container */}
              <div ref={previewRef} className="space-y-6 text-slate-900">
                {/* Formal Academic Header */}
                <div className="border-b-2 border-slate-900 pb-4">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                    <span>Study Top Academic Guide</span>
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                    {note.title || 'Untitled Note'}
                  </h1>
                  <div className="mt-2 text-xs text-slate-500 font-medium">
                    Curated on Study Top · Platform by <strong>Manjit Ranjan (Google Developer)</strong>
                  </div>
                </div>

                {/* Body Content with KaTeX Math and Markdown Rendering */}
                <div className="prose prose-slate max-w-none text-sm leading-relaxed prose-headings:font-bold prose-h2:text-xl prose-h3:text-lg prose-table:border prose-th:bg-slate-100 prose-th:p-2 prose-td:p-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {note.content || '*No content written yet.*'}
                  </ReactMarkdown>
                </div>

                {/* Sources List if attached */}
                {note.sources && note.sources.length > 0 && (
                  <div className="mt-8 pt-4 border-t border-slate-200 text-xs text-slate-600">
                    <h4 className="font-bold text-slate-800 uppercase tracking-wider mb-2">Grounding References:</h4>
                    <ol className="list-decimal pl-4 space-y-1">
                      {note.sources.map((s, idx) => (
                        <li key={s.id || idx}>
                          <span className="font-semibold text-slate-800">{s.title}</span> — {s.type.toUpperCase()} format ({s.size || 'Attached source'})
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Footer note */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Study Top AI Platform</span>
                  <span>Page 1 of 1</span>
                </div>
              </div>
            </div>
          ) : activeTab === 'png' ? (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">PNG High-Resolution Image Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                PNG captures the visual styling of your note—including mathematical formulas, lists, code blocks, and diagrams—rendered at 2x retina clarity for sharing on social media, student groups, or slide presentations.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700">
                <div className="font-semibold mb-1">Image Specs:</div>
                <div>• Format: PNG 24-bit with alpha channel</div>
                <div>• Scale: 2x Retina DPI (crisp text on phone screens)</div>
                <div>• Content: Current note ({note.content?.length || 0} characters)</div>
              </div>
              <button
                onClick={handleExportPNG}
                disabled={isExporting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                {isExporting ? 'Generating PNG...' : 'Download PNG Image'}
              </button>
            </div>
          ) : (
            <div className="max-w-xl mx-auto bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900">Plain Text (UTF-8 TXT) Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Clean text output formatted with standardized Markdown syntax. Perfect for copying into Obsidian, Notion, Apple Notes, Google Classroom, or flashcard software.
              </p>
              <div className="p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl max-h-60 overflow-y-auto">
                <pre>{note.content || 'No content written.'}</pre>
              </div>
              <button
                onClick={handleExportTXT}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Download UTF-8 TXT File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
