/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { NotificationPayload, NotificationResult } from './dispatcher';

export function hasLiveWhatsAppConfig(): boolean {
  const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  return Boolean(
    token &&
      token.length > 20 &&
      !token.includes('...') &&
      phoneId &&
      !phoneId.includes('...')
  );
}

/**
 * Normalizes phone numbers to Meta WhatsApp international format without '+' or leading zeros.
 * e.g. '+201001234567' -> '201001234567'
 *      '01001234567' -> '201001234567'
 */
export function normalizeWhatsAppDestination(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0020')) {
    digits = '20' + digits.slice(4);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = '20' + digits.slice(1);
  } else if (!digits.startsWith('20') && digits.length === 10) {
    digits = '20' + digits;
  }
  return digits;
}

/**
 * Builds Meta Cloud API approved template payload with one-tap URL approval button.
 */
export function buildWhatsAppTemplatePayload(params: {
  toPhone: string;
  templateName?: string;
  languageCode?: string;
  businessName: string;
  locationName: string;
  reviewerName: string;
  rating: number;
  reviewText: string;
  draftReply: string;
  approvalUrl: string;
}): Record<string, any> {
  const {
    toPhone,
    templateName = 'review_reply_approval',
    languageCode = 'ar',
    locationName,
    reviewerName,
    rating,
    reviewText,
    draftReply,
    approvalUrl,
  } = params;

  // Extract relative path after domain for the template dynamic URL button
  const urlObj = new URL(approvalUrl);
  const relativeTokenPath = urlObj.pathname.replace(/^\//, ''); // e.g. "approve/token_hash"

  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const cleanSnippet = (reviewText || '(تقييم بدون تعليق)').slice(0, 140);
  const cleanDraft = draftReply.slice(0, 280);

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizeWhatsAppDestination(toPhone),
    type: 'template',
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: 'header',
          parameters: [{ type: 'text', text: locationName }],
        },
        {
          type: 'body',
          parameters: [
            { type: 'text', text: reviewerName },
            { type: 'text', text: `${rating}★ (${stars})` },
            { type: 'text', text: cleanSnippet },
            { type: 'text', text: cleanDraft },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: relativeTokenPath }],
        },
      ],
    },
  };
}

/**
 * Sends a review approval notification to the business owner via WhatsApp.
 */
export async function sendWhatsAppNotification(
  payload: NotificationPayload
): Promise<NotificationResult> {
  const { business, location, review, draft, approvalUrl, isRenewal } = payload;
  const toPhone = business.notification_target;

  if (!toPhone) {
    return {
      channel: 'whatsapp',
      delivered: false,
      mode: 'mock-console',
      detail: 'No WhatsApp phone number configured for business',
    };
  }

  const destination = normalizeWhatsAppDestination(toPhone);
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
  const renewalPrefix = isRenewal ? '🔄 *[رابط متجدد]* ' : '';
  const carefulBadge = review.requires_careful_review
    ? '⚠️ *[يتطلب مراجعة دقيقة]*\n'
    : '';

  if (!hasLiveWhatsAppConfig()) {
    console.log(
      `[MOCK WHATSAPP${isRenewal ? ' (RENEWAL)' : ''} -> +${destination}]\n` +
        `📍 الفرع: *${location.display_name}*\n` +
        `${carefulBadge}` +
        `👤 العميل: *${review.reviewer_name || 'عميل'}* (${stars})\n` +
        `💬 التقييم: "${review.text || '(بدون تعليق)'}"\n\n` +
        `🤖 *الرد المقترح من الذكاء الاصطناعي:*\n"${draft.body}"\n\n` +
        `${renewalPrefix}👉 *رابط الاعتماد بنقرة واحدة:* ${approvalUrl}`
    );

    return {
      channel: 'whatsapp',
      delivered: true,
      mode: 'mock-console',
      detail: approvalUrl,
    };
  }

  // Live Meta Cloud API call
  const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const apiUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  const templatePayload = buildWhatsAppTemplatePayload({
    toPhone: destination,
    templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'review_reply_approval',
    languageCode: process.env.WHATSAPP_TEMPLATE_LANG || 'ar',
    businessName: business.name,
    locationName: location.display_name,
    reviewerName: review.reviewer_name || 'عميل',
    rating: review.rating,
    reviewText: review.text || '',
    draftReply: draft.body,
    approvalUrl,
  });

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(templatePayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[WhatsApp API Error (${res.status})]:`, errText);
    return {
      channel: 'whatsapp',
      delivered: false,
      mode: 'live',
      detail: errText,
    };
  }

  const resData = await res.json();
  return {
    channel: 'whatsapp',
    delivered: true,
    mode: 'live',
    detail: resData.messages?.[0]?.id,
  };
}

/**
 * Sends a Google OAuth disconnection / revocation alert to the owner via WhatsApp.
 */
export async function sendWhatsAppReconnectionAlert(params: {
  business: { id: string; name: string; notification_target: string | null };
  reason?: string;
  reconnectUrl: string;
}): Promise<NotificationResult> {
  const {
    business,
    reason = 'OAuth token revoked or expired (invalid_grant / 401 / 403)',
    reconnectUrl,
  } = params;
  const toPhone = business.notification_target;

  if (!toPhone) {
    return {
      channel: 'whatsapp',
      delivered: false,
      mode: 'mock-console',
      detail: 'No destination phone number configured',
    };
  }

  const destination = normalizeWhatsAppDestination(toPhone);

  if (!hasLiveWhatsAppConfig()) {
    console.log(
      `[MOCK WHATSAPP (RECONNECTION ALERT) -> +${destination}]\n` +
        `⚠️ *تنبيه هام: انقطاع اتصال Google Business Profile*\n\n` +
        `📍 النشاط التجاري: *${business.name}*\n` +
        `❌ السبب: ${reason}\n\n` +
        `توقفت مزامنة التقييمات ونشر الردود مؤقتاً لحين إعادة الاتصال.\n` +
        `👉 *رابط إعادة الربط الفوري:* ${reconnectUrl}`
    );
    return {
      channel: 'whatsapp',
      delivered: true,
      mode: 'mock-console',
      detail: reconnectUrl,
    };
  }

  const token = process.env.META_WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN!;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const apiUrl = `https://graph.facebook.com/v21.0/${phoneId}/messages`;

  const textPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: destination,
    type: 'text',
    text: {
      preview_url: true,
      body:
        `⚠️ *تنبيه هام: انقطاع اتصال Google Business Profile*\n\n` +
        `📍 النشاط: *${business.name}*\n` +
        `❌ السبب: ${reason}\n\n` +
        `توقفت المزامنة مؤقتاً. يرجى إعادة ربط الحساب:\n${reconnectUrl}`,
    },
  };

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(textPayload),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { channel: 'whatsapp', delivered: false, mode: 'live', detail: errText };
  }

  return { channel: 'whatsapp', delivered: true, mode: 'live' };
}
