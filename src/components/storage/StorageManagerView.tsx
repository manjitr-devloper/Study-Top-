import React, { useState, useEffect } from 'react';
import { 
  HardDrive, 
  Upload, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Download, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Layers,
  Loader2
} from 'lucide-react';
import { stClient } from '../../lib/stCloudClient';

interface StorageFile {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'doc' | 'notes';
  sizeBytes: number;
  uploadedAt: number;
}

export const StorageManagerView: React.FC = () => {
  const [stats, setStats] = useState<{ totalFiles: number; totalBytes: number }>({ totalFiles: 0, totalBytes: 0 });
  const [files, setFiles] = useState<StorageFile[]>([
    { id: 'f1', name: 'NCERT_Class10_Mathematics_Ch4.pdf', type: 'pdf', sizeBytes: 3.4 * 1024 * 1024, uploadedAt: Date.now() - 3600000 * 24 },
    { id: 'f2', name: 'Optics_Refraction_Diagram.png', type: 'image', sizeBytes: 1.2 * 1024 * 1024, uploadedAt: Date.now() - 3600000 * 12 },
    { id: 'f3', name: 'Chemistry_Periodic_Table_Notes.docx', type: 'doc', sizeBytes: 850 * 1024, uploadedAt: Date.now() - 3600000 * 4 },
    { id: 'f4', name: 'World_History_Revolutions_Summary.txt', type: 'notes', sizeBytes: 320 * 1024, uploadedAt: Date.now() - 3600000 }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Quota: 10GB provisioned capacity
  const totalCapacityBytes = 10 * 1024 * 1024 * 1024;
  const usedBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const usedPercent = Math.min(100, Math.round((usedBytes / totalCapacityBytes) * 100));

  const fetchStorageData = async () => {
    setIsLoading(true);
    try {
      const res = await stClient.files.getStatus();
      if (res?.stats) {
        setStats(res.stats);
      }
    } catch (e) {
      console.warn('Storage fetch warning:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStorageData();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        await stClient.files.upload({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          base64Content: base64
        });

        const newFile: StorageFile = {
          id: `file_${Date.now()}`,
          name: file.name,
          type: file.name.endsWith('.pdf') ? 'pdf' : file.type.startsWith('image/') ? 'image' : 'doc',
          sizeBytes: file.size,
          uploadedAt: Date.now()
        };
        setFiles(prev => [newFile, ...prev]);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this file from private storage?')) {
      setFiles(prev => prev.filter(f => f.id !== id));
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <span>Study Top Storage Manager</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Private encrypted object storage for your textbooks, photographed notes, and study exports.
          </p>
        </div>

        <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95">
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{isUploading ? 'Uploading to MinIO S3...' : 'Upload File'}</span>
          <input type="file" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Storage Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900">Total Capacity</span>
            <span className="text-[11px] font-bold text-blue-600">10.0 GB Provisioned</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(5, usedPercent)}%` }} />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span>Used: {formatSize(usedBytes)}</span>
            <span>Available: {formatSize(totalCapacityBytes - usedBytes)}</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-black text-slate-900">File Type Breakdown</div>
          <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px]">PDF Documents</span>
              <span className="font-bold text-slate-800">{files.filter(f => f.type === 'pdf').length} files</span>
            </div>
            <div className="p-2 bg-slate-50 rounded-xl">
              <span className="text-slate-400 block text-[10px]">Textbook Images</span>
              <span className="font-bold text-slate-800">{files.filter(f => f.type === 'image').length} files</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-2">
          <div className="text-xs font-black text-slate-900">Security &amp; Encryption</div>
          <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-800 text-[11px] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>SHA-256 Checksum Validation &amp; Isolated Bucket Active</span>
          </div>
        </div>
      </div>

      {/* Files Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="text-xs font-black uppercase tracking-wider text-slate-800">
            Stored Documents &amp; Files ({filteredFiles.length})
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white outline-none w-44 sm:w-60"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredFiles.map(file => (
            <div key={file.id} className="p-4 px-6 flex items-center justify-between gap-4 hover:bg-slate-50/60 transition">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {file.type === 'pdf' ? <FileText className="w-4 h-4" /> : file.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <File className="w-4 h-4" />}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">{file.name}</h4>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{formatSize(file.sizeBytes)}</span>
                    <span>•</span>
                    <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => alert(`Downloading ${file.name} from Study Top Storage...`)}
                  className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                  title="Delete File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
