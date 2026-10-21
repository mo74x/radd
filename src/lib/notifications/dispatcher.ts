import 'server-only';
import { Resend } from 'resend';
import {
  BusinessRow,
  DraftRow,
  LocationRow,
  ReviewRow,
} from '@/types/database';
import {
  sendWhatsAppNotification,
  sendWhatsAppReconnectionAlert,
} from './whatsapp';

export interface NotificationPayload {
  business: BusinessRow;
  location: LocationRow;
  review: ReviewRow;
  draft: DraftRow;
  approvalUrl: string;
  isRenewal?: boolean;
}

export interface NotificationResult {
  channel: string;
  delivered: boolean;
  mode: 'live' | 'mock-console';
  detail?: string;
}

function hasLiveResendKey(): boolean {
  const key = process.env.RESEND_API_KEY;
  return Boolean(key && key.startsWith('re_') && !key.includes('...'));
}

function hasLiveTelegramToken(): boolean {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  return Boolean(token && token.includes(':') && !token.includes('ABCdef'));
}

let dispatchedNotificationCount = 0;
let reconnectionNotificationCount = 0;

export function getDispatchedNotificationCount(): number {
  return dispatchedNotificationCount;
}

export function resetDispatchedNotificationCount(): void {
  dispatchedNotificationCount = 0;
}

export function getReconnectionNotificationCount(): number {
  return reconnectionNotificationCount;
}

export function resetReconnectionNotificationCount(): void {
  reconnectionNotificationCount = 0;
}

export async function sendOwnerNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const { business } = payload;
  dispatchedNotificationCount++;

  if (business.notification_channel === 'telegram') {
    return sendTelegramNotification(payload);
  }

  if (business.notification_channel === 'whatsapp') {
    return sendWhatsAppNotification(payload);
  }

  return sendEmailNotification(payload);
}

async function sendEmailNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const { business, location, review, draft, approvalUrl, isRenewal } = payload;
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const warningBadge = review.requires_careful_review
    ? '⚠️ [Requires Careful Review] '
    : '';
  const renewalPrefix = isRenewal ? '🔄 [Renewed Link] ' : '';

  const subject = `${renewalPrefix}${warningBadge}New ${review.rating}★ Review for ${location.display_name}`;

  if (!hasLiveResendKey() || !business.notification_target) {
    console.log(
      `[MOCK EMAIL${isRenewal ? ' (RENEWAL)' : ''} -> ${business.notification_target ?? 'owner'}] ${subject}\n` +
        `  Reviewer : ${review.reviewer_name} (${stars})\n` +
        `  Draft    : ${draft.body}\n` +
        `  One-Tap  : ${approvalUrl}`
    );
    return {
      channel: 'email',
      delivered: true,
      mode: 'mock-console',
      detail: approvalUrl,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Review Bot <onboarding@resend.dev>',
    to: [business.notification_target],
    subject,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="margin-top: 0; color: #111827;">${location.display_name}</h2>
        ${
          isRenewal
            ? `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px;">
                 <strong>🔄 رابط متجدد (Renewed Magic Link):</strong> تم إنشاء هذا الرابط الجديد بناءً على طلبك بعد انتهاء صلاحية الرابط القديم.
               </div>`
            : ''
        }
        <p style="font-size: 18px; margin: 8px 0;">
          <strong style="color: #f59e0b;">${stars}</strong> by <strong>${review.reviewer_name || 'Customer'}</strong>
        </p>
        ${
          review.requires_careful_review
            ? `<div style="background: #fef2f2; color: #991b1b; padding: 10px 12px; border-radius: 8px; margin-bottom: 12px; font-size: 14px;">
                 <strong>⚠️ Flagged for careful review:</strong> ${
                   review.flags.length ? review.flags.join(', ') : 'Low star rating'
                 }
               </div>`
            : ''
        }
        <div style="background: #f9fafb; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">Customer Review:</div>
          <div dir="auto" style="font-size: 15px; color: #1f2937;">${
            review.text || '<em>(Star rating only — no comment)</em>'
          }</div>
        </div>
        <div style="background: #ecfdf5; padding: 12px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #a7f3d0;">
          <div style="font-size: 12px; color: #047857; margin-bottom: 4px;">Suggested Reply:</div>
          <div dir="auto" style="font-size: 15px; color: #065f46;">${draft.body}</div>
        </div>
        <a href="${approvalUrl}" style="display: inline-block; background: #10b981; color: #ffffff; text-decoration: none; font-weight: 600; padding: 12px 20px; border-radius: 8px;">
          Approve, Edit, or Skip in One Tap →
        </a>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return { channel: 'email', delivered: true, mode: 'live' };
}

async function sendTelegramNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const { business, location, review, draft, approvalUrl, isRenewal } = payload;
  const stars = '⭐'.repeat(review.rating);
  const renewalHeader = isRenewal
    ? `🔄 *[رابط متجدد / Renewed Magic Link]*\nتم إصدار رابط جديد بناءً على طلبك بعد انتهاء صلاحية الرابط السابق.\n\n`
    : '';
  const warningLine = review.requires_careful_review
    ? `⚠️ *تنبيه: تقييم يحتاج لمراجعة دقيقة (${review.flags.join(', ') || 'تقييم منخفض'})*\n\n`
    : '';

  const messageText =
    `${renewalHeader}${warningLine}📍 *${location.display_name}*\n` +
    `${stars} من *${review.reviewer_name || 'عميل'}*\n\n` +
    `💬 *التقييم:*\n${review.text || '(تقييم بالنجوم فقط بدون تعليق)'}\n\n` +
    `✍️ *الرد المقترح:*\n${draft.body}`;

  if (!hasLiveTelegramToken() || !business.notification_target) {
    console.log(
      `[MOCK TELEGRAM${isRenewal ? ' (RENEWAL)' : ''} -> chat_id:${business.notification_target ?? 'unset'}]\n${messageText}\nLink: ${approvalUrl}`
    );
    return {
      channel: 'telegram',
      delivered: true,
      mode: 'mock-console',
      detail: approvalUrl,
    };
  }

  const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  const res = await fetch(tgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: business.notification_target,
      text: messageText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ موافقة أو تعديل الرد (One Tap)',
              url: approvalUrl,
            },
          ],
        ],
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`Telegram sendMessage failed: ${await res.text()}`);
  }

  return { channel: 'telegram', delivered: true, mode: 'live' };
}

export interface ReconnectionPayload {
  business: BusinessRow;
  reason?: string;
  reconnectUrl?: string;
}

export async function sendReconnectionNotification(
  payload: ReconnectionPayload
): Promise<NotificationResult> {
  const { business, reason } = payload;
  reconnectionNotificationCount++;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const reconnectUrl =
    payload.reconnectUrl || `${appUrl}/api/google/oauth/connect?businessId=${business.id}`;

  const subject = `⚠️ Action Required: Reconnect Google Business Profile for ${business.name}`;

  if (business.notification_channel === 'telegram') {
    const messageText =
      `⚠️ *تنبيه هام: انقطاع اتصال Google Business Profile*\n\n` +
      `📍 الحساب: *${business.name}*\n` +
      `❌ السبب: ${reason || 'انتهت صلاحية الإذن أو تم إلغاؤه (Revoked/Expired)'}\n\n` +
      `توقفت مزامنة التقييمات مؤقتاً ولن تتمكن المنظومة من جلب تقييمات جديدة أو نشر الردود حتى تتم إعادة الاتصال.`;

    if (!hasLiveTelegramToken() || !business.notification_target) {
      console.log(
        `[MOCK TELEGRAM (RECONNECTION ALERT) -> chat_id:${business.notification_target ?? 'unset'}]\n` +
          `${messageText}\nReconnect Link: ${reconnectUrl}`
      );
      return {
        channel: 'telegram',
        delivered: true,
        mode: 'mock-console',
        detail: reconnectUrl,
      };
    }

    const tgUrl = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const res = await fetch(tgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: business.notification_target,
        text: messageText,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: '🔗 إعادة ربط حساب Google الآن',
                url: reconnectUrl,
              },
            ],
          ],
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Telegram sendMessage failed: ${await res.text()}`);
    }

    return { channel: 'telegram', delivered: true, mode: 'live' };
  }

  // WhatsApp Notification
  if (business.notification_channel === 'whatsapp') {
    return sendWhatsAppReconnectionAlert({
      business,
      reason: reason || 'OAuth token revoked or expired (invalid_grant / 401 / 403)',
      reconnectUrl,
    });
  }

  // Email Notification
  if (!hasLiveResendKey() || !business.notification_target) {
    console.log(
      `[MOCK EMAIL (RECONNECTION ALERT) -> ${business.notification_target ?? 'owner'}] ${subject}\n` +
        `  Reason   : ${reason || 'OAuth authorization revoked or expired'}\n` +
        `  Reconnect: ${reconnectUrl}`
    );
    return {
      channel: 'email',
      delivered: true,
      mode: 'mock-console',
      detail: reconnectUrl,
    };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'Review Bot <onboarding@resend.dev>',
    to: [business.notification_target],
    subject,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 1px solid #fee2e2; border-radius: 12px; background: #fff;">
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px;">
          <h2 style="margin: 0; color: #991b1b; font-size: 18px;">⚠️ Google Connection Revoked / انقطاع اتصال Google</h2>
        </div>
        <p style="font-size: 15px; color: #374151; line-height: 1.5;">
          The Google Business Profile authorization for <strong>${business.name}</strong> has been revoked or expired.
        </p>
        <p style="font-size: 14px; color: #6b7280; background: #f9fafb; padding: 10px 12px; border-radius: 6px; font-family: monospace;">
          Reason: ${reason || 'OAuth token revoked or expired (invalid_grant / 401 / 403)'}
        </p>
        <p style="font-size: 14px; color: #374151; line-height: 1.5;">
          Review polling and automated response publishing have been safely paused to prevent failed requests. Please reconnect your Google account to restore automated management.
        </p>
        <div style="margin: 24px 0 16px;">
          <a href="${reconnectUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 12px 24px; border-radius: 8px;">
            🔗 Reconnect Google Account (إعادة ربط الحساب) →
          </a>
        </div>
        <p style="font-size: 12px; color: #9ca3af; margin: 0;">
          If you intentionally disconnected this account, you can ignore this email or manage your settings on the dashboard.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return { channel: 'email', delivered: true, mode: 'live' };
}