import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Download,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Eye,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Clock,
  Globe,
  Mail,
  User,
  FileText,
  Award,
  X,
  RefreshCw,
  LogOut,
  LogIn,
  UserPlus,
  Activity,
  AtSign,
  Flame,
  Loader2,
  Printer
} from 'lucide-react';

interface UserManagementSectionProps {
  users: any[];
  loginActivity?: any[];
  onUserAction: (action: string, userId: string, targetEmail: string, extra?: any) => void;
  actionLoading: boolean;
  darkMode: boolean;
  adminKey?: string;
  onRefresh?: () => void;
}

type ColumnKey =
  | 'uid'
  | 'displayName'
  | 'username'
  | 'email'
  | 'role'
  | 'loginMethod'
  | 'createdAt'
  | 'lastLogin'
  | 'lastLogout'
  | 'status'
  | 'learningPoints'
  | 'totalStudyHours'
  | 'achievementsCount'
  | 'deletionStatus'
  | 'loginCount'
  | 'emailVerified'
  | 'lastActivity';

const LOGIN_RECORDS_COLUMNS: Array<{ key: ColumnKey; label: string }> = [
  { key: 'uid', label: 'User ID' },
  { key: 'displayName', label: 'Full Name & Avatar' },
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role' },
  { key: 'loginMethod', label: 'Account Type' },
  { key: 'createdAt', label: 'Registration Date' },
  { key: 'lastLogin', label: 'Last Login' },
  { key: 'lastLogout', label: 'Last Logout' },
  { key: 'status', label: 'Account Status' },
  { key: 'learningPoints', label: 'Learning Points' },
  { key: 'totalStudyHours', label: 'Study Hours' },
  { key: 'achievementsCount', label: 'Achievements' },
  { key: 'deletionStatus', label: 'Deletion Status' },
  { key: 'loginCount', label: 'Login Count' },
  { key: 'emailVerified', label: 'Email Verified' },
  { key: 'lastActivity', label: 'Last Activity' }
];

export const UserManagementSection: React.FC<UserManagementSectionProps> = ({
  users,
  loginActivity = [],
  onUserAction,
  actionLoading,
  darkMode,
  adminKey = '',
  onRefresh
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<'ALL' | '24H' | '7D' | '30D'>('ALL');

  // Sorting (supports Learning Points, Most Recent Login, Registration Date, Login Count, Name)
  const [sortField, setSortField] = useState<
    'createdAt' | 'lastLogin' | 'lastLogout' | 'loginCount' | 'learningPoints' | 'totalStudyHours' | 'displayName'
  >('lastLogin');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Column Selector
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
    uid: true,
    displayName: true,
    username: true,
    email: true,
    role: true,
    loginMethod: true,
    createdAt: true,
    lastLogin: true,
    lastLogout: true,
    status: true,
    learningPoints: true,
    totalStudyHours: true,
    achievementsCount: true,
    deletionStatus: true,
    loginCount: true,
    emailVerified: true,
    lastActivity: true
  });

  // Bulk Selection
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [bulkStatusMsg, setBulkStatusMsg] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Individual User Details Modal
  const [selectedProfileUser, setSelectedProfileUser] = useState<any | null>(null);

  // Automatic Professional Admin PDF Report Generator Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfFilterScope, setPdfFilterScope] = useState<
    'all' | 'individual' | 'selected' | 'new_registrations' | 'active' | 'deleted_anonymized' | 'date_range'
  >('all');
  const [pdfIndividualUid, setPdfIndividualUid] = useState<string>('');
  const [pdfReportTitle, setPdfReportTitle] = useState('Study Top Official User & Leaderboard Administration Report');
  const [pdfStartDate, setPdfStartDate] = useState('');
  const [pdfEndDate, setPdfEndDate] = useState('');
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);

  const normalizeRole = (u: any): 'Student' | 'Guest' | 'Admin' => {
    if (u.role === 'super_admin' || u.role === 'Admin') return 'Admin';
    if (u.role === 'Guest' || u.loginMethod === 'Guest' || u.login_provider === 'Guest') return 'Guest';
    return 'Student';
  };

  const normalizeMethod = (u: any): 'Google' | 'Email' | 'Guest' => {
    const m = u.login_provider || u.loginMethod || u.accountType;
    if (m === 'Google' || m === 'Email' || m === 'Guest') {
      return m;
    }
    if (u.role === 'Guest' || !u.email) return 'Guest';
    return 'Email';
  };

  const normalizeStatus = (u: any): 'Active' | 'Suspended' | 'Deleted' => {
    if (u.deletionStatus && u.deletionStatus !== 'active') return 'Deleted';
    const s = (u.account_status || u.status || 'active').toString().toLowerCase();
    return s === 'suspended' || s === 'disabled' ? 'Suspended' : 'Active';
  };

  const normalizeEmailVerified = (u: any): 'Yes' | 'No' => {
    if (u.email_verified === 'Yes' || u.emailVerified === true) return 'Yes';
    return 'No';
  };

  // Top Summary KPIs (Derived strictly from actual user records)
  const summaryStats = useMemo(() => {
    const now = Date.now();
    const sevenDaysMs = 7 * 86400000;
    const totalRegisteredUsers = users.length;
    const activeUsers = users.filter(u => normalizeStatus(u) === 'Active').length;
    const guestUsers = users.filter(u => normalizeRole(u) === 'Guest').length;
    const newRegistrations = users.filter(u => now - Number(u.created_at || u.createdAt || now) <= sevenDaysMs).length;
    const totalPoints = users.reduce((sum, u) => sum + Number(u.learningPoints || 0), 0);
    return {
      totalRegisteredUsers,
      activeUsers,
      guestUsers,
      newRegistrations,
      totalPoints
    };
  }, [users]);

  // Filtered & Sorted Users
  const filteredUsers = useMemo(() => {
    const now = Date.now();
    return users
      .filter(u => {
        const roleLabel = normalizeRole(u);
        const methodLabel = normalizeMethod(u);
        const statusLabel = normalizeStatus(u).toLowerCase();
        const createdTs = Number(u.created_at || u.createdAt || now);

        if (roleFilter !== 'ALL' && roleLabel !== roleFilter) return false;
        if (methodFilter !== 'ALL' && methodLabel !== methodFilter) return false;
        if (statusFilter !== 'ALL' && statusLabel !== statusFilter.toLowerCase()) return false;

        if (dateRangeFilter === '24H' && now - createdTs > 86400000) return false;
        if (dateRangeFilter === '7D' && now - createdTs > 7 * 86400000) return false;
        if (dateRangeFilter === '30D' && now - createdTs > 30 * 86400000) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().replace(/^@/, '');
          const matchUid = (u.uid || '').toLowerCase().includes(q) || (u.studyTopId || '').toLowerCase().includes(q);
          const matchName = (u.full_name || u.displayName || '').toLowerCase().includes(q);
          const matchUsername = (u.username || '').toLowerCase().includes(q);
          const matchEmail = (u.email || '').toLowerCase().includes(q);
          const matchActivity = String(u.lastActivity || '').toLowerCase().includes(q);
          return matchUid || matchName || matchUsername || matchEmail || matchActivity;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (sortField === 'displayName') {
          return (a.full_name || a.displayName || '').localeCompare(b.full_name || b.displayName || '') * dir;
        }
        if (sortField === 'lastLogout') {
          const valA = Number(a.last_logout_at || a.lastLogout || 0);
          const valB = Number(b.last_logout_at || b.lastLogout || 0);
          return (valA - valB) * dir;
        }
        const valA = Number(a[sortField] || 0);
        const valB = Number(b[sortField] || 0);
        return (valA - valB) * dir;
      });
  }, [users, searchQuery, roleFilter, methodFilter, statusFilter, dateRangeFilter, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (
    field: 'createdAt' | 'lastLogin' | 'lastLogout' | 'loginCount' | 'learningPoints' | 'totalStudyHours' | 'displayName'
  ) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === paginatedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(paginatedUsers.map(u => u.uid));
    }
  };

  const toggleSelectRow = (uid: string) => {
    setSelectedUserIds(prev => (prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]));
  };

  // Bulk Action Execution
  const handleBulkAction = async (action: 'suspend' | 'activate' | 'disable' | 'verify_email' | 'delete') => {
    if (selectedUserIds.length === 0) return;
    try {
      const res = await fetch('/api/admin/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          Authorization: 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          userIds: selectedUserIds,
          action,
          reason: 'Bulk administrative operation on Login Records'
        })
      });
      const data = await res.json();
      if (data.success) {
        setBulkStatusMsg(data.message);
        setSelectedUserIds([]);
        onRefresh?.();
        setTimeout(() => setBulkStatusMsg(null), 3500);
      }
    } catch (_) {}
  };

  const formatDateTime = (ts?: number | null) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Export CSV (All filtered or Selected users — strictly excludes passwords/tokens)
  const exportUsersCsv = (onlySelected = false) => {
    const rowsToExport = onlySelected
      ? filteredUsers.filter(u => selectedUserIds.includes(u.uid))
      : filteredUsers;

    const headers = [
      'User ID',
      'Study Top ID',
      'Full Name',
      'Username',
      'Email',
      'Role',
      'Account Type',
      'Registration Date',
      'Last Login',
      'Last Logout',
      'Account Status',
      'Deletion Status',
      'Learning Points',
      'Total Study Hours',
      'Achievements Unlocked',
      'Login Count',
      'Email Verified',
      'Last Activity'
    ];
    const rows = rowsToExport.map(u => [
      u.uid,
      u.studyTopId || u.uid,
      `"${(u.full_name || u.displayName || '').replace(/"/g, '""')}"`,
      `"@${u.username || ''}"`,
      `"${u.email || ''}"`,
      normalizeRole(u),
      normalizeMethod(u),
      `"${formatDateTime(u.created_at || u.createdAt)}"`,
      `"${formatDateTime(u.last_login_at || u.lastLogin)}"`,
      `"${formatDateTime(u.last_logout_at || u.lastLogout)}"`,
      normalizeStatus(u),
      u.deletionStatus || 'active',
      u.learningPoints || 0,
      u.totalStudyHours || 0,
      u.achievementsCount || 0,
      u.login_count || u.loginCount || 1,
      normalizeEmailVerified(u),
      `"${(u.lastActivity || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `study_top_user_records_${onlySelected ? 'selected_' : ''}${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Backend PDF Report Generator Handler
  const handleGeneratePdfReport = async () => {
    setPdfGenerating(true);
    setPdfProgress(20);
    const progTimer = setInterval(() => {
      setPdfProgress(prev => (prev < 85 ? prev + 15 : prev));
    }, 220);

    try {
      const targetUids =
        pdfFilterScope === 'individual'
          ? [pdfIndividualUid || users[0]?.uid].filter(Boolean)
          : pdfFilterScope === 'selected'
          ? selectedUserIds
          : [];

      const res = await fetch('/api/admin/reports/users-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': 'manjitranjan180513@gmail.com',
          Authorization: 'Bearer manjitranjan180513@gmail.com',
          'x-admin-key': adminKey
        },
        body: JSON.stringify({
          reportTitle: pdfReportTitle,
          filterScope: pdfFilterScope,
          selectedUids: targetUids,
          startDate: pdfStartDate ? new Date(pdfStartDate).getTime() : undefined,
          endDate: pdfEndDate ? new Date(pdfEndDate).getTime() + 86399999 : undefined
        })
      });

      const data = await res.json();
      clearInterval(progTimer);
      setPdfProgress(100);

      if (data.success && data.pdfBase64) {
        const byteCharacters = atob(data.pdfBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.fileName || 'StudyTop_Admin_Users_Report.pdf';
        link.click();
        URL.revokeObjectURL(url);

        setBulkStatusMsg(`Official PDF Report (${data.recordsCount} records) generated and downloaded!`);
        setTimeout(() => {
          setShowPdfModal(false);
          setPdfGenerating(false);
          setPdfProgress(0);
        }, 600);
        setTimeout(() => setBulkStatusMsg(null), 4000);
      } else {
        setBulkStatusMsg(data.error || 'Failed to generate PDF report.');
        setPdfGenerating(false);
        setPdfProgress(0);
      }
    } catch (err: any) {
      clearInterval(progTimer);
      setPdfGenerating(false);
      setPdfProgress(0);
      setBulkStatusMsg('Network error while generating PDF report.');
    }
  };

  const cardSurface = darkMode
    ? 'bg-slate-900 border-slate-800 text-white'
    : 'bg-white border-slate-200/90 text-slate-900 shadow-xs';

  return (
    <div className="space-y-6">
      {/* Top Header & Export Actions */}
      <div className={`p-5 rounded-3xl border ${cardSurface}`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Dashboard → User Management → Identity, @Usernames &amp; Login Records</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Users className="w-6 h-6 text-indigo-600" />
              <span>Study Top 3.0 User Identity &amp; Leaderboard Directory ({filteredUsers.length})</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Complete user database with @usernames, learning points, study hours, achievements, login records, and backend PDF report generation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Live</span>
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(prev => !prev)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Columns</span>
              </button>

              {showColumnSelector && (
                <div
                  className={`absolute right-0 mt-2 w-60 p-3 rounded-2xl border shadow-2xl z-30 max-h-80 overflow-y-auto ${
                    darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  <div className="text-[11px] font-black uppercase text-slate-400 mb-2">Visible Columns</div>
                  <div className="space-y-1.5">
                    {LOGIN_RECORDS_COLUMNS.map(col => (
                      <label key={col.key} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[col.key]}
                          onChange={() =>
                            setVisibleColumns(prev => ({
                              ...prev,
                              [col.key]: !prev[col.key]
                            }))
                          }
                          className="rounded border-slate-300"
                        />
                        <span>{col.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowPdfModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export Official PDF Report</span>
            </button>

            <button
              onClick={() => exportUsersCsv(false)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredUsers.length})</span>
            </button>
          </div>
        </div>

        {/* 5 Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-200/70 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-blue-500/5 border border-blue-500/15">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Total Registered</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-600 mt-1 tabular-nums">{summaryStats.totalRegisteredUsers}</div>
            <div className="text-[11px] text-slate-400">Permanent Study Top IDs</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Active Accounts</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1 tabular-nums">{summaryStats.activeUsers}</div>
            <div className="text-[11px] text-slate-400">Verified active status</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Guest Accounts</span>
              <User className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1 tabular-nums">{summaryStats.guestUsers}</div>
            <div className="text-[11px] text-slate-400">Upgradable to Permanent</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/15">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>New Signups (7d)</span>
              <UserPlus className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1 tabular-nums">+{summaryStats.newRegistrations}</div>
            <div className="text-[11px] text-slate-400">Created in last 7 days</div>
          </div>

          <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/15">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>Total Learning Points</span>
              <Award className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-purple-600 mt-1 tabular-nums">
              {summaryStats.totalPoints.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">Verified backend points</div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-slate-200/70 dark:border-slate-800">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Name, @username, Email, or User ID..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl border text-xs font-medium outline-none ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">Role: All Roles</option>
            <option value="Student">Student</option>
            <option value="Guest">Guest</option>
            <option value="Admin">Admin</option>
          </select>

          <select
            value={methodFilter}
            onChange={e => {
              setMethodFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">Account Type: All</option>
            <option value="Google">Google</option>
            <option value="Email">Email</option>
            <option value="Guest">Guest</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">Status: All</option>
            <option value="Active">Active</option>
            <option value="Suspended">Suspended</option>
            <option value="Deleted">Deleted / Anonymized</option>
          </select>

          <select
            value={sortField}
            onChange={e => {
              setSortField(e.target.value as any);
              setSortDirection('desc');
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-bold outline-none ${
              darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="lastLogin">Sort: Most Recent Login</option>
            <option value="learningPoints">Sort: Learning Points</option>
            <option value="totalStudyHours">Sort: Total Study Hours</option>
            <option value="createdAt">Sort: Registration Date</option>
            <option value="loginCount">Sort: Login Count</option>
          </select>
        </div>

        {/* Bulk Action Toolbar */}
        {selectedUserIds.length > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-indigo-600 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-black">
              {selectedUserIds.length} User Record(s) Selected
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setPdfFilterScope('selected');
                  setShowPdfModal(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white text-indigo-950 hover:bg-indigo-50 text-xs font-black cursor-pointer"
              >
                Export Selected as PDF
              </button>
              <button
                onClick={() => exportUsersCsv(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-xs font-black cursor-pointer"
              >
                Export Selected CSV
              </button>
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-black cursor-pointer"
              >
                Activate Selected
              </button>
              <button
                onClick={() => handleBulkAction('suspend')}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black cursor-pointer"
              >
                Suspend Selected
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-xs font-black cursor-pointer"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedUserIds([])}
                className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-bold cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {bulkStatusMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 text-xs font-bold">
            {bulkStatusMsg}
          </div>
        )}
      </div>

      {/* Main User Management Spreadsheet Table */}
      <div className={`rounded-3xl border overflow-hidden ${cardSurface}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className={`border-b text-[11px] font-black uppercase tracking-wider ${
                  darkMode ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                <th className="p-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 cursor-pointer"
                  />
                </th>
                {visibleColumns.uid && <th className="p-3.5 whitespace-nowrap">User ID</th>}
                {visibleColumns.displayName && (
                  <th
                    onClick={() => toggleSort('displayName')}
                    className="p-3.5 whitespace-nowrap cursor-pointer hover:text-indigo-600"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Full Name</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.username && <th className="p-3.5 whitespace-nowrap">Username</th>}
                {visibleColumns.email && <th className="p-3.5 whitespace-nowrap">Email</th>}
                {visibleColumns.role && <th className="p-3.5 whitespace-nowrap">Role</th>}
                {visibleColumns.loginMethod && <th className="p-3.5 whitespace-nowrap">Account Type</th>}
                {visibleColumns.learningPoints && (
                  <th
                    onClick={() => toggleSort('learningPoints')}
                    className="p-3.5 whitespace-nowrap cursor-pointer hover:text-indigo-600"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Learning Points</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.totalStudyHours && (
                  <th
                    onClick={() => toggleSort('totalStudyHours')}
                    className="p-3.5 whitespace-nowrap cursor-pointer hover:text-indigo-600"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Study Hours</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.achievementsCount && <th className="p-3.5 whitespace-nowrap">Achievements</th>}
                {visibleColumns.createdAt && (
                  <th
                    onClick={() => toggleSort('createdAt')}
                    className="p-3.5 whitespace-nowrap cursor-pointer hover:text-indigo-600"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Registration Date</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.lastLogin && (
                  <th
                    onClick={() => toggleSort('lastLogin')}
                    className="p-3.5 whitespace-nowrap cursor-pointer hover:text-indigo-600"
                  >
                    <div className="inline-flex items-center gap-1">
                      <span>Last Login</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                )}
                {visibleColumns.status && <th className="p-3.5 whitespace-nowrap">Account Status</th>}
                {visibleColumns.deletionStatus && <th className="p-3.5 whitespace-nowrap">Deletion Status</th>}
                <th className="p-3.5 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={16} className="p-8 text-center text-slate-400 font-semibold">
                    No user records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map(u => {
                  const isRootAdmin = u.email === 'manjitranjan180513@gmail.com' || u.role === 'super_admin';
                  const roleLabel = normalizeRole(u);
                  const methodLabel = normalizeMethod(u);
                  const statusLabel = normalizeStatus(u);

                  return (
                    <tr
                      key={u.uid}
                      className={`transition-colors ${
                        darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50/90'
                      }`}
                    >
                      <td className="p-3.5">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(u.uid)}
                          onChange={() => toggleSelectRow(u.uid)}
                          disabled={isRootAdmin}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </td>

                      {visibleColumns.uid && (
                        <td className="p-3.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                          <div>{u.studyTopId || u.uid}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{u.uid}</div>
                        </td>
                      )}

                      {visibleColumns.displayName && (
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={u.full_name || u.displayName}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                                {(u.full_name || u.displayName || 'S').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="font-black">{u.full_name || u.displayName}</div>
                              {u.school && <div className="text-[10px] text-slate-400">{u.school}</div>}
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.username && (
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            @{u.username || 'scholar'}
                          </span>
                        </td>
                      )}

                      {visibleColumns.email && (
                        <td className="p-3.5 whitespace-nowrap">
                          {u.email ? (
                            <span className="font-medium">{u.email}</span>
                          ) : (
                            <span className="italic text-slate-400">Guest Account</span>
                          )}
                        </td>
                      )}

                      {visibleColumns.role && (
                        <td className="p-3.5 whitespace-nowrap font-bold">
                          {roleLabel}
                        </td>
                      )}

                      {visibleColumns.loginMethod && (
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 font-bold">
                            {methodLabel === 'Google' && <Globe className="w-3 h-3 text-blue-500" />}
                            {methodLabel === 'Email' && <Mail className="w-3 h-3 text-violet-500" />}
                            {methodLabel === 'Guest' && <User className="w-3 h-3 text-slate-500" />}
                            <span>{methodLabel}</span>
                          </span>
                        </td>
                      )}

                      {visibleColumns.learningPoints && (
                        <td className="p-3.5 whitespace-nowrap font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                          {(u.learningPoints || 0).toLocaleString()} pts
                        </td>
                      )}

                      {visibleColumns.totalStudyHours && (
                        <td className="p-3.5 whitespace-nowrap font-mono font-bold tabular-nums">
                          {u.totalStudyHours || 0} hrs
                        </td>
                      )}

                      {visibleColumns.achievementsCount && (
                        <td className="p-3.5 whitespace-nowrap font-bold tabular-nums">
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <Award className="w-3.5 h-3.5" />
                            <span>{u.achievementsCount || 0} badges</span>
                          </span>
                        </td>
                      )}

                      {visibleColumns.createdAt && (
                        <td className="p-3.5 whitespace-nowrap text-slate-500 tabular-nums">
                          {formatDateTime(u.created_at || u.createdAt)}
                        </td>
                      )}

                      {visibleColumns.lastLogin && (
                        <td className="p-3.5 whitespace-nowrap text-slate-500 tabular-nums">
                          {formatDateTime(u.last_login_at || u.lastLogin)}
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="p-3.5 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              statusLabel === 'Active'
                                ? 'text-emerald-600'
                                : statusLabel === 'Deleted'
                                ? 'text-slate-400'
                                : 'text-amber-600'
                            }`}
                          >
                            {statusLabel === 'Active' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <ShieldAlert className="w-3.5 h-3.5" />
                            )}
                            <span>{statusLabel}</span>
                          </span>
                        </td>
                      )}

                      {visibleColumns.deletionStatus && (
                        <td className="p-3.5 whitespace-nowrap text-[11px] font-bold">
                          {u.deletionStatus && u.deletionStatus !== 'active' ? (
                            <span className="text-rose-600">Deleted / Anonymized</span>
                          ) : (
                            <span className="text-emerald-600">Active Profile</span>
                          )}
                        </td>
                      )}

                      <td className="p-3.5 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => setSelectedProfileUser(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 font-bold flex items-center gap-1 cursor-pointer"
                            title="View Full Profile & Login History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>

                          <button
                            onClick={() => {
                              setPdfFilterScope('individual');
                              setPdfIndividualUid(u.uid);
                              setShowPdfModal(true);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 font-bold cursor-pointer"
                            title="Export Individual PDF Report"
                          >
                            PDF
                          </button>

                          {!isRootAdmin && (
                            <>
                              {statusLabel === 'Active' ? (
                                <button
                                  onClick={() => onUserAction('suspend', u.uid, u.email)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold cursor-pointer"
                                >
                                  Suspend
                                </button>
                              ) : (
                                <button
                                  onClick={() => onUserAction('activate', u.uid, u.email)}
                                  disabled={actionLoading}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold cursor-pointer"
                                >
                                  Activate
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div
          className={`p-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
            darkMode ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/60'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold text-slate-500">
            <span>
              Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredUsers.length)} of{' '}
              {filteredUsers.length} records
            </span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className={`px-2 py-1 rounded-lg border font-bold ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-black px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Automatic Professional Admin PDF Report Generator Modal */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl space-y-5 ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-[11px] font-black uppercase text-blue-600 tracking-wider">
                  Study Top Official PDF Engine
                </div>
                <h3 className="text-lg font-black mt-0.5">Generate Branded Admin PDF Report</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Includes Executive Cover Page, Study Top Logo on every page, Analytics Summary, Top Leaderboard Chart, and User Table.
                </p>
              </div>
              <button
                onClick={() => !pdfGenerating && setShowPdfModal(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-black uppercase text-slate-500 mb-1">Report Title</label>
                <input
                  type="text"
                  value={pdfReportTitle}
                  onChange={e => setPdfReportTitle(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block font-black uppercase text-slate-500 mb-1">Select Report Scope</label>
                <select
                  value={pdfFilterScope}
                  onChange={e => setPdfFilterScope(e.target.value as any)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  <option value="all">All Users ({users.length} records)</option>
                  <option value="individual">Individual User</option>
                  <option value="selected">Selected Users ({selectedUserIds.length} selected)</option>
                  <option value="new_registrations">New Registrations (Last 7 Days)</option>
                  <option value="active">Active Accounts Only</option>
                  <option value="deleted_anonymized">Deleted / Anonymized Accounts</option>
                  <option value="date_range">Custom Registration Date Range</option>
                </select>
              </div>

              {pdfFilterScope === 'individual' && (
                <div>
                  <label className="block font-black uppercase text-slate-500 mb-1">Choose Individual User</label>
                  <select
                    value={pdfIndividualUid}
                    onChange={e => setPdfIndividualUid(e.target.value)}
                    className={`w-full px-3.5 py-2.5 rounded-xl border font-bold outline-none ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    {users.map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.full_name || u.displayName} (@{u.username || 'scholar'}) — {u.email || 'Guest'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {pdfFilterScope === 'date_range' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black uppercase text-slate-500 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={pdfStartDate}
                      onChange={e => setPdfStartDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-bold ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-black uppercase text-slate-500 mb-1">End Date</label>
                    <input
                      type="date"
                      value={pdfEndDate}
                      onChange={e => setPdfEndDate(e.target.value)}
                      className={`w-full px-3 py-2 rounded-xl border font-bold ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
                      }`}
                    />
                  </div>
                </div>
              )}

              {pdfGenerating && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                  <div className="flex items-center justify-between font-bold text-blue-600">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Official Study Top PDF on Backend...</span>
                    </span>
                    <span className="font-mono tabular-nums">{pdfProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-200"
                      style={{ width: `${pdfProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowPdfModal(false)}
                disabled={pdfGenerating}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleGeneratePdfReport}
                disabled={pdfGenerating}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-lg"
              >
                {pdfGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>{pdfGenerating ? 'Rendering PDF...' : 'Generate & Download PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual User Profile Modal */}
      {selectedProfileUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-3xl rounded-3xl border p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-indigo-600">
                  {selectedProfileUser.studyTopId || selectedProfileUser.uid}
                </span>
                <h3 className="text-xl font-black mt-1">
                  {selectedProfileUser.full_name || selectedProfileUser.displayName} (@
                  {selectedProfileUser.username || 'scholar'})
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedProfileUser.email || 'Guest Account (No Registered Email)'} · Public URL:{' '}
                  <span className="font-mono text-blue-600">
                    studytop.app/@{selectedProfileUser.username || 'scholar'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProfileUser(null)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60">
                <div className="text-slate-400 font-bold">Learning Points</div>
                <div className="font-black text-base text-indigo-600 mt-0.5 tabular-nums">
                  {selectedProfileUser.learningPoints || 0} pts
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60">
                <div className="text-slate-400 font-bold">Study Hours</div>
                <div className="font-black text-base mt-0.5 tabular-nums">
                  {selectedProfileUser.totalStudyHours || 0} hrs
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60">
                <div className="text-slate-400 font-bold">Achievements</div>
                <div className="font-black text-base text-amber-600 mt-0.5 tabular-nums">
                  {selectedProfileUser.achievementsCount || 0} Unlocked
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60">
                <div className="text-slate-400 font-bold">Login Count</div>
                <div className="font-black text-base mt-0.5 tabular-nums">
                  {selectedProfileUser.login_count || selectedProfileUser.loginCount || 1} Sessions
                </div>
              </div>
            </div>

            {/* Login History Table */}
            <div className="mb-5">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Account Login &amp; Activity History</span>
              </h4>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className={darkMode ? 'bg-slate-950 text-slate-400' : 'bg-slate-50 text-slate-500'}>
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Event</th>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Device</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {(selectedProfileUser.loginHistory || []).map((lh: any) => (
                      <tr key={lh.id}>
                        <td className="p-2.5 font-mono text-[11px] tabular-nums">{formatDateTime(lh.timestamp)}</td>
                        <td className="p-2.5 font-bold">{lh.eventType || 'SIGN_IN'}</td>
                        <td className="p-2.5 font-bold">{lh.method}</td>
                        <td className="p-2.5 text-slate-500">{lh.device}</td>
                        <td className="p-2.5 font-bold text-emerald-600">{lh.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
