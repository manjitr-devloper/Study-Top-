import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Sparkles, 
  Mail, 
  Send, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Globe, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  Lock,
  ArrowRight,
  ChevronRight,
  AlertTriangle,
  User,
  Copy,
  Check
} from 'lucide-react';
import { StudyTopLogo } from '../StudyTopLogo';

interface AppUpdatingMaintenanceScreenProps {
  onAdminBypass?: () => void;
  onRefreshStatus?: () => Promise<boolean>;
}

export const AppUpdatingMaintenanceScreen: React.FC<AppUpdatingMaintenanceScreenProps> = ({
  onAdminBypass,
  onRefreshStatus
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manual status checking
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [copiedLink, setCopiedLink] = useState(false);

  // Admin bypass modal
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Auto poll status every 10 seconds to auto-recover when maintenance is disabled
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          const data = await res.json();
          if (!data.maintenanceMode) {
            // Maintenance mode ended, reload page or proceed
            window.location.reload();
          }
        }
      } catch (_) {}
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setLastChecked(new Date());
    try {
      if (onRefreshStatus) {
        const isStillMaintenance = await onRefreshStatus();
        if (!isStillMaintenance) {
          window.location.reload();
          return;
        }
      } else {
        const res = await fetch('/api/system/status');
        if (res.ok) {
          const data = await res.json();
          if (!data.maintenanceMode) {
            window.location.reload();
            return;
          }
        }
      }
    } catch (_) {}
    setTimeout(() => setIsChecking(false), 600);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, email, and message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/system/contact-during-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(data.message || 'Failed to send message. Please try sending a direct email.');
      }
    } catch (e) {
      setErrorMsg('Could not deliver message. Please contact via direct email below.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminBypassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = adminKey.trim();
    // Default secret keys or master email check
    if (
      cleanKey === 'STUDY_TOP_SUPER_ADMIN_2026' || 
      cleanKey === 'manjitranjan180513' ||
      cleanKey === 'manjitranjan180513@gmail.com'
    ) {
      sessionStorage.setItem('study_top_admin_bypass', 'true');
      sessionStorage.setItem('study_top_admin_key', cleanKey);
      if (onAdminBypass) {
        onAdminBypass();
      } else {
        window.location.reload();
      }
    } else {
      setAdminError('Invalid authorization key. Only developer Manjit Ranjan can bypass maintenance.');
    }
  };

  const copyLiveLink = () => {
    navigator.clipboard.writeText('https://tinyurl.com/studytop2026');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans select-none">
      {/* Top Header Bar */}
      <header className="max-w-5xl w-full mx-auto flex items-center justify-between pb-4 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <StudyTopLogo size="sm" />
          <span className="hidden sm:inline text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
            Platform Maintenance Mode
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition-all shadow-2xs cursor-pointer disabled:opacity-60"
            title="Check if updates have finished"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking...' : 'Check Status'}</span>
          </button>

          <button
            onClick={() => setShowAdminBypass(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            title="Developer / Admin Bypass Login"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-4xl w-full mx-auto my-auto py-6 sm:py-8 space-y-6">
        
        {/* Hero Advisory Card */}
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-3xl shadow-xl p-6 sm:p-10 text-center relative overflow-hidden">
          {/* Decorative ambient gradient */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-24 bg-gradient-to-r from-blue-400/20 via-indigo-400/20 to-purple-400/20 blur-2xl pointer-events-none" />

          {/* Animated Status Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-black shadow-xs mb-5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <Wrench className="w-3.5 h-3.5 text-amber-600" />
            <span>System Upgrades &amp; Enhancements in Progress</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            Study Top 2.0 is Currently Updating
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed">
            We are actively applying updates, improving AI performance, and fixing features across Study Top 2.0. 
            Access is temporarily paused to ensure complete data integrity. Everything will be back online shortly!
          </p>

          {/* Progress Animation Bar */}
          <div className="mt-6 max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                <span>Applying Updates &amp; Testing Features</span>
              </span>
              <span className="text-blue-600">Active</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full w-3/4 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-400">
              This page automatically checks every 10 seconds and will restore the app as soon as updates are completed.
            </p>
          </div>

          {/* Official Permanent URL badge */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="text-slate-500 font-medium">Official Permanent App Link:</span>
            <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono text-slate-800">
              <Globe className="w-3.5 h-3.5 text-indigo-600" />
              <span>https://tinyurl.com/studytop2026</span>
              <button
                onClick={copyLiveLink}
                className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                title="Copy link"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedLink && <span className="text-emerald-600 text-[11px] font-bold">Copied!</span>}
          </div>
        </div>

        {/* Contact Developer & Inquiries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Card 1: Direct Contact Developer Info */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  MR
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Developer &amp; Creator</h3>
                  <p className="text-xs text-slate-500">Study Top 2.0 Lead Architect</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Name:</span>
                  <span className="font-bold text-slate-900">Manjit Ranjan</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Direct Email:</span>
                  <a 
                    href="mailto:manjitranjan180513@gmail.com" 
                    className="font-mono text-blue-600 hover:underline font-semibold"
                  >
                    manjitranjan180513@gmail.com
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Platform:</span>
                  <span className="font-semibold text-slate-900">Study Top 2.0 AI</span>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                If you have urgent questions, need early access, or want to report an issue, feel free to reach out directly to Manjit Ranjan via email.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <a
                href="mailto:manjitranjan180513@gmail.com?subject=Study%20Top%202.0%20Update%20Inquiry"
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
              >
                <Mail className="w-4 h-4" />
                <span>Email Developer Directly</span>
              </a>
            </div>
          </div>

          {/* Card 2: Quick Message Form */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-1">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              <span>Leave a Message for the Developer</span>
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              We will notify you immediately once the update is completed.
            </p>

            {submitted ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2 animate-in fade-in">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-black text-emerald-900">Message Delivered</h4>
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Thank you! Your message has been sent to Manjit Ranjan. You will receive an update as soon as Study Top is back online.
                </p>
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3">
                {errorMsg && (
                  <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                    {errorMsg}
                  </div>
                )}

                <div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition"
                    required
                  />
                </div>

                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your Email Address"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition"
                    required
                  />
                </div>

                <div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What would you like to ask or report?"
                    rows={2}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-blue-500 focus:bg-white outline-none transition resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>{isSubmitting ? 'Sending Message...' : 'Submit Message'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

      </main>

      {/* Footer Bar */}
      <footer className="max-w-5xl w-full mx-auto text-center pt-4 border-t border-slate-200/80 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 Study Top 2.0 • Created &amp; Maintained by Manjit Ranjan</p>
        <p className="text-[11px] text-slate-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </p>
      </footer>

      {/* Admin Bypass Modal */}
      {showAdminBypass && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900">Developer Bypass Access</h3>
              </div>
              <button
                onClick={() => {
                  setShowAdminBypass(false);
                  setAdminError(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter developer key or admin credential to continue testing and working on Study Top 2.0 while maintenance is active for other students.
            </p>

            <form onSubmit={handleAdminBypassSubmit} className="space-y-3">
              {adminError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {adminError}
                </div>
              )}

              <input
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                placeholder="Developer Security Key"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none"
                autoFocus
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminBypass(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Verify &amp; Enter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
