/**
 * Multi-Format Notes Exporter for Study Top
 * Supports: PDF (A4 with page numbers & branding), DOCX (Microsoft Word), TXT, PNG, and JPG
 */

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  title: string;
  markdownContent: string;
  elementId?: string;
  authorName?: string;
}

/**
 * Clean filename generator
 */
function sanitizeFilename(title: string): string {
  return (title || 'Study_Top_Notes')
    .replace(/[^a-zA-Z0-9_\-\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 60);
}

/**
 * Export as Plain Text / Markdown (.txt)
 */
export function exportNotesAsTxt(title: string, markdownContent: string) {
  const header = `STUDY TOP AI NOTES
========================================================================
Topic: ${title}
Generated from: User Uploaded Documents
Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
========================================================================\n\n`;

  const blob = new Blob([header + markdownContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(title)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export as Microsoft Word Document (.docx)
 * Uses standard HTML-based Word XML envelope supported by MS Word, LibreOffice, and Google Docs
 */
export function exportNotesAsDocx(title: string, markdownContent: string) {
  // Convert basic markdown formatting to clean HTML for Word
  const htmlContent = markdownContent
    .replace(/^#\s+(.+)$/gm, '<h1 style="color:#1e3a8a; font-family:Calibri; font-size:24pt; border-bottom:2px solid #3b82f6; padding-bottom:6pt;">$1</h1>')
    .replace(/^##\s+(.+)$/gm, '<h2 style="color:#1d4ed8; font-family:Calibri; font-size:16pt; margin-top:14pt;">$1</h2>')
    .replace(/^###\s+(.+)$/gm, '<h3 style="color:#2563eb; font-family:Calibri; font-size:13pt; margin-top:10pt;">$1</h3>')
    .replace(/^\>\s*📍\s*(.+)$/gm, '<p style="color:#64748b; font-style:italic; font-size:10pt; background:#f1f5f9; padding:4pt 8pt; border-left:3pt solid #3b82f6;">📍 $1</p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li style="margin-bottom:3pt; font-family:Calibri; font-size:11pt;">$1</li>')
    .replace(/\n\n/g, '<p style="font-family:Calibri; font-size:11pt; line-height:1.5; color:#0f172a;"></p>');

  const docHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Calibri, sans-serif; font-size: 11pt; color: #0f172a; line-height: 1.5; margin: 1in; }
    h1 { color: #1e3a8a; }
    h2 { color: #1d4ed8; }
    h3 { color: #2563eb; }
    .footer { font-size: 9pt; color: #94a3b8; border-top: 1pt solid #cbd5e1; margin-top: 20pt; padding-top: 6pt; }
  </style>
</head>
<body>
  <div style="background-color:#eff6ff; padding:12pt; border-radius:6pt; margin-bottom:18pt; border:1pt solid #bfdbfe;">
    <h3 style="margin:0; color:#1e40af; font-size:12pt;">STUDY TOP • ACADEMIC STUDY NOTES</h3>
    <p style="margin:4pt 0 0 0; color:#3b82f6; font-size:9pt;">Strictly Generated from Uploaded Course Material</p>
  </div>
  ${htmlContent}
  <div class="footer">
    Study Top AI Notes Engine • Created with precision • Page 1
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', docHtml], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${sanitizeFilename(title)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export as Styled Educational PDF (A4 Multi-Page with Margins & Page Numbers)
 */
export async function exportNotesAsPdf(title: string, elementId: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Export container element #${elementId} not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    let heightLeft = contentHeight;
    let position = margin;
    let pageNumber = 1;

    // First Page
    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
    
    // Add page footer
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    pdf.text(`Study Top 2.0 • ${title.substring(0, 40)} • Page ${pageNumber}`, margin, pageHeight - 5);

    heightLeft -= (pageHeight - margin * 2);

    // Subsequent Pages if long document
    while (heightLeft > 0) {
      position = heightLeft - contentHeight + margin;
      pageNumber++;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, contentWidth, contentHeight);
      
      pdf.setFontSize(8);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Study Top 2.0 • ${title.substring(0, 40)} • Page ${pageNumber}`, margin, pageHeight - 5);

      heightLeft -= (pageHeight - margin * 2);
    }

    pdf.save(`${sanitizeFilename(title)}.pdf`);
    return true;
  } catch (err) {
    console.error('PDF export error:', err);
    return false;
  }
}

/**
 * Export as Image (PNG or JPG)
 */
export async function exportNotesAsImage(title: string, elementId: string, format: 'png' | 'jpeg' = 'png'): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) return false;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = canvas.toDataURL(mime, 0.95);

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${sanitizeFilename(title)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Image export error:', err);
    return false;
  }
}
