import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Mail,
  GraduationCap,
  School,
  Globe,
  Lock,
  Download,
  Trash2,
  Check,
  Save,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Camera,
  Copy,
  Award,
  Flame,
  Clock,
  TrendingUp,
  Edit3,
  Eye,
  Sparkles,
  AtSign
} from 'lucide-react';
import { UserProfile } from '../../../types';
import { GoogleAdsBanner } from '../../ads/GoogleAdsBanner';

interface UserProfilePageProps {
  userProfile: UserProfile | null;
  user: any;
  onUpdateProfile?: (updates: Partial<UserProfile>) => void;
  onSelectLanguage: () => void;
  onSignOut: () => void;
  onNavigateToLeaderboard?: () => void;
  onNavigateToSettings?: () => void;
}

const COVER_BANNERS = [
  {
    name: 'Royal Academic Blue',
    css: 'linear-gradient(135deg, #0f172a 0%, #1e40af 55%, #0284c7 100%)'
  },
  {
    name: 'Emerald Research',
    css: 'linear-gradient(135deg, #064e3b 0%, #059669 55%, #10b981 100%)'
  },
  {
    name: 'Deep Slate & Indigo',
    css: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 55%, #4f46e5 100%)'
  },
  {
    name: 'Sunset Scholar',
    css: 'linear-gradient(135deg, #7c2d12 0%, #d97706 55%, #f59e0b 100%)'
  },
  {
    name: 'Crimson University',
    css: 'linear-gradient(135deg, #4c0519 0%, #be123c 55%, #f43f5e 100%)'
  }
];

const THEME_COLORS = [
  { name: 'Study Blue', hex: '#2563eb' },
  { name: 'Indigo Focus', hex: '#4f46e5' },
  { name: 'Emerald Stem', hex: '#059669' },
  { name: 'Amber Gold', hex: '#d97706' },
  { name: 'Crimson Honor', hex: '#e11d48' },
  { name: 'Slate Executive', hex: '#0f172a' }
];

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  userProfile,
  user,
  onUpdateProfile,
  onSelectLanguage,
  onSignOut,
  onNavigateToLeaderboard,
  onNavigateToSettings
}) => {
  const currentUid = user?.uid || 'USR-ADMIN-MANJIT-01';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);
  const [officialBadges, setOfficialBadges] = useState<any[]>([]);
  const [leaderboardRank, setLeaderboardRank] = useState<number>(1);
  const [totalParticipants, setTotalParticipants] = useState<number>(1);

  // Form states
  const [fullName, setFullName] = useState(userProfile?.displayName || user?.displayName || 'Student Scholar');
  const [usernameInput, setUsernameInput] = useState('scholar');
  const [usernameCheck, setUsernameCheck] = useState<{
    checking: boolean;
    available: boolean;
    formatted: string;
    publicUrl: string;
    reason?: string;
  }>({
    checking: false,
    available: true,
    formatted: '@scholar',
    publicUrl: 'studytop.app/@scholar'
  });

  const [avatarUrl, setAvatarUrl] = useState('');
  const [coverBanner, setCoverBanner] = useState(COVER_BANNERS[0].css);
  const [profileThemeColor, setProfileThemeColor] = useState('#2563eb');
  const [bio, setBio] = useState('');
  const [school, setSchool] = useState('');
  const [educationLevel, setEducationLevel] = useState('Secondary / Higher Secondary');
  const [learningInterestsText, setLearningInterestsText] = useState('AI Notes, Problem Solving, Quizzes');
  const [favoriteSubjectsText, setFavoriteSubjectsText] = useState('Mathematics, Science');
  const [showcasedBadges, setShowcasedBadges] = useState<string[]>([]);

  // Privacy settings
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(true);
  const [showStudyStats, setShowStudyStats] = useState(true);
  const [showAchievements, setShowAchievements] = useState(true);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const loadAccountProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/account/profile/${encodeURIComponent(currentUid)}`);
      const data = await res.json();
      if (data.success && data.profile) {
        const p = data.profile;
        setAccountData(p);
        setOfficialBadges(data.officialAchievements || []);
        setLeaderboardRank(data.leaderboardRank || 1);
        setTotalParticipants(data.totalParticipants || 1);

        setFullName(p.fullName || user?.displayName || 'Student Scholar');
        setUsernameInput(p.username || 'scholar');
        setUsernameCheck({
          checking: false,
          available: true,
          formatted: `@${p.username}`,
          publicUrl: `studytop.app/@${p.username}`
        });
        setAvatarUrl(p.avatarUrl || user?.photoURL || '');
        setCoverBanner(p.coverBanner || COVER_BANNERS[0].css);
        setProfileThemeColor(p.profileThemeColor || '#2563eb');
        setBio(p.bio || '');
        setSchool(p.school || '');
        setEducationLevel(p.educationLevel || 'Secondary / Higher Secondary');
        setLearningInterestsText((p.learningInterests || []).join(', '));
        setFavoriteSubjectsText((p.favoriteSubjects || []).join(', '));
        setShowcasedBadges(p.showcasedAchievements || []);

        if (p.privacy) {
          setProfileVisibility(p.privacy.profileVisibility || 'public');
          setShowOnLeaderboard(p.privacy.showOnLeaderboard !== false);
          setShowStudyStats(p.privacy.showStudyStats !== false);
          setShowAchievements(p.privacy.showAchievements !== false);
        }
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    loadAccountProfile();
  }, [currentUid]);

  // Real-time Instagram-style @username availability check
  useEffect(() => {
    const clean = usernameInput.trim().replace(/^@+/, '');
    if (!clean) {
      setUsernameCheck({
        checking: false,
        available: false,
        formatted: '@',
        publicUrl: 'studytop.app/@',
        reason: 'Username is required.'
      });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameCheck(prev => ({ ...prev, checking: true }));
      try {
        const res = await fetch(
          `/api/account/username/check?username=${encodeURIComponent(clean)}&uid=${encodeURIComponent(currentUid)}`
        );
        const data = await res.json();
        setUsernameCheck({
          checking: false,
          available: Boolean(data.available),
          formatted: data.formatted || `@${clean.toLowerCase()}`,
          publicUrl: data.publicUrl || `studytop.app/@${clean.toLowerCase()}`,
          reason: data.reason
        });
      } catch (_) {
        setUsernameCheck(prev => ({ ...prev, checking: false }));
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [usernameInput, currentUid]);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Profile image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setErrorMessage(null);
    setSaveMessage(null);

    if (!usernameCheck.available) {
      setErrorMessage(usernameCheck.reason || 'Please choose an available @username.');
      return;
    }

    try {
      const res = await fetch(`/api/account/profile/${encodeURIComponent(currentUid)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          username: usernameInput.trim().replace(/^@+/, ''),
          avatarUrl,
          coverBanner,
          profileThemeColor,
          bio,
          school,
          educationLevel,
          learningInterests: learningInterestsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          favoriteSubjects: favoriteSubjectsText
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
          showcasedAchievements: showcasedBadges,
          privacy: {
            profileVisibility,
            showOnLeaderboard,
            showStudyStats,
            showAchievements
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Could not update profile.');
        return;
      }

      setAccountData(data.profile);
      if (onUpdateProfile) {
        onUpdateProfile({ displayName: fullName });
      }
      setIsEditing(false);
      setSaveMessage('Profile, @username, and privacy settings saved!');
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (_) {
      setErrorMessage('Network error while saving profile.');
    }
  };

  const toggleShowcaseBadge = (badgeId: string) => {
    setShowcasedBadges(prev => {
      if (prev.includes(badgeId)) {
        return prev.filter(id => id !== badgeId);
      }
      if (prev.length >= 5) return prev;
      return [...prev, badgeId];
    });
  };

  const copyPublicUrl = () => {
    navigator.clipboard?.writeText(`https://${usernameCheck.publicUrl}`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const unlockedSet = new Set(
    (accountData?.unlockedAchievements || []).map((a: any) => a.badgeId)
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans text-slate-900 pb-12">
      {/* Welcome to Study Top Account Identity Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold">
            <span className="text-blue-600 font-black">Welcome to Study Top!</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              Study Top ID: {accountData?.studyTopId || currentUid}
            </span>
            <span aria-hidden="true">·</span>
            <span>Status: {accountData?.accountStatus || 'Active'}</span>
            <span aria-hidden="true">·</span>
            <span>Role: {accountData?.role || 'Student'}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>
              Account Created:{' '}
              <strong className="text-slate-800">
                {accountData?.createdAt
                  ? new Date(accountData.createdAt).toLocaleString()
                  : new Date().toLocaleDateString()}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Last Login:{' '}
              <strong className="text-slate-800">
                {accountData?.lastLogin
                  ? new Date(accountData.lastLogin).toLocaleString()
                  : 'Active Now'}
              </strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {onNavigateToLeaderboard && (
            <button
              onClick={onNavigateToLeaderboard}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
            >
              Leaderboard Rank #{leaderboardRank}
            </button>
          )}
          <button
            onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            {isEditing ? <Save className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Save Profile' : 'Edit Profile'}</span>
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Profile Hero Card with Cover Banner, Avatar, @Username & Public URL */}
      <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
        {/* Cover Banner */}
        <div
          className="h-36 sm:h-44 p-5 flex items-start justify-between text-white relative"
          style={{ background: coverBanner }}
        >
          <div className="inline-flex items-center gap-2 bg-black/30 backdrop-blur-xs px-3 py-1.5 rounded-xl text-xs font-mono">
            <span>{usernameCheck.publicUrl}</span>
            <button
              onClick={copyPublicUrl}
              className="hover:text-blue-200 cursor-pointer"
              title="Copy Public Profile URL"
            >
              {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {isEditing && (
            <div className="flex items-center gap-1.5 bg-black/35 backdrop-blur-xs p-1.5 rounded-xl">
              {COVER_BANNERS.map((b, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCoverBanner(b.css)}
                  className="w-6 h-6 rounded-lg border border-white/60 cursor-pointer"
                  style={{ background: b.css }}
                  title={b.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Profile Identity Body */}
        <div className="p-6 sm:p-8 -mt-14 relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    referrerPolicy="no-referrer"
                    className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-md bg-white"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-3xl border-4 border-white shadow-md text-white font-black text-3xl flex items-center justify-center"
                    style={{ backgroundColor: profileThemeColor }}
                  >
                    {(fullName || 'S').charAt(0).toUpperCase()}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(true);
                    fileInputRef.current?.click();
                  }}
                  className="absolute -bottom-1 -right-1 p-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-md cursor-pointer"
                  title="Upload Profile Picture"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="pt-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{fullName}</h2>
                <div className="flex flex-wrap items-center gap-2 text-xs mt-0.5">
                  <span className="font-mono font-bold text-blue-600">{usernameCheck.formatted}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">{school || educationLevel}</span>
                  <span aria-hidden="true" className="text-slate-300">·</span>
                  <span className="text-slate-500">
                    Visibility: <strong className="text-slate-800 capitalize">{profileVisibility}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Key Study Stats */}
            <div className="grid grid-cols-4 gap-3 text-center tabular-nums">
              <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] font-bold text-slate-400">Rank</span>
                <span className="text-sm font-black text-slate-900">#{leaderboardRank}</span>
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] font-bold text-slate-400">Points</span>
                <span className="text-sm font-black text-blue-600">
                  {(accountData?.learningPoints ?? 10).toLocaleString()}
                </span>
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] text-slate-400 font-bold">Hours</span>
                <span className="text-sm font-black text-slate-900">
                  {accountData?.totalStudyHours ?? 0.2}h
                </span>
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/80">
                <span className="block text-[10px] text-slate-400 font-bold">Badges</span>
                <span className="text-sm font-black text-amber-600">
                  {accountData?.unlockedAchievements?.length ?? 1}
                </span>
              </div>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
            {bio || 'Add a personal bio and academic introduction to share your learning goals.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              <strong className="text-slate-800">Favorite Subjects:</strong>{' '}
              {favoriteSubjectsText || 'Mathematics, Science'}
            </div>
            <span aria-hidden="true">·</span>
            <div>
              <strong className="text-slate-800">Learning Interests:</strong>{' '}
              {learningInterestsText || 'Notes, Quizzes'}
            </div>
          </div>
        </div>
      </div>

      {/* Instagram-Style @Username & Profile Editor Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Instagram-Style @Username &amp; Personal Identity
            </h3>
            <p className="text-xs text-slate-500">
              Your @username is globally unique across Study Top. Letters, numbers, underscores (_), and periods (.) are permitted.
            </p>
          </div>
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Changes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Instagram-Style Username Field with Green/Red Availability Indicator */}
          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Unique @Username Handle
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono font-black text-slate-400 text-xs">
                @
              </span>
              <input
                type="text"
                value={usernameInput.replace(/^@+/, '')}
                onChange={e => setUsernameInput(e.target.value.replace(/^@+/, '').toLowerCase())}
                placeholder="manjit_ranjan"
                className={`w-full pl-8 pr-9 py-2.5 rounded-xl border text-xs font-mono font-bold outline-none transition-colors ${
                  usernameCheck.available
                    ? 'bg-emerald-50/40 border-emerald-400 text-slate-900 focus:border-emerald-600'
                    : 'bg-rose-50/40 border-rose-400 text-slate-900 focus:border-rose-600'
                }`}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameCheck.available ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-600" />
                )}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-[11px]">
              {usernameCheck.available ? (
                <span className="font-bold text-emerald-600">
                  Available! Public URL: {usernameCheck.publicUrl}
                </span>
              ) : (
                <span className="font-bold text-rose-600">
                  {usernameCheck.reason || 'Username unavailable'}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              School / Educational Institution (Optional)
            </label>
            <input
              type="text"
              value={school}
              onChange={e => setSchool(e.target.value)}
              placeholder="e.g. Delhi Public School / IIT / Stanford"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Class &amp; Education Level (Optional)
            </label>
            <select
              value={educationLevel}
              onChange={e => setEducationLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-800 outline-none"
            >
              <option>Class 8 (Middle School)</option>
              <option>Class 9 (Secondary)</option>
              <option>Class 10 (Board Finals)</option>
              <option>Class 11 (Senior Secondary)</option>
              <option>Class 12 (Board &amp; Competitive)</option>
              <option>Secondary / Higher Secondary</option>
              <option>Undergraduate / University</option>
              <option>Competitive Aspirant (JEE / NEET / UPSC)</option>
              <option>Educator / Researcher</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Bio &amp; Personal Introduction
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={2}
              placeholder="Introduce yourself, your academic goals, and favorite subjects..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Favorite Subjects (Comma-separated)
            </label>
            <input
              type="text"
              value={favoriteSubjectsText}
              onChange={e => setFavoriteSubjectsText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Learning Interests (Comma-separated)
            </label>
            <input
              type="text"
              value={learningInterestsText}
              onChange={e => setLearningInterestsText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Profile Accent Color
            </label>
            <div className="flex items-center gap-2 pt-1">
              {THEME_COLORS.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setProfileThemeColor(c.hex)}
                  className="w-7 h-7 rounded-xl border-2 flex items-center justify-center text-white cursor-pointer"
                  style={{
                    backgroundColor: c.hex,
                    borderColor: profileThemeColor === c.hex ? '#0f172a' : 'transparent'
                  }}
                  title={c.name}
                >
                  {profileThemeColor === c.hex && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-slate-600 uppercase mb-1">
              Private Registered Email (Never Shown Publicly)
            </label>
            <input
              type="email"
              value={accountData?.email || user?.email || 'Guest Account'}
              disabled
              className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Achievement & Badge System Showcase */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Achievement Badges &amp; Profile Showcase ({unlockedSet.size} / {officialBadges.length} Unlocked)
            </h3>
            <p className="text-xs text-slate-500">
              Click any unlocked badge to feature it in your top 5 showcased achievements on the Global Leaderboard.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600">
            Showcased: {showcasedBadges.length} / 5
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {officialBadges.map((badge: any) => {
            const isUnlocked = unlockedSet.has(badge.id);
            const isShowcased = showcasedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                onClick={() => isUnlocked && toggleShowcaseBadge(badge.id)}
                className={`p-4 rounded-2xl border transition-all ${
                  isUnlocked
                    ? isShowcased
                      ? 'bg-blue-50/60 border-blue-500 cursor-pointer'
                      : 'bg-white border-slate-200 hover:border-blue-300 cursor-pointer'
                    : 'bg-slate-50 border-slate-200/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Award className={`w-5 h-5 ${isUnlocked ? 'text-amber-500' : 'text-slate-400'}`} />
                  <span className="font-mono text-[10px] font-bold text-slate-500">
                    +{badge.pointsReward} pts
                  </span>
                </div>
                <div className="text-xs font-black text-slate-900">{badge.title}</div>
                <p className="text-[11px] text-slate-500 mt-1 leading-snug">{badge.description}</p>
                <div className="mt-2 pt-2 border-t border-slate-100 text-[10px] font-bold">
                  {isUnlocked ? (
                    <span className={isShowcased ? 'text-blue-600' : 'text-emerald-600'}>
                      {isShowcased ? 'Showcased on Profile' : 'Unlocked · Click to Showcase'}
                    </span>
                  ) : (
                    <span className="text-slate-400">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Privacy Controls Section */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Profile Privacy &amp; Visibility Controls</h3>
            <p className="text-xs text-slate-500">
              Control what other students can see at {usernameCheck.publicUrl}. Your email address is never exposed publicly.
            </p>
          </div>
          <button
            onClick={handleSaveProfile}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer"
          >
            Save Privacy
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="font-black text-slate-900">Public vs Private Profile</div>
              <div className="text-[11px] text-slate-500">Allow others to view your public profile URL</div>
            </div>
            <select
              value={profileVisibility}
              onChange={e => setProfileVisibility(e.target.value as 'public' | 'private')}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800"
            >
              <option value="public">Public Profile</option>
              <option value="private">Private Profile</option>
            </select>
          </div>

          <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-black text-slate-900">Leaderboard Participation</div>
              <div className="text-[11px] text-slate-500">Display my @username on the Global Leaderboard</div>
            </div>
            <input
              type="checkbox"
              checked={showOnLeaderboard}
              onChange={e => setShowOnLeaderboard(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
          </label>

          <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-black text-slate-900">Show Study Statistics</div>
              <div className="text-[11px] text-slate-500">Display learning points, hours, and streak publicly</div>
            </div>
            <input
              type="checkbox"
              checked={showStudyStats}
              onChange={e => setShowStudyStats(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
          </label>

          <label className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between cursor-pointer">
            <div>
              <div className="font-black text-slate-900">Show Achievements &amp; Badges</div>
              <div className="text-[11px] text-slate-500">Display unlocked badges on public profile</div>
            </div>
            <input
              type="checkbox"
              checked={showAchievements}
              onChange={e => setShowAchievements(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600"
            />
          </label>
        </div>
      </div>

      <GoogleAdsBanner slot="profile" />
    </div>
  );
};
