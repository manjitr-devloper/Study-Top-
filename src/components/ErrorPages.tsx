import React from 'react';
import { ShieldAlert, AlertTriangle, ArrowLeft, RefreshCw, Lock, ShieldX, Home } from 'lucide-react';

interface ErrorPageProps {
  onGoHome?: () => void;
  onRetry?: () => void;
  title?: string;
  message?: string;
}

export const Error401Unauthorized: React.FC<ErrorPageProps> = ({ onGoHome, onRetry, message }) => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-slate-800/80 border border-slate-700/80 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center mb-6">
        <Lock className="w-8 h-8" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
        HTTP 401 · Unauthorized
      </span>
      <h1 className="text-2xl font-black mt-4 mb-2">Authentication Required</h1>
      <p className="text-sm text-slate-400 mb-6">
        {message || "You must be signed in with valid credentials to access this protected area."}
      </p>
      <div className="flex gap-3 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        )}
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-2 cursor-pointer transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </button>
        )}
      </div>
    </div>
  </div>
);

export const Error403Forbidden: React.FC<ErrorPageProps> = ({ onGoHome, message }) => (
  <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-slate-900/90 border border-rose-500/30 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500" />
      <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mx-auto flex items-center justify-center mb-6">
        <ShieldX className="w-8 h-8" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
        HTTP 403 · Access Denied
      </span>
      <h1 className="text-2xl font-black mt-4 mb-2 tracking-tight">Super Admin Restricted Area</h1>
      <p className="text-xs font-medium text-slate-400 mb-6 leading-relaxed">
        {message || "This secure system is restricted strictly to the designated Super Admin (Manjit Ranjan). Your session does not possess backend administrative clearance."}
      </p>
      <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 mb-6 text-left">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span>Security Protocol Enforced</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Unauthorized access attempts are audited and logged with IP, timestamp, and device fingerprint.
        </p>
      </div>
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-98 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </button>
      )}
    </div>
  </div>
);

export const Error404NotFound: React.FC<ErrorPageProps> = ({ onGoHome }) => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
      <span className="text-4xl font-black text-blue-600 tracking-tighter">404</span>
      <h1 className="text-xl font-black text-slate-900 mt-2 mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-500 mb-6">
        The study resource or page you are looking for does not exist or has been moved.
      </p>
      {onGoHome && (
        <button
          onClick={onGoHome}
          className="px-6 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs cursor-pointer shadow-md"
        >
          Back to Study Top
        </button>
      )}
    </div>
  </div>
);

export const Error429RateLimited: React.FC<ErrorPageProps & { retryAfter?: number }> = ({ onRetry, retryAfter = 60 }) => (
  <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-slate-800 border border-amber-500/30 rounded-3xl p-8 text-center shadow-2xl">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-6">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full">
        HTTP 429 · Rate Limit Active
      </span>
      <h1 className="text-2xl font-black mt-4 mb-2">Slow Down a Moment</h1>
      <p className="text-xs text-slate-400 mb-6 leading-relaxed">
        Cloudflare WAF rate protection triggered due to rapid requests. Please wait {retryAfter} seconds before trying again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs cursor-pointer shadow-md flex items-center gap-2 mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Now</span>
        </button>
      )}
    </div>
  </div>
);

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Study Top Uncaught UI Exception:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 text-center shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-black text-slate-900 mb-2">Study Top Workspace Notice</h1>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              An unexpected render event occurred. You can reload the workspace safely.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl text-left mb-6 overflow-auto max-h-32 text-[11px] font-mono text-slate-600 border border-slate-200">
              {this.state.error?.message || 'Application recovered.'}
            </div>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload App</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
