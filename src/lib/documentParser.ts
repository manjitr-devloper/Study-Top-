/**
 * Document & Multimodal Content Parser for Study Top AI Notes Engine
 * Supports: PDF, DOCX, TXT/MD, PPTX/PPT, Images (JPG, PNG, WEBP) & Camera Captures
 * Features: Client-side text extraction, file hashing, duplicate detection, and caching
 */

import mammoth from 'mammoth';

export interface ProcessedSourceFile {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'txt' | 'pptx' | 'image' | 'camera' | 'text';
  sizeBytes: number;
  sizeFormatted: string;
  hash: string;
  previewUrl?: string;
  base64Data?: string;
  mimeType: string;
  extractedText?: string;
  pageCount?: number;
  isDuplicate?: boolean;
}

// In-memory extraction cache to prevent redundant processing
const extractionCache = new Map<string, { text?: string; base64?: string }>();

/**
 * Fast string/buffer hashing for duplicate detection and caching
 */
export async function computeFileHash(file: File): Promise<string> {
  try {
    const buffer = await file.slice(0, 65536).arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(digest));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  } catch (_) {
    return `${file.name}_${file.size}_${file.lastModified}`;
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function detectFileType(file: File): 'pdf' | 'docx' | 'txt' | 'pptx' | 'image' | 'text' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) return 'docx';
  if (name.endsWith('.pptx') || name.endsWith('.ppt') || file.type.includes('presentation')) return 'pptx';
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.rtf') || name.endsWith('.csv') || file.type.startsWith('text/')) return 'txt';
  if (file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|bmp|svg)$/i.test(name)) return 'image';
  return 'txt';
}

/**
 * Converts File to Base64 String
 */
export function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Process any uploaded file into a unified ProcessedSourceFile
 */
export async function processSourceFile(
  file: File, 
  existingFiles: ProcessedSourceFile[] = []
): Promise<ProcessedSourceFile> {
  const fileType = detectFileType(file);
  const hash = await computeFileHash(file);
  const id = `src_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const sizeFormatted = formatFileSize(file.size);

  // Check duplicate
  const isDuplicate = existingFiles.some(
    f => f.hash === hash || (f.name === file.name && f.sizeBytes === file.size)
  );

  let extractedText: string | undefined;
  let base64Data: string | undefined;
  let previewUrl: string | undefined;

  // Check cache first
  if (extractionCache.has(hash)) {
    const cached = extractionCache.get(hash)!;
    extractedText = cached.text;
    base64Data = cached.base64;
  }

  // Handle DOCX via Mammoth
  if (fileType === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedText = result.value.trim();
    } catch (docxErr) {
      console.warn('Mammoth DOCX extraction note:', docxErr);
      extractedText = `[DOCX Document: ${file.name}]`;
    }
  }

  // Handle Plain Text files
  if (fileType === 'txt') {
    try {
      extractedText = await file.text();
    } catch (txtErr) {
      console.warn('Text file read error:', txtErr);
    }
  }

  // Handle PPTX (Extract text preview from binary or readable strings)
  if (fileType === 'pptx') {
    try {
      const text = await file.text();
      // Simple XML slide text cleaner
      const cleaned = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      extractedText = cleaned.length > 50 ? cleaned.slice(0, 8000) : `[Presentation Document: ${file.name}]`;
    } catch (_) {
      extractedText = `[Presentation Document: ${file.name}]`;
    }
  }

  // Handle PDF and Images
  if (fileType === 'pdf' || fileType === 'image') {
    if (!base64Data) {
      base64Data = await fileToBase64(file);
    }
    if (fileType === 'image') {
      previewUrl = URL.createObjectURL(file);
    }
  }

  // Update extraction cache
  extractionCache.set(hash, { text: extractedText, base64: base64Data });

  return {
    id,
    name: file.name,
    type: fileType,
    sizeBytes: file.size,
    sizeFormatted,
    hash,
    previewUrl,
    base64Data,
    mimeType: file.type || (fileType === 'pdf' ? 'application/pdf' : 'image/jpeg'),
    extractedText,
    isDuplicate
  };
}
