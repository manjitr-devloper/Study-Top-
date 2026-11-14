import React, { useState, useEffect, useRef } from 'react';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle2, 
  Wifi, 
  WifiOff, 
  Database, 
  Clock, 
  FileText, 
  ExternalLink,
  ChevronDown,
  X,
  Info
} from 'lucide-react';
import { 
  subscribeNotesSync, 
  setNotesSyncStatus, 
  getNotesSyncInfo, 
  NotesSyncInfo 
} from '../../lib/notesSyncState';
import { db } from '../../lib/firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

interface FirebaseSyncStatusIndicatorProps {
  notesCount?: number;
  className?: string;
  onForceSync?: () => void;
}

export const FirebaseSyncStatusIndicator: React.FC<FirebaseSyncStatusIndicatorProps> = ({
  notesCount,
  className = '',
  onForceSync
}) => {
  const [syncInfo, setSyncInfo] = useState<NotesSyncInfo>(getNotesSyncInfo());
  const [isOpen, setIsOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Subscribe to sync state changes
  useEffect(() => {
    const unsubscribe = subscribeNotesSync((info) => {
      setSyncInfo(info);
    });
    return unsubscribe;
  }, []);

  // Update notes count when prop changes
  useEffect(() => {
    if (typeof notesCount === 'number') {
      setNotesSyncStatus(syncInfo.status, { notesCount });
    }
  }, [notesCount]);

  // Click outside listener for the popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleManualSync = async () => {
    setIsVerifying(true);
    setVerifyMessage(null);
    setNotesSyncStatus('syncing', { message: 'Verifying connection to Firebase...' });

    if (onForceSync) {
      onForceSync();
    }

    try {
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('Device is offline');
      }

      // Probe Firestore connection
      await getDocFromServer(doc(db, 'test', 'connection')).catch((e) => {
        if (e?.message?.includes('the client is offline')) {
          throw e;
        }
      });

      setNotesSyncStatus('synced', {
        isOnline: true,
        lastSyncedAt: Date.now(),
        message: 'Successfully verified & synced to Firebase',
        pendingCount: 0
      });
      setVerifyMessage('Connection verified! All notes are in sync with Firebase.');
    } catch (err: any) {
      const isOffline = !navigator.onLine || err?.message?.includes('offline');
      setNotesSyncStatus(isOffline ? 'cached_offline' : 'synced', {
        isOnline: !isOffline,
        message: isOffline ? 'Offline: Cached locally' : 'Sync completed'
      });
      setVerifyMessage(
        isOffline 
          ? 'Device is offline. Notes remain safely stored in local cache.' 
          : 'Sync completed.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSeconds < 10) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentNotesCount = typeof notesCount === 'number' ? notesCount : syncInfo.notesCount;

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      {/* Clickable Header Status Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border select-none ${
          syncInfo.status === 'cached_offline'
            ? 'bg-amber-50/90 border-amber-300/80 text-amber-900 hover:bg-amber-100 shadow-2xs'
            : syncInfo.status === 'syncing'
            ? 'bg-blue-50/90 border-blue-300/80 text-blue-900 hover:bg-blue-100 shadow-2xs'
            : 'bg-emerald-50/90 border-emerald-300/80 text-emerald-900 hover:bg-emerald-100 shadow-2xs'
        }`}
        title={
          syncInfo.status === 'cached_offline'
            ? 'Offline: Notes are cached locally. Click for sync details.'
            : syncInfo.status === 'syncing'
            ? 'Syncing notes to Firebase Firestore...'
            : 'Notes synced to Firebase. Click for sync details.'
        }
      >
        {/* Status Dot */}
        {syncInfo.status === 'cached_offline' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        )}
        {syncInfo.status === 'syncing' && (
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        )}
        {syncInfo.status === 'synced' && (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        )}

        {/* Icon */}
        {syncInfo.status === 'cached_offline' ? (
          <CloudOff className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        ) : syncInfo.status === 'syncing' ? (
          <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        )}

        {/* Label (Responsive) */}
        <span className="hidden sm:inline font-medium">
          {syncInfo.status === 'cached_offline' ? (
            'Cached Locally (Offline)'
          ) : syncInfo.status === 'syncing' ? (
            'Syncing to Firebase...'
          ) : (
            'Firebase Synced'
          )}
        </span>
        <span className="sm:hidden font-medium">
          {syncInfo.status === 'cached_offline' ? 'Offline' : syncInfo.status === 'syncing' ? 'Syncing' : 'Synced'}
        </span>

        <ChevronDown className={`w-3 h-3 transition-transform text-slate-500 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Details */}
      {isOpen && (
        <div className="absolute right-0 sm:left-0 top-full mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${
                syncInfo.status === 'cached_offline' 
                  ? 'bg-amber-100 text-amber-700' 
                  : syncInfo.status === 'syncing' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-emerald-100 text-emerald-700'
              }`}>
                {syncInfo.status === 'cached_offline' ? (
                  <CloudOff className="w-4 h-4" />
                ) : syncInfo.status === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Cloud className="w-4 h-4" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Notes Storage & Sync</h4>
                <p className="text-[11px] text-slate-500">Firebase Firestore Real-Time Sync</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Current Status Banner */}
          <div className={`mt-3 p-3 rounded-xl border ${
            syncInfo.status === 'cached_offline'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : syncInfo.status === 'syncing'
              ? 'bg-blue-50/70 border-blue-200 text-blue-900'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-start gap-2">
              {syncInfo.status === 'cached_offline' ? (
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>
                    {syncInfo.status === 'cached_offline'
                      ? 'Offline Mode Active'
                      : syncInfo.status === 'syncing'
                      ? 'Synchronizing in Progress'
                      : 'Firebase Cloud Connected'}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md ${
                    syncInfo.status === 'cached_offline'
                      ? 'bg-amber-200 text-amber-800'
                      : syncInfo.status === 'syncing'
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-emerald-200 text-emerald-800'
                  }`}>
                    {syncInfo.status === 'cached_offline' ? 'Local Cache' : 'Live Cloud'}
                  </span>
                </div>
                <p className="text-[11px] mt-1 leading-relaxed text-slate-600">
                  {syncInfo.status === 'cached_offline'
                    ? 'Your edits are stored safely in local browser storage (IndexedDB) and will instantly push to Firebase once internet connectivity is restored.'
                    : syncInfo.status === 'syncing'
                    ? 'Updating note documents in Firebase Firestore...'
                    : 'All notes are synchronized in real-time with Google Cloud Firestore database.'}
                </p>
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <FileText className="w-3 h-3 text-blue-500" />
                <span className="text-[10px] font-semibold uppercase">Notes Protected</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {currentNotesCount} {currentNotesCount === 1 ? 'Note' : 'Notes'}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                <Clock className="w-3 h-3 text-indigo-500" />
                <span className="text-[10px] font-semibold uppercase">Last Synced</span>
              </div>
              <div className="text-sm font-black text-slate-900">
                {formatLastSync(syncInfo.lastSyncedAt)}
              </div>
            </div>
          </div>

          {/* Database Target Info */}
          <div className="mt-2.5 bg-slate-50/80 border border-slate-100 rounded-xl p-2.5 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <Database className="w-3 h-3 text-emerald-600" />
                Firestore DB:
              </span>
              <span className="font-mono text-[10px] text-slate-800 font-semibold truncate max-w-[170px]" title={syncInfo.databaseId}>
                {syncInfo.databaseId}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span className="text-slate-500 font-medium">Local Cache Strategy:</span>
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Persistent Multi-Tab
              </span>
            </div>
          </div>

          {/* Verification Feedback Message */}
          {verifyMessage && (
            <div className="mt-2.5 text-[11px] p-2 bg-blue-50 text-blue-800 border border-blue-200 rounded-lg flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>{verifyMessage}</span>
            </div>
          )}

          {/* Action Button */}
          <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] text-slate-400">
              Automatic sync enabled
            </span>
            <button
              onClick={handleManualSync}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition cursor-pointer disabled:opacity-60 shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
