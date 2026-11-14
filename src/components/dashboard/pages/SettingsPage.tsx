import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sun,
  Bell,
  Sparkles,
  ShieldCheck,
  Check,
  Trash2,
  Lock,
  Download,
  LogOut,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  User,
  AtSign,
  X,
  Loader2,
  Mail
} from 'lucide-react';

interface SettingsPageProps {
  user?: any;
  language?: string;
  onSelectLanguage?: () => void;
  onSignOut?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  user,
  language = 'English',
  onSelectLanguage,
  onSignOut
}) => {
  const currentUid = user?.uid || 'USR-ADMIN-MANJIT-01';

  const [profile, setProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loginHistory, setLoginHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable Account Settings
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameStatus, setUsernameStatus] = useState<{ available: boolean; reason?: string }>({
    available: true
  });

  // Notification Preferences
  const [notifPrefs, setNotifPrefs] = useState({
    accountEvents: true,
    achievements: true,
    leaderboardChanges: true,
    weeklySummaries: true,
    streakMilestones: true,
    securityEvents: true
  });

  // Study Top 4.0 Email Notification Preferences (email_preferences table)
  const [emailPrefs, setEmailPrefs] = useState({
    welcome_email_enabled: true,
    login_alert_enabled: true,
    logout_email_enabled: true,
    security_alert_enabled: true
  });
  const [emailHistory, setEmailHistory] = useState<any[]>([]);

  // Privacy Settings
  const [privacyPrefs, setPrivacyPrefs] = useState({
    profileVisibility: 'public' as 'public' | 'private',
    showOnLeaderboard: true,
    showStudyStats: true,
    showAchievements: true
  });

  const [statusBanner, setStatusBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // 10-Step Permanent Account Deletion Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm_form' | 'deleted_receipt'>('confirm_form');
  const [reAuthEmail, setReAuthEmail] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deletionReceipt, setDeletionReceipt] = useState<any>(null);

  const loadAccountData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/account/profile/${encodeURIComponent(currentUid)}`);
      const data = await res.json();
      if (data.success && data.profile) {
        setProfile(data.profile);
        setFullName(data.profile.fullName || '');
        setUsername(data.profile.username || '');
        setNotifications(data.notifications || []);
        setLoginHistory(data.loginHistory || []);
        if (data.profile.notificationPrefs) {
          setNotifPrefs(data.profile.notificationPrefs);
        }
        if (data.profile.privacy) {
          setPrivacyPrefs(data.profile.privacy);
        }
      }
      const userEmailParam = encodeURIComponent(user?.email || data?.profile?.email || '');
      const [epRes, ehRes] = await Promise.all([
        fetch(`/api/account/email-preferences/${encodeURIComponent(currentUid)}`),
        fetch(`/api/account/email-history/${encodeURIComponent(currentUid)}?email=${userEmailParam}`)
      ]);
      if (epRes.ok) {
        const epData = await epRes.json();
        if (epData.preferences) {
          setEmailPrefs({
            welcome_email_enabled: Boolean(epData.preferences.welcome_email_enabled),
            login_alert_enabled: Boolean(epData.preferences.login_alert_enabled),
            logout_email_enabled: Boolean(epData.preferences.logout_email_enabled),
            security_alert_enabled: Boolean(epData.preferences.security_alert_enabled)
          });
        }
      }
      if (ehRes.ok) {
        const ehData = await ehRes.json();
        setEmailHistory(ehData.notifications || []);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadAccountData();
  }, [currentUid]);

  useEffect(() => {
    const clean = username.trim().replace(/^@+/, '');
    if (!clean) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/account/username/check?username=${encodeURIComponent(clean)}&uid=${encodeURIComponent(currentUid)}`
        );
        const d = await res.json();
        setUsernameStatus({ available: Boolean(d.available), reason: d.reason });
      } catch (_) {}
    }, 200);
    return () => clearTimeout(t);
  }, [username, currentUid]);

  const handleSaveAccountSettings = async () => {
    setErrorBanner(null);
    setStatusBanner(null);
    if (!usernameStatus.available) {
      setErrorBanner(usernameStatus.reason || 'Chosen @username is not available.');
      return;
    }

    try {
      const [res] = await Promise.all([
        fetch(`/api/account/profile/${encodeURIComponent(currentUid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            username: username.trim().replace(/^@+/, ''),
            privacy: privacyPrefs,
            notificationPrefs: notifPrefs
          })
        }),
        fetch(`/api/account/email-preferences/${encodeURIComponent(currentUid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(emailPrefs)
        })
      ]);
      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
        setStatusBanner('Account settings, @username, privacy, and Study Top 4.0 email preferences saved!');
        loadAccountData();
        setTimeout(() => setStatusBanner(null), 3500);
      } else {
        setErrorBanner(data.error || 'Could not save settings.');
      }
    } catch (_) {
      setErrorBanner('Network error while saving settings.');
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    try {
      await fetch('/api/account/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: currentUid })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (_) {}
  };

  const handleDownloadPersonalArchive = async () => {
    try {
      const res = await fetch(`/api/account/export/${encodeURIComponent(currentUid)}`);
      const data = await res.json();
      if (data.success && data.archive) {
        const blob = new Blob([JSON.stringify(data.archive, null, 2)], {
          type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `StudyTop_Personal_Account_Archive_${profile?.username || currentUid}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusBanner('Personal account data archive downloaded successfully.');
        setTimeout(() => setStatusBanner(null), 3500);
      }
    } catch (_) {}
  };

  const handleSignOutAllSessions = async () => {
    try {
      await fetch('/api/user/logout-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUid,
          email: profile?.email || user?.email,
          displayName: profile?.fullName || user?.displayName
        })
      });
    } catch (_) {}
    localStorage.removeItem('cached_ai_responses');
    sessionStorage.clear();
    if (onSignOut) onSignOut();
  };

  const handleExecutePermanentDeletion = async () => {
    setErrorBanner(null);
    if (deleteConfirmText !== 'DELETE') {
      setErrorBanner('Please type DELETE in all caps to confirm permanent account deletion.');
      return;
    }
    setDeletingAccount(true);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUid,
          email: reAuthEmail || profile?.email || user?.email,
          confirmationPhrase: deleteConfirmText
        })
      });
      const data = await res.json();
      if (data.success) {
        setDeletionReceipt(data.receipt);
        setDeleteStep('deleted_receipt');
      } else {
        setErrorBanner(data.error || 'Account deletion could not be completed.');
      }
    } catch (_) {
      setErrorBanner('Network error while processing account deletion.');
    }
    setDeletingAccount(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900 pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-blue-600">
            Study Top 3.0 Account Control, Notifications &amp; Data Governance
          </div>
          <h2 className="text-2xl font-black text-slate-900 mt-1">
            Account Settings, Privacy &amp; Notifications
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manage your @username, notification inbox, privacy controls, login activity, data export, and account deletion.
          </p>
        </div>

        <button
          onClick={handleSaveAccountSettings}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5 shadow-2xs self-start sm:self-auto"
        >
          <Check className="w-4 h-4" />
          <span>Save All Settings</span>
        </button>
      </div>

      {statusBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* 1. Edit Personal Information & Change @Username */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          <span>1. Personal Information &amp; @Username Handle</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-black text-slate-600 uppercase text-[11px] mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block font-black text-slate-600 uppercase text-[11px] mb-1">
              Change @Username (Globally Unique)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400">
                @
              </span>
              <input
                type="text"
                value={username.replace(/^@+/, '')}
                onChange={e => setUsername(e.target.value.replace(/^@+/, '').toLowerCase())}
                className={`w-full pl-8 pr-9 py-2.5 rounded-xl border font-mono font-bold outline-none ${
                  usernameStatus.available
                    ? 'bg-emerald-50/40 border-emerald-400 text-slate-900'
                    : 'bg-rose-50/40 border-rose-400 text-slate-900'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
              </span>
            </div>
            <div className="mt-1 text-[11px] font-bold">
              {usernameStatus.available ? (
                <span className="text-emerald-600">
                  Available · studytop.app/@{username.replace(/^@+/, '')}
                </span>
              ) : (
                <span className="text-rose-600">{usernameStatus.reason}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Study Top In-App Notifications Inbox & Preferences */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-600" />
              <span>2. Study Top Notifications ({unreadCount} Unread)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Real-time alerts for account creation, @username updates, unlocked achievements, leaderboard changes, and security events.
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllNotificationsRead}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer self-start sm:self-auto"
            >
              Mark All Read
            </button>
          )}
        </div>

        {/* Notification Inbox List */}
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {notifications.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-semibold">
              No notifications yet. Complete a study session or quiz to receive achievement updates!
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`p-3.5 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
                  n.read ? 'bg-slate-50 border-slate-200/80' : 'bg-blue-50/40 border-blue-200'
                }`}
              >
                <div>
                  <div className="font-black text-slate-900">{n.title}</div>
                  <p className="text-slate-600 mt-0.5">{n.message}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Notification Preference Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          {[
            { key: 'accountEvents', label: 'Account & @Username Updates' },
            { key: 'achievements', label: 'New Achievement Unlocks' },
            { key: 'leaderboardChanges', label: 'Leaderboard Position Changes' },
            { key: 'weeklySummaries', label: 'Weekly Learning Summaries' },
            { key: 'streakMilestones', label: 'Study Streak Milestones' },
            { key: 'securityEvents', label: 'Account Security Alerts' }
          ].map(item => (
            <label
              key={item.key}
              className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer"
            >
              <span className="font-bold text-slate-800">{item.label}</span>
              <input
                type="checkbox"
                checked={(notifPrefs as any)[item.key]}
                onChange={e =>
                  setNotifPrefs(prev => ({ ...prev, [item.key]: e.target.checked }))
                }
                className="w-4 h-4 rounded text-blue-600"
              />
            </label>
          ))}
        </div>

        {/* Study Top 4.0 Real Email Notification Preferences & History */}
        <div className="pt-4 border-t border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span>Transactional Email Notification Preferences (Study Top 4.0)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Official Sender: <strong className="font-mono text-blue-600">manjitranjan180513@gmail.com</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              { key: 'welcome_email_enabled', label: 'Welcome Email (New Account Registration)' },
              { key: 'login_alert_enabled', label: 'New Login Security Notification Emails' },
              { key: 'logout_email_enabled', label: 'Logout Confirmation Emails' },
              { key: 'security_alert_enabled', label: 'Password Reset & Account Security Alerts' }
            ].map((item) => (
              <label
                key={item.key}
                className="p-3 rounded-2xl bg-blue-50/40 border border-blue-200/80 flex items-center justify-between cursor-pointer"
              >
                <span className="font-bold text-slate-800">{item.label}</span>
                <input
                  type="checkbox"
                  checked={(emailPrefs as any)[item.key]}
                  onChange={(e) =>
                    setEmailPrefs((prev) => ({ ...prev, [item.key]: e.target.checked }))
                  }
                  className="w-4 h-4 rounded text-blue-600"
                />
              </label>
            ))}
          </div>

          {emailHistory.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-black uppercase text-slate-500">
                Recent Transactional Emails Dispatched to Your Account
              </div>
              <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Subject</th>
                      <th className="p-2.5">Type</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {emailHistory.slice(0, 5).map((eh) => (
                      <tr key={eh.id}>
                        <td className="p-2.5 font-bold text-slate-800">{eh.subject}</td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{eh.email_type}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              eh.delivery_status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {eh.delivery_status}
                          </span>
                        </td>
                        <td className="p-2.5 text-[11px] text-slate-400 font-mono">
                          {new Date(eh.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Account Security & Recent Login Activity */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>3. Account Security &amp; Login Activity</span>
            </h3>
            <p className="text-xs text-slate-500">
              Review recent sign-in sessions and revoke active sessions across devices.
            </p>
          </div>
          <button
            onClick={handleSignOutAllSessions}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out From All Sessions</span>
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 font-black uppercase text-[10px]">
              <tr>
                <th className="p-3">Date &amp; Time</th>
                <th className="p-3">Event</th>
                <th className="p-3">Auth Method</th>
                <th className="p-3">Client Device</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loginHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-slate-500 font-medium">
                    Current active session verified ({profile?.accountType || 'Authenticated'}).
                  </td>
                </tr>
              ) : (
                loginHistory.slice(0, 6).map((lh: any) => (
                  <tr key={lh.id}>
                    <td className="p-3 font-mono text-[11px] tabular-nums">
                      {new Date(lh.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold">{lh.eventType || 'SIGN_IN'}</td>
                    <td className="p-3 font-bold">{lh.method}</td>
                    <td className="p-3 text-slate-500">{lh.device}</td>
                    <td className="p-3 font-bold text-emerald-600">{lh.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Data Export & Permanent Account Deletion */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <h3 className="text-sm font-black text-slate-900">
          4. Personal Data Archive &amp; Permanent Account Deletion
        </h3>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <p className="text-xs font-black text-slate-900">Download Personal Account Information</p>
            <p className="text-[11px] text-slate-500">
              Export your complete Study Top profile, @username metadata, achievements, learning history, and login records as JSON.
            </p>
          </div>
          <button
            onClick={handleDownloadPersonalArchive}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-800 cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Personal Data</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-rose-50/60 rounded-2xl border border-rose-200">
          <div>
            <p className="text-xs font-black text-rose-900">Permanently Delete Study Top Account</p>
            <p className="text-[11px] text-rose-700">
              Permanently delete your profile, release your @username handle, remove leaderboard scores, and revoke active sessions.
            </p>
          </div>
          <button
            onClick={() => {
              setDeleteStep('confirm_form');
              setDeleteConfirmText('');
              setShowDeleteModal(true);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>

      {/* 10-Step Permanent Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-5 text-xs">
            {deleteStep === 'confirm_form' ? (
              <>
                <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                  <div>
                    <span className="text-[11px] font-black uppercase text-rose-600">
                      Permanent Account Deletion Workflow
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-0.5">
                      Confirm Permanent Account Deletion
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 text-rose-900">
                  <div className="font-black">What will be permanently deleted:</div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px]">
                    <li>Your Study Top Account ({profile?.studyTopId || currentUid}) and personal profile data.</li>
                    <li>Your public handle (@{profile?.username}) and public profile URL.</li>
                    <li>Your Global Leaderboard rankings, learning points, and achievement showcase.</li>
                    <li>Your social study posts, notifications, and stored learning activities.</li>
                    <li>
                      <strong>Retention Notice:</strong> Only an anonymized compliance receipt (with zero personal email or credentials) is retained for legal security auditing.
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block font-black text-slate-700 uppercase text-[11px] mb-1">
                      Step 1: Confirm Your Email / Identity for Fresh Authentication
                    </label>
                    <input
                      type="text"
                      value={reAuthEmail}
                      onChange={e => setReAuthEmail(e.target.value)}
                      placeholder={profile?.email || 'Enter your registered email or username'}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-bold text-slate-900 outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-slate-700 uppercase text-[11px] mb-1">
                      Step 2: Type DELETE in all caps to confirm permanently
                    </label>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={e => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 font-mono font-black text-rose-600 outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={deletingAccount}
                    className="px-4 py-2 rounded-xl border border-slate-200 font-bold text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExecutePermanentDeletion}
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                    className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black flex items-center gap-1.5 cursor-pointer"
                  >
                    {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    <span>Permanently Delete Account</span>
                  </button>
                </div>
              </>
            ) : (
              /* Step 10: Account Deletion Confirmation Screen */
              <div className="space-y-4 text-center py-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-black text-slate-900">
                  Account Permanently Deleted &amp; Anonymized
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {deletionReceipt?.retentionNote}
                </p>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
                  Receipt ID: {deletionReceipt?.id} · Completed:{' '}
                  {new Date(deletionReceipt?.completedAt || Date.now()).toUTCString()}
                </div>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    handleSignOutAllSessions();
                  }}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-black cursor-pointer"
                >
                  Close &amp; Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
