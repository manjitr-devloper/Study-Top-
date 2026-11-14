import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Award,
  Flame,
  Clock,
  TrendingUp,
  Search,
  Sparkles,
  CheckCircle2,
  User,
  AtSign,
  BookOpen,
  MessageSquare,
  Heart,
  Send,
  ExternalLink,
  X,
  RefreshCw,
  ShieldCheck,
  Calculator,
  Calendar,
  FileText,
  Zap,
  Globe
} from 'lucide-react';
import { GoogleAdsBanner } from '../../ads/GoogleAdsBanner';

interface GlobalLeaderboardPageProps {
  user: any;
  userProfile?: any;
  onOpenProfile?: () => void;
}

type LeaderboardCategory =
  | 'global'
  | 'weekly'
  | 'monthly'
  | 'daily'
  | 'subject'
  | 'consistent'
  | 'hours'
  | 'achievements';

const RANKING_CATEGORIES: Array<{ id: LeaderboardCategory; label: string }> = [
  { id: 'global', label: '1. Global Top Students' },
  { id: 'weekly', label: '2. Weekly Top Students' },
  { id: 'monthly', label: '3. Monthly Top Students' },
  { id: 'daily', label: '4. Daily Top Students' },
  { id: 'subject', label: '5. Subject-Wise Rankings' },
  { id: 'consistent', label: '6. Most Consistent' },
  { id: 'hours', label: '7. Most Study Hours' },
  { id: 'achievements', label: '8. Most Achievements' }
];

const SUBJECT_OPTIONS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'General'
];

export const GlobalLeaderboardPage: React.FC<GlobalLeaderboardPageProps> = ({
  user,
  onOpenProfile
}) => {
  const [activeView, setActiveView] = useState<'leaderboard' | 'social_feed'>('leaderboard');
  const [category, setCategory] = useState<LeaderboardCategory>('global');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [entries, setEntries] = useState<any[]>([]);
  const [totalParticipants, setTotalParticipants] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchHandle, setSearchHandle] = useState<string>('');

  // Public Profile Inspector Modal (`studytop.app/@username`)
  const [inspectedPublicProfile, setInspectedPublicProfile] = useState<any | null>(null);
  const [loadingPublicProfile, setLoadingPublicProfile] = useState<boolean>(false);

  // Verified Learning Activity Feedback
  const [activityNotice, setActivityNotice] = useState<string | null>(null);
  const [awardingActivity, setAwardingActivity] = useState<boolean>(false);

  // Social Study Feed State
  const [socialPosts, setSocialPosts] = useState<any[]>([]);
  const [newPostSubject, setNewPostSubject] = useState('Mathematics');
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostType, setNewPostType] = useState<'study_tip' | 'note_snippet' | 'achievement' | 'quiz_score'>('study_tip');
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [postingSocial, setPostingSocial] = useState(false);

  const currentUid = user?.uid || 'USR-ADMIN-MANJIT-01';

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        category,
        ...(category === 'subject' ? { subject: selectedSubject } : {}),
        limit: '100'
      });
      const res = await fetch(`/api/leaderboard?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        setTotalParticipants(data.totalParticipants || 0);
      }
    } catch (_) {}
    setLoading(false);
  }, [category, selectedSubject]);

  const fetchSocialFeed = useCallback(async () => {
    try {
      const res = await fetch('/api/social/feed');
      const data = await res.json();
      if (data.success) {
        setSocialPosts(data.posts || []);
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchLeaderboard();
    fetchSocialFeed();
  }, [fetchLeaderboard, fetchSocialFeed]);

  const handleInspectUsername = async (rawUsername: string) => {
    const clean = rawUsername.replace(/^@+/, '').trim();
    if (!clean) return;
    setLoadingPublicProfile(true);
    try {
      const res = await fetch(`/api/profile/public/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.found) {
        setInspectedPublicProfile(data.profile);
      } else {
        setActivityNotice(`Public profile @${clean} was not found or is private.`);
        setTimeout(() => setActivityNotice(null), 3500);
      }
    } catch (_) {}
    setLoadingPublicProfile(false);
  };

  const handleCompleteVerifiedActivity = async (
    activityType: 'study_session' | 'practice_quiz' | 'high_quiz_score' | 'learning_challenge',
    label: string,
    minutes: number
  ) => {
    if (!currentUid || awardingActivity) return;
    setAwardingActivity(true);
    try {
      const res = await fetch('/api/account/activity/award', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUid,
          activityType,
          subject: selectedSubject,
          studyMinutes: minutes,
          description: `Verified ${label} (${selectedSubject})`
        })
      });
      const data = await res.json();
      if (data.success) {
        const badgeMsg =
          data.newlyUnlockedBadges && data.newlyUnlockedBadges.length > 0
            ? ` + Unlocked Badge: ${data.newlyUnlockedBadges.map((b: any) => b.title).join(', ')}!`
            : '';
        setActivityNotice(
          `Verified! +${data.pointsAwarded} Learning Points awarded (Total: ${data.totalPoints} pts).${badgeMsg}`
        );
        fetchLeaderboard();
      } else {
        setActivityNotice(data.reason || 'Please wait before logging another activity.');
      }
    } catch (_) {
      setActivityNotice('Could not verify activity at this moment.');
    }
    setAwardingActivity(false);
    setTimeout(() => setActivityNotice(null), 4500);
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || postingSocial) return;
    setPostingSocial(true);
    try {
      const res = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: currentUid,
          subject: newPostSubject,
          content: newPostContent.trim(),
          attachmentType: newPostType,
          attachmentTitle: `${newPostSubject} · ${newPostType.replace(/_/g, ' ').toUpperCase()}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewPostContent('');
        fetchSocialFeed();
        setActivityNotice('Your study update has been shared on the Study Top Social Wall!');
        setTimeout(() => setActivityNotice(null), 3500);
      }
    } catch (_) {}
    setPostingSocial(false);
  };

  const handleLikePost = async (postId: string) => {
    try {
      await fetch('/api/social/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, uid: currentUid })
      });
      fetchSocialFeed();
    } catch (_) {}
  };

  const handleAddComment = async (postId: string) => {
    const text = (commentInputs[postId] || '').trim();
    if (!text) return;
    try {
      const res = await fetch('/api/social/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, uid: currentUid, text })
      });
      if (res.ok) {
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        fetchSocialFeed();
      }
    } catch (_) {}
  };

  const filteredEntries = entries.filter(e => {
    if (!searchHandle.trim()) return true;
    const q = searchHandle.toLowerCase().replace(/^@/, '');
    return (
      (e.fullName || '').toLowerCase().includes(q) ||
      (e.username || '').toLowerCase().includes(q) ||
      (e.school || '').toLowerCase().includes(q)
    );
  });

  const topThree = filteredEntries.slice(0, 3);
  const myEntry = entries.find(e => e.uid === currentUid);

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-slate-900 pb-12">
      {/* Top Executive Header */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600">
              <span>Study Top 3.0 Competitive Learning &amp; Social Study Network</span>
              <span aria-hidden="true">·</span>
              <span>{totalParticipants} Verified Students</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
              Global Student Leaderboard &amp; Social Study Hub
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Earn verified learning points from study sessions, practice quizzes, and academic challenges. Click any @username to inspect their public profile.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveView('leaderboard')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeView === 'leaderboard'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Global Leaderboard
              </button>
              <button
                onClick={() => setActiveView('social_feed')}
                className={`px-3.5 py-2 rounded-lg text-xs font-black transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  activeView === 'social_feed'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Social Study Wall ({socialPosts.length})
              </button>
            </div>

            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black cursor-pointer whitespace-nowrap shrink-0"
              >
                My @Username &amp; Profile
              </button>
            )}
          </div>
        </div>

        {/* My Current Standing Strip */}
        {myEntry && (
          <div className="mt-5 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                #{myEntry.rank}
              </div>
              <div>
                <div className="font-black text-slate-900">
                  Your Standing: Rank #{myEntry.rank} · {myEntry.fullName}{' '}
                  <span className="text-blue-600 font-mono">({myEntry.formattedUsername})</span>
                </div>
                <div className="text-slate-500">
                  Public Profile URL: <span className="font-mono text-slate-700">{myEntry.publicUrl}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 tabular-nums">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">Verified Points</span>
                <span className="font-black text-sm text-blue-600">{myEntry.learningPoints.toLocaleString()} pts</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">Study Streak</span>
                <span className="font-black text-sm text-amber-600">{myEntry.studyStreak} days</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">Study Hours</span>
                <span className="font-black text-sm text-slate-800">{myEntry.totalStudyHours} hrs</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">Achievements</span>
                <span className="font-black text-sm text-emerald-600">{myEntry.achievementsCount} badges</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {activityNotice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{activityNotice}</span>
          </div>
          <button onClick={() => setActivityNotice(null)} className="text-emerald-700 font-black cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {activeView === 'leaderboard' ? (
        <>
          {/* Verified Learning Points Activity Bar */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Earn Verified Learning Points (Backend Anti-Cheat Validated)
                </h2>
                <p className="text-xs text-slate-500">
                  Points are awarded strictly for verified study activities — never for repeated logins.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-blue-600">
                Active Subject: {selectedSubject}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                onClick={() => handleCompleteVerifiedActivity('study_session', 'Focused Study Session', 25)}
                disabled={awardingActivity}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span>Complete Study Session</span>
                  <span className="font-mono text-blue-600">+10 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Logs +25 mins verified study time</p>
              </button>

              <button
                onClick={() => handleCompleteVerifiedActivity('practice_quiz', 'Practice Quiz Completion', 15)}
                disabled={awardingActivity}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span>Complete Practice Quiz</span>
                  <span className="font-mono text-emerald-600">+15 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Unlocks Quiz Master progress</p>
              </button>

              <button
                onClick={() => handleCompleteVerifiedActivity('high_quiz_score', 'High Accuracy Quiz (90%+)', 20)}
                disabled={awardingActivity}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span>High Quiz Score Mastery</span>
                  <span className="font-mono text-purple-600">+20 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Verified 90%+ mastery score</p>
              </button>

              <button
                onClick={() => handleCompleteVerifiedActivity('learning_challenge', 'Daily Academic Challenge', 30)}
                disabled={awardingActivity}
                className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs font-black text-slate-900">
                  <span>Complete Learning Challenge</span>
                  <span className="font-mono text-amber-600">+25 pts</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Full problem-set synthesis</p>
              </button>
            </div>
          </div>

          {/* 8 Ranking Category Selector Tabs */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {RANKING_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    category === cat.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
              {category === 'subject' ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-500 mr-1">Subject:</span>
                  {SUBJECT_OPTIONS.map(subj => (
                    <button
                      key={subj}
                      onClick={() => setSelectedSubject(subj)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                        selectedSubject === subj
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {subj}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 font-medium">
                  Showing verified rankings for <span className="font-bold text-slate-800">{RANKING_CATEGORIES.find(c => c.id === category)?.label}</span>
                </div>
              )}

              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchHandle}
                  onChange={e => setSearchHandle(e.target.value)}
                  placeholder="Search student or @username..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Top Three Students Special Podium Cards (Gold, Silver, Bronze Champions) */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topThree.map((champ, idx) => {
                const rank = idx + 1;
                const podiumSpec =
                  rank === 1
                    ? {
                        title: 'Rank #1 · Gold Champion',
                        border: 'border-amber-300 bg-gradient-to-b from-amber-50/70 to-white',
                        accent: 'text-amber-700',
                        medalBg: 'bg-amber-500 text-white'
                      }
                    : rank === 2
                    ? {
                        title: 'Rank #2 · Silver Champion',
                        border: 'border-slate-300 bg-gradient-to-b from-slate-100/70 to-white',
                        accent: 'text-slate-700',
                        medalBg: 'bg-slate-600 text-white'
                      }
                    : {
                        title: 'Rank #3 · Bronze Champion',
                        border: 'border-orange-300 bg-gradient-to-b from-orange-50/60 to-white',
                        accent: 'text-orange-800',
                        medalBg: 'bg-orange-600 text-white'
                      };

                return (
                  <motion.div
                    key={champ.uid}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.05 }}
                    onClick={() => handleInspectUsername(champ.username)}
                    className={`rounded-3xl border p-6 shadow-xs cursor-pointer transition-transform hover:-translate-y-0.5 ${podiumSpec.border}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className={`text-xs font-black uppercase tracking-wider ${podiumSpec.accent}`}>
                        {podiumSpec.title}
                      </span>
                      <span className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center ${podiumSpec.medalBg}`}>
                        #{rank}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5">
                      {champ.avatarUrl ? (
                        <img
                          src={champ.avatarUrl}
                          alt={champ.fullName}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-2xl text-white font-black text-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: champ.profileThemeColor || '#2563eb' }}
                        >
                          {(champ.fullName || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-base font-black text-slate-900 truncate">{champ.fullName}</h3>
                        <p className="text-xs font-mono font-bold text-blue-600 truncate">
                          {champ.formattedUsername}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {champ.school || champ.educationLevel || 'Verified Study Top Scholar'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-200/70 text-center tabular-nums">
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold">Score</span>
                        <span className="text-sm font-black text-slate-900">
                          {champ.categoryScore} {champ.categoryUnit}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold">Streak</span>
                        <span className="text-sm font-black text-amber-600">{champ.studyStreak}d</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-500 font-bold">Study Time</span>
                        <span className="text-sm font-black text-slate-900">{champ.totalStudyHours}h</span>
                      </div>
                    </div>

                    {champ.showcasedAchievements && champ.showcasedAchievements.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-600">
                        <span className="font-bold truncate">
                          Badges: {champ.showcasedAchievements.map((b: any) => b.title).slice(0, 2).join(' · ')}
                        </span>
                        <span className="font-mono font-bold text-slate-400 shrink-0">
                          {champ.achievementsCount} total
                        </span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Google Ads Placement (Configured with manjitranjan180513@gmail.com) */}
          <GoogleAdsBanner slot="leaderboard" />

          {/* Complete Leaderboard Profile Cards List */}
          <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Complete Verified Rankings ({filteredEntries.length} Students)
                </h3>
                <p className="text-xs text-slate-500">
                  Click any scholar row to open their public Study Top profile (studytop.app/@username)
                </p>
              </div>
              <button
                onClick={fetchLeaderboard}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="divide-y divide-slate-200/70">
              {filteredEntries.length === 0 ? (
                <div className="p-10 text-center text-xs text-slate-500 font-semibold">
                  No students matched your search filter.
                </div>
              ) : (
                filteredEntries.map(entry => (
                  <div
                    key={entry.uid}
                    onClick={() => handleInspectUsername(entry.username)}
                    className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-800 font-mono font-black text-xs flex items-center justify-center shrink-0 tabular-nums">
                        #{entry.rank}
                      </div>

                      {entry.avatarUrl ? (
                        <img
                          src={entry.avatarUrl}
                          alt={entry.fullName}
                          referrerPolicy="no-referrer"
                          className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-2xl text-white font-black text-base flex items-center justify-center shrink-0"
                          style={{ backgroundColor: entry.profileThemeColor || '#2563eb' }}
                        >
                          {(entry.fullName || 'S').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900 truncate">{entry.fullName}</span>
                          <span className="text-xs font-mono font-bold text-blue-600 truncate">
                            {entry.formattedUsername}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{entry.role}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{entry.publicUrl}</span>
                          {entry.showcasedAchievements?.length > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-700 font-medium">
                                {entry.showcasedAchievements.map((b: any) => b.title).slice(0, 2).join(', ')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0 tabular-nums text-xs">
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">Learning Points</span>
                        <span className="font-mono font-black text-sm text-blue-600">
                          {entry.learningPoints.toLocaleString()} pts
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">Streak</span>
                        <span className="font-mono font-bold text-amber-600">{entry.studyStreak} days</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">Study Hours</span>
                        <span className="font-mono font-bold text-slate-800">{entry.totalStudyHours} hrs</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">Badges</span>
                        <span className="font-mono font-bold text-emerald-600">{entry.achievementsCount}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      ) : (
        /* Social Media Study Wall View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Create Study Post + Social Feed */}
          <div className="lg:col-span-2 space-y-5">
            <form
              onSubmit={handleCreatePost}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">
                  Share a Study Milestone, Note Snippet, or Exam Tip
                </h3>
                <span className="text-xs font-mono text-blue-600 font-bold">
                  Posting as {myEntry?.formattedUsername || '@scholar'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  value={newPostSubject}
                  onChange={e => setNewPostSubject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  {SUBJECT_OPTIONS.map(s => (
                    <option key={s} value={s}>
                      Subject: {s}
                    </option>
                  ))}
                </select>

                <select
                  value={newPostType}
                  onChange={e => setNewPostType(e.target.value as any)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="study_tip">Study Tip / Concept Summary</option>
                  <option value="note_snippet">Revision Note Snippet</option>
                  <option value="achievement">Achievement Milestone</option>
                  <option value="quiz_score">Quiz Victory</option>
                </select>
              </div>

              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                rows={3}
                placeholder="Share a key formula, concept explanation, or study milestone with the Study Top community..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500"
              />

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={postingSocial || !newPostContent.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{postingSocial ? 'Publishing...' : 'Publish to Study Wall'}</span>
                </button>
              </div>
            </form>

            <GoogleAdsBanner slot="social_feed" />

            {/* Posts List */}
            <div className="space-y-4">
              {socialPosts.map(post => {
                const likedByMe = Array.isArray(post.likes) && post.likes.includes(currentUid);
                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() => handleInspectUsername(post.authorUsername)}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                          {(post.authorName || 'S').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-black text-slate-900">{post.authorName}</span>
                            <span className="text-xs font-mono font-bold text-blue-600">
                              @{post.authorUsername}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {post.subject} · {new Date(post.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    <div className="flex items-center gap-5 pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => handleLikePost(post.id)}
                        className={`flex items-center gap-1.5 font-bold cursor-pointer ${
                          likedByMe ? 'text-rose-600' : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedByMe ? 'fill-rose-600' : ''}`} />
                        <span>{post.likes?.length || 0} Likes</span>
                      </button>

                      <span className="flex items-center gap-1.5 font-bold text-slate-500">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments?.length || 0} Comments</span>
                      </span>
                    </div>

                    {/* Comments */}
                    {post.comments && post.comments.length > 0 && (
                      <div className="space-y-2 pt-2 bg-slate-50 rounded-2xl p-3">
                        {post.comments.map((c: any) => (
                          <div key={c.id} className="text-xs">
                            <span className="font-black text-slate-900">{c.authorName}</span>{' '}
                            <span className="font-mono text-blue-600">@{c.authorUsername}</span>:{' '}
                            <span className="text-slate-700">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add Comment Input */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={e =>
                          setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Write a supportive study reply..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Top Scholars Quick Directory */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-black text-slate-900">Top Ranked Scholars</h3>
              <div className="space-y-2.5">
                {entries.slice(0, 6).map(e => (
                  <div
                    key={e.uid}
                    onClick={() => handleInspectUsername(e.username)}
                    className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-slate-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-black text-xs text-slate-400">#{e.rank}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black text-slate-900 truncate">{e.fullName}</div>
                        <div className="text-[11px] font-mono text-blue-600 truncate">
                          {e.formattedUsername}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black text-slate-800 shrink-0">
                      {e.learningPoints} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Public @username Profile Modal (`studytop.app/@username`) */}
      <AnimatePresence>
        {inspectedPublicProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-xl bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xl"
            >
              <div
                className="h-28 relative p-5 flex items-start justify-between text-white"
                style={{
                  background:
                    inspectedPublicProfile.coverBanner ||
                    'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)'
                }}
              >
                <span className="text-xs font-mono font-bold bg-black/30 backdrop-blur-xs px-3 py-1 rounded-lg">
                  {inspectedPublicProfile.publicUrl}
                </span>
                <button
                  onClick={() => setInspectedPublicProfile(null)}
                  className="p-1.5 rounded-xl bg-black/30 hover:bg-black/50 text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 -mt-10 relative space-y-4">
                <div className="flex items-end justify-between gap-4">
                  {inspectedPublicProfile.avatarUrl ? (
                    <img
                      src={inspectedPublicProfile.avatarUrl}
                      alt={inspectedPublicProfile.fullName}
                      referrerPolicy="no-referrer"
                      className="w-20 h-20 rounded-3xl object-cover border-4 border-white shadow-md bg-white"
                    />
                  ) : (
                    <div
                      className="w-20 h-20 rounded-3xl border-4 border-white shadow-md text-white font-black text-2xl flex items-center justify-center"
                      style={{ backgroundColor: inspectedPublicProfile.profileThemeColor || '#2563eb' }}
                    >
                      {(inspectedPublicProfile.fullName || 'S').charAt(0).toUpperCase()}
                    </div>
                  )}

                  {inspectedPublicProfile.leaderboardRank && (
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-slate-400 block">Global Rank</span>
                      <span className="text-xl font-black text-blue-600 tabular-nums">
                        #{inspectedPublicProfile.leaderboardRank}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900">{inspectedPublicProfile.fullName}</h3>
                  <p className="text-xs font-mono font-bold text-blue-600">
                    {inspectedPublicProfile.formattedUsername} · {inspectedPublicProfile.role}
                  </p>
                </div>

                {inspectedPublicProfile.isPrivate ? (
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 font-semibold">
                    This scholar has set their profile to Private. Email addresses and personal data are never exposed publicly.
                  </div>
                ) : (
                  <>
                    {inspectedPublicProfile.bio && (
                      <p className="text-xs text-slate-700 leading-relaxed">{inspectedPublicProfile.bio}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {inspectedPublicProfile.school && <span>{inspectedPublicProfile.school}</span>}
                      {inspectedPublicProfile.educationLevel && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{inspectedPublicProfile.educationLevel}</span>
                        </>
                      )}
                      {inspectedPublicProfile.createdAt && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Joined {new Date(inspectedPublicProfile.createdAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {inspectedPublicProfile.studyStats && (
                      <div className="grid grid-cols-4 gap-2.5 pt-2 tabular-nums text-center">
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="block text-[10px] text-slate-400 font-bold">Points</span>
                          <span className="font-black text-sm text-blue-600">
                            {inspectedPublicProfile.studyStats.learningPoints}
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="block text-[10px] text-slate-400 font-bold">Hours</span>
                          <span className="font-black text-sm text-slate-900">
                            {inspectedPublicProfile.studyStats.totalStudyHours}h
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="block text-[10px] text-slate-400 font-bold">Streak</span>
                          <span className="font-black text-sm text-amber-600">
                            {inspectedPublicProfile.studyStats.studyStreak}d
                          </span>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                          <span className="block text-[10px] text-slate-400 font-bold">Activities</span>
                          <span className="font-black text-sm text-emerald-600">
                            {inspectedPublicProfile.studyStats.completedActivities}
                          </span>
                        </div>
                      </div>
                    )}

                    {inspectedPublicProfile.achievements?.length > 0 && (
                      <div className="pt-2">
                        <h4 className="text-[11px] font-black uppercase text-slate-400 mb-2">
                          Unlocked Achievement Badges ({inspectedPublicProfile.achievements.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {inspectedPublicProfile.achievements.slice(0, 6).map((a: any) => (
                            <div
                              key={a.badgeId}
                              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                            >
                              <div className="font-black text-slate-900">
                                {a.definition?.title || a.badgeId}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {a.definition?.description}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
