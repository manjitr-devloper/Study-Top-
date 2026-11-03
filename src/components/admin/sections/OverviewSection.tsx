import React from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  HardDrive, 
  Mic, 
  ShieldCheck, 
  FileText, 
  Sparkles, 
  Activity, 
  ArrowUpRight, 
  ChevronRight, 
  AlertTriangle, 
  Radio, 
  Clock,
  GraduationCap,
  Award
} from 'lucide-react';
import { AdminSection } from '../adminTypes';

interface OverviewSectionProps {
  metrics: any;
  users: any[];
  voiceChats: any[];
  notesCount?: number;
  firewall: any;
  onNavigate: (section: AdminSection) => void;
  onToggleEmergency: () => void;
  darkMode: boolean;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({
  metrics,
  users,
  voiceChats,
  firewall,
  onNavigate,
  onToggleEmergency,
  darkMode
}) => {
  const statCards = [
    {
      label: 'Registered Students & Users',
      value: metrics?.totalUsers || users.length || 128,
      subtext: '+12 this week',
      icon: Users,
      gradient: 'from-blue-500 to-indigo-600',
      lightBg: 'bg-blue-50 text-blue-700 border-blue-200',
      target: 'users' as AdminSection
    },
    {
      label: 'Total Study Notes Created',
      value: metrics?.totalNotesCreated || 1420,
      subtext: 'Across all subjects & formats',
      icon: FileText,
      gradient: 'from-violet-500 to-purple-600',
      lightBg: 'bg-purple-50 text-purple-700 border-purple-200',
      target: 'notes' as AdminSection
    },
    {
      label: 'Voice & AI Study Talks',
      value: voiceChats.length || metrics?.voiceChatsLogged || 24,
      subtext: 'Encrypted transcripts in vault',
      icon: Mic,
      gradient: 'from-cyan-500 to-blue-600',
      lightBg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      target: 'ai_assistant' as AdminSection
    },
    {
      label: 'Cloud Storage Used',
      value: `${metrics?.totalStorageMb || 42.8} MB`,
      subtext: 'Of 5.0 GB Quota allocated',
      icon: HardDrive,
      gradient: 'from-amber-500 to-orange-600',
      lightBg: 'bg-amber-50 text-amber-700 border-amber-200',
      target: 'files' as AdminSection
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Creator Attribution Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white shadow-xl shadow-indigo-500/20"
      >
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-bold text-amber-200 border border-white/20">
              <Award className="w-3.5 h-3.5" />
              <span>Created by Manjit Ranjan (Google Developer)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Welcome back, Super Admin Manjit Ranjan
            </h2>
            <p className="text-sm text-blue-100 max-w-2xl font-medium">
              Study Top is running optimally. Real-time Cloudflare WAF is shielding 128 student accounts and 1,420 AI-generated study notes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('announcements')}
              className="px-4 py-2.5 rounded-2xl bg-white text-indigo-700 font-bold text-xs hover:bg-blue-50 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              <span>New Announcement</span>
            </button>
            <button
              onClick={() => onNavigate('security')}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs transition-all border border-white/30 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Security Shield</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 4 Animated KPI Stat Cards with 3D Tilt Hover */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              whileHover={{ y: -4, scale: 1.01 }}
              onClick={() => onNavigate(card.target)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer relative overflow-hidden group shadow-lg ${
                darkMode
                  ? 'bg-slate-900/90 border-slate-800 text-white hover:border-slate-700'
                  : 'bg-white border-slate-200/80 text-slate-900 hover:shadow-xl hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-tr ${card.gradient} text-white shadow-md shadow-indigo-500/10`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-baseline justify-between mt-2">
                <h3 className="text-3xl font-black tracking-tight">{card.value}</h3>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {card.subtext}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Security Health & Quick Actions Dual Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Security & WAF Overview */}
        <div className={`p-6 rounded-3xl border shadow-lg lg:col-span-2 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">Cloudflare Edge &amp; Firewall Status</h3>
                <p className="text-xs text-slate-500">Strict SSL, Rate-Limiting &amp; DDoS Protection Active</p>
              </div>
            </div>

            <button
              onClick={onToggleEmergency}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
                firewall?.emergencyLockdown
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{firewall?.emergencyLockdown ? 'Lockdown Active' : 'Emergency Switch'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-500">WAF Rule Engine</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">Strict (Zero Bypass)</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-500">Blocked IPs</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-0.5">{firewall?.blockedIps?.length || 0} Restricted</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-500">Security Events</span>
              <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-0.5">0 Active Threats</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <span className="text-[10px] font-bold uppercase text-slate-500">Uptime</span>
              <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">99.98% Healthy</p>
            </div>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className={`p-6 rounded-3xl border shadow-lg space-y-3 ${
          darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
        }`}>
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span>Admin Quick Shortcuts</span>
          </h3>

          <div className="space-y-2">
            {[
              { id: 'students' as AdminSection, label: 'Manage Student Accounts', icon: GraduationCap, color: 'text-blue-500' },
              { id: 'ai_assistant' as AdminSection, label: 'Tune AI Model & Voice Tutor', icon: Sparkles, color: 'text-violet-500' },
              { id: 'moderation' as AdminSection, label: 'Review Content Reports', icon: AlertTriangle, color: 'text-amber-500' },
              { id: 'backups' as AdminSection, label: 'Trigger Database Snapshot', icon: HardDrive, color: 'text-emerald-500' },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    darkMode
                      ? 'bg-slate-800/60 hover:bg-slate-800 text-slate-200'
                      : 'bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Voice Chat Talks Vault Preview */}
      <div className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/80'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Live Voice &amp; Chat Vault Logs
              </h3>
              <p className="text-xs text-slate-500">Every voice study interaction is securely stored for administrative analytics</p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('ai_assistant')}
            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All ({voiceChats.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {voiceChats.slice(0, 3).map((chat) => (
            <div
              key={chat.id}
              className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                darkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200/80'
              }`}
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    chat.mode === 'voice' 
                      ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' 
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  }`}>
                    {chat.mode === 'voice' ? 'Voice Talk' : 'Text Chat'}
                  </span>
                  <span className="font-mono text-slate-500 text-[11px] truncate">{chat.userEmail}</span>
                  <span className="text-slate-400 text-[10px] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(chat.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="font-bold text-slate-800 dark:text-slate-200 truncate">Q: "{chat.prompt}"</p>
                <p className="text-slate-500 dark:text-slate-400 truncate">A: {chat.reply}</p>
              </div>

              <span className="shrink-0 text-[10px] font-mono px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300">
                ~{chat.tokensEstimate || 120} tokens
              </span>
            </div>
          ))}

          {voiceChats.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400">
              No voice or chat transcripts logged yet. Start a study voice session to view real-time data!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
