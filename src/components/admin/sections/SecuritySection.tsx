import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  AlertOctagon, 
  Globe, 
  Flame, 
  Ban, 
  Key, 
  CheckCircle2, 
  AlertTriangle,
  Plus
} from 'lucide-react';

interface SecuritySectionProps {
  firewall: any;
  onToggleEmergency: () => Promise<void>;
  onBlockIp: (ip: string, reason?: string) => Promise<void>;
  onUnblockIp: (ip: string) => Promise<void>;
  actionLoading: boolean;
  darkMode: boolean;
}

export const SecuritySection: React.FC<SecuritySectionProps> = ({
  firewall,
  onToggleEmergency,
  onBlockIp,
  onUnblockIp,
  actionLoading,
  darkMode
}) => {
  const [ipInput, setIpInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;
    await onBlockIp(ipInput.trim(), reasonInput.trim());
    setIpInput('');
    setReasonInput('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-emerald-500" />
          <span>Security Centre &amp; Cloudflare WAF Shield</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Full-Stack edge firewall, DDoS mitigation, IP blocklists, and emergency lockdown controls
        </p>
      </div>

      {/* Emergency Lockdown Master Switch */}
      <div className={`p-6 rounded-3xl border shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
        firewall?.emergencyLockdown
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-800'
          : darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
            firewall?.emergencyLockdown 
              ? 'bg-rose-600 text-white animate-pulse' 
              : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
          }`}>
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Emergency Platform Lockdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              When enabled, all non-admin write requests (note updates, uploads) are instantly frozen by the server
            </p>
          </div>
        </div>

        <button
          disabled={actionLoading}
          onClick={onToggleEmergency}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg active:scale-95 flex items-center gap-2 ${
            firewall?.emergencyLockdown
              ? 'bg-rose-600 hover:bg-rose-700 text-white ring-4 ring-rose-500/20'
              : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700'
          }`}
        >
          {firewall?.emergencyLockdown ? (
            <>
              <Unlock className="w-4 h-4" />
              <span>Lift Emergency Lockdown</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Activate Lockdown</span>
            </>
          )}
        </button>
      </div>

      {/* Cloudflare Shield Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border shadow-lg ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
            <Globe className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Cloudflare Edge WAF</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">Active · Strict</p>
          <p className="text-xs text-slate-500 mt-1">Zero Trust HTTPS &amp; Ray ID Injection</p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-lg ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Rate Limiting</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">Active (25 req/min Admin)</p>
          <p className="text-xs text-slate-500 mt-1">150 req/min for general app routes</p>
        </div>

        <div className={`p-5 rounded-3xl border shadow-lg ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center gap-2 mb-2 text-violet-600 dark:text-violet-400">
            <Key className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Master Key Guard</span>
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-white">8235**** Key Masked</p>
          <p className="text-xs text-slate-500 mt-1">Restricted to Manjit Ranjan</p>
        </div>
      </div>

      {/* Manual IP Blacklist Manager */}
      <div className={`p-6 rounded-3xl border shadow-xl space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
          <Ban className="w-4 h-4 text-rose-500" />
          <span>Firewall IP Restriction List</span>
        </h3>

        <form onSubmit={handleBlockSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            type="text"
            required
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="IP Address (e.g. 192.168.1.50)"
            className={`p-2.5 rounded-xl text-xs font-bold border outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
          <input
            type="text"
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="Reason (e.g. Brute-force attempt)"
            className={`p-2.5 rounded-xl text-xs font-bold border outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="submit"
            disabled={actionLoading}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Block IP Immediately</span>
          </button>
        </form>

        <div className="pt-2">
          <h4 className="text-xs font-bold text-slate-500 mb-2">Restricted IPs ({firewall?.blockedIps?.length || 0})</h4>
          <div className="space-y-2">
            {(firewall?.blockedIps || []).map((ip: string) => (
              <div
                key={ip}
                className={`p-3 rounded-2xl border flex items-center justify-between text-xs font-mono ${
                  darkMode ? 'bg-slate-800/40 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              >
                <span>{ip}</span>
                <button
                  onClick={() => onUnblockIp(ip)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] cursor-pointer"
                >
                  Unblock
                </button>
              </div>
            ))}

            {(!firewall?.blockedIps || firewall?.blockedIps?.length === 0) && (
              <p className="text-xs text-slate-400 py-3">No IP addresses currently banned.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
