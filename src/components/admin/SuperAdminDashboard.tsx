import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Users, 
  GraduationCap, 
  FileText, 
  Sparkles, 
  FolderArchive, 
  CreditCard, 
  ShieldAlert, 
  Radio, 
  BarChart3, 
  Lock, 
  Clock, 
  UserCheck, 
  Sliders, 
  Cpu, 
  Database, 
  Activity, 
  LifeBuoy, 
  User, 
  LogOut, 
  Search, 
  RefreshCw, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  Award, 
  AlertOctagon,
  HardDrive,
  Mic
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { AdminLoginPage } from './AdminLoginPage';
import { AdminSection } from './adminTypes';

// Modular Section Components
import { OverviewSection } from './sections/OverviewSection';
import { UserManagementSection } from './sections/UserManagementSection';
import { StudentAccountsSection } from './sections/StudentAccountsSection';
import { NotesManagementSection } from './sections/NotesManagementSection';
import { AiAssistantSection } from './sections/AiAssistantSection';
import { FileManagementSection } from './sections/FileManagementSection';
import { SubscriptionSection } from './sections/SubscriptionSection';
import { ModerationSection } from './sections/ModerationSection';
import { AnnouncementsSection } from './sections/AnnouncementsSection';
import { AnalyticsSection } from './sections/AnalyticsSection';
import { SecuritySection } from './sections/SecuritySection';
import { AuditLogsSection } from './sections/AuditLogsSection';
import { AdminTeamSection } from './sections/AdminTeamSection';
import { AppConfigSection } from './sections/AppConfigSection';
import { IntegrationsSection } from './sections/IntegrationsSection';
import { BackupSection } from './sections/BackupSection';
import { SystemHealthSection } from './sections/SystemHealthSection';
import { SupportTicketsSection } from './sections/SupportTicketsSection';
import { AdminProfileSection } from './sections/AdminProfileSection';

interface SuperAdminDashboardProps {
  onClose: () => void;
  currentUser?: any;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onClose, currentUser: propUser }) => {
  const [activeTab, setActiveTab] = useState<AdminSection>('overview');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('study_top_admin_theme') === 'dark';
    }
    return false;
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchNav, setSearchNav] = useState('');

  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(() => {
    if (typeof window !== 'undefined') {
      const authFlag = sessionStorage.getItem('study_top_admin_authenticated');
      const savedKey = sessionStorage.getItem('study_top_admin_key');
      const curEmail = auth.currentUser?.email?.toLowerCase();
      if (curEmail === 'manjitranjan180513@gmail.com') return true;
      if (authFlag === 'true' || Boolean(savedKey)) return true;
    }
    return false;
  });
  const [adminKey, setAdminKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('study_top_admin_key') || '';
    }
    return '';
  });

  // State Stores
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [aiConfig, setAiConfig] = useState<any>(null);
  const [voiceChats, setVoiceChats] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [storageStats, setStorageStats] = useState({ usedMb: 42.8, maxMb: 5120 });
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [mrr, setMrr] = useState(79.84);
  const [reports, setReports] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [firewall, setFirewall] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);

  const [bannedWords, setBannedWords] = useState<string[]>([
    'hate', 'hack', 'cheat', 'scam', 'abuse', 'phishing', 'malware', 'exploit'
  ]);

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const currentUser = propUser || auth.currentUser;
  const isSuperAdminEmail = currentUser?.email?.toLowerCase() === 'manjitranjan180513@gmail.com';

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('study_top_admin_theme', next ? 'dark' : 'light');
      return next;
    });
  };

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // 20 Structured Navigation Items
  const navigationItems = [
    // 1. Core
    { id: 'overview' as AdminSection, label: 'Overview Dashboard', icon: Activity, category: 'Core' },
    { id: 'users' as AdminSection, label: 'User Directory', icon: Users, category: 'Core', badge: users.length || undefined },
    { id: 'students' as AdminSection, label: 'Student Accounts', icon: GraduationCap, category: 'Core', badge: students.length || undefined },
    { id: 'notes' as AdminSection, label: 'Notes Catalog', icon: FileText, category: 'Core', badge: notes.length || undefined },

    // 2. Intelligence
    { id: 'ai_assistant' as AdminSection, label: 'AI Assistant & Voice', icon: Sparkles, category: 'Intelligence' },
    { id: 'files' as AdminSection, label: 'Files & OCR Uploads', icon: FolderArchive, category: 'Intelligence' },
    { id: 'subscriptions' as AdminSection, label: 'Platform AI Quotas & Limits', icon: Sliders, category: 'Intelligence' },

    // 3. Governance
    { id: 'moderation' as AdminSection, label: 'Reports & Moderation', icon: ShieldAlert, category: 'Governance', badge: reports.filter(r => r.status === 'pending').length || undefined },
    { id: 'announcements' as AdminSection, label: 'Broadcasts & Notices', icon: Radio, category: 'Governance', badge: announcements.length || undefined },
    { id: 'analytics' as AdminSection, label: 'Analytics & Telemetry', icon: BarChart3, category: 'Governance' },

    // 4. Infrastructure
    { id: 'security' as AdminSection, label: 'Security & Cloudflare', icon: Lock, category: 'Infrastructure' },
    { id: 'audit' as AdminSection, label: 'Audit Trail & Logs', icon: Clock, category: 'Infrastructure' },
    { id: 'team' as AdminSection, label: 'Admin Team & Roles', icon: UserCheck, category: 'Infrastructure' },
    { id: 'app_config' as AdminSection, label: 'App Configuration', icon: Sliders, category: 'Infrastructure' },
    { id: 'integrations' as AdminSection, label: 'Integrations & APIs', icon: Cpu, category: 'Infrastructure' },
    { id: 'backups' as AdminSection, label: 'Backup & Recovery', icon: Database, category: 'Infrastructure' },
    { id: 'system_health' as AdminSection, label: 'System Health Telemetry', icon: Activity, category: 'Infrastructure' },

    // 5. Support & Profile
    { id: 'support_tickets' as AdminSection, label: 'Help & Student Support', icon: LifeBuoy, category: 'Support', badge: tickets.filter(t => t.status === 'open').length || undefined },
    { id: 'profile' as AdminSection, label: 'Super Admin Profile', icon: User, category: 'Support' },
    { id: 'logout' as AdminSection, label: 'Sign Out Session', icon: LogOut, category: 'Support' }
  ];

  // Load all admin data from server
  const loadDashboardData = async (customHeaders?: Record<string, string>) => {
    const headers = customHeaders || {
      'x-user-email': currentUser?.email || 'manjitranjan180513@gmail.com',
      'Authorization': `Bearer ${currentUser?.email || 'manjitranjan180513@gmail.com'}`
    };
    if (adminKey) headers['x-admin-key'] = adminKey;

    try {
      const [
        mRes, uRes, sRes, nRes, aiRes, vRes, fRes, subRes, repRes, annRes, fwRes, logRes, teamRes, cfgRes, tktRes
      ] = await Promise.allSettled([
        fetch('/api/admin/metrics', { headers }),
        fetch('/api/admin/users', { headers }),
        fetch('/api/admin/students', { headers }),
        fetch('/api/admin/notes', { headers }),
        fetch('/api/admin/ai-config', { headers }),
        fetch('/api/admin/voice-chats', { headers }),
        fetch('/api/admin/files', { headers }),
        fetch('/api/admin/subscriptions', { headers }),
        fetch('/api/admin/reports', { headers }),
        fetch('/api/announcements/active'),
        fetch('/api/admin/firewall', { headers }),
        fetch('/api/admin/audit-logs', { headers }),
        fetch('/api/admin/team', { headers }),
        fetch('/api/admin/config', { headers }),
        fetch('/api/admin/support-tickets', { headers })
      ]);

      if (mRes.status === 'fulfilled' && mRes.value.ok) setMetrics((await mRes.value.json()).metrics);
      if (uRes.status === 'fulfilled' && uRes.value.ok) setUsers((await uRes.value.json()).users || []);
      if (sRes.status === 'fulfilled' && sRes.value.ok) setStudents((await sRes.value.json()).students || []);
      if (nRes.status === 'fulfilled' && nRes.value.ok) setNotes((await nRes.value.json()).notes || []);
      if (aiRes.status === 'fulfilled' && aiRes.value.ok) setAiConfig((await aiRes.value.json()).config);
      if (vRes.status === 'fulfilled' && vRes.value.ok) setVoiceChats((await vRes.value.json()).chats || []);
      if (fRes.status === 'fulfilled' && fRes.value.ok) {
        const fData = await fRes.value.json();
        setFiles(fData.files || []);
        setStorageStats({ usedMb: fData.totalStorageUsedMb, maxMb: fData.maxAllowedMb });
      }
      if (subRes.status === 'fulfilled' && subRes.value.ok) {
        const subData = await subRes.value.json();
        setSubscriptions(subData.plans || []);
        setMrr(subData.monthlyRecurringRevenue || 79.84);
      }
      if (repRes.status === 'fulfilled' && repRes.value.ok) setReports((await repRes.value.json()).reports || []);
      if (annRes.status === 'fulfilled' && annRes.value.ok) setAnnouncements((await annRes.value.json()).announcements || []);
      if (fwRes.status === 'fulfilled' && fwRes.value.ok) setFirewall((await fwRes.value.json()).firewall);
      if (logRes.status === 'fulfilled' && logRes.value.ok) setAuditLogs((await logRes.value.json()).logs || []);
      if (teamRes.status === 'fulfilled' && teamRes.value.ok) setTeam((await teamRes.value.json()).team || []);
      if (cfgRes.status === 'fulfilled' && cfgRes.value.ok) setAppConfig((await cfgRes.value.json()).config);
      if (tktRes.status === 'fulfilled' && tktRes.value.ok) setTickets((await tktRes.value.json()).tickets || []);
    } catch (e) {
      console.warn('Admin data load notice:', e);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (_) {}
    sessionStorage.removeItem('study_top_admin_authenticated');
    sessionStorage.removeItem('study_top_admin_key');
    setIsAuthorized(false);
    setAdminKey('');
    showFeedback('Super Admin session signed out.');
  };

  // Handle Section Switch
  const handleNavClick = (sectionId: AdminSection) => {
    if (sectionId === 'logout') {
      handleLogout();
    } else {
      setActiveTab(sectionId);
      setMobileMenuOpen(false);
    }
  };

  // Actions
  const handleUserAction = async (action: string, userId: string, targetEmail: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ action, userId, targetEmail })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message || `Action ${action} succeeded`);
        loadDashboardData();
      } else {
        showFeedback(data.error || 'Action failed');
      }
    } catch (_) {
      showFeedback('Network error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStudentAction = async (studentId: string, action: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/students/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ studentId, action, reason })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Student action applied`);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleNoteAction = async (noteId: string, action: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/notes/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ noteId, action, reason })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Note action applied`);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleUpdateAiConfig = async (updates: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('AI Assistant hyperparameter configuration saved!');
        setAiConfig(data.config);
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleDeleteFile = async (fileId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        }
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Storage file removed');
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleUpdatePlan = async (planId: string, updates: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/subscriptions/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ planId, ...updates })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Subscription tier limits updated');
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleResolveReport = async (reportId: string, resolution: 'resolved' | 'dismissed') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/reports/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ reportId, resolution })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Report marked as ${resolution}`);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handlePublishAnnouncement = async (title: string, content: string, priority: 'info' | 'important' | 'emergency') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ title, content, priority })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Announcement broadcasted to all active students!');
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        }
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Announcement removed');
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleToggleEmergency = async () => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/firewall/toggle-emergency', {
        method: 'POST',
        headers: {
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        }
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(data.message);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleBlockIp = async (ip: string, reason?: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/firewall/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ ip, reason })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`IP ${ip} blocked`);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleUnblockIp = async (ip: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/firewall/unblock-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ ip })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`IP ${ip} unblocked`);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleInviteStaff = async (name: string, email: string, role: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/team/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ name, email, role })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Invitation dispatched to ${email}`);
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleUpdateAppConfig = async (updates: any) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Study Top global application configuration saved!');
        setAppConfig(data.config);
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleReplyTicket = async (ticketId: string, reply: string) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/support-tickets/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          'Authorization': 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({ ticketId, reply })
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('Support resolution sent to student');
        loadDashboardData();
      }
    } catch (_) {}
    setActionLoading(false);
  };

  const handleExportData = (type: 'json' | 'csv') => {
    if (type === 'json') {
      const dump = {
        exportedAt: new Date().toISOString(),
        owner: 'Only Admin: Manjit Ranjan',
        platform: 'Study Top',
        metrics,
        users,
        students,
        notes,
        files,
        announcements,
        auditLogs
      };
      const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_top_admin_dump_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['ID', 'Action', 'Actor', 'Target', 'Details', 'IP', 'Status', 'Timestamp'];
      const rows = auditLogs.map(l => [
        l.id,
        l.action,
        `"${l.actor}"`,
        `"${l.target || ''}"`,
        `"${(l.details || '').replace(/"/g, '""')}"`,
        l.ip,
        l.status,
        new Date(l.timestamp).toISOString()
      ]);
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study_top_audit_logs_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    showFeedback(`Exported ${type.toUpperCase()} file`);
  };

  // If not authenticated
  if (!isAuthorized) {
    return (
      <AdminLoginPage
        onSuccess={(data) => {
          if (data.key) setAdminKey(data.key);
          setIsAuthorized(true);
          sessionStorage.setItem('study_top_admin_authenticated', 'true');
          if (data.key) sessionStorage.setItem('study_top_admin_key', data.key);
          loadDashboardData(data.key ? { 'x-admin-key': data.key } : undefined);
        }}
        onBackToApp={onClose}
      />
    );
  }

  const activeItem = navigationItems.find(i => i.id === activeTab) || navigationItems[0];

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col font-sans overflow-hidden transition-colors duration-300 ${
      darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      {/* ============================================================= */}
      {/* 1. TOP NAVIGATION BAR WITH BREADCRUMBS & SYSTEM CONTROLS      */}
      {/* ============================================================= */}
      <header className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between shrink-0 z-30 transition-colors ${
        darkMode ? 'bg-slate-900/90 border-slate-800' : 'bg-white/95 border-slate-200/80 shadow-xs'
      } backdrop-blur-xl`}>
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-600 to-indigo-600 flex items-center justify-center shadow-md shadow-rose-950/20 shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight flex items-center gap-1.5 text-slate-900 dark:text-white">
                <span>Study Top</span>
                <span className="text-slate-400 font-light">/</span>
                <span className="text-indigo-600 dark:text-indigo-400">Admin</span>
              </h1>
              {/* MANDATORY OWNER LABEL */}
              <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                Only Admin: Manjit Ranjan
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              Smart Notes Making Platform · Created by Manjit Ranjan (Google Developer)
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Emergency Lockdown Status Indicator */}
          {firewall?.emergencyLockdown && (
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500 text-rose-600 dark:text-rose-300 text-xs font-black animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5" />
              LOCKDOWN ACTIVE
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
            }`}
            title={darkMode ? 'Switch to Colourful Light Theme' : 'Switch to Dark Mode'}
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Refresh Data */}
          <button
            onClick={() => {
              loadDashboardData();
              showFeedback('Refreshed all platform telemetry');
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
            title="Refresh All Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Exit / Back to App */}
          <button
            onClick={onClose}
            className={`py-2 px-3.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              darkMode 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Back to App</span>
          </button>
        </div>
      </header>

      {/* Feedback Toast */}
      <AnimatePresence>
        {feedbackMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-2.5 rounded-2xl text-xs font-bold shadow-2xl z-50 flex items-center gap-2 border border-indigo-400/40"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{feedbackMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* ============================================================= */}
        {/* 2. SIDEBAR NAVIGATION (20 Working Sections)                   */}
        {/* ============================================================= */}
        <aside className={`hidden md:flex flex-col shrink-0 border-r transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } ${
          darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
        }`}>
          {/* Quick Filter Search inside Sidebar */}
          {!sidebarCollapsed && (
            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchNav}
                  onChange={(e) => setSearchNav(e.target.value)}
                  placeholder="Filter 20 sections..."
                  className={`w-full pl-8 pr-2.5 py-1.5 rounded-xl text-xs font-bold outline-none border ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>
            </div>
          )}

          {/* Navigation Items List */}
          <nav className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {navigationItems
              .filter(item => !searchNav || item.label.toLowerCase().includes(searchNav.toLowerCase()))
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                const isLogout = item.id === 'logout';

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    title={sidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-indigo-500/20 font-black' 
                        : isLogout
                        ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        : darkMode 
                        ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : isLogout ? 'text-rose-500' : 'text-slate-400'}`} />
                    {!sidebarCollapsed && (
                      <span className="truncate text-left flex-1">{item.label}</span>
                    )}
                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
          </nav>

          {/* Sidebar Footer with Collapse Toggle */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-black uppercase text-slate-400">
                20 Modules
              </span>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 cursor-pointer mx-auto"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 md:hidden flex">
              <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-xs"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.div
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                className={`relative w-72 max-w-[85vw] h-full flex flex-col p-4 shadow-2xl ${
                  darkMode ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-500" />
                    <span className="font-black text-sm">Study Top Admin</span>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-xl text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <nav className="flex-1 overflow-y-auto space-y-1">
                  {navigationItems.map(item => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                          isActive 
                            ? 'bg-indigo-600 text-white' 
                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate text-left flex-1">{item.label}</span>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ============================================================= */}
        {/* 3. MAIN DASHBOARD CONTENT AREA                                */}
        {/* ============================================================= */}
        <main className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 custom-scrollbar transition-colors ${
          darkMode ? 'bg-slate-950' : 'bg-slate-50'
        }`}>
          {/* Breadcrumb Navigation on Top of Every Page */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Study Top Admin</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-500">{activeItem.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 dark:text-indigo-400 font-black">{activeItem.label}</span>
          </div>

          {/* RENDER ALL 20 SECTIONS */}
          {activeTab === 'overview' && (
            <OverviewSection
              metrics={metrics}
              users={users}
              voiceChats={voiceChats}
              firewall={firewall}
              onNavigate={(s) => setActiveTab(s)}
              onToggleEmergency={handleToggleEmergency}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'users' && (
            <UserManagementSection
              users={users}
              onUserAction={handleUserAction}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'students' && (
            <StudentAccountsSection
              students={students}
              onStudentAction={handleStudentAction}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'notes' && (
            <NotesManagementSection
              notes={notes}
              onNoteAction={handleNoteAction}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'ai_assistant' && (
            <AiAssistantSection
              config={aiConfig}
              voiceChats={voiceChats}
              onUpdateConfig={handleUpdateAiConfig}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'files' && (
            <FileManagementSection
              files={files}
              totalStorageUsedMb={storageStats.usedMb}
              maxAllowedMb={storageStats.maxMb}
              onDeleteFile={handleDeleteFile}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionSection
              plans={subscriptions}
              monthlyRecurringRevenue={mrr}
              totalSubscribedUsers={users.length}
              onUpdatePlan={handleUpdatePlan}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'moderation' && (
            <ModerationSection
              reports={reports}
              bannedWords={bannedWords}
              onAddBannedWord={(w) => setBannedWords([...bannedWords, w])}
              onRemoveBannedWord={(w) => setBannedWords(bannedWords.filter(item => item !== w))}
              onResolveReport={handleResolveReport}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementsSection
              announcements={announcements}
              onPublishAnnouncement={handlePublishAnnouncement}
              onDeleteAnnouncement={handleDeleteAnnouncement}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsSection
              darkMode={darkMode}
            />
          )}

          {activeTab === 'security' && (
            <SecuritySection
              firewall={firewall}
              onToggleEmergency={handleToggleEmergency}
              onBlockIp={handleBlockIp}
              onUnblockIp={handleUnblockIp}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogsSection
              logs={auditLogs}
              onExport={handleExportData}
              onRefresh={loadDashboardData}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'team' && (
            <AdminTeamSection
              team={team}
              creatorName="Manjit Ranjan (Google Developer)"
              onInvite={handleInviteStaff}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'app_config' && (
            <AppConfigSection
              config={appConfig}
              onUpdateConfig={handleUpdateAppConfig}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'integrations' && (
            <IntegrationsSection
              darkMode={darkMode}
            />
          )}

          {activeTab === 'backups' && (
            <BackupSection
              darkMode={darkMode}
            />
          )}

          {activeTab === 'system_health' && (
            <SystemHealthSection
              darkMode={darkMode}
            />
          )}

          {activeTab === 'support_tickets' && (
            <SupportTicketsSection
              tickets={tickets}
              onReplyTicket={handleReplyTicket}
              actionLoading={actionLoading}
              darkMode={darkMode}
            />
          )}

          {activeTab === 'profile' && (
            <AdminProfileSection
              onLogout={handleLogout}
              darkMode={darkMode}
            />
          )}
        </main>
      </div>
    </div>
  );
};
