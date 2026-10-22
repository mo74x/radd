import { NotificationPayload } from './dispatcher';

/**
 * Escapes characters for Telegram HTML format.
 */
function escapeTelegramHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Truncates text cleanly with an ellipsis.
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export interface RenderedTelegramMessage {
  text: string;
  parse_mode: 'HTML';
  reply_markup: {
    inline_keyboard: Array<Array<{ text: string; url: string }>>;
  };
}

/**
 * Formats a Telegram message with strict HTML escaping, smart length truncation,
 * and an inline approval action button.
 */
export function renderTelegramMessage(payload: NotificationPayload): RenderedTelegramMessage {
  const { business, location, review, draft, approvalUrl, isRenewal } = payload;

  const starsCount = Math.max(1, Math.min(5, review.rating || 5));
  const starsString = '⭐'.repeat(starsCount);

  // Snippet truncation: keep customer review concise (max 320 chars)
  const rawReviewText = review.text ? review.text.trim() : '';
  const reviewSnippet = rawReviewText
    ? `«${truncateText(rawReviewText, 320)}»`
    : '<i>(تقييم بالنجوم فقط بدون تعليق)</i>';

  // Sections
  const renewalLine = isRenewal
    ? `🔄 <b>[رابط متجدد / Renewed Magic Link]</b>\nتم إصدار رابط جديد بناءً على طلبك بعد انتهاء صلاحية الرابط السابق.\n\n`
    : '';

  const warningLine = review.requires_careful_review
    ? `⚠️ <b>تنبيه: تقييم يحتاج لمراجعة دقيقة (${escapeTelegramHtml(review.flags.join(', ') || 'تقييم منخفض')})</b>\n\n`
    : '';

  const locationTitle = escapeTelegramHtml(location.display_name || business.name);
  const reviewerName = escapeTelegramHtml(review.reviewer_name || 'عميل جوجل');
  const safeReviewSnippet = rawReviewText ? escapeTelegramHtml(reviewSnippet) : reviewSnippet;
  const safeReplyDraft = escapeTelegramHtml(draft.body);

  const text = `
${renewalLine}${warningLine}📍 <b>${locationTitle}</b>
${starsString} (${starsCount}/5) • من <b>${reviewerName}</b>

💬 <b>التقييم:</b>
${safeReviewSnippet}

✍️ <b>الرد المقترح (رَدّ AI):</b>
${safeReplyDraft}
`.trim();

  return {
    text,
    parse_mode: 'HTML',
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: '✅ موافقة أو تعديل الرد (One-Tap)',
            url: approvalUrl,
          },
        ],
      ],
    },
  };
}
