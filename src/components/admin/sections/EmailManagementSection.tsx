import React, { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RefreshCw,
  Send,
  Filter,
  Search,
  ShieldCheck,
  Sliders,
  Eye,
  X,
  RotateCcw,
  Server,
  UserPlus,
  LogIn,
  LogOut,
  ShieldAlert,
  FileText
} from 'lucide-react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider, getAccessToken, setCachedAccessToken } from '../../../lib/firebase';

interface EmailManagementSectionProps {
  adminKey: string;
  darkMode: boolean;
}

export const EmailManagementSection: React.FC<EmailManagementSectionProps> = ({
  adminKey,
  darkMode
}) => {
  const [loading, setLoading] = useState(true);
  const [actionBusy, setActionBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null);

  const [ownerEmail, setOwnerEmail] = useState('manjitranjan180513@gmail.com');
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [globalConfig, setGlobalConfig] = useState<any>({
    welcomeEmailEnabled: true,
    loginAlertEnabled: true,
    logoutEmailEnabled: true,
    securityAlertEnabled: true,
    emailVerificationEnabled: true,
    maxRetries: 3,
    rateLimitPerMinutePerUser: 6
  });
  const [summary, setSummary] = useState<any>({
    totalEmails: 0,
    acceptedEmails: 0,
    failedOrUnconfiguredEmails: 0,
    pendingEmails: 0,
    welcomeEmails: 0,
    loginNotifications: 0,
    logoutNotifications: 0,
    securityAlerts: 0
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<any[]>([]);

  // Filters
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'delivery_logs' | 'settings'>('notifications');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<'all' | 'today' | '7days'>('all');

  // Preview Modal
  const [previewRecord, setPreviewRecord] = useState<any | null>(null);

  const getAdminHeaders = () => ({
    'Content-Type': 'application/json',
    'x-user-email': 'manjitranjan180513@gmail.com',
    Authorization: 'Bearer manjitranjan180513@gmail.com',
    'x-admin-key': adminKey || '82359693'
  });

  const loadEmailDashboard = async () => {
    try {
      const res = await fetch('/api/admin/emails', {
        headers: getAdminHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setOwnerEmail(data.ownerEmail || 'manjitranjan180513@gmail.com');
        setProviderStatus(data.providerStatus || null);
        if (data.globalConfig) setGlobalConfig(data.globalConfig);
        if (data.summary) setSummary(data.summary);
        setNotifications(data.notifications || []);
        setDeliveryLogs(data.deliveryLogs || []);
      }
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailDashboard();
  }, [adminKey]);

  const handleToggleEventConfig = async (key: string, nextValue: boolean) => {
    setActionBusy(true);
    try {
      const res = await fetch('/api/admin/emails/config', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ [key]: nextValue })
      });
      const data = await res.json();
      if (data.success && data.globalConfig) {
        setGlobalConfig(data.globalConfig);
        setFeedback({
          type: 'success',
          text: `Updated email event setting (${key} = ${nextValue ? 'Enabled' : 'Disabled'}).`
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Failed to update email event configuration.' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleConnectGmailOAuth = async () => {
    setActionBusy(true);
    setFeedback(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (!token) {
        setFeedback({
          type: 'warning',
          text: 'Google Sign-In succeeded, but no OAuth access token was returned. Please ensure the Gmail permission checkbox is selected.'
        });
        setActionBusy(false);
        return;
      }
      setCachedAccessToken(token);
      const res = await fetch('/api/admin/emails/oauth-token', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          email: result.user?.email || ownerEmail,
          accessToken: token
        })
      });
      const data = await res.json();
      if (data.dashboard) {
        setProviderStatus(data.dashboard.providerStatus || null);
        setSummary(data.dashboard.summary);
        setNotifications(data.dashboard.notifications || []);
        setDeliveryLogs(data.dashboard.deliveryLogs || []);
      }
      setFeedback({
        type: 'success',
        text: `Gmail OAuth 2.0 Sender (${result.user?.email || ownerEmail}) connected! ${data.acceptedCount || 0} queued email(s) immediately delivered to inbox.`
      });
    } catch (err: any) {
      setFeedback({
        type: 'error',
        text: err?.message || 'Google OAuth authorization was cancelled or failed.'
      });
    } finally {
      setActionBusy(false);
    }
  };

  const handleSendTestEmail = async () => {
    setActionBusy(true);
    setFeedback(null);
    try {
      let activeToken = await getAccessToken();
      if (!activeToken && !providerStatus?.configured) {
        try {
          const result = await signInWithPopup(auth, googleProvider);
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            activeToken = credential.accessToken;
            setCachedAccessToken(activeToken);
          }
        } catch (_) {}
      }

      const res = await fetch('/api/admin/emails/test', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
          recipientEmail: ownerEmail,
          gmailAccessToken: activeToken || undefined
        })
      });
      const data = await res.json();
      if (data.dashboard) {
        setProviderStatus(data.dashboard.providerStatus || data.providerInfo || null);
        setSummary(data.dashboard.summary);
        setNotifications(data.dashboard.notifications || []);
        setDeliveryLogs(data.dashboard.deliveryLogs || []);
      }
      if (data.delivered) {
        setFeedback({
          type: 'success',
          text: `Test email accepted by Gmail API and delivered to ${ownerEmail}! Message ID: ${data.providerMessageId}`
        });
      } else {
        setFeedback({
          type: 'warning',
          text: `Test email status: "${data.status}". ${data.message}`
        });
      }
    } catch {
      setFeedback({ type: 'error', text: 'Network error while triggering test email.' });
    } finally {
      setActionBusy(false);
    }
  };

  const handleRetryQueue = async (notificationId?: string) => {
    setActionBusy(true);
    setFeedback(null);
    try {
      const activeToken = await getAccessToken();
      if (activeToken) {
        await fetch('/api/admin/emails/oauth-token', {
          method: 'POST',
          headers: getAdminHeaders(),
          body: JSON.stringify({ email: ownerEmail, accessToken: activeToken })
        }).catch(() => {});
      }
      const res = await fetch('/api/admin/emails/retry', {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({ notificationId })
      });
      const data = await res.json();
      if (data.dashboard) {
        setProviderStatus(data.dashboard.providerStatus || null);
        setSummary(data.dashboard.summary);
        setNotifications(data.dashboard.notifications || []);
        setDeliveryLogs(data.dashboard.deliveryLogs || []);
      }
      setFeedback({
        type: data.acceptedCount > 0 ? 'success' : 'warning',
        text: `Processed ${data.processedCount} queued/failed email job(s): ${data.acceptedCount} accepted by provider, ${data.stillPendingOrFailedCount} pending provider configuration or retry.`
      });
    } catch {
      setFeedback({ type: 'error', text: 'Failed to process email retry queue.' });
    } finally {
      setActionBusy(false);
    }
  };

  const now = Date.now();
  const filteredNotifications = notifications.filter((n) => {
    if (filterType !== 'all' && n.email_type !== filterType) return false;
    if (filterStatus !== 'all' && n.delivery_status !== filterStatus) return false;
    if (filterDateRange === 'today' && now - n.created_at > 86400000) return false;
    if (filterDateRange === '7days' && now - n.created_at > 7 * 86400000) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        (n.recipient_email || '').toLowerCase().includes(q) ||
        (n.recipient_name || '').toLowerCase().includes(q) ||
        (n.subject || '').toLowerCase().includes(q) ||
        (n.user_id || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>Accepted by Provider</span>
          </span>
        );
      case 'pending_provider_config':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock className="w-3 h-3" />
            <span>Queued (Needs SMTP Secret)</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <AlertTriangle className="w-3 h-3" />
            <span>Failed</span>
          </span>
        );
      case 'queued':
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
            <Clock className="w-3 h-3" />
            <span>Pending Queue</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Owner Email & Provider Status */}
      <div
        className={`rounded-3xl border p-6 shadow-xs ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-600 text-white">
                <Mail className="w-3.5 h-3.5" />
                <span>STUDY TOP 4.0 EMAIL NOTIFICATION SYSTEM</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <span>Official Sender: {ownerEmail}</span>
              </span>
              {providerStatus?.configured ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live SMTP Provider Connected</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Queue Active • Set GMAIL_APP_PASSWORD for Live Inbox Delivery</span>
                </span>
              )}
            </div>
            <h2 className="text-xl font-black tracking-tight">
              Transactional Email Queue, Delivery Logs &amp; Security Alerts
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All automated Welcome, Login, Logout, and Security Alert emails are dispatched from{' '}
              <strong className="text-blue-600 dark:text-blue-400">{ownerEmail}</strong> with idempotency protection and exponential backoff.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleConnectGmailOAuth}
              disabled={actionBusy}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{providerStatus?.configured ? 'Refresh Gmail OAuth Sender' : 'Connect Gmail OAuth Sender'}</span>
            </button>
            <button
              onClick={handleSendTestEmail}
              disabled={actionBusy}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Test Email to Owner</span>
            </button>
            <button
              onClick={() => handleRetryQueue()}
              disabled={actionBusy}
              className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-black text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Failed / Queued Jobs</span>
            </button>
            <button
              onClick={loadEmailDashboard}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              title="Refresh Email Logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Honest Provider Setup Notice when GMAIL_APP_PASSWORD is not yet set */}
        {providerStatus && !providerStatus.configured && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="font-black flex items-center gap-2">
              <Server className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Honest Provider Verification Status: {providerStatus.transportMode}</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {providerStatus.setupRequiredReason} Study Top never fabricates delivery statuses: until your{' '}
              <code>GMAIL_APP_PASSWORD</code> (or <code>GMAIL_REFRESH_TOKEN</code> / <code>RESEND_API_KEY</code>) is set in server secrets, emails are safely recorded in <code>email_notifications</code> with status{' '}
              <strong>Queued (Needs SMTP Secret)</strong> so zero notifications are lost.
            </p>
          </div>
        )}

        {feedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : feedback.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 8 Real Email Telemetry Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Total Processed', value: summary.totalEmails, icon: Mail, color: 'text-blue-600 bg-blue-50' },
          { label: 'Provider Accepted', value: summary.acceptedEmails, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Failed / Unconfigured', value: summary.failedOrUnconfiguredEmails, icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
          { label: 'Pending Queue', value: summary.pendingEmails, icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
          { label: 'Welcome Emails', value: summary.welcomeEmails, icon: UserPlus, color: 'text-purple-600 bg-purple-50' },
          { label: 'Login Alerts', value: summary.loginNotifications, icon: LogIn, color: 'text-cyan-600 bg-cyan-50' },
          { label: 'Logout Alerts', value: summary.logoutNotifications, icon: LogOut, color: 'text-slate-700 bg-slate-100' },
          { label: 'Security Alerts', value: summary.securityAlerts, icon: ShieldAlert, color: 'text-rose-600 bg-rose-50' }
        ].map((card, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border shadow-2xs ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 truncate">
                {card.label}
              </span>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl font-black">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'notifications', label: `Email Notifications (${notifications.length})`, icon: Mail },
            { id: 'delivery_logs', label: `Provider Delivery Logs (${deliveryLogs.length})`, icon: FileText },
            { id: 'settings', label: 'Event Toggles & Queue Settings', icon: Sliders }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition cursor-pointer ${
                activeSubTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : darkMode
                  ? 'bg-slate-900 text-slate-300 border border-slate-800'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: EMAIL NOTIFICATIONS TABLE */}
      {activeSubTab === 'notifications' && (
        <div
          className={`rounded-3xl border p-5 shadow-xs space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by recipient email, name, subject, or user ID..."
                className="bg-transparent border-none outline-none text-xs w-full"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="all">All Event Types</option>
              <option value="welcome">Welcome Email</option>
              <option value="login_alert">Login Notification</option>
              <option value="logout_alert">Logout Notification</option>
              <option value="security_alert">Security Alert</option>
              <option value="email_verification">Email Verification</option>
              <option value="admin_test">Admin Test Email</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="all">All Delivery Statuses</option>
              <option value="accepted">Accepted by Provider</option>
              <option value="pending_provider_config">Queued (Needs SMTP Secret)</option>
              <option value="failed">Failed</option>
              <option value="queued">Queued</option>
            </select>

            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value as any)}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
            >
              <option value="all">All Time</option>
              <option value="today">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400">
                  <th className="py-3 px-3">Recipient</th>
                  <th className="py-3 px-3">Event Type</th>
                  <th className="py-3 px-3">Subject</th>
                  <th className="py-3 px-3">Delivery Status</th>
                  <th className="py-3 px-3">Created / Sent</th>
                  <th className="py-3 px-3">Retries</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {filteredNotifications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-medium">
                      No email notifications match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredNotifications.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-3">
                        <div className="font-bold">{rec.recipient_name || 'Scholar'}</div>
                        <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                          {rec.recipient_email}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[11px] font-bold">
                          {rec.email_type}
                        </span>
                        {rec.security_subtype && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{rec.security_subtype}</div>
                        )}
                      </td>
                      <td className="py-3 px-3 max-w-xs">
                        <div className="font-bold truncate">{rec.subject}</div>
                        {rec.error_code && (
                          <div className="text-[10px] text-amber-600 truncate" title={rec.error_message}>
                            {rec.error_code}: {rec.error_message}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">{renderStatusBadge(rec.delivery_status)}</td>
                      <td className="py-3 px-3 text-[11px] text-slate-500">
                        <div>Created: {new Date(rec.created_at).toLocaleString()}</div>
                        {rec.sent_at && (
                          <div className="text-emerald-600 font-bold">
                            Sent: {new Date(rec.sent_at).toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold">{rec.retry_count || 0}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {rec.html_preview && (
                            <button
                              onClick={() => setPreviewRecord(rec)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Preview</span>
                            </button>
                          )}
                          {rec.delivery_status !== 'accepted' && rec.html_preview && (
                            <button
                              onClick={() => handleRetryQueue(rec.id)}
                              disabled={actionBusy}
                              className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PROVIDER DELIVERY LOGS */}
      {activeSubTab === 'delivery_logs' && (
        <div
          className={`rounded-3xl border p-5 shadow-xs space-y-4 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <h3 className="text-sm font-black uppercase tracking-wider">
            Immutable Email Delivery Audit Logs (email_delivery_logs)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400">
                  <th className="py-2.5 px-3">Log ID</th>
                  <th className="py-2.5 px-3">Notification ID</th>
                  <th className="py-2.5 px-3">Provider</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Retry #</th>
                  <th className="py-2.5 px-3">Provider Response / Error</th>
                  <th className="py-2.5 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {deliveryLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No delivery attempt logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  deliveryLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{log.id}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600">{log.notification_id}</td>
                      <td className="py-2.5 px-3 font-bold">{log.provider}</td>
                      <td className="py-2.5 px-3">{renderStatusBadge(log.status)}</td>
                      <td className="py-2.5 px-3 font-mono">{log.retry_count}</td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-sm truncate">
                        {log.provider_response || log.last_error || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: EVENT TOGGLES & QUEUE SETTINGS */}
      {activeSubTab === 'settings' && (
        <div
          className={`rounded-3xl border p-6 shadow-xs space-y-5 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div>
            <h3 className="text-base font-black">Global Automated Email Event Controls</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enable or disable specific automated Study Top 4.0 email triggers across the platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'welcomeEmailEnabled',
                title: 'Welcome Email (New Account Registration)',
                desc: 'Sent once immediately when a user creates their Study Top account with their unique @username.'
              },
              {
                key: 'loginAlertEnabled',
                title: 'Login Security Notification',
                desc: 'Sent whenever a registered user signs in via Google or Email/Password.'
              },
              {
                key: 'logoutEmailEnabled',
                title: 'Logout Confirmation Notification',
                desc: 'Enqueued non-blockingly in the background whenever a registered user logs out.'
              },
              {
                key: 'securityAlertEnabled',
                title: 'Account Security Alerts',
                desc: 'Sent for password resets, password changes, new device logins, and account deletion.'
              }
            ].map((item) => {
              const enabled = Boolean(globalConfig[item.key]);
              return (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4"
                >
                  <div>
                    <div className="text-xs font-black">{item.title}</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => handleToggleEventConfig(item.key, !enabled)}
                    disabled={actionBusy}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-black cursor-pointer transition ${
                      enabled
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMAIL TEMPLATE PREVIEW MODAL */}
      {previewRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="text-xs font-black text-blue-600 uppercase">
                  Official Study Top Email Preview ({previewRecord.email_type})
                </div>
                <div className="text-sm font-black text-slate-900">{previewRecord.subject}</div>
                <div className="text-[11px] text-slate-500">
                  From: <strong>{ownerEmail}</strong> &rarr; To: <strong>{previewRecord.recipient_email}</strong>
                </div>
              </div>
              <button
                onClick={() => setPreviewRecord(null)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-100">
              <div
                className="bg-white rounded-2xl overflow-hidden shadow-xs"
                dangerouslySetInnerHTML={{ __html: previewRecord.html_preview || '' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
