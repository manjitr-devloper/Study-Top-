import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FolderArchive, 
  FileText, 
  HardDrive, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  FileCheck,
  Paperclip
} from 'lucide-react';
import { UploadedFileItem } from '../adminTypes';

interface FileManagementSectionProps {
  files: UploadedFileItem[];
  totalStorageUsedMb: number;
  maxAllowedMb: number;
  onDeleteFile: (fileId: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const FileManagementSection: React.FC<FileManagementSectionProps> = ({
  files,
  totalStorageUsedMb,
  maxAllowedMb,
  onDeleteFile,
  actionLoading,
  darkMode
}) => {
  const [search, setSearch] = useState('');
  const usagePercentage = Math.min(100, Math.round((totalStorageUsedMb / maxAllowedMb) * 100));

  const filtered = files.filter(f => 
    f.fileName.toLowerCase().includes(search.toLowerCase()) || 
    f.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <FolderArchive className="w-6 h-6 text-amber-500" />
            <span>File &amp; Document Upload Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage scanned documents, OCR handwritten uploads, textbooks, and PDF attachments
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files..."
            className={`pl-9 pr-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>
      </div>

      {/* Storage Gauge Card */}
      <div className={`p-6 rounded-3xl border shadow-xl ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">Cloud Storage Allocation</h3>
              <p className="text-xs text-slate-500">{totalStorageUsedMb} MB used of {maxAllowedMb} MB total tier capacity</p>
            </div>
          </div>
          <span className="text-sm font-mono font-black text-amber-600 dark:text-amber-400">
            {usagePercentage}% Capacity
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500" 
            style={{ width: `${Math.max(5, usagePercentage)}%` }}
          />
        </div>
      </div>

      {/* Files Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-black uppercase text-[10px] tracking-wider border-b ${
              darkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3.5 px-5">File Name</th>
                <th className="py-3.5 px-4">Owner</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">OCR Status</th>
                <th className="py-3.5 px-4">Uploaded</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${
              darkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'
            }`}>
              {filtered.map((file) => (
                <tr key={file.id} className={`transition-colors ${
                  darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2.5">
                      <Paperclip className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{file.fileName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{file.mimeType} · {file.pagesCount} pages</div>
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {file.ownerEmail}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px]">
                    {file.fileSizeMb} MB
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      OCR Processed
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </td>

                  <td className="py-3.5 px-5 text-right">
                    <button
                      disabled={actionLoading}
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 transition-all cursor-pointer"
                      title="Delete storage file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
