export type AdminSection =
  | 'overview'
  | 'users'
  | 'students'
  | 'notes'
  | 'ai_assistant'
  | 'files'
  | 'subscriptions'
  | 'payments'
  | 'moderation'
  | 'announcements'
  | 'analytics'
  | 'security'
  | 'audit'
  | 'team'
  | 'app_config'
  | 'integrations'
  | 'backups'
  | 'system_health'
  | 'support_tickets'
  | 'profile'
  | 'logout';

export interface AdminNavItem {
  id: AdminSection;
  label: string;
  icon: string;
  badge?: string;
  category: 'Core' | 'Academic' | 'Intelligence' | 'Operations' | 'System';
}

export interface StudentAccount {
  id: string;
  name: string;
  email: string;
  grade: string;
  subjects: string[];
  studyStreakDays: number;
  totalNotes: number;
  aiVoiceMinutes: number;
  lastActive: number;
  status: 'active' | 'warning' | 'suspended';
}

export interface NoteMetadata {
  id: string;
  title: string;
  ownerEmail: string;
  ownerName: string;
  category: string;
  format: string;
  wordCount: number;
  hasAudio: boolean;
  hasPdf: boolean;
  status: 'published' | 'flagged_review' | 'archived';
  createdAt: number;
  flagged: boolean;
}

export interface AiAssistantConfig {
  provider: string;
  activeModel: string;
  fallbackModel: string;
  temperature: number;
  maxOutputTokens: number;
  systemPrompt: string;
  voiceEnabled: boolean;
  voiceAccent: string;
  audioSpeed: number;
  dailyTokenLimitPerStudent: number;
  safetyFilterLevel: string;
  totalTokensUsedMonth: number;
  geminiStatus: string;
}

export interface UploadedFileItem {
  id: string;
  fileName: string;
  ownerEmail: string;
  fileSizeMb: number;
  mimeType: string;
  ocrProcessed: boolean;
  pagesCount: number;
  uploadedAt: number;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: string;
  activeUsersCount: number;
  maxNotes: number;
  maxStorageMb: number;
  monthlyAiTokens: number;
  voiceTutorEnabled: boolean;
  isDefault: boolean;
}

export interface ContentReport {
  id: string;
  reporterEmail: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reportedAt: number;
}

export interface AdminTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  badge: string;
  permissions: string[];
  isCreator: boolean;
  joinedAt: number;
  status: 'active' | 'invited' | 'suspended';
}

export interface AppConfig {
  appName: string;
  tagline: string;
  creatorCredit: string;
  allowNewRegistrations: boolean;
  maintenanceMode: boolean;
  defaultStorageLimitMb: number;
  geminiModelPreference: string;
  enableVoiceAssistant: boolean;
  enableOCRUpload: boolean;
  enableYouTubeNoteExtractor: boolean;
  contactSupportEmail: string;
}

export interface SystemBackup {
  id: string;
  title: string;
  sizeMb: number;
  totalNotes: number;
  totalUsers: number;
  status: string;
  checksum: string;
  createdAt: number;
}

export interface SupportTicket {
  id: string;
  userEmail: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: number;
  adminReply: string | null;
}
