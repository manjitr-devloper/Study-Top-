import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  User,
  Loader2,
  Atom,
  Brain,
  Layers,
  Check
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  sendPasswordResetEmail,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../lib/firebase';
import { supabaseService } from '../lib/supabase';
import { StudyTopLogo } from './StudyTopLogo';

interface LoginPageProps {
  onLoginSuccess: (user: FirebaseUser) => void;
  onOpenAdmin?: () => void;
  onExploreLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ 
  onLoginSuccess, 
  onOpenAdmin, 
  onExploreLanding 
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & feedback
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to sync user profile with Firestore and Supabase/PostgreSQL
  const syncStudentProfile = async (fbUser: FirebaseUser, preferredName?: string) => {
    const displayName = preferredName || fbUser.displayName || fbUser.email?.split('@')[0] || 'Student';
    
    // 1. Firestore profile
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName,
          photoURL: fbUser.photoURL || null,
          role: 'student',
          grade: 'Class 10',
          board: 'Universal',
          createdAt: Date.now(),
          lastLogin: Date.now(),
          tutorialCompleted: false
        }, { merge: true });
      } else {
        await setDoc(userRef, { lastLogin: Date.now() }, { merge: true });
      }
    } catch (e) {
      console.warn('Firestore profile sync note (handled gracefully):', e);
    }

    // 2. Supabase / PostgreSQL sync
    supabaseService.syncUserProfile({
      uid: fbUser.uid,
      email: fbUser.email || '',
      displayName,
      photoURL: fbUser.photoURL || undefined
    }).catch(() => {});
  };

  // Google Sign-In with Firebase Authentication
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        await syncStudentProfile(result.user);
        setSuccessMessage('Successfully signed in with Google! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(result.user);
        }, 400);
      }
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in popup was closed before completing.');
      } else if (err.code === 'auth/popup-blocked') {
        setErrorMessage('Pop-up was blocked by the browser. Please allow popups for this site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // Ignored duplicate click
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Please verify your connection and try again.');
      } else {
        setErrorMessage(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Email / Password Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. EMAIL SIGN IN
    if (authMode === 'login') {
      const cleanEmail = email.trim();
      if (!cleanEmail || !password) {
        setErrorMessage('Please enter your email address and password.');
        return;
      }

      setIsLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        if (cred.user) {
          await syncStudentProfile(cred.user);
          setSuccessMessage('Welcome back! Logging you into Study Top...');
          setTimeout(() => {
            onLoginSuccess(cred.user);
          }, 400);
        }
      } catch (err: any) {
        console.error('Sign-in Error:', err);
        if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          setErrorMessage('Invalid email or password. Please verify your credentials or create an account.');
        } else if (err.code === 'auth/too-many-requests') {
          setErrorMessage('Too many failed attempts. For your security, please wait a moment or reset your password.');
        } else {
          setErrorMessage(err.message || 'Login failed. Please check your credentials.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 2. CREATE ACCOUNT (SIGN UP)
    if (authMode === 'signup') {
      const cleanName = fullName.trim();
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanName) {
        setErrorMessage('Please enter your full name.');
        return;
      }
      if (!cleanEmail) {
        setErrorMessage('Please enter a valid email address.');
        return;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match. Please re-enter.');
        return;
      }
      if (!agreeTerms) {
        setErrorMessage('Please agree to the Terms of Service & Privacy Policy to continue.');
        return;
      }

      setIsLoading(true);
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        if (cred.user) {
          // Update display name on Firebase Auth user
          try {
            await updateProfile(cred.user, { displayName: cleanName });
          } catch (e) {}

          await syncStudentProfile(cred.user, cleanName);
          setSuccessMessage('Account created successfully! Welcome to Study Top.');
          setTimeout(() => {
            onLoginSuccess(cred.user);
          }, 500);
        }
      } catch (err: any) {
        console.error('Registration Error:', err);
        if (err.code === 'auth/email-already-in-use') {
          setErrorMessage('An account with this email address already exists. Please sign in instead.');
        } else if (err.code === 'auth/invalid-email') {
          setErrorMessage('The email address is formatted incorrectly.');
        } else if (err.code === 'auth/weak-password') {
          setErrorMessage('The password is too weak. Please use at least 6 characters with numbers or symbols.');
        } else {
          setErrorMessage(err.message || 'Registration failed. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // 3. FORGOT PASSWORD
    if (authMode === 'forgot') {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail) {
        setErrorMessage('Please enter your registered email address.');
        return;
      }

      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, cleanEmail);
        setSuccessMessage(`Password reset link sent to ${cleanEmail}. Please check your inbox and spam folder.`);
      } catch (err: any) {
        console.error('Reset Password Error:', err);
        if (err.code === 'auth/user-not-found') {
          setErrorMessage('No student account found with this email address.');
        } else {
          setErrorMessage(err.message || 'Could not send reset email. Please verify your address.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-100 text-slate-900 font-sans">
      
      {/* Background Subtle Educational Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.05] pointer-events-none" />

      {/* Main SaaS Container Card */}
      <motion.div 
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-5xl bg-white rounded-[32px] border border-slate-200/90 shadow-2xl shadow-blue-900/5 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
      >
        
        {/* =========================================================================
            LEFT SECTION: BRANDING & EDUCATIONAL INTELLIGENCE GRAPHIC (5 cols on lg)
            ========================================================================= */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-b from-blue-600 via-indigo-600 to-slate-900 text-white p-10 flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Glow Spheres */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

          {/* Top Brand Header */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md p-2.5 border border-white/20 flex items-center justify-center shadow-lg">
                <StudyTopLogo size="md" variant="icon" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>STUDY TOP</span>
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200 block">
                  Your Intelligent Learning Companion
                </span>
              </div>
            </div>

            <div className="pt-6">
              <h2 className="text-3xl font-black tracking-tight leading-tight text-white">
                Learn smarter.<br />Understand better.<br />
                <span className="text-blue-300">Achieve more.</span>
              </h2>
              <p className="text-xs text-blue-100/90 leading-relaxed font-medium mt-3">
                Transform textbooks, PDFs, handwritten notes, and lectures into structured point-wise study guides instantly with MIND 1.0.
              </p>
            </div>
          </div>

          {/* Center Abstract AI Learning Graphic & Feature Pillars */}
          <div className="relative z-10 my-8 space-y-3">
            {[
              {
                icon: Brain,
                title: 'MIND 1.0 Intelligence',
                desc: 'Point-wise notes with zero manual editing needed'
              },
              {
                icon: BookOpen,
                title: '17-Point Study Structure',
                desc: 'Formulas, definitions, Q&A, and chapter summaries'
              },
              {
                icon: ShieldCheck,
                title: 'Real Firebase & Supabase',
                desc: 'Secure cloud sessions, instant multi-device syncing'
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.1 }}
                className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-white">
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-white">{item.title}</h4>
                  <p className="text-[11px] text-blue-200/80 font-medium truncate">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Identity & Creator Credit */}
          <div className="relative z-10 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-blue-200/80">
            <div>
              <p className="font-bold text-white">Study Top</p>
              <p className="text-[10px] text-blue-200">Created by Manjit Ranjan (Google Developer)</p>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-white/10 text-white text-[10px] font-black uppercase tracking-wider border border-white/20 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>MIND 1.0</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT SECTION: CLEAN PREMIUM AUTHENTICATION CARD (7 cols on lg)
            ========================================================================= */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-white relative">
          
          {/* Mobile Top Header */}
          <div className="lg:hidden flex items-center justify-between pb-6 mb-6 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <StudyTopLogo size="sm" variant="icon" />
              <div>
                <span className="font-black text-sm tracking-tight text-slate-900 block">STUDY TOP</span>
                <span className="text-[10px] font-bold text-blue-600 block">Your Intelligent Learning Companion</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider border border-blue-200">
              MIND 1.0
            </span>
          </div>

          <div>
            {/* Heading & Subtext */}
            <div className="mb-6">
              {authMode === 'login' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Welcome Back
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Sign in to continue your intelligent learning journey with Study Top.
                  </p>
                </>
              )}

              {authMode === 'signup' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Create Student Account
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Join Study Top for free point-wise AI notes, solvers, and study tools.
                  </p>
                </>
              )}

              {authMode === 'forgot' && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Reset Your Password
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                    Enter your registered email address to receive a secure password recovery link.
                  </p>
                </>
              )}
            </div>

            {/* Error & Success Feedback Banners */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs font-bold flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{errorMessage}</span>
                </motion.div>
              )}

              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-xs font-bold flex items-start gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Authentication (Login & Signup modes) */}
            {authMode !== 'forgot' && (
              <div className="space-y-4 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading || isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-extrabold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-3 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 active:scale-[0.99]"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 absolute">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Full Name (Sign Up only) */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g., Alex Johnson"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    />
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@study-top.edu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              {/* Password Input (Login & Signup) */}
              {authMode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Password
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer transition-colors"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
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
              )}

              {/* Confirm Password (Signup only) */}
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Options: Remember Me or Agree to Terms */}
              {authMode === 'login' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                    Remember my session on this device
                  </label>
                </div>
              )}

              {authMode === 'signup' && (
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="agreeTerms" className="text-xs font-medium text-slate-600 select-none">
                    I agree to the <span className="text-blue-600 font-bold">Terms of Service</span> and <span className="text-blue-600 font-bold">Privacy Policy</span>.
                  </label>
                </div>
              )}

              {/* Primary Action Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm tracking-wide shadow-lg shadow-blue-600/25 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-[0.99] mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <span>
                      {authMode === 'login' && 'Sign In to Study Top'}
                      {authMode === 'signup' && 'Create Free Account'}
                      {authMode === 'forgot' && 'Send Recovery Link'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Bottom Switcher Links */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            {authMode === 'login' ? (
              <>
                <span className="text-slate-500 font-medium">Don't have an account yet?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Create Account →
                </button>
              </>
            ) : (
              <>
                <span className="text-slate-500 font-medium">Already have an account?</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className="font-extrabold text-blue-600 hover:text-blue-700 cursor-pointer"
                >
                  Sign In instead →
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
