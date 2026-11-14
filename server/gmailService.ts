import nodemailer from 'nodemailer';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * STUDY TOP 4.0 — REAL EMAIL NOTIFICATION SYSTEM & TRANSACTIONAL QUEUE
 * Official Owner / Sender Email: manjitranjan180513@gmail.com
 * Created by Manjit Ranjan (Google Developer)
 *
 * Security & Honesty Guarantees:
 * - Credentials (GMAIL_APP_PASSWORD, GMAIL_REFRESH_TOKEN, SMTP_PASS, RESEND_API_KEY) are read strictly from server environment variables and NEVER exposed to the client.
 * - Never claims an email was delivered/accepted unless the SMTP or transactional provider returns an actual acceptance response (e.g., 250 OK + messageId).
 * - Distinguishes provider acceptance ('accepted'), queued ('queued'), user-preference skipped ('skipped_preference'), and failed/unconfigured ('failed' / 'pending_provider_config').
 * - Never logs OTP codes, plaintext passwords, or authentication tokens in email_notifications or email_delivery_logs.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const EMAIL_DB_FILE = path.join(DATA_DIR, 'email_notifications_db.json');

export const OWNER_EMAIL = 'manjitranjan180513@gmail.com';
const GMAIL_USER = process.env.GMAIL_USER || process.env.OWNER_EMAIL || OWNER_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || '';
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID || '';
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET || '';
const GMAIL_REFRESH_TOKEN = process.env.GMAIL_REFRESH_TOKEN || '';
const CUSTOM_SMTP_HOST = process.env.SMTP_HOST || '';
const CUSTOM_SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const APP_PUBLIC_URL =
  process.env.APP_URL ||
  process.env.VITE_API_BASE_URL ||
  'https://ais-pre-dexg65p2k7wdhydz6k57ax-798150476797.asia-southeast1.run.app';

// ============================================================================
// 1. DATABASE INTERFACES (Mirrors PostgreSQL Tables)
// ============================================================================

export type EmailEventType =
  | 'welcome'
  | 'login_alert'
  | 'logout_alert'
  | 'security_alert'
  | 'email_verification'
  | 'password_recovery_otp'
  | 'admin_test';

export type EmailDeliveryStatus =
  | 'queued'
  | 'sending'
  | 'accepted'
  | 'failed'
  | 'pending_provider_config'
  | 'skipped_preference';

export interface EmailNotificationRecord {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  email_type: EmailEventType;
  security_subtype?: string;
  subject: string;
  delivery_status: EmailDeliveryStatus;
  provider_message_id: string | null;
  provider_name: string;
  created_at: number;
  sent_at: number | null;
  error_code: string | null;
  error_message: string | null;
  retry_count: number;
  next_retry_at: number | null;
  idempotency_key: string;
  // Safe preview bodies (never populated for OTP emails)
  html_preview?: string;
  text_preview?: string;
}

export interface EmailPreferencesRecord {
  user_id: string;
  welcome_email_enabled: boolean;
  login_alert_enabled: boolean;
  logout_email_enabled: boolean;
  security_alert_enabled: boolean;
  updated_at: number;
}

export interface EmailDeliveryLogRecord {
  id: string;
  notification_id: string;
  provider: string;
  status: EmailDeliveryStatus;
  retry_count: number;
  last_error: string | null;
  provider_response?: string | null;
  created_at: number;
}

export interface AdminEmailGlobalConfig {
  ownerEmail: string;
  welcomeEmailEnabled: boolean;
  loginAlertEnabled: boolean;
  logoutEmailEnabled: boolean;
  securityAlertEnabled: boolean;
  emailVerificationEnabled: boolean;
  maxRetries: number;
  rateLimitPerMinutePerUser: number;
  updatedAt: number;
}

// ============================================================================
// 2. PERSISTENT STORES & POSTGRESQL SYNC HOOK
// ============================================================================

const emailNotificationsStore = new Map<string, EmailNotificationRecord>();
const emailPreferencesStore = new Map<string, EmailPreferencesRecord>();
const emailDeliveryLogsStore: EmailDeliveryLogRecord[] = [];
const idempotencyKeyMap = new Map<string, { notificationId: string; timestamp: number }>();
const sentWelcomeAccounts = new Set<string>(); // Permanent set of user_ids and emails that received accepted Welcome email
const recipientRateLimitMap = new Map<string, number[]>(); // recipient_email -> array of timestamps in last 60s

// In-memory Google Workspace OAuth 2.0 access tokens for Gmail REST API (never persisted to disk or logs)
let activeOwnerGmailAccessToken: { token: string; updatedAt: number; email: string } | null = null;
const userGmailAccessTokens = new Map<string, { token: string; updatedAt: number }>();

export function registerGmailAccessToken(email?: string, accessToken?: string | null) {
  const cleanToken = (accessToken || '').trim();
  if (!cleanToken || cleanToken === 'null' || cleanToken === 'undefined') return;
  const cleanEmail = (email || '').trim().toLowerCase();

  if (cleanEmail) {
    userGmailAccessTokens.set(cleanEmail, { token: cleanToken, updatedAt: Date.now() });
  }

  // Register as active sender token if from owner email or if no sender token is cached yet
  if (!activeOwnerGmailAccessToken || cleanEmail === OWNER_EMAIL.toLowerCase()) {
    activeOwnerGmailAccessToken = {
      token: cleanToken,
      updatedAt: Date.now(),
      email: cleanEmail || OWNER_EMAIL
    };
  }

  // Immediately flush any previously queued emails (e.g., pending_provider_config) now that live Gmail OAuth is active
  setTimeout(() => {
    processEmailQueue({ forceRetryAllFailed: true }).catch(() => {});
  }, 150);
}

let globalEmailConfig: AdminEmailGlobalConfig = {
  ownerEmail: OWNER_EMAIL,
  welcomeEmailEnabled: true,
  loginAlertEnabled: true,
  logoutEmailEnabled: true,
  securityAlertEnabled: true,
  emailVerificationEnabled: true,
  maxRetries: 3,
  rateLimitPerMinutePerUser: 6,
  updatedAt: Date.now()
};

// Optional PostgreSQL query hook injected from server.ts
let pgQueryHook: ((text: string, params?: any[]) => Promise<any>) | null = null;

export function registerPostgresHook(queryFn: (text: string, params?: any[]) => Promise<any>) {
  pgQueryHook = queryFn;
}

function loadEmailDbFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(EMAIL_DB_FILE)) {
      const raw = fs.readFileSync(EMAIL_DB_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.notifications)) {
        for (const n of parsed.notifications) {
          if (n && n.id) {
            emailNotificationsStore.set(n.id, n);
            if (n.idempotency_key) {
              idempotencyKeyMap.set(n.idempotency_key, { notificationId: n.id, timestamp: n.created_at });
            }
            if (n.email_type === 'welcome' && n.delivery_status === 'accepted') {
              sentWelcomeAccounts.add(n.recipient_email.toLowerCase());
              if (n.user_id) sentWelcomeAccounts.add(n.user_id);
            }
          }
        }
      }
      if (Array.isArray(parsed.preferences)) {
        for (const p of parsed.preferences) {
          if (p && p.user_id) emailPreferencesStore.set(p.user_id, p);
        }
      }
      if (Array.isArray(parsed.deliveryLogs)) {
        emailDeliveryLogsStore.push(...parsed.deliveryLogs.slice(0, 1000));
      }
      if (parsed.globalConfig) {
        globalEmailConfig = { ...globalEmailConfig, ...parsed.globalConfig, ownerEmail: OWNER_EMAIL };
      }
    }
  } catch (err) {
    console.warn('[StudyTopEmail4.0] Disk load notice:', err);
  }
}

function saveEmailDbToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const payload = {
      updatedAt: Date.now(),
      globalConfig: globalEmailConfig,
      sentWelcomeAccounts: Array.from(sentWelcomeAccounts),
      notifications: Array.from(emailNotificationsStore.values())
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, 600),
      preferences: Array.from(emailPreferencesStore.values()),
      deliveryLogs: emailDeliveryLogsStore.slice(0, 1000)
    };
    fs.writeFileSync(EMAIL_DB_FILE, JSON.stringify(payload, null, 2), 'utf8');
  } catch (err) {
    console.warn('[StudyTopEmail4.0] Disk save notice:', err);
  }
}

loadEmailDbFromDisk();

async function syncNotificationToPostgres(record: EmailNotificationRecord) {
  if (!pgQueryHook) return;
  try {
    await pgQueryHook(
      `INSERT INTO email_notifications (id, user_id, recipient_email, email_type, subject, delivery_status, provider_message_id, created_at, sent_at, error_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         delivery_status = EXCLUDED.delivery_status,
         provider_message_id = EXCLUDED.provider_message_id,
         sent_at = EXCLUDED.sent_at,
         error_code = EXCLUDED.error_code`,
      [
        record.id,
        record.user_id,
        record.recipient_email,
        record.email_type,
        record.subject,
        record.delivery_status,
        record.provider_message_id,
        record.created_at,
        record.sent_at,
        record.error_code
      ]
    );
  } catch (_) {}
}

async function syncDeliveryLogToPostgres(log: EmailDeliveryLogRecord) {
  if (!pgQueryHook) return;
  try {
    await pgQueryHook(
      `INSERT INTO email_delivery_logs (id, notification_id, provider, status, retry_count, last_error, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO NOTHING`,
      [
        log.id,
        log.notification_id,
        log.provider,
        log.status,
        log.retry_count,
        log.last_error,
        log.created_at
      ]
    );
  } catch (_) {}
}

// ============================================================================
// 3. OTP VAULT (5-Minute Cryptographic OTPs — Never Logged in Email Previews)
// ============================================================================

interface OtpRecord {
  hashedOtp: string;
  salt: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
  email: string;
}

const otpStore = new Map<string, OtpRecord>();
const otpRateLimit = new Map<string, number>();

export function generateSecureOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOtp(otp: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(otp).digest('hex');
}

export function storeOtp(email: string, plainOtp: string): { expiresAt: number; validitySeconds: number } {
  const normalizedEmail = email.trim().toLowerCase();
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedOtp = hashOtp(plainOtp, salt);
  const validitySeconds = 300;
  const expiresAt = Date.now() + validitySeconds * 1000;

  otpStore.set(normalizedEmail, {
    hashedOtp,
    salt,
    expiresAt,
    attempts: 0,
    createdAt: Date.now(),
    email: normalizedEmail
  });
  otpRateLimit.set(normalizedEmail, Date.now());
  return { expiresAt, validitySeconds };
}

export function verifyOtp(email: string, inputOtp: string): { success: boolean; message: string; expired?: boolean } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = otpStore.get(normalizedEmail);
  if (!record) {
    return { success: false, message: 'No active OTP request found. Please request a new OTP.' };
  }
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return { success: false, expired: true, message: 'OTP expired. Password recovery OTPs are valid for 5 minutes. Please request a new one.' };
  }
  if (record.attempts >= 5) {
    otpStore.delete(normalizedEmail);
    return { success: false, message: 'Maximum 5 verification attempts exceeded. This OTP has been invalidated.' };
  }
  record.attempts += 1;
  const testHash = hashOtp(inputOtp.trim(), record.salt);
  const isValid = crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(record.hashedOtp, 'hex'));
  if (!isValid) {
    const remaining = 5 - record.attempts;
    return { success: false, message: `Invalid OTP code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
  }
  otpStore.delete(normalizedEmail);
  return { success: true, message: 'OTP verified successfully.' };
}

// ============================================================================
// 4. USER EMAIL PREFERENCES MANAGEMENT
// ============================================================================

export function getUserEmailPreferences(userId: string): EmailPreferencesRecord {
  const cleanId = (userId || '').trim();
  const existing = emailPreferencesStore.get(cleanId);
  if (existing) return existing;

  const defaultPrefs: EmailPreferencesRecord = {
    user_id: cleanId || 'anonymous',
    welcome_email_enabled: true,
    login_alert_enabled: true,
    logout_email_enabled: true,
    security_alert_enabled: true,
    updated_at: Date.now()
  };
  if (cleanId) {
    emailPreferencesStore.set(cleanId, defaultPrefs);
    saveEmailDbToDisk();
  }
  return defaultPrefs;
}

export async function updateUserEmailPreferences(
  userId: string,
  updates: Partial<Omit<EmailPreferencesRecord, 'user_id' | 'updated_at'>>
): Promise<EmailPreferencesRecord> {
  const current = getUserEmailPreferences(userId);
  const next: EmailPreferencesRecord = {
    user_id: userId,
    welcome_email_enabled:
      updates.welcome_email_enabled !== undefined ? Boolean(updates.welcome_email_enabled) : current.welcome_email_enabled,
    login_alert_enabled:
      updates.login_alert_enabled !== undefined ? Boolean(updates.login_alert_enabled) : current.login_alert_enabled,
    logout_email_enabled:
      updates.logout_email_enabled !== undefined ? Boolean(updates.logout_email_enabled) : current.logout_email_enabled,
    security_alert_enabled:
      updates.security_alert_enabled !== undefined ? Boolean(updates.security_alert_enabled) : current.security_alert_enabled,
    updated_at: Date.now()
  };

  emailPreferencesStore.set(userId, next);
  saveEmailDbToDisk();

  if (pgQueryHook) {
    try {
      await pgQueryHook(
        `INSERT INTO email_preferences (user_id, welcome_email_enabled, login_alert_enabled, logout_email_enabled, security_alert_enabled, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           welcome_email_enabled = EXCLUDED.welcome_email_enabled,
           login_alert_enabled = EXCLUDED.login_alert_enabled,
           logout_email_enabled = EXCLUDED.logout_email_enabled,
           security_alert_enabled = EXCLUDED.security_alert_enabled,
           updated_at = EXCLUDED.updated_at`,
        [
          next.user_id,
          next.welcome_email_enabled,
          next.login_alert_enabled,
          next.logout_email_enabled,
          next.security_alert_enabled,
          next.updated_at
        ]
      );
    } catch (_) {}
  }

  return next;
}

// ============================================================================
// 5. VALIDATION, TRANSPORTER & PROVIDER DETECTION
// ============================================================================

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  if (trimmed.length > 254 || trimmed.endsWith('@studytop.guest') || trimmed.endsWith('@deleted.studytop.local')) {
    return false;
  }
  return EMAIL_REGEX.test(trimmed);
}

function getActiveProviderInfo(): {
  configured: boolean;
  providerName: string;
  transportMode: string;
  setupRequiredReason: string | null;
} {
  if (activeOwnerGmailAccessToken && Date.now() - activeOwnerGmailAccessToken.updatedAt < 55 * 60 * 1000) {
    return {
      configured: true,
      providerName: 'Google Workspace Gmail API (OAuth 2.0)',
      transportMode: `Authenticated Gmail REST API (${activeOwnerGmailAccessToken.email || OWNER_EMAIL})`,
      setupRequiredReason: null
    };
  }
  if (userGmailAccessTokens.size > 0) {
    return {
      configured: true,
      providerName: 'Google Workspace Gmail API (OAuth 2.0)',
      transportMode: `Authenticated Gmail REST API (${OWNER_EMAIL})`,
      setupRequiredReason: null
    };
  }
  if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
    return {
      configured: true,
      providerName: 'Gmail OAuth2 SMTP',
      transportMode: `Authenticated Gmail OAuth2 (${OWNER_EMAIL})`,
      setupRequiredReason: null
    };
  }
  if (GMAIL_APP_PASSWORD) {
    return {
      configured: true,
      providerName: 'Gmail SMTP (App Password)',
      transportMode: `Authenticated Gmail SMTP (${OWNER_EMAIL})`,
      setupRequiredReason: null
    };
  }
  if (CUSTOM_SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return {
      configured: true,
      providerName: `Custom SMTP (${CUSTOM_SMTP_HOST})`,
      transportMode: `Authenticated Custom SMTP (${OWNER_EMAIL})`,
      setupRequiredReason: null
    };
  }
  if (RESEND_API_KEY) {
    return {
      configured: true,
      providerName: 'Resend Transactional API',
      transportMode: `Transactional HTTP API (${OWNER_EMAIL})`,
      setupRequiredReason: null
    };
  }
  return {
    configured: false,
    providerName: 'Gmail OAuth Ready (Sign In with Google to Activate Token)',
    transportMode: 'Awaiting Google Sign-In OAuth Token or GMAIL_APP_PASSWORD',
    setupRequiredReason:
      'Sign in with Google (or click "Connect Gmail OAuth Sender" in Admin Email Management) to authorize live Gmail API delivery, or set GMAIL_APP_PASSWORD in server environment variables.'
  };
}

function createTransporter() {
  if (GMAIL_CLIENT_ID && GMAIL_CLIENT_SECRET && GMAIL_REFRESH_TOKEN) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: GMAIL_USER,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN
      }
    });
  }

  if (GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD
      }
    });
  }

  if (CUSTOM_SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: CUSTOM_SMTP_HOST,
      port: CUSTOM_SMTP_PORT,
      secure: CUSTOM_SMTP_PORT === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return null;
}

// ============================================================================
// 6. RESPONSIVE LIGHT-SAAS HTML & PLAIN-TEXT EMAIL TEMPLATES
// ============================================================================

function createEmailTemplate(params: {
  title: string;
  badgeText?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
}): string {
  const ctaBlock =
    params.ctaLabel && params.ctaUrl
      ? `
      <div style="text-align: center; margin: 28px 0;">
        <a href="${params.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff !important; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; font-size: 14px; letter-spacing: 0.2px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);">
          ${params.ctaLabel} &rarr;
        </a>
      </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 24px 12px; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.06);">
    <!-- Top Brand Header -->
    <div style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 55%, #4f46e5 100%); padding: 32px 28px; text-align: center; color: #ffffff;">
      <div style="display: inline-block; background: rgba(255, 255, 255, 0.16); border: 1px solid rgba(255, 255, 255, 0.28); padding: 5px 14px; border-radius: 999px; font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">
        ${params.badgeText || 'STUDY TOP OFFICIAL NOTIFICATION'}
      </div>
      <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">STUDY TOP</h1>
      <p style="margin: 6px 0 0; font-size: 12px; color: #dbeafe; font-weight: 600;">
        AI-Powered Academic Learning &amp; Smart Notes Ecosystem
      </p>
    </div>

    <!-- Main Body -->
    <div style="padding: 32px 28px; font-size: 14px; line-height: 1.65; color: #334155;">
      ${params.bodyHtml}
      ${ctaBlock}
      <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9;">
        <p style="margin: 0; font-size: 13px; color: #475569;">Warm regards,</p>
        <p style="margin: 4px 0 0; font-size: 14px; font-weight: 800; color: #0f172a;">Study Top Team</p>
        <p style="margin: 2px 0 0; font-size: 12px; color: #2563eb; font-weight: 600;">Official Sender: ${OWNER_EMAIL}</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f8fafc; padding: 22px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0; font-weight: 800; color: #0f172a; font-size: 12px;">Created by Manjit Ranjan</p>
      <p style="margin: 4px 0 0;">Official Owner Email: <a href="mailto:${OWNER_EMAIL}" style="color: #2563eb; text-decoration: none; font-weight: 700;">${OWNER_EMAIL}</a></p>
      <p style="margin: 8px 0 0;">${params.footerNote || 'You received this transactional notification regarding your Study Top account security and activity.'}</p>
      <p style="margin: 8px 0 0; font-size: 10px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Study Top. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

// ============================================================================
// 7. BACKGROUND QUEUE & PROVIDER EXECUTION ENGINE
// ============================================================================

function checkRateLimit(recipientEmail: string): boolean {
  const now = Date.now();
  const key = recipientEmail.toLowerCase();
  const windowStart = now - 60000;
  const recent = (recipientRateLimitMap.get(key) || []).filter(t => t > windowStart);
  if (recent.length >= globalEmailConfig.rateLimitPerMinutePerUser) {
    return false;
  }
  recent.push(now);
  recipientRateLimitMap.set(key, recent);
  return true;
}

function recordDeliveryLog(params: {
  notificationId: string;
  provider: string;
  status: EmailDeliveryStatus;
  retryCount: number;
  lastError: string | null;
  providerResponse?: string | null;
}) {
  const logEntry: EmailDeliveryLogRecord = {
    id: `edl_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    notification_id: params.notificationId,
    provider: params.provider,
    status: params.status,
    retry_count: params.retryCount,
    last_error: params.lastError,
    provider_response: params.providerResponse || null,
    created_at: Date.now()
  };
  emailDeliveryLogsStore.unshift(logEntry);
  if (emailDeliveryLogsStore.length > 1000) {
    emailDeliveryLogsStore.length = 1000;
  }
  syncDeliveryLogToPostgres(logEntry).catch(() => {});
}

async function sendViaGmailRestApi(params: {
  accessToken: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  htmlBody: string;
}): Promise<{
  accepted: boolean;
  providerMessageId: string | null;
  statusCode: number;
  errorMessage: string | null;
}> {
  try {
    const encodedSubject = `=?UTF-8?B?${Buffer.from(params.subject, 'utf-8').toString('base64')}?=`;
    const mimeLines = [
      `From: "Study Top Team" <${params.fromEmail}>`,
      `To: ${params.toEmail}`,
      `Reply-To: ${OWNER_EMAIL}`,
      `Subject: ${encodedSubject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      'Content-Transfer-Encoding: base64',
      '',
      Buffer.from(params.htmlBody, 'utf-8').toString('base64')
    ];

    const rawMessage = Buffer.from(mimeLines.join('\r\n'), 'utf-8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawMessage })
    });

    const data: any = await resp.json().catch(() => ({}));
    if (resp.ok && data?.id) {
      return {
        accepted: true,
        providerMessageId: String(data.id),
        statusCode: resp.status,
        errorMessage: null
      };
    }

    return {
      accepted: false,
      providerMessageId: null,
      statusCode: resp.status,
      errorMessage: data?.error?.message || `Gmail API returned HTTP ${resp.status}`
    };
  } catch (err: any) {
    return {
      accepted: false,
      providerMessageId: null,
      statusCode: 500,
      errorMessage: err?.message || 'Gmail REST API network error'
    };
  }
}

async function attemptProviderDelivery(
  record: EmailNotificationRecord,
  htmlBody: string,
  textBody: string
): Promise<{
  accepted: boolean;
  status: EmailDeliveryStatus;
  providerMessageId: string | null;
  errorCode: string | null;
  errorMessage: string | null;
}> {
  const providerInfo = getActiveProviderInfo();
  record.provider_name = providerInfo.providerName;

  // 0. Attempt Google Workspace Gmail REST API (OAuth 2.0) if an access token is available in memory
  const recipientLower = record.recipient_email.toLowerCase();
  const candidateTokens: Array<{ token: string; email: string; isOwner: boolean }> = [];

  if (activeOwnerGmailAccessToken?.token) {
    candidateTokens.push({
      token: activeOwnerGmailAccessToken.token,
      email: activeOwnerGmailAccessToken.email || OWNER_EMAIL,
      isOwner: true
    });
  }
  const recipientTokenEntry = userGmailAccessTokens.get(recipientLower);
  if (recipientTokenEntry?.token && recipientTokenEntry.token !== activeOwnerGmailAccessToken?.token) {
    candidateTokens.push({
      token: recipientTokenEntry.token,
      email: recipientLower,
      isOwner: false
    });
  }

  for (const candidate of candidateTokens) {
    const gmailRes = await sendViaGmailRestApi({
      accessToken: candidate.token,
      fromEmail: candidate.email || OWNER_EMAIL,
      toEmail: record.recipient_email,
      subject: record.subject,
      htmlBody
    });

    if (gmailRes.accepted && gmailRes.providerMessageId) {
      record.provider_name = 'Google Workspace Gmail API (OAuth 2.0)';
      return {
        accepted: true,
        status: 'accepted',
        providerMessageId: gmailRes.providerMessageId,
        errorCode: null,
        errorMessage: null
      };
    }

    // If token expired or lacked scope (401/403), evict stale token from memory
    if (gmailRes.statusCode === 401 || gmailRes.statusCode === 403) {
      if (candidate.isOwner && activeOwnerGmailAccessToken?.token === candidate.token) {
        activeOwnerGmailAccessToken = null;
      }
      userGmailAccessTokens.delete(candidate.email.toLowerCase());
    }
  }

  // 1. If Resend API key is configured, attempt HTTP transactional send
  if (RESEND_API_KEY && !GMAIL_APP_PASSWORD && !GMAIL_REFRESH_TOKEN) {
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: `Study Top <${OWNER_EMAIL}>`,
          to: [record.recipient_email],
          reply_to: OWNER_EMAIL,
          subject: record.subject,
          html: htmlBody,
          text: textBody
        })
      });
      const data: any = await resp.json().catch(() => ({}));
      if (resp.ok && data?.id) {
        return {
          accepted: true,
          status: 'accepted',
          providerMessageId: String(data.id),
          errorCode: null,
          errorMessage: null
        };
      }
      return {
        accepted: false,
        status: 'failed',
        providerMessageId: null,
        errorCode: `RESEND_${resp.status}`,
        errorMessage: data?.message || 'Resend provider rejected message'
      };
    } catch (err: any) {
      return {
        accepted: false,
        status: 'failed',
        providerMessageId: null,
        errorCode: 'RESEND_NETWORK_ERROR',
        errorMessage: err?.message || 'Resend connection error'
      };
    }
  }

  // 2. Nodemailer Transporter (Gmail OAuth2 / Gmail App Password / Custom SMTP)
  const transporter = createTransporter();
  if (!transporter) {
    // HONESTY RULE: Never claim an email was sent when provider credentials are not configured!
    return {
      accepted: false,
      status: 'pending_provider_config',
      providerMessageId: null,
      errorCode: 'PROVIDER_CREDENTIALS_NOT_CONFIGURED',
      errorMessage:
        providerInfo.setupRequiredReason ||
        'Sign in with Google to authorize Gmail OAuth delivery or set GMAIL_APP_PASSWORD in server environment.'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"Study Top Team" <${OWNER_EMAIL}>`,
      replyTo: OWNER_EMAIL,
      to: record.recipient_email,
      subject: record.subject,
      html: htmlBody,
      text: textBody
    });

    const acceptedList = Array.isArray(info.accepted) ? info.accepted : [];
    if (acceptedList.length > 0 || info.messageId) {
      return {
        accepted: true,
        status: 'accepted',
        providerMessageId: info.messageId || `smtp_${Date.now()}`,
        errorCode: null,
        errorMessage: null
      };
    }

    return {
      accepted: false,
      status: 'failed',
      providerMessageId: null,
      errorCode: 'SMTP_NOT_ACCEPTED',
      errorMessage: `SMTP server did not confirm recipient acceptance: ${info.response || 'No response'}`
    };
  } catch (err: any) {
    return {
      accepted: false,
      status: 'failed',
      providerMessageId: null,
      errorCode: err?.code || 'SMTP_SEND_ERROR',
      errorMessage: err?.message || 'SMTP transport error'
    };
  }
}

async function enqueueAndProcessEmail(params: {
  userId?: string;
  recipientEmail: string;
  recipientName?: string;
  emailType: EmailEventType;
  securitySubtype?: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  idempotencyKey: string;
  isSensitiveOtp?: boolean;
  bypassPreferenceCheck?: boolean;
}): Promise<{
  queued: boolean;
  delivered: boolean;
  status: EmailDeliveryStatus;
  notificationId: string | null;
  providerMessageId: string | null;
  message: string;
}> {
  const cleanEmail = (params.recipientEmail || '').trim().toLowerCase();
  const cleanUserId = (params.userId || cleanEmail || 'user').trim();
  const cleanName = (params.recipientName || 'Study Top Scholar').trim();

  // 1. Validate recipient email address
  if (!isValidEmailAddress(cleanEmail)) {
    return {
      queued: false,
      delivered: false,
      status: 'failed',
      notificationId: null,
      providerMessageId: null,
      message: `Invalid or non-routable recipient email address: "${cleanEmail}"`
    };
  }

  // 2. Duplicate-event prevention via Idempotency Key (10s window for accepted deliveries to prevent accidental double-clicks)
  const existingIdemp = idempotencyKeyMap.get(params.idempotencyKey);
  if (existingIdemp) {
    const prevRec = emailNotificationsStore.get(existingIdemp.notificationId);
    if (prevRec && prevRec.delivery_status === 'accepted' && Date.now() - existingIdemp.timestamp < 10 * 1000) {
      return {
        queued: false,
        delivered: true,
        status: prevRec.delivery_status,
        notificationId: prevRec.id,
        providerMessageId: prevRec.provider_message_id,
        message: 'Duplicate event prevented by idempotency guard.'
      };
    }
  }

  // 3. Global Admin Event Toggle & User Preferences Check
  if (!params.bypassPreferenceCheck) {
    const userPrefs = getUserEmailPreferences(cleanUserId);

    if (params.emailType === 'welcome' && (!globalEmailConfig.welcomeEmailEnabled || !userPrefs.welcome_email_enabled)) {
      return {
        queued: false,
        delivered: false,
        status: 'skipped_preference',
        notificationId: null,
        providerMessageId: null,
        message: 'Welcome email disabled by user or admin preference.'
      };
    }
    if (params.emailType === 'login_alert' && (!globalEmailConfig.loginAlertEnabled || !userPrefs.login_alert_enabled)) {
      return {
        queued: false,
        delivered: false,
        status: 'skipped_preference',
        notificationId: null,
        providerMessageId: null,
        message: 'Login notification disabled by user or admin preference.'
      };
    }
    if (params.emailType === 'logout_alert' && (!globalEmailConfig.logoutEmailEnabled || !userPrefs.logout_email_enabled)) {
      return {
        queued: false,
        delivered: false,
        status: 'skipped_preference',
        notificationId: null,
        providerMessageId: null,
        message: 'Logout notification disabled by user or admin preference.'
      };
    }
    if (params.emailType === 'security_alert' && (!globalEmailConfig.securityAlertEnabled || !userPrefs.security_alert_enabled)) {
      return {
        queued: false,
        delivered: false,
        status: 'skipped_preference',
        notificationId: null,
        providerMessageId: null,
        message: 'Security alert disabled by user or admin preference.'
      };
    }
  }

  // 4. Rate Limiting Check
  if (!checkRateLimit(cleanEmail)) {
    return {
      queued: false,
      delivered: false,
      status: 'failed',
      notificationId: null,
      providerMessageId: null,
      message: 'Rate limit exceeded for recipient email. Try again in 60 seconds.'
    };
  }

  // 5. Create Notification Record
  const now = Date.now();
  const notificationId = `emn_${now}_${crypto.randomBytes(4).toString('hex')}`;
  const providerInfo = getActiveProviderInfo();

  const record: EmailNotificationRecord = {
    id: notificationId,
    user_id: cleanUserId,
    recipient_email: cleanEmail,
    recipient_name: cleanName,
    email_type: params.emailType,
    security_subtype: params.securitySubtype,
    subject: params.subject,
    delivery_status: 'queued',
    provider_message_id: null,
    provider_name: providerInfo.providerName,
    created_at: now,
    sent_at: null,
    error_code: null,
    error_message: null,
    retry_count: 0,
    next_retry_at: null,
    idempotency_key: params.idempotencyKey,
    // Never store OTP previews in logs!
    html_preview: params.isSensitiveOtp ? undefined : params.htmlBody,
    text_preview: params.isSensitiveOtp ? '[REDACTED SECURITY CODE]' : params.textBody
  };

  emailNotificationsStore.set(notificationId, record);
  idempotencyKeyMap.set(params.idempotencyKey, { notificationId, timestamp: now });

  // 6. Execute Provider Delivery Attempt
  const deliveryResult = await attemptProviderDelivery(record, params.htmlBody, params.textBody);
  record.delivery_status = deliveryResult.status;
  record.provider_message_id = deliveryResult.providerMessageId;
  record.error_code = deliveryResult.errorCode;
  record.error_message = deliveryResult.errorMessage;

  if (deliveryResult.accepted) {
    record.sent_at = Date.now();
    record.next_retry_at = null;
  } else if (deliveryResult.status === 'failed') {
    // Schedule exponential backoff retry (2^retry * 5000ms)
    record.next_retry_at = Date.now() + Math.pow(2, record.retry_count + 1) * 5000;
  }

  recordDeliveryLog({
    notificationId: record.id,
    provider: record.provider_name,
    status: record.delivery_status,
    retryCount: record.retry_count,
    lastError: record.error_message,
    providerResponse: deliveryResult.providerMessageId
  });

  saveEmailDbToDisk();
  syncNotificationToPostgres(record).catch(() => {});

  return {
    queued: true,
    delivered: deliveryResult.accepted,
    status: record.delivery_status,
    notificationId: record.id,
    providerMessageId: record.provider_message_id,
    message: deliveryResult.accepted
      ? `Email accepted by ${record.provider_name} (Message ID: ${record.provider_message_id})`
      : record.error_message || `Email recorded with status: ${record.delivery_status}`
  };
}

// ============================================================================
// 8. REQUIRED REUSABLE BACKEND EMAIL FUNCTIONS
// ============================================================================

/**
 * 1. sendWelcomeEmail()
 * Trigger: Immediately after a user successfully creates their Study Top account for the first time.
 * Subject: Welcome to Study Top — Your Learning Journey Starts Here!
 * Sent only once per account, never on repeat logins.
 */
export async function sendWelcomeEmail(
  toEmailOrParams:
    | string
    | {
        userId?: string;
        email: string;
        name: string;
        username?: string;
      },
  nameArg?: string,
  usernameArg?: string,
  userIdArg?: string
): Promise<boolean> {
  const email = typeof toEmailOrParams === 'string' ? toEmailOrParams : toEmailOrParams.email;
  const name = (typeof toEmailOrParams === 'string' ? nameArg : toEmailOrParams.name) || 'Study Top Scholar';
  const rawUsername = (typeof toEmailOrParams === 'string' ? usernameArg : toEmailOrParams.username) || email.split('@')[0] || 'scholar';
  const formattedUsername = rawUsername.startsWith('@') ? rawUsername : `@${rawUsername.replace(/[^a-z0-9_.]/gi, '').toLowerCase()}`;
  const userId = (typeof toEmailOrParams === 'string' ? userIdArg : toEmailOrParams.userId) || email.trim().toLowerCase();

  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!isValidEmailAddress(normalizedEmail)) return false;

  // Enforce strict once-per-account rule once accepted by provider
  if (sentWelcomeAccounts.has(normalizedEmail) || (userId && sentWelcomeAccounts.has(userId))) {
    return false;
  }

  const subject = 'Welcome to Study Top — Your Learning Journey Starts Here!';
  const htmlBody = createEmailTemplate({
    title: subject,
    badgeText: 'WELCOME TO STUDY TOP',
    ctaLabel: 'Open Your Study Top Workspace',
    ctaUrl: APP_PUBLIC_URL,
    bodyHtml: `
      <h2 style="font-size: 20px; color: #0f172a; margin-top: 0; font-weight: 900;">
        Welcome to Study Top, ${name}! 🎓
      </h2>
      <p>
        Congratulations on creating your official <strong>Study Top</strong> account! Your personalized AI academic learning ecosystem is now active and ready.
      </p>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 16px 20px; margin: 20px 0;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.8px; color: #1d4ed8; font-weight: 800;">
          Your Official Student Identity
        </div>
        <div style="margin-top: 8px; font-size: 14px; color: #0f172a;">
          <strong>Registered Name:</strong> ${name}<br/>
          <strong>Unique Username:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: 800;">${formattedUsername}</span><br/>
          <strong>Public Profile:</strong> <span style="font-family: monospace; color: #475569;">studytop.app/${formattedUsername}</span>
        </div>
      </div>

      <p style="font-weight: 800; color: #0f172a; margin-bottom: 8px;">Explore Your Study Top Features:</p>
      <ul style="padding-left: 20px; margin-top: 0; line-height: 1.8; color: #334155;">
        <li><strong>AI Point-Wise Notes Maker:</strong> Transform PDFs, textbook photos, documents, and YouTube lectures into structured chapter notes.</li>
        <li><strong>Universal AI Solver:</strong> Step-by-step verified solutions across Mathematics, Physics, Chemistry, Biology, and 23 academic subjects.</li>
        <li><strong>Smart Flashcards &amp; Practice Quizzes:</strong> Auto-generate active recall decks and exam mock tests.</li>
        <li><strong>Global Leaderboard &amp; Achievements:</strong> Earn verified learning points, maintain your daily study streak, and unlock scholar badges.</li>
      </ul>
    `,
    footerNote: 'Created by Manjit Ranjan • Sent once upon initial Study Top account creation.'
  });

  const textBody = [
    `STUDY TOP — Welcome to Study Top — Your Learning Journey Starts Here!`,
    ``,
    `Hello ${name},`,
    `Welcome to Study Top! Your permanent learning account has been created.`,
    ``,
    `Registered Name: ${name}`,
    `Unique Username: ${formattedUsername}`,
    `Public Profile: studytop.app/${formattedUsername}`,
    ``,
    `Key Study Top Features:`,
    `- AI Point-Wise Notes Maker (PDFs, images, textbooks, YouTube)`,
    `- Universal AI Solver (Step-by-step math & science solutions)`,
    `- Smart Flashcards & Practice Quizzes`,
    `- Global Leaderboard & Scholar Achievements`,
    ``,
    `Launch Study Top: ${APP_PUBLIC_URL}`,
    ``,
    `Study Top Team`,
    `Created by Manjit Ranjan (${OWNER_EMAIL})`
  ].join('\n');

  const result = await enqueueAndProcessEmail({
    userId,
    recipientEmail: normalizedEmail,
    recipientName: name,
    emailType: 'welcome',
    subject,
    htmlBody,
    textBody,
    idempotencyKey: `welcome:${normalizedEmail}`
  });

  if (result.delivered) {
    sentWelcomeAccounts.add(normalizedEmail);
    if (userId) sentWelcomeAccounts.add(userId);
    saveEmailDbToDisk();
  }

  return result.delivered;
}

/**
 * 2. sendLoginNotification()
 * Trigger: Whenever a registered user successfully signs in.
 * Subject: New Login Detected — Study Top
 * Never includes passwords, authentication tokens, or sensitive credentials.
 */
export async function sendLoginNotification(params: {
  userId?: string;
  email: string;
  name: string;
  ip?: string;
  userAgent?: string;
  provider?: string;
  location?: string;
  timeZone?: string;
}): Promise<boolean> {
  const normalizedEmail = (params.email || '').trim().toLowerCase();
  if (!isValidEmailAddress(normalizedEmail)) return false;

  const now = new Date();
  const resolvedTimeZone =
    params.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const rawProvider = (params.provider || '').toLowerCase();
  const loginMethod = rawProvider.includes('google') ? 'Google Authentication' : 'Email / Password';
  const deviceBrowser = (params.userAgent || 'Web Browser Session').slice(0, 110);
  const locationDisplay = params.location ? params.location : null;

  // Idempotency bucket per 10 seconds so accidental double-clicks don't send two emails, while separate sign-ins always deliver
  const minuteBucket = Math.floor(Date.now() / 10000);
  const subject = 'New Login Detected — Study Top';

  const htmlBody = createEmailTemplate({
    title: subject,
    badgeText: 'SECURITY LOGIN ALERT',
    ctaLabel: 'Review Account Security',
    ctaUrl: APP_PUBLIC_URL,
    bodyHtml: `
      <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; font-weight: 900;">
        New Sign-In to Your Study Top Account
      </h2>
      <p>
        Hello <strong>${params.name || 'Study Top Scholar'}</strong>, we detected a successful login to your Study Top account.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; background: #f8fafc; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0;">
        <tbody>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569; width: 38%;">Registered Name</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700;">${params.name || 'Study Top Scholar'}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Registered Email</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #2563eb; font-family: monospace;">${normalizedEmail}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Login Date &amp; Time</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${dateString} at ${timeString}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Time Zone</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">${resolvedTimeZone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; font-weight: 700; color: #475569;">Login Method</td>
            <td style="padding: 10px 14px; border-bottom: 1px solid #e2e8f0; color: #0f172a; font-weight: 700;">${loginMethod}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; ${locationDisplay ? 'border-bottom: 1px solid #e2e8f0;' : ''} font-weight: 700; color: #475569;">Device / Browser</td>
            <td style="padding: 10px 14px; ${locationDisplay ? 'border-bottom: 1px solid #e2e8f0;' : ''} color: #475569; font-size: 12px;">${deviceBrowser}</td>
          </tr>
          ${
            locationDisplay
              ? `<tr>
            <td style="padding: 10px 14px; font-weight: 700; color: #475569;">Approximate Location</td>
            <td style="padding: 10px 14px; color: #0f172a;">${locationDisplay}</td>
          </tr>`
              : ''
          }
        </tbody>
      </table>

      <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #92400e;">
        <strong>Security Advisory:</strong> If you recognize this sign-in, no action is needed. If you do not recognize this login activity, please reset your password immediately and review your active sessions in Study Top Account Settings.
      </div>
    `
  });

  const textBody = [
    `STUDY TOP — New Login Detected — Study Top`,
    ``,
    `Hello ${params.name || 'Study Top Scholar'},`,
    `A new login was detected on your Study Top account:`,
    `- Registered Name: ${params.name || 'Study Top Scholar'}`,
    `- Registered Email: ${normalizedEmail}`,
    `- Login Date & Time: ${dateString} at ${timeString}`,
    `- Time Zone: ${resolvedTimeZone}`,
    `- Login Method: ${loginMethod}`,
    `- Device / Browser: ${deviceBrowser}`,
    ...(locationDisplay ? [`- Approximate Location: ${locationDisplay}`] : []),
    ``,
    `Security Advisory: If you do not recognize this login, please secure your account and reset your password immediately at ${APP_PUBLIC_URL}.`,
    ``,
    `Study Top Team`,
    `Created by Manjit Ranjan (${OWNER_EMAIL})`
  ].join('\n');

  const result = await enqueueAndProcessEmail({
    userId: params.userId || normalizedEmail,
    recipientEmail: normalizedEmail,
    recipientName: params.name,
    emailType: 'login_alert',
    subject,
    htmlBody,
    textBody,
    idempotencyKey: `login:${normalizedEmail}:${minuteBucket}`
  });

  return result.delivered;
}

/**
 * 3. sendLogoutNotification()
 * Trigger: Whenever a registered user successfully logs out.
 * Subject: You Have Logged Out — Study Top
 * Non-blocking: enqueued after logout event is recorded.
 */
export async function sendLogoutNotification(params: {
  userId?: string;
  email: string;
  name?: string;
  timeZone?: string;
}): Promise<boolean> {
  const normalizedEmail = (params.email || '').trim().toLowerCase();
  if (!isValidEmailAddress(normalizedEmail)) return false;

  const now = new Date();
  const resolvedTimeZone =
    params.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const dateString = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const userName = (params.name || 'Study Top Scholar').trim();
  const minuteBucket = Math.floor(Date.now() / 10000);
  const subject = 'You Have Logged Out — Study Top';

  const htmlBody = createEmailTemplate({
    title: subject,
    badgeText: 'SESSION ENDED SAFELY',
    ctaLabel: 'Sign In Again to Study Top',
    ctaUrl: APP_PUBLIC_URL,
    bodyHtml: `
      <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; font-weight: 900;">
        You Have Logged Out of Study Top
      </h2>
      <p>
        Hello <strong>${userName}</strong>, this is a confirmation that your current Study Top session has ended safely.
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px;">
        <strong>User Name:</strong> ${userName}<br/>
        <strong>Logout Date &amp; Time:</strong> ${dateString} at ${timeString} (${resolvedTimeZone})<br/>
        <strong>Session Status:</strong> <span style="color: #059669; font-weight: 800;">Signed Out &amp; Cleared</span>
      </div>

      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 14px 16px; font-size: 12px; color: #1e40af;">
        <strong>Security Reminder:</strong> If you were studying on a shared, school, or public computer, please close all browser tabs to ensure your personal data remains private.
      </div>
    `
  });

  const textBody = [
    `STUDY TOP — You Have Logged Out — Study Top`,
    ``,
    `Hello ${userName},`,
    `Your current Study Top session has ended safely.`,
    `- User Name: ${userName}`,
    `- Logout Date & Time: ${dateString} at ${timeString} (${resolvedTimeZone})`,
    ``,
    `Security Reminder: Always remember to sign out and close browser windows when using shared or public devices.`,
    ``,
    `Study Top Team`,
    `Created by Manjit Ranjan (${OWNER_EMAIL})`
  ].join('\n');

  const result = await enqueueAndProcessEmail({
    userId: params.userId || normalizedEmail,
    recipientEmail: normalizedEmail,
    recipientName: userName,
    emailType: 'logout_alert',
    subject,
    htmlBody,
    textBody,
    idempotencyKey: `logout:${normalizedEmail}:${minuteBucket}`
  });

  return result.delivered;
}

/**
 * 4. sendSecurityAlert()
 * Supports:
 * - password_reset_requested
 * - password_changed
 * - new_device_signin
 * - account_deletion_requested
 * - account_deletion_completed
 * Never logs OTPs, passwords, or private tokens.
 */
export async function sendSecurityAlert(params: {
  userId?: string;
  email: string;
  name?: string;
  alertType:
    | 'password_reset_requested'
    | 'password_changed'
    | 'new_device_signin'
    | 'account_deletion_requested'
    | 'account_deletion_completed';
  details?: string;
}): Promise<boolean> {
  const normalizedEmail = (params.email || '').trim().toLowerCase();
  if (!isValidEmailAddress(normalizedEmail)) return false;

  const userName = (params.name || 'Study Top Scholar').trim();
  const nowStr = new Date().toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const alertMeta: Record<
    typeof params.alertType,
    { subject: string; heading: string; description: string }
  > = {
    password_reset_requested: {
      subject: 'Security Alert: Password Reset Requested — Study Top',
      heading: 'Password Reset Request Received',
      description:
        'A password reset was requested for your Study Top account. If you did not initiate this request, your account password has not been changed.'
    },
    password_changed: {
      subject: 'Security Alert: Password Successfully Changed — Study Top',
      heading: 'Your Study Top Password Was Changed',
      description:
        'Your Study Top account password was successfully updated. If you did not authorize this change, please contact Study Top support immediately.'
    },
    new_device_signin: {
      subject: 'Security Alert: New Device Sign-In — Study Top',
      heading: 'Sign-In From a New Device or Browser',
      description:
        'Your Study Top account was accessed from a new device or browser environment.'
    },
    account_deletion_requested: {
      subject: 'Security Alert: Account Deletion Requested — Study Top',
      heading: 'Account Deletion Request Initiated',
      description:
        'We received a verified request to permanently delete your Study Top account and associated personal profile data.'
    },
    account_deletion_completed: {
      subject: 'Confirmation: Account Deletion Completed — Study Top',
      heading: 'Your Study Top Account Has Been Permanently Deleted',
      description:
        'Your Study Top account, @username handle, personal profile, and study records have been permanently deleted and anonymized in accordance with your request.'
    }
  };

  const meta = alertMeta[params.alertType] || alertMeta.new_device_signin;
  const minuteBucket = Math.floor(Date.now() / 60000);

  const htmlBody = createEmailTemplate({
    title: meta.subject,
    badgeText: 'STUDY TOP SECURITY ALERT',
    ctaLabel: 'Open Study Top Security Center',
    ctaUrl: APP_PUBLIC_URL,
    bodyHtml: `
      <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; font-weight: 900;">
        ${meta.heading}
      </h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>${meta.description}</p>
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 13px; color: #991b1b;">
        <strong>Event Type:</strong> ${params.alertType.replace(/_/g, ' ').toUpperCase()}<br/>
        <strong>Timestamp:</strong> ${nowStr}<br/>
        ${params.details ? `<strong>Additional Context:</strong> ${params.details}` : ''}
      </div>
    `
  });

  const textBody = [
    `STUDY TOP — ${meta.subject}`,
    ``,
    `Hello ${userName},`,
    meta.description,
    `- Event: ${params.alertType}`,
    `- Timestamp: ${nowStr}`,
    ...(params.details ? [`- Details: ${params.details}`] : []),
    ``,
    `Study Top Team`,
    `Created by Manjit Ranjan (${OWNER_EMAIL})`
  ].join('\n');

  const result = await enqueueAndProcessEmail({
    userId: params.userId || normalizedEmail,
    recipientEmail: normalizedEmail,
    recipientName: userName,
    emailType: 'security_alert',
    securitySubtype: params.alertType,
    subject: meta.subject,
    htmlBody,
    textBody,
    idempotencyKey: `sec:${params.alertType}:${normalizedEmail}:${minuteBucket}`
  });

  return result.delivered;
}

/**
 * 5. sendEmailVerification()
 * Sends an email verification link / confirmation notice to the user.
 */
export async function sendEmailVerification(params: {
  userId?: string;
  email: string;
  name?: string;
  verificationUrl?: string;
}): Promise<{ queued: boolean; delivered: boolean; message: string }> {
  const normalizedEmail = (params.email || '').trim().toLowerCase();
  if (!isValidEmailAddress(normalizedEmail)) {
    return { queued: false, delivered: false, message: 'Invalid email address.' };
  }

  const userName = (params.name || 'Study Top Scholar').trim();
  const verifyLink = params.verificationUrl || `${APP_PUBLIC_URL}/?verifyEmail=true`;
  const subject = 'Verify Your Email Address — Study Top';
  const minuteBucket = Math.floor(Date.now() / 60000);

  const htmlBody = createEmailTemplate({
    title: subject,
    badgeText: 'EMAIL VERIFICATION',
    ctaLabel: 'Verify Email Address',
    ctaUrl: verifyLink,
    bodyHtml: `
      <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; font-weight: 900;">
        Verify Your Study Top Email Address
      </h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Please verify your email address (<strong>${normalizedEmail}</strong>) to complete your Study Top security profile and unlock all verified scholar features.</p>
    `
  });

  const textBody = [
    `STUDY TOP — Verify Your Email Address`,
    ``,
    `Hello ${userName},`,
    `Please verify your Study Top email address by visiting: ${verifyLink}`,
    ``,
    `Study Top Team`,
    `Created by Manjit Ranjan (${OWNER_EMAIL})`
  ].join('\n');

  const res = await enqueueAndProcessEmail({
    userId: params.userId || normalizedEmail,
    recipientEmail: normalizedEmail,
    recipientName: userName,
    emailType: 'email_verification',
    subject,
    htmlBody,
    textBody,
    idempotencyKey: `verify:${normalizedEmail}:${minuteBucket}`
  });

  return {
    queued: res.queued,
    delivered: res.delivered,
    message: res.message
  };
}

/**
 * 6. processEmailQueue()
 * Processes eligible failed or queued email notifications with exponential backoff.
 */
export async function processEmailQueue(options?: {
  forceRetryAllFailed?: boolean;
  specificNotificationId?: string;
}): Promise<{
  processedCount: number;
  acceptedCount: number;
  stillPendingOrFailedCount: number;
}> {
  const now = Date.now();
  let processedCount = 0;
  let acceptedCount = 0;
  let stillPendingOrFailedCount = 0;

  const candidates = Array.from(emailNotificationsStore.values()).filter(rec => {
    if (options?.specificNotificationId) {
      return rec.id === options.specificNotificationId;
    }
    if (rec.delivery_status === 'accepted' || rec.delivery_status === 'skipped_preference') {
      return false;
    }
    if (options?.forceRetryAllFailed) {
      return rec.delivery_status === 'failed' || rec.delivery_status === 'pending_provider_config' || rec.delivery_status === 'queued';
    }
    // Automatic background retry for failed jobs within maxRetries
    if (
      rec.delivery_status === 'failed' &&
      rec.retry_count < globalEmailConfig.maxRetries &&
      rec.next_retry_at &&
      now >= rec.next_retry_at
    ) {
      return true;
    }
    return false;
  });

  for (const rec of candidates) {
    if (!rec.html_preview) continue; // Do not auto-retry redacted OTP messages
    processedCount += 1;
    rec.retry_count += 1;
    rec.delivery_status = 'sending';

    const res = await attemptProviderDelivery(
      rec,
      rec.html_preview,
      rec.text_preview || rec.subject
    );

    rec.delivery_status = res.status;
    rec.provider_message_id = res.providerMessageId;
    rec.error_code = res.errorCode;
    rec.error_message = res.errorMessage;

    if (res.accepted) {
      rec.sent_at = Date.now();
      rec.next_retry_at = null;
      acceptedCount += 1;
    } else {
      stillPendingOrFailedCount += 1;
      if (rec.retry_count < globalEmailConfig.maxRetries) {
        rec.next_retry_at = Date.now() + Math.pow(2, rec.retry_count) * 5000;
      } else {
        rec.next_retry_at = null;
      }
    }

    recordDeliveryLog({
      notificationId: rec.id,
      provider: rec.provider_name,
      status: rec.delivery_status,
      retryCount: rec.retry_count,
      lastError: rec.error_message,
      providerResponse: res.providerMessageId
    });

    syncNotificationToPostgres(rec).catch(() => {});
  }

  if (processedCount > 0) {
    saveEmailDbToDisk();
  }

  return {
    processedCount,
    acceptedCount,
    stillPendingOrFailedCount
  };
}

// Start background queue processor every 15 seconds
setInterval(() => {
  processEmailQueue().catch(() => {});
}, 15000);

// ============================================================================
// 9. PASSWORD RECOVERY OTP SENDER (Preserves existing Auth flow + Security Alert)
// ============================================================================

export async function sendPasswordRecoveryOtp(params: {
  email: string;
  name?: string;
}): Promise<{ success: boolean; message: string; validitySeconds: number; cooldownSeconds: number; providerAccepted?: boolean }> {
  const normalizedEmail = (params.email || '').trim().toLowerCase();
  if (!isValidEmailAddress(normalizedEmail)) {
    return {
      success: false,
      message: 'Please provide a valid email address.',
      validitySeconds: 300,
      cooldownSeconds: 0
    };
  }

  const lastSent = otpRateLimit.get(normalizedEmail);
  if (lastSent && Date.now() - lastSent < 60000) {
    const waitSeconds = Math.ceil((60000 - (Date.now() - lastSent)) / 1000);
    return {
      success: false,
      message: `Please wait ${waitSeconds} seconds before requesting another OTP.`,
      validitySeconds: 300,
      cooldownSeconds: waitSeconds
    };
  }

  const plainOtp = generateSecureOtp();
  const { validitySeconds } = storeOtp(normalizedEmail, plainOtp);

  const htmlBody = createEmailTemplate({
    title: 'Password Reset Verification Code — Study Top',
    badgeText: 'PASSWORD RECOVERY CODE',
    bodyHtml: `
      <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; font-weight: 900;">Password Recovery Verification</h2>
      <p>Hello ${params.name ? `<strong>${params.name}</strong>` : 'Study Top Scholar'},</p>
      <p>We received a request to reset your Study Top password. Enter the 6-digit verification code below within 5 minutes:</p>
      <div style="background: #eff6ff; border: 2px dashed #3b82f6; border-radius: 14px; padding: 20px; text-align: center; margin: 22px 0;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700; margin-bottom: 6px;">One-Time Verification Code</div>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #1d4ed8; font-family: monospace;">${plainOtp}</div>
        <div style="font-size: 12px; font-weight: 700; color: #dc2626; margin-top: 6px;">Valid for 5 minutes • Never share this code</div>
      </div>
      <p style="font-size: 12px; color: #64748b;">If you did not request a password reset, you can safely ignore this email.</p>
    `
  });

  const res = await enqueueAndProcessEmail({
    userId: normalizedEmail,
    recipientEmail: normalizedEmail,
    recipientName: params.name || 'Student',
    emailType: 'password_recovery_otp',
    securitySubtype: 'password_reset_requested',
    subject: 'Password Reset Verification Code — Study Top',
    htmlBody,
    textBody: 'Your Study Top password reset code was generated. (Code redacted from logs for security).',
    idempotencyKey: `otp:${normalizedEmail}:${Date.now()}`,
    isSensitiveOtp: true,
    bypassPreferenceCheck: true
  });

  // Also record a non-sensitive security alert event
  sendSecurityAlert({
    email: normalizedEmail,
    name: params.name,
    alertType: 'password_reset_requested',
    details: 'Password recovery verification initiated.'
  }).catch(() => {});

  return {
    success: true,
    providerAccepted: res.delivered,
    message: res.delivered
      ? 'A 6-digit OTP has been sent to your email address. Valid for 5 minutes.'
      : 'OTP generated and queued. Note: Live SMTP provider credentials (GMAIL_APP_PASSWORD) are required in server environment for external inbox delivery.',
    validitySeconds,
    cooldownSeconds: 60
  };
}

// ============================================================================
// 10. ADMIN TEST EMAIL & TELEMETRY QUERIES
// ============================================================================

export async function sendAdminTestEmail(customRecipient?: string): Promise<{
  delivered: boolean;
  status: EmailDeliveryStatus;
  notificationId: string | null;
  providerMessageId: string | null;
  message: string;
  providerInfo: ReturnType<typeof getActiveProviderInfo>;
}> {
  const targetEmail = isValidEmailAddress(customRecipient || '') ? customRecipient!.trim().toLowerCase() : OWNER_EMAIL;
  const nowStr = new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' });
  const subject = `Study Top 4.0 Email System Verification — ${new Date().toLocaleTimeString()}`;

  const htmlBody = createEmailTemplate({
    title: subject,
    badgeText: 'ADMIN DIAGNOSTIC TEST',
    ctaLabel: 'Open Study Top Admin Console',
    ctaUrl: APP_PUBLIC_URL,
    bodyHtml: `
      <h2 style="font-size: 19px; color: #0f172a; margin-top: 0; font-weight: 900;">
        Study Top 4.0 Email Notification System Test
      </h2>
      <p>Hello <strong>Manjit Ranjan</strong>,</p>
      <p>This is an official diagnostic test email triggered from the <strong>Study Top 4.0 Admin Email Management Console</strong>.</p>
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; margin: 18px 0; font-size: 13px; color: #166534;">
        <strong>Official Owner Sender:</strong> ${OWNER_EMAIL}<br/>
        <strong>Recipient:</strong> ${targetEmail}<br/>
        <strong>Timestamp:</strong> ${nowStr}<br/>
        <strong>Queue &amp; Idempotency Engine:</strong> Operational
      </div>
    `
  });

  const textBody = [
    `STUDY TOP 4.0 — Admin Diagnostic Test Email`,
    `Official Sender: ${OWNER_EMAIL}`,
    `Recipient: ${targetEmail}`,
    `Timestamp: ${nowStr}`,
    `Created by Manjit Ranjan`
  ].join('\n');

  const res = await enqueueAndProcessEmail({
    userId: 'USR-ADMIN-MANJIT-01',
    recipientEmail: targetEmail,
    recipientName: 'Manjit Ranjan (Owner)',
    emailType: 'admin_test',
    subject,
    htmlBody,
    textBody,
    idempotencyKey: `admin_test:${targetEmail}:${Date.now()}`,
    bypassPreferenceCheck: true
  });

  return {
    delivered: res.delivered,
    status: res.status,
    notificationId: res.notificationId,
    providerMessageId: res.providerMessageId,
    message: res.message,
    providerInfo: getActiveProviderInfo()
  };
}

export function getAdminEmailManagementDashboardData() {
  const allNotifications = Array.from(emailNotificationsStore.values()).sort(
    (a, b) => b.created_at - a.created_at
  );
  const providerInfo = getActiveProviderInfo();

  const totalProcessed = allNotifications.length;
  const acceptedCount = allNotifications.filter(n => n.delivery_status === 'accepted').length;
  const failedCount = allNotifications.filter(
    n => n.delivery_status === 'failed' || n.delivery_status === 'pending_provider_config'
  ).length;
  const pendingCount = allNotifications.filter(
    n => n.delivery_status === 'queued' || n.delivery_status === 'sending'
  ).length;
  const welcomeCount = allNotifications.filter(n => n.email_type === 'welcome').length;
  const loginCount = allNotifications.filter(n => n.email_type === 'login_alert').length;
  const logoutCount = allNotifications.filter(n => n.email_type === 'logout_alert').length;
  const securityCount = allNotifications.filter(
    n => n.email_type === 'security_alert' || n.email_type === 'password_recovery_otp'
  ).length;

  return {
    ownerEmail: OWNER_EMAIL,
    providerStatus: providerInfo,
    globalConfig: globalEmailConfig,
    summary: {
      totalEmails: totalProcessed,
      acceptedEmails: acceptedCount,
      failedOrUnconfiguredEmails: failedCount,
      pendingEmails: pendingCount,
      welcomeEmails: welcomeCount,
      loginNotifications: loginCount,
      logoutNotifications: logoutCount,
      securityAlerts: securityCount
    },
    notifications: allNotifications.slice(0, 250),
    deliveryLogs: emailDeliveryLogsStore.slice(0, 250)
  };
}

export function updateAdminEmailGlobalConfig(updates: Partial<AdminEmailGlobalConfig>): AdminEmailGlobalConfig {
  globalEmailConfig = {
    ...globalEmailConfig,
    welcomeEmailEnabled:
      updates.welcomeEmailEnabled !== undefined ? Boolean(updates.welcomeEmailEnabled) : globalEmailConfig.welcomeEmailEnabled,
    loginAlertEnabled:
      updates.loginAlertEnabled !== undefined ? Boolean(updates.loginAlertEnabled) : globalEmailConfig.loginAlertEnabled,
    logoutEmailEnabled:
      updates.logoutEmailEnabled !== undefined ? Boolean(updates.logoutEmailEnabled) : globalEmailConfig.logoutEmailEnabled,
    securityAlertEnabled:
      updates.securityAlertEnabled !== undefined ? Boolean(updates.securityAlertEnabled) : globalEmailConfig.securityAlertEnabled,
    emailVerificationEnabled:
      updates.emailVerificationEnabled !== undefined ? Boolean(updates.emailVerificationEnabled) : globalEmailConfig.emailVerificationEnabled,
    maxRetries:
      updates.maxRetries !== undefined ? Math.max(1, Math.min(10, Number(updates.maxRetries))) : globalEmailConfig.maxRetries,
    rateLimitPerMinutePerUser:
      updates.rateLimitPerMinutePerUser !== undefined
        ? Math.max(1, Math.min(30, Number(updates.rateLimitPerMinutePerUser)))
        : globalEmailConfig.rateLimitPerMinutePerUser,
    ownerEmail: OWNER_EMAIL,
    updatedAt: Date.now()
  };
  saveEmailDbToDisk();
  return globalEmailConfig;
}

export function getUserEmailHistory(userId: string, userEmail?: string): EmailNotificationRecord[] {
  const cleanUid = (userId || '').trim();
  const cleanEmail = (userEmail || '').trim().toLowerCase();
  return Array.from(emailNotificationsStore.values())
    .filter(
      n =>
        (cleanUid && n.user_id === cleanUid) ||
        (cleanEmail && n.recipient_email.toLowerCase() === cleanEmail)
    )
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 50)
    .map(n => ({
      ...n,
      html_preview: undefined // Keep user list lightweight
    }));
}

export function getEmailServiceStatus() {
  const providerInfo = getActiveProviderInfo();
  return {
    adminGmail: OWNER_EMAIL,
    ownerEmail: OWNER_EMAIL,
    liveDelivery: providerInfo.configured,
    providerName: providerInfo.providerName,
    transportMode: providerInfo.transportMode,
    setupRequiredReason: providerInfo.setupRequiredReason,
    features: [
      'Official Sender: manjitranjan180513@gmail.com',
      'One-Time Welcome Email with @username Identity',
      'Real-Time Login & Non-Blocking Logout Notifications',
      'Security Alerts (Password Reset, New Device, Account Deletion)',
      'Background Queue with Exponential Backoff & Idempotency Keys',
      'PostgreSQL & Persistent Audit Logs (email_notifications, email_preferences, email_delivery_logs)'
    ],
    timestamp: Date.now()
  };
}
