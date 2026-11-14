import React, { useState } from 'react';
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Compass
} from 'lucide-react';
import {
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInAnonymously,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, setCachedAccessToken, getAccessToken } from '../lib/firebase';
import { supabaseService } from '../lib/supabase';
import { StudyTopLogo } from './StudyTopLogo';

type AuthMode = 'sign-in' | 'create-account' | 'guest';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onOpenAdmin?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenAdmin
}) => {
  // Current tab mode: 'sign-in', 'create-account', or 'guest'
  const [authMode, setAuthMode] = useState<AuthMode>('sign-in');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading & Feedback state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Signing you in...');
  const [loadingSubtext, setLoadingSubtext] = useState('Securing your academic workspace...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccessTransition, setIsSuccessTransition] = useState(false);

  // Clear errors when switching tabs
  const handleSwitchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setErrorMessage(null);
  };

  // Helper to record failed login attempts as security events (NEVER sends passwords)
  const recordFailedAuthEvent = (attemptedEmail: string, provider: 'google' | 'email' | 'guest', reason: string) => {
    fetch('/api/user/auth-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: attemptedEmail || '',
        provider,
        reason
      })
    }).catch(() => {});
  };

  // Helper to handle post-auth sync & redirection
  const handleSuccessfulAuth = async (userObj: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string | null;
    isGuest: boolean;
    provider: 'google' | 'email' | 'guest';
    eventType: 'GOOGLE_AUTH' | 'SIGN_IN' | 'CREATE_ACCOUNT' | 'GUEST_PASS';
    emailVerified?: boolean;
    accessToken?: string | null;
  }) => {
    setLoadingText('Loading your workspace...');
    setLoadingSubtext('Preparing your notes, subjects, and study tools...');

    const now = Date.now();
    const cleanEmail = userObj.isGuest ? '' : (userObj.email || '');
    const cleanName = userObj.displayName || (userObj.isGuest ? 'Guest Student' : 'Student');
    const loginProviderLabel: 'Google' | 'Email' | 'Guest' =
      userObj.provider === 'google' ? 'Google' : userObj.provider === 'guest' ? 'Guest' : 'Email';
    const isVerified = Boolean(userObj.emailVerified || userObj.provider === 'google');

    try {
      const activeOAuthToken = userObj.accessToken || (await getAccessToken());
      const resolvedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (activeOAuthToken) {
        syncHeaders['Authorization'] = `Bearer ${activeOAuthToken}`;
      }

      // 0. Automatically sync registration/login event to Backend Admin-Only User Authentication Records DB & Gmail Notification Service
      await fetch('/api/user/sync-account', {
        method: 'POST',
        headers: syncHeaders,
        body: JSON.stringify({
          uid: userObj.uid,
          email: cleanEmail,
          displayName: cleanName,
          fullName: cleanName,
          photoURL: userObj.photoURL || null,
          provider: userObj.provider,
          eventType: userObj.eventType,
          isGuest: userObj.isGuest,
          role: userObj.isGuest ? 'Guest' : 'Student',
          emailVerified: isVerified,
          timeZone: resolvedTimeZone,
          gmailAccessToken: activeOAuthToken || undefined,
          activityDescription: `Authenticated via ${loginProviderLabel} (${userObj.eventType})`
        })
      }).catch(() => {});

      // 1. Sync to Firestore users collection with all 12 schema fields (never fabricate guest emails or store secrets)
      const userDocRef = doc(db, 'users', userObj.uid);
      await setDoc(
        userDocRef,
        {
          uid: userObj.uid,
          full_name: cleanName,
          displayName: cleanName,
          email: cleanEmail,
          role: userObj.isGuest ? 'Guest' : 'Student',
          login_provider: loginProviderLabel,
          created_at: now,
          last_login_at: now,
          last_logout_at: null,
          account_status: 'Active',
          login_count: 1,
          email_verified: isVerified ? 'Yes' : 'No',
          last_activity: now,
          photoURL: userObj.photoURL || null,
          language: 'English',
          profession: 'Student',
          lastLogin: now,
          account_type: userObj.isGuest ? 'guest' : 'registered',
          authentication_provider: userObj.provider,
          isGuest: userObj.isGuest
        },
        { merge: true }
      ).catch((fsErr) => {
        console.warn('Firestore user profile sync notice:', fsErr);
      });

      // 2. Sync to Supabase profile
      if (!userObj.isGuest && cleanEmail) {
        await supabaseService.syncUserProfile({
          uid: userObj.uid,
          email: cleanEmail,
          displayName: cleanName,
          photoURL: userObj.photoURL || undefined
        }).catch((sbErr) => {
          console.warn('Supabase user profile sync notice:', sbErr);
        });
      }
    } catch (syncErr) {
      console.warn('Post-auth profile sync note:', syncErr);
    }

    // Trigger smooth transition
    setIsSuccessTransition(true);
    setTimeout(() => {
      onLoginSuccess({
        uid: userObj.uid,
        email: cleanEmail,
        displayName: cleanName,
        photoURL: userObj.photoURL || null,
        language: 'English',
        profession: 'Student',
        account_type: userObj.isGuest ? 'guest' : 'registered',
        authentication_provider: userObj.provider,
        isGuest: userObj.isGuest
      });
    }, 600);
  };

  // 1. Continue with Google Authentication
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    setLoadingText('Connecting to Google...');
    setLoadingSubtext('Verifying your Google Account and permissions...');

    try {
      let result: any;
      try {
        result = await signInWithPopup(auth, googleProvider);
      } catch (popupErr: any) {
        if (popupErr.code === 'auth/popup-blocked' || popupErr.code === 'auth/cancelled-popup-request') {
          setLoadingText('Redirecting to Google...');
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw popupErr;
      }

      const user = result.user;

      // Extract OAuth credential access token for Google Classroom and Gmail notifications
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setCachedAccessToken(credential.accessToken);
      }

      await handleSuccessfulAuth({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'Student',
        photoURL: user.photoURL || null,
        isGuest: false,
        provider: 'google',
        eventType: 'GOOGLE_AUTH',
        emailVerified: true,
        accessToken: credential?.accessToken || null
      });
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setIsLoading(false);
      recordFailedAuthEvent(email.trim(), 'google', err.code || err.message || 'Google authentication failed');

      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Google sign-in was cancelled. Please click the button to try again.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Please check your internet connection.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized in Firebase OAuth settings.');
      } else {
        setErrorMessage(err.message || 'Google authentication could not be completed. Please try again.');
      }
    }
  };

  // 2. Sign In (Existing User)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Signing you in...');
    setLoadingSubtext('Authenticating your credentials...');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await handleSuccessfulAuth({
        uid: user.uid,
        email: user.email || cleanEmail,
        displayName: user.displayName || cleanEmail.split('@')[0] || 'Student',
        photoURL: user.photoURL || null,
        isGuest: false,
        provider: 'email',
        eventType: 'SIGN_IN',
        emailVerified: Boolean(user.emailVerified)
      });
    } catch (err: any) {
      // Fallback to Backend Email Auth if Firebase Email/Password provider is not enabled in console
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        try {
          const bRes = await fetch('/api/auth/email-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password })
          });
          const bData = await bRes.json();
          if (bRes.ok && bData.success && bData.user) {
            await handleSuccessfulAuth({
              uid: bData.user.uid,
              email: bData.user.email,
              displayName: bData.user.displayName,
              photoURL: null,
              isGuest: false,
              provider: 'email',
              eventType: 'SIGN_IN',
              emailVerified: false
            });
            return;
          }
        } catch (_) {}
      }

      console.error('Sign-In Error:', err);
      setIsLoading(false);
      recordFailedAuthEvent(cleanEmail, 'email', err.code || err.message || 'Sign-in failed');

      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setErrorMessage('Incorrect email or password. Please verify your credentials or create a new account.');
      } else if (err.code === 'auth/too-many-requests') {
        setErrorMessage('Too many failed attempts. Please wait a few moments before trying again.');
      } else if (err.code === 'auth/user-disabled') {
        setErrorMessage('This account has been disabled. Please contact support for assistance.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network error. Please check your internet connection.');
      } else {
        setErrorMessage(err.message || 'Sign in failed. Please verify your credentials.');
      }
    }
  };

  // 3. Create Account (New User)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName || cleanName.length < 2) {
      setErrorMessage('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!cleanEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your password.');
      return;
    }

    setIsLoading(true);
    setLoadingText('Creating your account...');
    setLoadingSubtext('Setting up your personal profile and notes vault...');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      // Update Firebase Auth profile displayName
      try {
        await updateProfile(user, { displayName: cleanName });
      } catch (pErr) {
        console.warn('Profile name update notice:', pErr);
      }

      await handleSuccessfulAuth({
        uid: user.uid,
        email: user.email || cleanEmail,
        displayName: cleanName,
        photoURL: null,
        isGuest: false,
        provider: 'email',
        eventType: 'CREATE_ACCOUNT',
        emailVerified: Boolean(user.emailVerified)
      });
    } catch (err: any) {
      // Fallback to Backend Email Signup if Firebase Email/Password provider is not enabled in console
      if (err.code === 'auth/operation-not-allowed' || err.code === 'auth/configuration-not-found') {
        try {
          const bRes = await fetch('/api/auth/email-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: cleanEmail, password, fullName: cleanName })
          });
          const bData = await bRes.json();
          if (bRes.ok && bData.success && bData.user) {
            await handleSuccessfulAuth({
              uid: bData.user.uid,
              email: bData.user.email,
              displayName: bData.user.displayName,
              photoURL: null,
              isGuest: false,
              provider: 'email',
              eventType: 'CREATE_ACCOUNT',
              emailVerified: false
            });
            return;
          }
        } catch (_) {}
      }

      console.error('Create Account Error:', err);
      setIsLoading(false);
      recordFailedAuthEvent(cleanEmail, 'email', err.code || err.message || 'Account creation failed');

      if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists. Please Sign In instead.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Password is too weak. Please use at least 6 characters with numbers or letters.');
      } else if (err.code === 'auth/invalid-email') {
        setErrorMessage('Please provide a valid email address.');
      } else if (err.code === 'auth/network-request-failed') {
        setErrorMessage('Network connection error. Please check your internet connection.');
      } else {
        setErrorMessage(err.message || 'Account creation could not be completed. Please try again.');
      }
    }
  };

  // 4. Guest Pass (Name-Only)
  const handleGuestPass = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanGuestName = guestName.trim();
    if (!cleanGuestName || cleanGuestName.length < 2) {
      setErrorMessage('Please enter your name to continue as a guest (at least 2 characters).');
      return;
    }

    setIsLoading(true);
    setLoadingText('Preparing your guest session...');
    setLoadingSubtext('Setting up your temporary guest workspace...');

    try {
      let guestUid: string;
      try {
        const anonCred = await signInAnonymously(auth);
        guestUid = anonCred.user.uid;
        await updateProfile(anonCred.user, { displayName: cleanGuestName }).catch(() => {});
      } catch (anonErr) {
        console.warn('Anonymous auth notice, creating localized guest session:', anonErr);
        guestUid = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }

      await handleSuccessfulAuth({
        uid: guestUid,
        email: '',
        displayName: cleanGuestName,
        photoURL: null,
        isGuest: true,
        provider: 'guest',
        eventType: 'GUEST_PASS',
        emailVerified: false
      });
    } catch (err: any) {
      console.error('Guest Session Error:', err);
      setIsLoading(false);
      recordFailedAuthEvent('', 'guest', err.message || 'Guest session error');
      setErrorMessage(err.message || 'Could not start guest session. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans select-none text-slate-900">
      
      {/* Subtle Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Soft Ambient Blur Spheres */}
        <div 
          className="absolute -top-32 -left-32 w-96 h-96 bg-blue-100/70 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '9s' }} 
        />
        <div 
          className="absolute top-1/2 -right-32 w-96 h-96 bg-indigo-100/60 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '11s' }} 
        />
        <div 
          className="absolute -bottom-32 left-1/3 w-96 h-96 bg-violet-100/50 rounded-full blur-3xl animate-pulse" 
          style={{ animationDuration: '10s' }} 
        />

        {/* Minimal geometric grid texture */}
        <div 
          className="absolute inset-0 opacity-[0.035]" 
          style={{ 
            backgroundImage: `radial-gradient(#2563eb 1.2px, transparent 1.2px)`, 
            backgroundSize: '24px 24px' 
          }} 
        />
      </div>

      {/* Main Authentication Card */}
      <div 
        className={`relative w-full max-w-[440px] bg-white border border-slate-200/90 rounded-3xl shadow-xl shadow-slate-200/60 p-6 sm:p-9 transition-all duration-500 z-10 ${
          isSuccessTransition ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Card Header */}
        <div className="flex flex-col items-center text-center space-y-2.5 mb-6">
          <div className="flex items-center justify-center mb-0.5 transform transition-transform duration-300 hover:scale-105">
            <StudyTopLogo size="lg" showTagline={false} />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Welcome to Study Top
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Your learning journey starts here.
            </p>
          </div>
        </div>

        {/* Mode Selector Segmented Tabs */}
        <div className="mb-6 p-1 bg-slate-100/90 border border-slate-200/60 rounded-2xl flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleSwitchMode('sign-in')}
            disabled={isLoading}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 ${
              authMode === 'sign-in'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('create-account')}
            disabled={isLoading}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 ${
              authMode === 'create-account'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('guest')}
            disabled={isLoading}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 ${
              authMode === 'guest'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Guest Pass
          </button>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed flex-1 font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 1: SIGN IN
            ========================================================================= */}
        {authMode === 'sign-in' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* A. Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-11 px-4 bg-white hover:bg-slate-50/90 active:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              title="Sign in with your Google account"
            >
              <svg 
                className="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" 
                viewBox="0 0 24 24"
              >
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
              <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-tight">
                Continue with Google
              </span>
            </button>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400">
                or sign in with email
              </span>
            </div>

            {/* Email + Password Form */}
            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                    className="w-full h-10.5 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group mt-1"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Switch to Create Account link */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Don't have an account yet?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('create-account')}
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 2: CREATE ACCOUNT
            ========================================================================= */}
        {authMode === 'create-account' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* A. Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-11 px-4 bg-white hover:bg-slate-50/90 active:bg-slate-100 border border-slate-300 hover:border-slate-400 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 shadow-xs hover:shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              title="Sign up with your Google account"
            >
              <svg 
                className="w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110" 
                viewBox="0 0 24 24"
              >
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
              <span className="text-xs sm:text-sm font-semibold text-slate-700 tracking-tight">
                Sign up with Google
              </span>
            </button>

            {/* Subtle Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-[11px] font-semibold text-slate-400">
                or register with email
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Morgan"
                    disabled={isLoading}
                    autoComplete="name"
                    required
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="alex@example.com"
                    disabled={isLoading}
                    autoComplete="email"
                    required
                    className="w-full h-10.5 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password (min. 6 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    disabled={isLoading}
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full h-10.5 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    disabled={isLoading}
                    autoComplete="new-password"
                    className="w-full h-10.5 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md hover:shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group mt-1"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Switch to Sign In link */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleSwitchMode('sign-in')}
                  className="font-bold text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODE 3: GUEST PASS
            ========================================================================= */}
        {authMode === 'guest' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Description */}
            <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                <Compass className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-slate-900">
                  Explore Study Top
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Continue without creating an account. Only your name is required.
                </p>
              </div>
            </div>

            {/* Name-Only Form */}
            <form onSubmit={handleGuestPass} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enter your name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    disabled={isLoading}
                    autoComplete="name"
                    required
                    minLength={2}
                    className="w-full h-11 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>No password, email, or credit card required.</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  You can explore permitted features in Guest Mode and upgrade to save your notes permanently anytime.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-slate-900 hover:bg-slate-800 active:bg-black text-white font-bold text-xs sm:text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed group"
              >
                <span>Continue as Guest</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </button>
            </form>

            {/* Back to Sign In */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => handleSwitchMode('sign-in')}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {/* Card Footer Divider */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col items-center justify-center space-y-1.5 text-center">
          <div className="text-[11px] text-slate-400 font-medium">
            Study Top | Created by Manjit Ranjan
          </div>

          {onOpenAdmin && (
            <button
              type="button"
              onClick={onOpenAdmin}
              className="text-[10px] text-slate-300 hover:text-slate-500 transition-colors cursor-pointer"
            >
              Developer Admin Access
            </button>
          )}
        </div>

        {/* =========================================================================
            PREMIUM ANIMATED LOADER OVERLAY
            Triggers immediately on any login button click until auth completes or fails
            ========================================================================= */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-md rounded-3xl z-40 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
            {/* Centered Study Top Emblem */}
            <div className="relative mb-5 flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute w-20 h-20 rounded-full border-2 border-blue-400/30 animate-ping opacity-30" />
              
              {/* Rotating multi-color gradient spinner */}
              <div 
                className="absolute w-16 h-16 rounded-full border-2 border-transparent border-t-blue-600 border-r-indigo-500 animate-spin" 
                style={{ animationDuration: '1s' }} 
              />
              
              {/* Center Logo container */}
              <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center p-1.5 z-10">
                <StudyTopLogo size="xs" variant="icon" showTagline={false} />
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
                <span>{loadingText}</span>
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                {loadingSubtext}
              </p>
            </div>

            {/* Animated bouncing dots */}
            <div className="flex items-center gap-1.5 mt-5">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          FULL-SCREEN SUCCESS TRANSITION OVERLAY
          Smooth handoff to Dashboard
          ========================================================================= */}
      {isSuccessTransition && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-md z-50 flex flex-col items-center justify-center space-y-3.5 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <CheckCircle2 className="w-7 h-7 text-blue-600 animate-in zoom-in-75 duration-300" />
          </div>
          <div className="text-base font-black text-slate-900">
            Welcome to Study Top
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Opening your personal learning workspace...
          </p>
        </div>
      )}

    </div>
  );
};
