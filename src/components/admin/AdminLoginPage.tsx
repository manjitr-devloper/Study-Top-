import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Key, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Brain, 
  FileText, 
  ChevronLeft, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Clock, 
  Chrome,
  Zap,
  Layers,
  ArrowLeft
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithPopup, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';

interface AdminLoginPageProps {
  onSuccess: (adminData: { email: string; token: string; key?: string }) => void;
  onBackToApp: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({ onSuccess, onBackToApp }) => {
  const [isFlipped, setIsFlipped] = useState(false); // Flip for forgot password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passcode, setPasscode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [rememberSession, setRememberSession] = useState(true);

  // Recovery email state
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  // Loading & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('Verifying administrator credentials…');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Rate Limiting (Front-end defense layer in tandem with backend WAF)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const timerRef = useRef<any>(null);

  // Floating background icon coordinates
  const floatingIcons = [
    { Icon: BookOpen, top: '12%', left: '10%', delay: 0, duration: 6, color: 'text-blue-400/40' },
    { Icon: Brain, top: '22%', right: '12%', delay: 1, duration: 7, color: 'text-violet-400/40' },
    { Icon: Sparkles, top: '75%', left: '8%', delay: 2, duration: 5, color: 'text-amber-400/50' },
    { Icon: GraduationCap, top: '80%', right: '10%', delay: 1.5, duration: 8, color: 'text-indigo-400/40' },
    { Icon: ShieldCheck, top: '48%', left: '4%', delay: 2.5, duration: 6.5, color: 'text-emerald-400/40' },
    { Icon: FileText, top: '55%', right: '6%', delay: 0.8, duration: 7.2, color: 'text-purple-400/40' },
  ];

  useEffect(() => {
    // Check saved lockout
    const savedLockout = localStorage.getItem('study_top_admin_lockout');
    if (savedLockout) {
      const remaining = Math.ceil((parseInt(savedLockout, 10) - Date.now()) / 1000);
      if (remaining > 0) {
        setLockoutTimer(remaining);
      } else {
        localStorage.removeItem('study_top_admin_lockout');
      }
    }
  }, []);

  useEffect(() => {
    if (lockoutTimer > 0) {
      timerRef.current = setInterval(() => {
        setLockoutTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            localStorage.removeItem('study_top_admin_lockout');
            setFailedAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [lockoutTimer]);

  const handleRecordFailure = () => {
    const nextAttempts = failedAttempts + 1;
    setFailedAttempts(nextAttempts);
    if (nextAttempts >= 4) {
      const lockSeconds = 60;
      setLockoutTimer(lockSeconds);
      localStorage.setItem('study_top_admin_lockout', (Date.now() + lockSeconds * 1000).toString());
      setErrorMessage(`Too many failed attempts. Temporary lockout active (${lockSeconds}s).`);
    }
  };

  // Primary Login Handler
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) {
      setErrorMessage(`System lockout active. Please wait ${lockoutTimer} seconds.`);
      return;
    }

    if (!email.trim() && !passcode.trim()) {
      setErrorMessage('Please enter your administrator email, password, or security passcode.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);
    setLoadingStage('Connecting to secure verification service…');

    try {
      // Step 1: Backend verification request to /api/admin/login
      setLoadingStage('Verifying administrator credentials…');
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
          passcode: passcode.trim()
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        // If password was also provided, try Firebase Auth as secondary validation
        if (email.trim() && password) {
          try {
            setLoadingStage('Validating Firebase authentication…');
            const userCred = await signInWithEmailAndPassword(auth, email.trim(), password);
            if (userCred.user && userCred.user.email?.toLowerCase() === 'manjitranjan180513@gmail.com') {
              setLoadingStage('Access granted. Initializing Admin Workspace…');
              setSuccessNotice('Administrator session verified successfully.');
              setTimeout(() => {
                onSuccess({
                  email: userCred.user.email || 'manjitranjan180513@gmail.com',
                  token: 'fb_' + userCred.user.uid,
                  key: passcode.trim() || undefined
                });
              }, 600);
              return;
            } else {
              throw new Error('Unauthorized role. Account is not registered with Super Admin privileges.');
            }
          } catch (fbErr: any) {
            handleRecordFailure();
            setErrorMessage(fbErr.message || data.error || 'Authentication failed. Please verify credentials.');
            return;
          }
        }

        handleRecordFailure();
        setErrorMessage(data.error || 'Invalid administrator credentials. Access restricted.');
        return;
      }

      // Step 2: Verification succeeded
      setLoadingStage('Administrator verified. Loading Cloudflare-shielded control center…');
      setSuccessNotice('Welcome back, Admin Manjit Ranjan.');
      
      if (rememberSession) {
        sessionStorage.setItem('study_top_admin_authenticated', 'true');
        if (passcode.trim()) {
          sessionStorage.setItem('study_top_admin_key', passcode.trim());
        }
      }

      setTimeout(() => {
        onSuccess({
          email: data.adminEmail || email.trim() || 'manjitranjan180513@gmail.com',
          token: data.token,
          key: passcode.trim() || undefined
        });
      }, 700);

    } catch (err: any) {
      console.error('Admin login error:', err);
      setErrorMessage('Network error or server unavailable. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In for Admin
  const handleGoogleAdminLogin = async () => {
    if (lockoutTimer > 0) return;
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStage('Opening Google Authentication…');

    try {
      const res = await signInWithPopup(auth, googleProvider);
      if (res.user) {
        const userEmail = (res.user.email || '').toLowerCase();
        if (userEmail === 'manjitranjan180513@gmail.com') {
          setLoadingStage('Super Admin identity confirmed…');
          setSuccessNotice('Google Super Admin credentials verified.');
          setTimeout(() => {
            onSuccess({
              email: res.user.email || 'manjitranjan180513@gmail.com',
              token: res.user.uid
            });
          }, 600);
        } else {
          setErrorMessage(`Access Denied: ${userEmail} does not have administrator privileges. Only Manjit Ranjan is authorized.`);
        }
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Google authentication was cancelled.');
    } finally {
      setIsLoading(false);
    }
  };

  // Password Recovery Handler
  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSuccess(true);
      setSuccessNotice('If this is a registered administrator email, password reset instructions have been dispatched.');
    } catch (err: any) {
      // Security constitution: never reveal if email exists, maintain neutral confirmation
      setResetSuccess(true);
      setSuccessNotice('Instructions sent. Please check your inbox and follow the secure link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-violet-50/50 flex flex-col justify-between relative overflow-hidden font-sans text-slate-800">
      
      {/* 1. FLOATING BACKGROUND EDUCATIONAL & SECURITY ICONS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {floatingIcons.map((item, idx) => {
          const { Icon, color, delay, duration, ...position } = item;
          return (
            <motion.div
              key={idx}
              style={position as any}
              className={`absolute ${color}`}
              animate={{
                y: [0, -18, 0],
                rotate: [0, 8, -8, 0],
                scale: [1, 1.08, 1],
              }}
              transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              <Icon className="w-10 h-10 sm:w-14 sm:h-14" />
            </motion.div>
          );
        })}

        {/* Soft Ambient Light Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-300/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. TOP NAVBAR */}
      <header className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-8 py-5 flex items-center justify-between">
        <button
          onClick={onBackToApp}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 hover:bg-white text-slate-700 font-bold text-xs shadow-xs border border-slate-200/80 backdrop-blur-md transition-all active:scale-95 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 text-blue-600" />
          <span>Back to Study Top</span>
        </button>

        {/* Security Shield Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-bold shadow-2xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="hidden sm:inline">Cloudflare Strict WAF Active</span>
          <span className="sm:hidden">WAF Active</span>
        </div>
      </header>

      {/* 3. MAIN CENTER CONTAINER WITH 3D CARD */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 py-8">
        
        {/* Animated Brand Header */}
        <div className="text-center mb-8 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-blue-100/80 via-indigo-100/80 to-violet-100/80 border border-blue-200/60 text-blue-900 text-xs font-extrabold mb-3 shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Administrator Control Portal</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900"
          >
            Study Top{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
              Admin
            </span>
          </motion.h1>

          <p className="text-sm font-semibold text-slate-500 mt-1">
            Smart Notes Making Platform
          </p>

          <p className="text-xs font-bold text-indigo-600 mt-0.5">
            Created by Manjit Ranjan (Google Developer)
          </p>
        </div>

        {/* 4. 3D GLASS LOGIN CARD (With Flip to Forgot Password) */}
        <div className="w-full max-w-md perspective-1000">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="relative"
          >
            {/* Outer moving gradient glow ring */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-3xl blur-md opacity-30 animate-pulse" />

            <div className="relative bg-white/95 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-9 shadow-2xl shadow-blue-900/10 transition-all">
              
              {!isFlipped ? (
                /* ================= FRONT: LOGIN VIEW ================= */
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Admin Sign In</h2>
                      <p className="text-xs text-slate-500 font-medium">Verify credentials or enter master passcode</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                      <Lock className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Feedback Messages */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5 shadow-2xs"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <span>{errorMessage}</span>
                      </motion.div>
                    )}

                    {successNotice && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-2.5 shadow-2xs"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{successNotice}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Form */}
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    
                    {/* Admin Email */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 ml-1">
                        Admin Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="manjitranjan180513@gmail.com"
                          disabled={isLoading || lockoutTimer > 0}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60"
                        />
                      </div>
                    </div>

                    {/* Admin Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => { setIsFlipped(true); setErrorMessage(null); setSuccessNotice(null); }}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          disabled={isLoading || lockoutTimer > 0}
                          className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Security Passcode Field */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1.5 ml-1">
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-amber-500" />
                          <span>Admin Passcode</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold">Security authentication</span>
                      </div>
                      <div className="relative">
                        <Key className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type={showPasscode ? 'text' : 'password'}
                          value={passcode}
                          onChange={(e) => setPasscode(e.target.value)}
                          placeholder="Enter administrator passcode"
                          disabled={isLoading || lockoutTimer > 0}
                          className="w-full pl-10 pr-10 py-3 bg-amber-50/40 border border-amber-200/70 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:border-amber-500 focus:bg-white focus:ring-4 focus:ring-amber-500/10 transition-all disabled:opacity-60"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasscode(!showPasscode)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember Session Checkbox */}
                    <div className="flex items-center gap-2 pt-1 ml-1">
                      <input
                        type="checkbox"
                        id="rememberAdminSession"
                        checked={rememberSession}
                        onChange={(e) => setRememberSession(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="rememberAdminSession" className="text-xs font-semibold text-slate-600 cursor-pointer">
                        Remember admin session on this device
                      </label>
                    </div>

                    {/* Lockout Warning */}
                    {lockoutTimer > 0 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs font-bold text-amber-800">
                        <Clock className="w-4 h-4 text-amber-600 animate-spin" />
                        <span>Lockout active. Try again in {lockoutTimer}s.</span>
                      </div>
                    )}

                    {/* Submit Button with 3D press effect */}
                    <button
                      type="submit"
                      disabled={isLoading || lockoutTimer > 0}
                      className="w-full py-4 mt-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>{loadingStage}</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Admin Login</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Divider */}
                  <div className="relative my-6 text-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200/80" />
                    </div>
                    <span className="relative px-3 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Or Super Admin OAuth
                    </span>
                  </div>

                  {/* Google OAuth Login */}
                  <button
                    type="button"
                    onClick={handleGoogleAdminLogin}
                    disabled={isLoading || lockoutTimer > 0}
                    className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold text-xs flex items-center justify-center gap-2.5 shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    <Chrome className="w-4 h-4 text-red-500" />
                    <span>Sign in with Google (Owner Account)</span>
                  </button>

                  <div className="mt-5 text-center">
                    <span className="text-[11px] font-bold text-slate-400">
                      Authorized Owner: <strong className="text-slate-700">Manjit Ranjan</strong>
                    </span>
                  </div>
                </div>
              ) : (
                /* ================= BACK: PASSWORD RECOVERY ================= */
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Recover Password</h2>
                      <p className="text-xs text-slate-500 font-medium">Firebase Authentication Recovery</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                      <Key className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Feedback */}
                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5"
                      >
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                        <span>{errorMessage}</span>
                      </motion.div>
                    )}

                    {successNotice && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span>{successNotice}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handlePasswordRecovery} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 ml-1">
                        Administrator Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="manjitranjan180513@gmail.com"
                          disabled={isLoading || resetSuccess}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || resetSuccess}
                      className="w-full py-3.5 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          <span>Dispatching reset email…</span>
                        </>
                      ) : (
                        <>
                          <Mail className="w-4 h-4" />
                          <span>Send Password Recovery</span>
                        </>
                      )}
                    </button>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => { setIsFlipped(false); setErrorMessage(null); setSuccessNotice(null); }}
                        className="text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Return to Admin Login</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </main>

      {/* 5. FOOTER */}
      <footer className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-8 py-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <p>© {new Date().getFullYear()} Study Top · Secure Super Admin Environment</p>
        <p>Owner Label: <strong className="text-slate-800 font-bold">Only Admin: Manjit Ranjan (Google Developer)</strong></p>
      </footer>
    </div>
  );
};
