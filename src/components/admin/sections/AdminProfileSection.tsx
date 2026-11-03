import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  ShieldCheck, 
  Key, 
  Crown, 
  Award, 
  Mail, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  Eye, 
  EyeOff,
  Server
} from 'lucide-react';

interface AdminProfileSectionProps {
  onLogout: () => void;
  darkMode: boolean;
}

export const AdminProfileSection: React.FC<AdminProfileSectionProps> = ({ onLogout, darkMode }) => {
  const [showKey, setShowKey] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-6 h-6 text-indigo-500" />
          <span>Super Admin Profile &amp; Creator Credentials</span>
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Root administrator identity, cryptographic session tokens, and security profile
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Identity Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl lg:col-span-2 space-y-6 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-rose-950/20 shrink-0">
                MR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    Manjit Ranjan
                  </h3>
                  <Crown className="w-5 h-5 text-amber-500 shrink-0" />
                </div>
                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                  Lead Google Developer &amp; Founder
                </p>
                <div className="inline-block mt-2">
                  <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
                    Only Admin: Manjit Ranjan
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto border border-rose-200 dark:border-rose-900"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>
          </div>

          {/* Details Table */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Verified Admin Email</span>
              <p className="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-500" />
                <span>manjitranjan180513@gmail.com</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Master Security Passcode</span>
              <div className="flex items-center justify-between">
                <p className="font-mono font-bold text-slate-900 dark:text-white">
                  {showKey ? (sessionStorage.getItem('study_top_admin_key') || 'Protected Key') : '••••••••'}
                </p>
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Managed Platform</span>
              <p className="font-bold text-slate-900 dark:text-white">
                Study Top — Smart Notes Making Platform
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-1">
              <span className="text-slate-500 font-bold uppercase text-[10px]">Two-Factor Authentication</span>
              <p className="font-bold text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Hardware &amp; Passcode Enforcement</span>
              </p>
            </div>
          </div>
        </div>

        {/* Root Privileges Summary */}
        <div className={`p-6 sm:p-8 rounded-3xl border shadow-xl space-y-4 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Root Privileges</span>
          </h3>

          <div className="space-y-2 text-xs">
            {[
              'Full administrative control over all 20 sidebar modules',
              'Cloudflare WAF Emergency Lockdown authority',
              'AI Assistant system prompt & hyperparameter tuner',
              'Database snapshot creation and disaster recovery',
              'Student account streak management and password resets',
              'Access to Voice & Chat Storage Vault archive'
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
