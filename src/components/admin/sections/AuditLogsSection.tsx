import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

interface AuditLogsSectionProps {
  logs: any[];
  onExport: (type: 'json' | 'csv') => void;
  onRefresh: () => void;
  darkMode: boolean;
}

export const AuditLogsSection: React.FC<AuditLogsSectionProps> = ({
  logs,
  onExport,
  onRefresh,
  darkMode
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.ip.includes(search);
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500" />
            <span>Audit Trail &amp; Forensic Activity Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Immutable, timestamped record of administrative actions, authentication events, and security triggers
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onExport('csv')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onExport('json')}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, details, or IP..."
            className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-bold outline-none border ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-3 py-2 rounded-xl text-xs font-bold outline-none border cursor-pointer ${
            darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
          }`}
        >
          <option value="all">All Statuses</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="error">Error / Violation</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-xl ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className={`font-black uppercase text-[10px] tracking-wider border-b ${
              darkMode ? 'bg-slate-800/80 text-slate-400 border-slate-700' : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}>
              <tr>
                <th className="py-3.5 px-5">Timestamp</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">IP Address</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-5">Details</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-medium ${
              darkMode ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'
            }`}>
              {filteredLogs.map((log) => (
                <tr key={log.id} className={`transition-colors ${
                  darkMode ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                }`}>
                  <td className="py-3.5 px-5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </td>

                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                    {log.actor}
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {log.ip}
                  </td>

                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      log.status === 'success' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                        : log.status === 'warning' 
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' 
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {log.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> :
                       log.status === 'warning' ? <AlertTriangle className="w-3 h-3" /> :
                       <XCircle className="w-3 h-3" />}
                      <span>{log.status}</span>
                    </span>
                  </td>

                  <td className="py-3.5 px-5 text-slate-600 dark:text-slate-300 text-[11px] max-w-xs truncate">
                    {log.details}
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
