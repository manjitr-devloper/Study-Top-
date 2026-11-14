import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '..', 'data');
const IDENTITY_DB_FILE = path.join(DATA_DIR, 'identity_ecosystem_db.json');

export interface AchievementBadgeDef {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'academic' | 'community' | 'leaderboard';
  iconName: string;
  pointsReward: number;
}

export const OFFICIAL_ACHIEVEMENTS: AchievementBadgeDef[] = [
  {
    id: 'first_study_session',
    title: 'First Study Session',
    description: 'Completed your first verified study session or learning activity on Study Top.',
    category: 'academic',
    iconName: 'Sparkles',
    pointsReward: 10
  },
  {
    id: 'streak_7_days',
    title: '7-Day Study Streak',
    description: 'Maintained a verified daily study streak for 7 consecutive days.',
    category: 'streak',
    iconName: 'Flame',
    pointsReward: 50
  },
  {
    id: 'consistency_30_days',
    title: '30-Day Consistency',
    description: 'Demonstrated academic dedication with 30 days of consistent study.',
    category: 'streak',
    iconName: 'Calendar',
    pointsReward: 150
  },
  {
    id: 'quiz_master',
    title: 'Quiz Master',
    description: 'Completed practice quizzes and achieved high accuracy scores.',
    category: 'academic',
    iconName: 'CheckCircle2',
    pointsReward: 30
  },
  {
    id: 'math_expert',
    title: 'Mathematics Expert',
    description: 'Solved advanced mathematical equations and step-by-step proofs.',
    category: 'academic',
    iconName: 'Calculator',
    pointsReward: 40
  },
  {
    id: 'science_explorer',
    title: 'Science Explorer',
    description: 'Mastered Physics, Chemistry, and Biology concepts with AI verification.',
    category: 'academic',
    iconName: 'Atom',
    pointsReward: 40
  },
  {
    id: 'notes_creator',
    title: 'Notes Creator',
    description: 'Generated and organized structured study notes and revision guides.',
    category: 'academic',
    iconName: 'FileText',
    pointsReward: 25
  },
  {
    id: 'learning_champion',
    title: 'Learning Champion',
    description: 'Surpassed 500 verified learning points across Study Top modules.',
    category: 'leaderboard',
    iconName: 'Award',
    pointsReward: 75
  },
  {
    id: 'top_100_student',
    title: 'Top 100 Student',
    description: 'Ranked among the Global Top 100 Scholars on the Study Top Leaderboard.',
    category: 'leaderboard',
    iconName: 'TrendingUp',
    pointsReward: 50
  },
  {
    id: 'global_top_10',
    title: 'Global Top 10',
    description: 'Achieved elite status in the Global Top 10 on the Study Top Leaderboard.',
    category: 'leaderboard',
    iconName: 'Crown',
    pointsReward: 100
  }
];

export interface UserPrivacySettings {
  profileVisibility: 'public' | 'private';
  showOnLeaderboard: boolean;
  showStudyStats: boolean;
  showAchievements: boolean;
}

export interface UserNotificationPreferences {
  accountEvents: boolean;
  achievements: boolean;
  leaderboardChanges: boolean;
  weeklySummaries: boolean;
  streakMilestones: boolean;
  securityEvents: boolean;
}

export interface StudyTopNotification {
  id: string;
  uid: string;
  type:
    | 'account_created'
    | 'username_updated'
    | 'profile_updated'
    | 'achievement_unlocked'
    | 'leaderboard_rank'
    | 'weekly_summary'
    | 'streak_milestone'
    | 'security_event';
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  metadata?: Record<string, any>;
}

export interface UnlockedAchievement {
  badgeId: string;
  unlockedAt: number;
}

export interface LearningActivityLog {
  id: string;
  uid: string;
  activityType:
    | 'study_session'
    | 'practice_quiz'
    | 'high_quiz_score'
    | 'learning_challenge'
    | 'notes_generated'
    | 'problem_solved'
    | 'streak_bonus';
  subject: string;
  pointsAwarded: number;
  studyMinutes: number;
  description: string;
  timestamp: number;
}

export interface SocialStudyPost {
  id: string;
  uid: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorRole: string;
  subject: string;
  content: string;
  attachmentType?: 'note_snippet' | 'achievement' | 'quiz_score' | 'study_tip';
  attachmentTitle?: string;
  likes: string[]; // array of uids
  comments: Array<{
    id: string;
    uid: string;
    authorName: string;
    authorUsername: string;
    text: string;
    createdAt: number;
  }>;
  createdAt: number;
}

export interface StudyTopAccountProfile {
  uid: string;
  studyTopId: string; // e.g. ST-2026-XXXX
  fullName: string;
  username: string; // stored lowercase without @, e.g. 'manjit_ranjan'
  avatarUrl: string;
  coverBanner: string;
  profileThemeColor: string;
  email: string;
  bio: string;
  school: string;
  educationLevel: string;
  learningInterests: string[];
  favoriteSubjects: string[];
  createdAt: number;
  lastLogin: number;
  accountStatus: 'Active' | 'Suspended' | 'Deleted';
  deletionStatus: 'active' | 'deleted' | 'anonymized';
  deletedAt?: number | null;
  role: 'Admin' | 'Teacher' | 'Student' | 'Guest';
  accountType: 'Google' | 'Email' | 'Guest';
  learningPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  dailyPoints: number;
  subjectPoints: Record<string, number>;
  totalStudyHours: number;
  studyStreak: number;
  lastStudyDate: string; // YYYY-MM-DD
  completedActivities: number;
  unlockedAchievements: UnlockedAchievement[];
  showcasedAchievements: string[];
  privacy: UserPrivacySettings;
  notificationPrefs: UserNotificationPreferences;
  followers: string[];
  following: string[];
}

export interface AccountDeletionRecord {
  id: string;
  uid: string;
  username: string;
  accountType: string;
  requestedAt: number;
  completedAt: number;
  status: 'anonymized_and_purged';
  retentionNote: string;
}

export interface AdminExportLog {
  id: string;
  adminEmail: string;
  reportTitle: string;
  filterScope: string;
  recordsExported: number;
  format: 'PDF' | 'CSV';
  createdAt: number;
}

// Persistent state
const profilesMap = new Map<string, StudyTopAccountProfile>();
const usernamesIndex = new Map<string, string>(); // normalized username -> uid
let learningActivitiesLog: LearningActivityLog[] = [];
let notificationsStore: StudyTopNotification[] = [];
let deletionRequestsStore: AccountDeletionRecord[] = [];
let adminExportLogsStore: AdminExportLog[] = [];
let socialPostsStore: SocialStudyPost[] = [];
const activityRateGuard = new Map<string, number>(); // `${uid}:${activityType}` -> lastTimestamp

const RESERVED_USERNAMES = new Set([
  'admin',
  'superadmin',
  'root',
  'support',
  'studytop',
  'official',
  'api',
  'login',
  'settings',
  'leaderboard',
  'profile',
  'delete',
  'null',
  'undefined',
  'system'
]);

export function validateUsernameFormat(rawUsername: string): {
  valid: boolean;
  normalized: string;
  error?: string;
} {
  const cleaned = String(rawUsername || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();

  if (cleaned.length < 3) {
    return { valid: false, normalized: cleaned, error: 'Username must be at least 3 characters long.' };
  }
  if (cleaned.length > 30) {
    return { valid: false, normalized: cleaned, error: 'Username cannot exceed 30 characters.' };
  }
  if (!/^[a-z0-9_.]+$/.test(cleaned)) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Only letters, numbers, underscores (_), and periods (.) are allowed.'
    };
  }
  if (cleaned.startsWith('.') || cleaned.endsWith('.') || cleaned.includes('..')) {
    return {
      valid: false,
      normalized: cleaned,
      error: 'Username cannot start or end with a period or contain consecutive periods.'
    };
  }
  if (RESERVED_USERNAMES.has(cleaned)) {
    return { valid: false, normalized: cleaned, error: 'This username is reserved by Study Top.' };
  }
  return { valid: true, normalized: cleaned };
}

export function isUsernameAvailable(rawUsername: string, excludeUid?: string): {
  available: boolean;
  normalized: string;
  formatted: string;
  publicUrl: string;
  reason?: string;
} {
  const validation = validateUsernameFormat(rawUsername);
  if (!validation.valid) {
    return {
      available: false,
      normalized: validation.normalized,
      formatted: `@${validation.normalized}`,
      publicUrl: `studytop.app/@${validation.normalized}`,
      reason: validation.error
    };
  }
  const ownerUid = usernamesIndex.get(validation.normalized);
  if (ownerUid && ownerUid !== excludeUid) {
    return {
      available: false,
      normalized: validation.normalized,
      formatted: `@${validation.normalized}`,
      publicUrl: `studytop.app/@${validation.normalized}`,
      reason: `@${validation.normalized} is already taken by another student.`
    };
  }
  return {
    available: true,
    normalized: validation.normalized,
    formatted: `@${validation.normalized}`,
    publicUrl: `studytop.app/@${validation.normalized}`
  };
}

function generateUniqueUsername(preferredName: string, email: string, uid: string): string {
  if (email && email.toLowerCase() === 'manjitranjan180513@gmail.com') {
    const manjitCandidate = 'manjit_ranjan';
    const existingOwner = usernamesIndex.get(manjitCandidate);
    if (!existingOwner || existingOwner === uid) {
      return manjitCandidate;
    }
  }

  let base = (preferredName || email?.split('@')[0] || 'scholar')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

  if (base.length < 3 || RESERVED_USERNAMES.has(base)) {
    base = `scholar_${ base || 'user' }`;
  }
  base = base.slice(0, 22);

  if (!usernamesIndex.has(base) || usernamesIndex.get(base) === uid) {
    return base;
  }

  for (let i = 1; i < 1000; i++) {
    const candidate = `${base}_${i}`;
    if (!usernamesIndex.has(candidate) || usernamesIndex.get(candidate) === uid) {
      return candidate;
    }
  }
  return `${base}_${Date.now().toString(36).slice(-4)}`;
}

export function saveIdentityDbToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload = {
      updatedAt: Date.now(),
      profiles: Array.from(profilesMap.values()),
      learningActivities: learningActivitiesLog.slice(0, 2000),
      notifications: notificationsStore.slice(0, 2000),
      deletionRequests: deletionRequestsStore.slice(0, 500),
      adminExportLogs: adminExportLogsStore.slice(0, 500),
      socialPosts: socialPostsStore.slice(0, 500)
    };
    fs.writeFileSync(IDENTITY_DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[IdentityDB] Failed to persist:', err);
  }
}

export function loadIdentityDbFromDisk() {
  try {
    if (fs.existsSync(IDENTITY_DB_FILE)) {
      const raw = fs.readFileSync(IDENTITY_DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.profiles)) {
        for (const p of parsed.profiles) {
          if (p && p.uid) {
            profilesMap.set(p.uid, p);
            if (p.username && p.deletionStatus !== 'deleted' && p.deletionStatus !== 'anonymized') {
              usernamesIndex.set(p.username.toLowerCase(), p.uid);
            }
          }
        }
      }
      if (Array.isArray(parsed.learningActivities)) learningActivitiesLog = parsed.learningActivities;
      if (Array.isArray(parsed.notifications)) notificationsStore = parsed.notifications;
      if (Array.isArray(parsed.deletionRequests)) deletionRequestsStore = parsed.deletionRequests;
      if (Array.isArray(parsed.adminExportLogs)) adminExportLogsStore = parsed.adminExportLogs;
      if (Array.isArray(parsed.socialPosts)) socialPostsStore = parsed.socialPosts;
    }
  } catch (err) {
    console.warn('[IdentityDB] Load notice:', err);
  }

  // Ensure founder & Super Admin profile (@manjit_ranjan) exists with real creator data
  if (!profilesMap.has('USR-ADMIN-MANJIT-01')) {
    const now = Date.now();
    const creatorProfile: StudyTopAccountProfile = {
      uid: 'USR-ADMIN-MANJIT-01',
      studyTopId: 'ST-ROOT-0001',
      fullName: 'Manjit Ranjan',
      username: 'manjit_ranjan',
      avatarUrl: '',
      coverBanner: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0ea5e9 100%)',
      profileThemeColor: '#2563eb',
      email: 'manjitranjan180513@gmail.com',
      bio: 'Creator of Study Top · Google Developer · Building AI-powered learning tools for students and educators worldwide.',
      school: 'Study Top AI Research & Engineering',
      educationLevel: 'Creator & Lead Architect',
      learningInterests: ['Artificial Intelligence', 'Mathematics', 'Physics', 'Full-Stack Systems'],
      favoriteSubjects: ['Mathematics', 'Computer Science', 'Physics'],
      createdAt: 1729000000000,
      lastLogin: now,
      accountStatus: 'Active',
      deletionStatus: 'active',
      role: 'Admin',
      accountType: 'Google',
      learningPoints: 120,
      weeklyPoints: 120,
      monthlyPoints: 120,
      dailyPoints: 40,
      subjectPoints: {
        Mathematics: 50,
        'Computer Science': 45,
        Physics: 25
      },
      totalStudyHours: 14.5,
      studyStreak: 7,
      lastStudyDate: new Date().toISOString().slice(0, 10),
      completedActivities: 6,
      unlockedAchievements: [
        { badgeId: 'first_study_session', unlockedAt: 1729000000000 },
        { badgeId: 'streak_7_days', unlockedAt: now },
        { badgeId: 'notes_creator', unlockedAt: now },
        { badgeId: 'top_100_student', unlockedAt: now },
        { badgeId: 'global_top_10', unlockedAt: now }
      ],
      showcasedAchievements: [
        'global_top_10',
        'streak_7_days',
        'first_study_session',
        'notes_creator',
        'top_100_student'
      ],
      privacy: {
        profileVisibility: 'public',
        showOnLeaderboard: true,
        showStudyStats: true,
        showAchievements: true
      },
      notificationPrefs: {
        accountEvents: true,
        achievements: true,
        leaderboardChanges: true,
        weeklySummaries: true,
        streakMilestones: true,
        securityEvents: true
      },
      followers: [],
      following: []
    };
    profilesMap.set(creatorProfile.uid, creatorProfile);
    usernamesIndex.set(creatorProfile.username, creatorProfile.uid);

    if (socialPostsStore.length === 0) {
      socialPostsStore.push({
        id: 'post_welcome_manjit',
        uid: creatorProfile.uid,
        authorName: 'Manjit Ranjan',
        authorUsername: 'manjit_ranjan',
        authorAvatar: '',
        authorRole: 'Admin',
        subject: 'Study Top 3.0 Community',
        content:
          'Welcome to Study Top! Claim your unique @username in your Profile, complete study sessions or quizzes to earn verified learning points, and climb the Global Student Leaderboard.',
        attachmentType: 'study_tip',
        attachmentTitle: 'Welcome to Study Top 3.0 Social Study Hub',
        likes: ['USR-ADMIN-MANJIT-01'],
        comments: [],
        createdAt: now
      });
    }
    saveIdentityDbToDisk();
  }
}

loadIdentityDbFromDisk();

export function createNotification(params: {
  uid: string;
  type: StudyTopNotification['type'];
  title: string;
  message: string;
  metadata?: Record<string, any>;
}): StudyTopNotification {
  const notif: StudyTopNotification = {
    id: `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    uid: params.uid,
    type: params.type,
    title: params.title,
    message: params.message,
    read: false,
    createdAt: Date.now(),
    metadata: params.metadata
  };
  notificationsStore.unshift(notif);
  if (notificationsStore.length > 2000) notificationsStore.length = 2000;
  saveIdentityDbToDisk();
  return notif;
}

export function ensureOrSyncStudyTopAccount(params: {
  uid: string;
  fullName?: string;
  email?: string;
  avatarUrl?: string;
  role?: 'Admin' | 'Teacher' | 'Student' | 'Guest';
  accountType?: 'Google' | 'Email' | 'Guest';
  accountStatus?: 'Active' | 'Suspended' | 'Deleted';
  createdAt?: number;
  lastLogin?: number;
  migrateFromGuestUid?: string;
}): { profile: StudyTopAccountProfile; isNewAccount: boolean } {
  const now = Date.now();
  const cleanUid = (params.uid || `ST-${now.toString(36).toUpperCase()}`).trim();

  // Check if migrating from a guest account
  if (params.migrateFromGuestUid && profilesMap.has(params.migrateFromGuestUid)) {
    const guestProf = profilesMap.get(params.migrateFromGuestUid)!;
    if (!profilesMap.has(cleanUid)) {
      const newUsername = generateUniqueUsername(
        params.fullName || guestProf.fullName,
        params.email || '',
        cleanUid
      );
      usernamesIndex.delete(guestProf.username);
      const upgraded: StudyTopAccountProfile = {
        ...guestProf,
        uid: cleanUid,
        fullName: params.fullName || guestProf.fullName,
        username: newUsername,
        email: params.email || guestProf.email,
        avatarUrl: params.avatarUrl || guestProf.avatarUrl,
        role: params.role || 'Student',
        accountType: params.accountType || 'Google',
        lastLogin: now
      };
      profilesMap.delete(params.migrateFromGuestUid);
      profilesMap.set(cleanUid, upgraded);
      usernamesIndex.set(newUsername, cleanUid);
      createNotification({
        uid: cleanUid,
        type: 'account_created',
        title: 'Welcome to Study Top! Guest Data Migrated',
        message: `Your guest progress (${upgraded.learningPoints} pts) has been permanently linked to @${upgraded.username}.`
      });
      saveIdentityDbToDisk();
      return { profile: upgraded, isNewAccount: true };
    }
  }

  const existing = profilesMap.get(cleanUid);
  if (existing) {
    if (params.fullName && params.fullName !== 'Student' && params.fullName !== 'Authenticated Student') {
      existing.fullName = params.fullName;
    }
    if (params.email) existing.email = params.email;
    if (params.avatarUrl) existing.avatarUrl = params.avatarUrl;
    if (params.accountStatus) existing.accountStatus = params.accountStatus;
    if (params.role) existing.role = params.role;
    existing.lastLogin = params.lastLogin || now;
    saveIdentityDbToDisk();
    return { profile: existing, isNewAccount: false };
  }

  // Create new permanent Study Top Account
  const fullName =
    params.fullName ||
    (params.email ? params.email.split('@')[0] : 'Student Scholar');
  const username = generateUniqueUsername(fullName, params.email || '', cleanUid);
  const studyTopId = `ST-${new Date().getFullYear()}-${crypto
    .createHash('sha1')
    .update(cleanUid)
    .digest('hex')
    .slice(0, 6)
    .toUpperCase()}`;

  const newProfile: StudyTopAccountProfile = {
    uid: cleanUid,
    studyTopId,
    fullName,
    username,
    avatarUrl: params.avatarUrl || '',
    coverBanner: 'linear-gradient(135deg, #0f172a 0%, #1e40af 55%, #0284c7 100%)',
    profileThemeColor: '#2563eb',
    email: params.email || '',
    bio: 'Passionate learner on Study Top exploring AI-powered study notes, problem solving, and quizzes.',
    school: '',
    educationLevel: 'Secondary / Higher Secondary',
    learningInterests: ['Notes & Revision', 'Problem Solving', 'Practice Quizzes'],
    favoriteSubjects: ['Mathematics', 'Science'],
    createdAt: params.createdAt || now,
    lastLogin: params.lastLogin || now,
    accountStatus: params.accountStatus || 'Active',
    deletionStatus: 'active',
    role:
      params.email?.toLowerCase() === 'manjitranjan180513@gmail.com'
        ? 'Admin'
        : params.role || 'Student',
    accountType: params.accountType || (params.email ? 'Email' : 'Guest'),
    learningPoints: 10,
    weeklyPoints: 10,
    monthlyPoints: 10,
    dailyPoints: 10,
    subjectPoints: { General: 10 },
    totalStudyHours: 0.2,
    studyStreak: 1,
    lastStudyDate: new Date().toISOString().slice(0, 10),
    completedActivities: 1,
    unlockedAchievements: [{ badgeId: 'first_study_session', unlockedAt: now }],
    showcasedAchievements: ['first_study_session'],
    privacy: {
      profileVisibility: 'public',
      showOnLeaderboard: true,
      showStudyStats: true,
      showAchievements: true
    },
    notificationPrefs: {
      accountEvents: true,
      achievements: true,
      leaderboardChanges: true,
      weeklySummaries: true,
      streakMilestones: true,
      securityEvents: true
    },
    followers: [],
    following: []
  };

  profilesMap.set(cleanUid, newProfile);
  usernamesIndex.set(username, cleanUid);

  createNotification({
    uid: cleanUid,
    type: 'account_created',
    title: 'Welcome to Study Top!',
    message: `Your permanent Study Top Account (${studyTopId}) and handle @${username} are ready. You unlocked the "First Study Session" badge (+10 pts)!`
  });

  saveIdentityDbToDisk();
  return { profile: newProfile, isNewAccount: true };
}

export function updateUsername(uid: string, requestedUsername: string): {
  success: boolean;
  username?: string;
  publicUrl?: string;
  error?: string;
  profile?: StudyTopAccountProfile;
} {
  const profile = profilesMap.get(uid);
  if (!profile || profile.deletionStatus !== 'active') {
    return { success: false, error: 'Account profile not found.' };
  }

  const check = isUsernameAvailable(requestedUsername, uid);
  if (!check.available) {
    return { success: false, error: check.reason || 'Username is not available.' };
  }

  const oldUsername = profile.username;
  if (oldUsername === check.normalized) {
    return {
      success: true,
      username: `@${check.normalized}`,
      publicUrl: check.publicUrl,
      profile
    };
  }

  usernamesIndex.delete(oldUsername);
  profile.username = check.normalized;
  usernamesIndex.set(check.normalized, uid);

  // Also update social posts by this user
  for (const post of socialPostsStore) {
    if (post.uid === uid) {
      post.authorUsername = check.normalized;
    }
  }

  if (profile.notificationPrefs.accountEvents) {
    createNotification({
      uid,
      type: 'username_updated',
      title: 'Username Updated Successfully',
      message: `Your unique Study Top handle is now @${check.normalized} (studytop.app/@${check.normalized}).`
    });
  }

  saveIdentityDbToDisk();
  return {
    success: true,
    username: `@${check.normalized}`,
    publicUrl: check.publicUrl,
    profile
  };
}

export function updateAccountProfile(
  uid: string,
  updates: Partial<{
    fullName: string;
    username: string;
    avatarUrl: string;
    coverBanner: string;
    profileThemeColor: string;
    bio: string;
    school: string;
    educationLevel: string;
    learningInterests: string[];
    favoriteSubjects: string[];
    showcasedAchievements: string[];
    privacy: Partial<UserPrivacySettings>;
    notificationPrefs: Partial<UserNotificationPreferences>;
  }>
): { success: boolean; profile?: StudyTopAccountProfile; error?: string } {
  const profile = profilesMap.get(uid);
  if (!profile || profile.deletionStatus !== 'active') {
    return { success: false, error: 'Account not found.' };
  }

  if (updates.username && updates.username.replace(/^@+/, '').toLowerCase() !== profile.username) {
    const uRes = updateUsername(uid, updates.username);
    if (!uRes.success) {
      return { success: false, error: uRes.error };
    }
  }

  if (typeof updates.fullName === 'string' && updates.fullName.trim()) {
    profile.fullName = updates.fullName.trim().slice(0, 80);
    for (const post of socialPostsStore) {
      if (post.uid === uid) post.authorName = profile.fullName;
    }
  }
  if (typeof updates.avatarUrl === 'string') {
    profile.avatarUrl = updates.avatarUrl;
    for (const post of socialPostsStore) {
      if (post.uid === uid) post.authorAvatar = profile.avatarUrl;
    }
  }
  if (typeof updates.coverBanner === 'string') profile.coverBanner = updates.coverBanner;
  if (typeof updates.profileThemeColor === 'string') profile.profileThemeColor = updates.profileThemeColor;
  if (typeof updates.bio === 'string') profile.bio = updates.bio.slice(0, 500);
  if (typeof updates.school === 'string') profile.school = updates.school.slice(0, 120);
  if (typeof updates.educationLevel === 'string') profile.educationLevel = updates.educationLevel.slice(0, 80);
  if (Array.isArray(updates.learningInterests)) {
    profile.learningInterests = updates.learningInterests.map(s => String(s).trim()).filter(Boolean).slice(0, 12);
  }
  if (Array.isArray(updates.favoriteSubjects)) {
    profile.favoriteSubjects = updates.favoriteSubjects.map(s => String(s).trim()).filter(Boolean).slice(0, 10);
  }
  if (Array.isArray(updates.showcasedAchievements)) {
    const unlockedSet = new Set(profile.unlockedAchievements.map(a => a.badgeId));
    profile.showcasedAchievements = updates.showcasedAchievements
      .filter(id => unlockedSet.has(id))
      .slice(0, 5);
  }
  if (updates.privacy) {
    profile.privacy = { ...profile.privacy, ...updates.privacy };
  }
  if (updates.notificationPrefs) {
    profile.notificationPrefs = { ...profile.notificationPrefs, ...updates.notificationPrefs };
  }

  if (profile.notificationPrefs.accountEvents) {
    createNotification({
      uid,
      type: 'profile_updated',
      title: 'Profile Changes Saved',
      message: 'Your Study Top profile and privacy preferences have been updated.'
    });
  }

  saveIdentityDbToDisk();
  return { success: true, profile };
}

export function awardVerifiedLearningPoints(params: {
  uid: string;
  activityType: LearningActivityLog['activityType'];
  subject?: string;
  studyMinutes?: number;
  description?: string;
}): {
  success: boolean;
  pointsAwarded: number;
  totalPoints: number;
  newlyUnlockedBadges: AchievementBadgeDef[];
  reason?: string;
  profile?: StudyTopAccountProfile;
} {
  const profile = profilesMap.get(params.uid);
  if (!profile || profile.deletionStatus !== 'active') {
    return {
      success: false,
      pointsAwarded: 0,
      totalPoints: 0,
      newlyUnlockedBadges: [],
      reason: 'Profile not found.'
    };
  }

  // Anti-cheat rate guard: prevent duplicate point claims within 15 seconds for same activity type
  const guardKey = `${params.uid}:${params.activityType}`;
  const lastClaim = activityRateGuard.get(guardKey) || 0;
  const now = Date.now();
  if (now - lastClaim < 15000) {
    return {
      success: false,
      pointsAwarded: 0,
      totalPoints: profile.learningPoints,
      newlyUnlockedBadges: [],
      reason: 'Activity cooldown active to prevent duplicate point claims.',
      profile
    };
  }
  activityRateGuard.set(guardKey, now);

  const pointsMap: Record<LearningActivityLog['activityType'], number> = {
    study_session: 10,
    practice_quiz: 15,
    high_quiz_score: 20,
    learning_challenge: 25,
    notes_generated: 15,
    problem_solved: 10,
    streak_bonus: 15
  };

  const basePoints = pointsMap[params.activityType] || 10;
  const minutes = Math.max(1, Math.min(180, Number(params.studyMinutes || 15)));
  const subject = (params.subject || 'General').trim();

  // Check streak progression
  const todayStr = new Date(now).toISOString().slice(0, 10);
  const yesterdayStr = new Date(now - 86400000).toISOString().slice(0, 10);
  if (profile.lastStudyDate !== todayStr) {
    if (profile.lastStudyDate === yesterdayStr) {
      profile.studyStreak += 1;
    } else {
      profile.studyStreak = Math.max(1, profile.studyStreak);
    }
    profile.lastStudyDate = todayStr;
  }

  profile.learningPoints += basePoints;
  profile.weeklyPoints += basePoints;
  profile.monthlyPoints += basePoints;
  profile.dailyPoints += basePoints;
  profile.subjectPoints[subject] = (profile.subjectPoints[subject] || 0) + basePoints;
  profile.totalStudyHours = Number((profile.totalStudyHours + minutes / 60).toFixed(2));
  profile.completedActivities += 1;

  const logEntry: LearningActivityLog = {
    id: `act_${now}_${crypto.randomBytes(3).toString('hex')}`,
    uid: params.uid,
    activityType: params.activityType,
    subject,
    pointsAwarded: basePoints,
    studyMinutes: minutes,
    description: params.description || `Completed ${params.activityType.replace(/_/g, ' ')} in ${subject}`,
    timestamp: now
  };
  learningActivitiesLog.unshift(logEntry);

  // Evaluate achievement unlocks
  const unlockedSet = new Set(profile.unlockedAchievements.map(a => a.badgeId));
  const newlyUnlocked: AchievementBadgeDef[] = [];

  const tryUnlock = (badgeId: string) => {
    if (unlockedSet.has(badgeId)) return;
    const def = OFFICIAL_ACHIEVEMENTS.find(b => b.id === badgeId);
    if (!def) return;
    unlockedSet.add(badgeId);
    profile.unlockedAchievements.push({ badgeId, unlockedAt: now });
    if (profile.showcasedAchievements.length < 5) {
      profile.showcasedAchievements.push(badgeId);
    }
    profile.learningPoints += def.pointsReward;
    newlyUnlocked.push(def);
    if (profile.notificationPrefs.achievements) {
      createNotification({
        uid: profile.uid,
        type: 'achievement_unlocked',
        title: `Achievement Unlocked: ${def.title}!`,
        message: `${def.description} (+${def.pointsReward} bonus points)`
      });
    }
  };

  tryUnlock('first_study_session');
  if (profile.studyStreak >= 7) tryUnlock('streak_7_days');
  if (profile.studyStreak >= 30) tryUnlock('consistency_30_days');
  if (params.activityType === 'practice_quiz' || params.activityType === 'high_quiz_score') {
    tryUnlock('quiz_master');
  }
  if (subject.toLowerCase().includes('math') || (profile.subjectPoints['Mathematics'] || 0) >= 30) {
    tryUnlock('math_expert');
  }
  if (
    subject.toLowerCase().includes('science') ||
    subject.toLowerCase().includes('physic') ||
    subject.toLowerCase().includes('chemi') ||
    subject.toLowerCase().includes('biolog')
  ) {
    tryUnlock('science_explorer');
  }
  if (params.activityType === 'notes_generated') {
    tryUnlock('notes_creator');
  }
  if (profile.learningPoints >= 500) {
    tryUnlock('learning_champion');
  }

  // Check leaderboard rank for Top 100 / Top 10 badges
  const ranked = getLeaderboard({ category: 'global', limit: 100 });
  const myRankIdx = ranked.entries.findIndex(e => e.uid === profile.uid);
  if (myRankIdx >= 0 && myRankIdx < 100) tryUnlock('top_100_student');
  if (myRankIdx >= 0 && myRankIdx < 10) tryUnlock('global_top_10');

  saveIdentityDbToDisk();
  return {
    success: true,
    pointsAwarded: basePoints,
    totalPoints: profile.learningPoints,
    newlyUnlockedBadges: newlyUnlocked,
    profile
  };
}

export interface LeaderboardEntry {
  rank: number;
  uid: string;
  studyTopId: string;
  fullName: string;
  username: string;
  formattedUsername: string;
  publicUrl: string;
  avatarUrl: string;
  profileThemeColor: string;
  role: string;
  school: string;
  educationLevel: string;
  learningPoints: number;
  categoryScore: number;
  categoryUnit: string;
  studyStreak: number;
  totalStudyHours: number;
  achievementsCount: number;
  showcasedAchievements: AchievementBadgeDef[];
}

export function getLeaderboard(params: {
  category?:
    | 'global'
    | 'weekly'
    | 'monthly'
    | 'daily'
    | 'subject'
    | 'consistent'
    | 'hours'
    | 'achievements';
  subject?: string;
  limit?: number;
}): {
  category: string;
  subject?: string;
  totalParticipants: number;
  entries: LeaderboardEntry[];
  updatedAt: number;
} {
  const category = params.category || 'global';
  const subject = params.subject || 'Mathematics';
  const limit = Math.min(200, Math.max(1, params.limit || 50));

  const eligible = Array.from(profilesMap.values()).filter(
    p =>
      p.accountStatus === 'Active' &&
      p.deletionStatus === 'active' &&
      p.privacy.showOnLeaderboard !== false
  );

  const scored = eligible.map(p => {
    let score = p.learningPoints;
    let unit = 'pts';

    if (category === 'weekly') {
      score = p.weeklyPoints || p.learningPoints;
      unit = 'weekly pts';
    } else if (category === 'monthly') {
      score = p.monthlyPoints || p.learningPoints;
      unit = 'monthly pts';
    } else if (category === 'daily') {
      score = p.dailyPoints || 0;
      unit = 'today pts';
    } else if (category === 'subject') {
      score = p.subjectPoints?.[subject] || 0;
      unit = `${subject} pts`;
    } else if (category === 'consistent') {
      score = p.studyStreak || 1;
      unit = 'day streak';
    } else if (category === 'hours') {
      score = p.totalStudyHours || 0;
      unit = 'hours';
    } else if (category === 'achievements') {
      score = p.unlockedAchievements?.length || 0;
      unit = 'badges';
    }

    return { profile: p, score, unit };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.profile.learningPoints - a.profile.learningPoints;
  });

  const entries: LeaderboardEntry[] = scored.slice(0, limit).map((item, idx) => {
    const p = item.profile;
    const badgeDefs = (p.showcasedAchievements || [])
      .map(id => OFFICIAL_ACHIEVEMENTS.find(b => b.id === id))
      .filter((b): b is AchievementBadgeDef => Boolean(b));

    return {
      rank: idx + 1,
      uid: p.uid,
      studyTopId: p.studyTopId,
      fullName: p.fullName,
      username: p.username,
      formattedUsername: `@${p.username}`,
      publicUrl: `studytop.app/@${p.username}`,
      avatarUrl: p.avatarUrl,
      profileThemeColor: p.profileThemeColor || '#2563eb',
      role: p.role,
      school: p.school,
      educationLevel: p.educationLevel,
      learningPoints: p.learningPoints,
      categoryScore: item.score,
      categoryUnit: item.unit,
      studyStreak: p.studyStreak,
      totalStudyHours: p.totalStudyHours,
      achievementsCount: p.unlockedAchievements?.length || 0,
      showcasedAchievements: p.privacy.showAchievements ? badgeDefs : []
    };
  });

  return {
    category,
    subject: category === 'subject' ? subject : undefined,
    totalParticipants: eligible.length,
    entries,
    updatedAt: Date.now()
  };
}

export function getPublicProfileByUsername(rawUsername: string): {
  found: boolean;
  isPrivate?: boolean;
  profile?: Record<string, any>;
} {
  const clean = String(rawUsername || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase();
  const uid = usernamesIndex.get(clean);
  if (!uid) return { found: false };
  const p = profilesMap.get(uid);
  if (!p || p.deletionStatus !== 'active' || p.accountStatus !== 'Active') {
    return { found: false };
  }

  if (p.privacy.profileVisibility === 'private') {
    return {
      found: true,
      isPrivate: true,
      profile: {
        fullName: p.fullName,
        username: p.username,
        formattedUsername: `@${p.username}`,
        publicUrl: `studytop.app/@${p.username}`,
        avatarUrl: p.avatarUrl,
        profileThemeColor: p.profileThemeColor,
        role: p.role,
        isPrivate: true
      }
    };
  }

  const lb = getLeaderboard({ category: 'global', limit: 500 });
  const rankEntry = lb.entries.find(e => e.uid === p.uid);

  // Strictly exclude email and internal credentials from public profile
  return {
    found: true,
    isPrivate: false,
    profile: {
      studyTopId: p.studyTopId,
      fullName: p.fullName,
      username: p.username,
      formattedUsername: `@${p.username}`,
      publicUrl: `studytop.app/@${p.username}`,
      avatarUrl: p.avatarUrl,
      coverBanner: p.coverBanner,
      profileThemeColor: p.profileThemeColor,
      bio: p.bio,
      school: p.school,
      educationLevel: p.educationLevel,
      learningInterests: p.learningInterests,
      favoriteSubjects: p.favoriteSubjects,
      role: p.role,
      createdAt: p.createdAt,
      followersCount: p.followers?.length || 0,
      followingCount: p.following?.length || 0,
      leaderboardRank: p.privacy.showOnLeaderboard ? rankEntry?.rank || null : null,
      studyStats: p.privacy.showStudyStats
        ? {
            learningPoints: p.learningPoints,
            totalStudyHours: p.totalStudyHours,
            studyStreak: p.studyStreak,
            completedActivities: p.completedActivities
          }
        : null,
      achievements: p.privacy.showAchievements
        ? p.unlockedAchievements.map(ua => ({
            ...ua,
            definition: OFFICIAL_ACHIEVEMENTS.find(b => b.id === ua.badgeId)
          }))
        : []
    }
  };
}

export function getProfileByUid(uid: string): StudyTopAccountProfile | null {
  return profilesMap.get(uid) || null;
}

export function getAllProfiles(): StudyTopAccountProfile[] {
  return Array.from(profilesMap.values());
}

export function getUserNotifications(uid: string): StudyTopNotification[] {
  return notificationsStore.filter(n => n.uid === uid).slice(0, 100);
}

export function markNotificationsRead(uid: string, notificationId?: string) {
  for (const n of notificationsStore) {
    if (n.uid === uid && (!notificationId || n.id === notificationId)) {
      n.read = true;
    }
  }
  saveIdentityDbToDisk();
}

export function getUserLearningActivities(uid: string): LearningActivityLog[] {
  return learningActivitiesLog.filter(a => a.uid === uid).slice(0, 100);
}

export function executePermanentAccountDeletion(params: {
  uid: string;
  email?: string;
  confirmationPhrase: string;
}): {
  success: boolean;
  receipt?: AccountDeletionRecord;
  error?: string;
} {
  if (params.confirmationPhrase !== 'DELETE') {
    return {
      success: false,
      error: 'Please type DELETE in all caps to confirm permanent account deletion.'
    };
  }

  const profile = profilesMap.get(params.uid);
  if (!profile) {
    return { success: false, error: 'Account record not found.' };
  }

  if (profile.email.toLowerCase() === 'manjitranjan180513@gmail.com') {
    return {
      success: false,
      error: 'The primary Creator Super Admin account cannot be deleted.'
    };
  }

  const now = Date.now();
  const oldUsername = profile.username;

  // Release @username from public index & leaderboard
  usernamesIndex.delete(oldUsername);

  // Anonymize personal profile record & mark deleted
  profile.fullName = 'Deleted Study Top User';
  profile.username = `deleted_${now.toString(36)}`;
  profile.email = '';
  profile.avatarUrl = '';
  profile.bio = '';
  profile.school = '';
  profile.accountStatus = 'Deleted';
  profile.deletionStatus = 'anonymized';
  profile.deletedAt = now;
  profile.privacy = {
    profileVisibility: 'private',
    showOnLeaderboard: false,
    showStudyStats: false,
    showAchievements: false
  };

  // Remove user's social posts & notifications
  socialPostsStore = socialPostsStore.filter(p => p.uid !== params.uid);
  notificationsStore = notificationsStore.filter(n => n.uid !== params.uid);
  learningActivitiesLog = learningActivitiesLog.filter(a => a.uid !== params.uid);

  const receipt: AccountDeletionRecord = {
    id: `del_${now}_${crypto.randomBytes(3).toString('hex')}`,
    uid: params.uid,
    username: `@${oldUsername}`,
    accountType: profile.accountType,
    requestedAt: now,
    completedAt: now,
    status: 'anonymized_and_purged',
    retentionNote:
      'Personal data, email, @username handle, public profile, and leaderboard scores have been permanently purged. Minimal anonymized audit log retained for security compliance.'
  };

  deletionRequestsStore.unshift(receipt);
  saveIdentityDbToDisk();

  return { success: true, receipt };
}

// Social Study Feed helpers
export function getSocialStudyFeed(): SocialStudyPost[] {
  return socialPostsStore.slice(0, 100);
}

export function createSocialStudyPost(params: {
  uid: string;
  subject: string;
  content: string;
  attachmentType?: SocialStudyPost['attachmentType'];
  attachmentTitle?: string;
}): { success: boolean; post?: SocialStudyPost; error?: string } {
  const profile = profilesMap.get(params.uid);
  if (!profile || profile.deletionStatus !== 'active') {
    return { success: false, error: 'Please sign in to post to the Study Top Community.' };
  }
  const cleanContent = String(params.content || '').trim();
  if (!cleanContent) {
    return { success: false, error: 'Post content cannot be empty.' };
  }

  const post: SocialStudyPost = {
    id: `post_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    uid: profile.uid,
    authorName: profile.fullName,
    authorUsername: profile.username,
    authorAvatar: profile.avatarUrl,
    authorRole: profile.role,
    subject: (params.subject || 'General Study').slice(0, 50),
    content: cleanContent.slice(0, 1000),
    attachmentType: params.attachmentType,
    attachmentTitle: params.attachmentTitle,
    likes: [],
    comments: [],
    createdAt: Date.now()
  };

  socialPostsStore.unshift(post);
  saveIdentityDbToDisk();
  return { success: true, post };
}

export function toggleLikeSocialPost(postId: string, uid: string): {
  success: boolean;
  likesCount?: number;
  liked?: boolean;
} {
  const post = socialPostsStore.find(p => p.id === postId);
  if (!post) return { success: false };
  const idx = post.likes.indexOf(uid);
  let liked = false;
  if (idx >= 0) {
    post.likes.splice(idx, 1);
  } else {
    post.likes.push(uid);
    liked = true;
  }
  saveIdentityDbToDisk();
  return { success: true, likesCount: post.likes.length, liked };
}

export function addCommentToSocialPost(params: {
  postId: string;
  uid: string;
  text: string;
}): { success: boolean; post?: SocialStudyPost } {
  const post = socialPostsStore.find(p => p.id === params.postId);
  const profile = profilesMap.get(params.uid);
  if (!post || !profile || !params.text?.trim()) return { success: false };

  post.comments.push({
    id: `cmt_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    uid: profile.uid,
    authorName: profile.fullName,
    authorUsername: profile.username,
    text: params.text.trim().slice(0, 400),
    createdAt: Date.now()
  });
  saveIdentityDbToDisk();
  return { success: true, post };
}

export function getAdminExportLogs(): AdminExportLog[] {
  return adminExportLogsStore;
}

// ============================================================================
// AUTOMATIC PROFESSIONAL ADMIN PDF REPORT GENERATOR (Backend jsPDF Engine)
// ============================================================================
export function generateAdminUsersPdfReport(params: {
  reportTitle?: string;
  filterScope:
    | 'all'
    | 'individual'
    | 'selected'
    | 'new_registrations'
    | 'active'
    | 'deleted_anonymized'
    | 'date_range';
  selectedUids?: string[];
  startDate?: number;
  endDate?: number;
  adminEmail: string;
}): {
  pdfBase64: string;
  fileName: string;
  recordsCount: number;
  exportLog: AdminExportLog;
} {
  const now = Date.now();
  const allProfiles = Array.from(profilesMap.values());

  let filtered = allProfiles;
  if (params.filterScope === 'individual' || params.filterScope === 'selected') {
    const idSet = new Set(params.selectedUids || []);
    filtered = allProfiles.filter(p => idSet.has(p.uid));
  } else if (params.filterScope === 'new_registrations') {
    const sevenDaysAgo = now - 7 * 86400000;
    filtered = allProfiles.filter(p => p.createdAt >= sevenDaysAgo);
  } else if (params.filterScope === 'active') {
    filtered = allProfiles.filter(p => p.accountStatus === 'Active' && p.deletionStatus === 'active');
  } else if (params.filterScope === 'deleted_anonymized') {
    filtered = allProfiles.filter(p => p.deletionStatus !== 'active' || p.accountStatus === 'Deleted');
  } else if (params.filterScope === 'date_range') {
    const start = params.startDate || 0;
    const end = params.endDate || now;
    filtered = allProfiles.filter(p => p.createdAt >= start && p.createdAt <= end);
  }

  filtered.sort((a, b) => b.learningPoints - a.learningPoints);

  // Analytics calculations
  const totalUsers = allProfiles.length;
  const activeUsers = allProfiles.filter(p => p.accountStatus === 'Active' && p.deletionStatus === 'active').length;
  const inactiveUsers = totalUsers - activeUsers;
  const guestUsers = allProfiles.filter(p => p.accountType === 'Guest' || p.role === 'Guest').length;
  const newRegistrations7d = allProfiles.filter(p => now - p.createdAt <= 7 * 86400000).length;
  const totalLearningPoints = allProfiles.reduce((acc, p) => acc + (p.learningPoints || 0), 0);
  const avgStudyHours =
    totalUsers > 0
      ? Number((allProfiles.reduce((acc, p) => acc + (p.totalStudyHours || 0), 0) / totalUsers).toFixed(2))
      : 0;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawBrandLogo = (x: number, y: number, scale = 1) => {
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(x, y, 28 * scale, 28 * scale, 6 * scale, 6 * scale, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13 * scale);
    doc.text('ST', x + 5.5 * scale, y + 19 * scale);
  };

  // =========================================================================
  // PAGE 1: EXECUTIVE COVER PAGE & ANALYTICS DASHBOARD
  // =========================================================================
  // Executive Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 165, 'F');
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 160, pageWidth, 6, 'F');

  drawBrandLogo(45, 38, 1.35);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('STUDY TOP', 96, 62);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.text('Official AI-Powered Educational Platform & Student Identity Ecosystem', 96, 80);

  const reportTitle =
    params.reportTitle ||
    `Study Top Official User & Leaderboard Report (${params.filterScope.replace(/_/g, ' ').toUpperCase()})`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(reportTitle, 45, 118);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(191, 219, 254);
  doc.text(
    `Generated: ${new Date(now).toUTCString()}   |   Prepared by: Study Top Administration (${params.adminEmail})   |   Scope: ${filtered.length} Authorized Records`,
    45,
    140
  );

  // Analytics Section Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('1. Executive Platform & Leaderboard Analytics Summary', 45, 200);

  // 8 KPI Stat Boxes
  const kpiBoxes = [
    { label: 'Total Registered Users', value: String(totalUsers), sub: 'Verified Study Top IDs' },
    { label: 'New Registrations (7d)', value: `+${newRegistrations7d}`, sub: 'Recent Account Growth' },
    { label: 'Active Accounts', value: String(activeUsers), sub: 'Active Status' },
    { label: 'Inactive / Deleted', value: String(inactiveUsers), sub: 'Suspended or Anonymized' },
    { label: 'Guest Accounts', value: String(guestUsers), sub: 'Guest Pass Sessions' },
    { label: 'Total Learning Points', value: totalLearningPoints.toLocaleString(), sub: 'Verified Backend Points' },
    { label: 'Average Study Hours', value: `${avgStudyHours} hrs`, sub: 'Per Registered Student' },
    { label: 'Records in Report', value: String(filtered.length), sub: `Filter: ${params.filterScope}` }
  ];

  const boxWidth = (pageWidth - 90 - 30) / 4;
  const boxHeight = 64;
  kpiBoxes.forEach((box, idx) => {
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    const bx = 45 + col * (boxWidth + 10);
    const by = 216 + row * (boxHeight + 12);

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(bx, by, boxWidth, boxHeight, 6, 6, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(box.label, bx + 12, by + 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(box.value, bx + 12, by + 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text(box.sub, bx + 12, by + 54);
  });

  // Visual Bar Chart: Top 5 Leaderboard Scholars by Learning Points
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('2. Global Leaderboard Top Scholars Distribution (Points & Study Hours)', 45, 392);

  const topScholars = allProfiles
    .filter(p => p.deletionStatus === 'active')
    .sort((a, b) => b.learningPoints - a.learningPoints)
    .slice(0, 5);
  const maxPts = Math.max(...topScholars.map(s => s.learningPoints), 10);

  topScholars.forEach((scholar, i) => {
    const ry = 412 + i * 24;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text(
      `#${i + 1} ${scholar.fullName.slice(0, 22)} (@${scholar.username.slice(0, 18)})`,
      45,
      ry + 12
    );

    const barMaxW = 360;
    const barW = Math.max(12, Math.round((scholar.learningPoints / maxPts) * barMaxW));
    doc.setFillColor(226, 232, 240);
    doc.roundedRect(260, ry + 2, barMaxW, 13, 3, 3, 'F');
    doc.setFillColor(37, 99, 235);
    doc.roundedRect(260, ry + 2, barW, 13, 3, 3, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${scholar.learningPoints} pts  |  ${scholar.totalStudyHours} hrs  |  ${scholar.unlockedAchievements.length} badges`,
      632,
      ry + 12
    );
  });

  // =========================================================================
  // PAGE 2+: USER INFORMATION TABLE
  // =========================================================================
  const rowsPerPage = 16;
  const totalTablePages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  for (let pIdx = 0; pIdx < totalTablePages; pIdx++) {
    doc.addPage('a4', 'landscape');

    // Page Header with Study Top Logo
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 52, 'F');
    drawBrandLogo(45, 12, 0.95);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('STUDY TOP — Authorized User Identity & Authentication Directory', 80, 31);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text(new Date(now).toISOString().slice(0, 19).replace('T', ' ') + ' UTC', pageWidth - 175, 31);

    // Table Columns
    const cols = [
      { label: 'User ID', x: 45, width: 92 },
      { label: 'Full Name', x: 137, width: 110 },
      { label: 'Username', x: 247, width: 105 },
      { label: 'Email', x: 352, width: 150 },
      { label: 'Registration', x: 502, width: 78 },
      { label: 'Last Login', x: 580, width: 78 },
      { label: 'Role', x: 658, width: 52 },
      { label: 'Status', x: 710, width: 55 },
      { label: 'Points', x: 765, width: 45 }
    ];

    const headerY = 72;
    doc.setFillColor(37, 99, 235);
    doc.rect(45, headerY, pageWidth - 90, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    cols.forEach(c => {
      doc.text(c.label, c.x + 4, headerY + 15);
    });

    const pageRows = filtered.slice(pIdx * rowsPerPage, (pIdx + 1) * rowsPerPage);
    if (pageRows.length === 0) {
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('No user records matched the selected filter criteria.', 45, headerY + 48);
    } else {
      pageRows.forEach((u, rIdx) => {
        const ry = headerY + 24 + rIdx * 26;
        if (rIdx % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(45, ry, pageWidth - 90, 26, 'F');
        }
        doc.setDrawColor(226, 232, 240);
        doc.line(45, ry + 26, pageWidth - 45, ry + 26);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);

        const regDate = new Date(u.createdAt).toISOString().slice(0, 10);
        const loginDate = new Date(u.lastLogin).toISOString().slice(0, 10);

        doc.text(String(u.studyTopId || u.uid).slice(0, 16), cols[0].x + 4, ry + 16);
        doc.text(String(u.fullName || 'Student').slice(0, 20), cols[1].x + 4, ry + 16);
        doc.text(`@${String(u.username || '').slice(0, 18)}`, cols[2].x + 4, ry + 16);
        doc.text(String(u.email || 'Guest (No Email)').slice(0, 28), cols[3].x + 4, ry + 16);
        doc.text(regDate, cols[4].x + 4, ry + 16);
        doc.text(loginDate, cols[5].x + 4, ry + 16);
        doc.text(String(u.role || 'Student'), cols[6].x + 4, ry + 16);
        doc.text(
          u.deletionStatus !== 'active' ? 'Anonymized' : String(u.accountStatus || 'Active'),
          cols[7].x + 4,
          ry + 16
        );
        doc.setFont('helvetica', 'bold');
        doc.text(String(u.learningPoints || 0), cols[8].x + 4, ry + 16);
      });
    }
  }

  // Add consistent Footer & Page Numbering to every page
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(203, 213, 225);
    doc.line(45, pageHeight - 34, pageWidth - 45, pageHeight - 34);
    drawBrandLogo(45, pageHeight - 28, 0.65);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'STUDY TOP CONFIDENTIAL ADMINISTRATION REPORT · Zero Passwords or Auth Tokens Included · Created by Manjit Ranjan',
      70,
      pageHeight - 16
    );
    doc.setFont('helvetica', 'bold');
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - 95, pageHeight - 16);
  }

  const pdfArrayBuffer = doc.output('arraybuffer');
  const pdfBase64 = Buffer.from(pdfArrayBuffer).toString('base64');
  const fileName = `StudyTop_Admin_Report_${params.filterScope}_${new Date(now).toISOString().slice(0, 10)}.pdf`;

  const exportLog: AdminExportLog = {
    id: `exp_${now}_${crypto.randomBytes(3).toString('hex')}`,
    adminEmail: params.adminEmail,
    reportTitle,
    filterScope: params.filterScope,
    recordsExported: filtered.length,
    format: 'PDF',
    createdAt: now
  };
  adminExportLogsStore.unshift(exportLog);
  saveIdentityDbToDisk();

  return {
    pdfBase64,
    fileName,
    recordsCount: filtered.length,
    exportLog
  };
}
