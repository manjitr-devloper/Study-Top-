import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  Download, 
  Plus, 
  CheckCircle2, 
  Clock, 
  HardDrive, 
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { SystemBackup } from '../adminTypes';

interface BackupSectionProps {
  darkMode: boolean;
}

export const BackupSection: React.FC<BackupSectionProps> = ({ darkMode }) => {
  const [backups, setBackups] = useState<SystemBackup[]>([]);
  const [schedule, setSchedule] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadBackups = async () => {
    try {
      const res = await fetch('/api/admin/backups', {
        headers: {
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com'
        }
      });
      const data = await res.json();
      setBackups(data.backups || []);
      setSchedule(data.autoBackupSchedule || 'Every 24 hours at 00:00 UTC');
    } catch (_) {}
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const triggerInstantBackup = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: {
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com'
        }
      });
      const data = await res.json();
      if (data.success) {
        setMessage('New snapshot generated and SHA-256 verified!');
        loadBackups();
        setTimeout(() => setMessage(null), 3500);
      }
    } catch (_) {
      setMessage('Failed to generate snapshot');
    } finally {
      setLoading(false);
    }
  };

  const downloadSnapshotJson = (backup: SystemBackup) => {
    const data = {
      backupMeta: backup,
      owner: 'Only Admin: Manjit Ranjan',
      appName: 'Study Top',
      generatedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${backup.id}_study_top_snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-500" />
            <span>Database Backup, Snapshots &amp; Disaster Recovery</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated cloud backups with cryptographic checksum integrity and instant JSON dumps
          </p>
        </div>

        <button
          disabled={loading}
          onClick={triggerInstantBackup}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 hover:from-blue-500 hover:to-indigo-500 transition-all cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{loading ? 'Creating Snapshot...' : 'Create Instant Snapshot'}</span>
        </button>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {/* Snapshot Schedule Banner */}
      <div className={`p-5 rounded-3xl border shadow-lg flex items-center justify-between ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Automated Snapshot Cron</h4>
            <p className="text-[11px] text-slate-500">{schedule}</p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          Sync Active
        </span>
      </div>

      {/* Backups List */}
      <div className="space-y-3">
        {backups.map((b) => (
          <div
            key={b.id}
            className={`p-5 rounded-3xl border shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{b.id}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  {b.status}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(b.createdAt).toLocaleString()}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{b.title}</h4>
              <p className="text-xs text-slate-500 font-mono text-[10px] truncate max-w-xl">
                Checksum: {b.checksum}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500 pt-1">
                <span><b>{b.totalNotes}</b> Notes</span>
                <span>•</span>
                <span><b>{b.totalUsers}</b> Users</span>
                <span>•</span>
                <span><b>{b.sizeMb} MB</b> Archive Size</span>
              </div>
            </div>

            <button
              onClick={() => downloadSnapshotJson(b)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Dump</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
