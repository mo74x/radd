import { NotificationPayload } from './dispatcher';

/**
 * Escapes HTML characters in user text for email safety.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Detects whether text contains Arabic characters.
 */
function isArabicText(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generates email-client-safe, table-based, inline-styled HTML for review approval notifications.
 * Adheres strictly to Radd brand guidelines (Deep Teal #0F5E63, Amber #F5A623, Off-White #F2F7F6).
 */
export function renderApprovalEmail(payload: NotificationPayload): RenderedEmail {
  const { business, location, review, draft, approvalUrl, isRenewal } = payload;

  const reviewText = review.text || '';
  const isArabic = isArabicText(reviewText) || isArabicText(draft.body) || isArabicText(location.display_name);
  const dir = isArabic ? 'rtl' : 'ltr';
  const textAlign = isArabic ? 'right' : 'left';

  const starsCount = Math.max(1, Math.min(5, review.rating || 5));
  const starsString = '★'.repeat(starsCount) + '☆'.repeat(5 - starsCount);

  // Subject line
  const renewalPrefix = isRenewal ? '🔄 [رابط متجدد / Renewed] ' : '';
  const warningBadge = review.requires_careful_review ? '⚠️ [مراجعة دقيقة] ' : '';
  const subject = `${renewalPrefix}${warningBadge}تقييم جديد (${starsCount}★) لـ ${location.display_name || business.name}`;

  // Plain-text alternative
  const plainText = `
${isRenewal ? '[رابط متجدد بناءً على طلبك]\n' : ''}${review.requires_careful_review ? '⚠️ تنبيه: تقييم يحتاج لمراجعة دقيقة\n' : ''}
تقييم جديد لـ ${location.display_name} (${starsString})
العميل: ${review.reviewer_name || 'عميل جوجل'}

نص التقييم:
${reviewText ? `"${reviewText}"` : '(تقييم بالنجوم فقط بدون تعليق)'}

الرد الذكي المقترح:
${draft.body}

للموافقة أو التعديل بنقرة واحدة افتح الرابط التالي:
${approvalUrl}

--
رَدّ (Radd) • نظام الرد الذكي على تقييمات جوجل
`.trim();

  // HTML Email Template
  const html = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${isArabic ? 'ar' : 'en'}" dir="${dir}">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(subject)}</title>
  <style type="text/css">
    body, table, td, p, a, div {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.5;
    }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 12px !important; }
      .content-card { padding: 16px !important; }
      .cta-button { width: 100% !important; display: block !important; box-sizing: border-box !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #F2F7F6; color: #0B1F22; -webkit-text-size-adjust: 100%;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F2F7F6; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container (Max 600px) -->
        <table class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 94, 99, 0.08); border: 1px solid #E2E8F0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: #0F5E63; padding: 24px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <span style="font-size: 26px; font-weight: 800; color: #F2F7F6; letter-spacing: -0.5px;">Radd <span style="color: #F5A623;">ردّ</span></span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="font-size: 13px; color: #D8EAE8; font-weight: 500;">${escapeHtml(location.display_name || business.name)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Renewal Notice If Applicable -->
          ${
            isRenewal
              ? `
          <tr>
            <td style="padding: 16px 24px 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ECFDF5; border: 1px solid #A7F3D0; border-radius: 10px; padding: 12px 16px;">
                <tr>
                  <td style="font-size: 13px; color: #065F46; text-align: ${textAlign}; direction: ${dir};">
                    <strong>🔄 رابط متجدد (Renewed Magic Link):</strong> تم إصدار هذا الرابط بناءً على طلبك بعد انتهاء صلاحية الرابط السابق.
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Flagged/Careful Review Warning If Applicable -->
          ${
            review.requires_careful_review
              ? `
          <tr>
            <td style="padding: 16px 24px 0 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #FEF2F2; border: 1px solid #FECACA; border-radius: 10px; padding: 12px 16px;">
                <tr>
                  <td style="font-size: 13px; color: #991B1B; text-align: ${textAlign}; direction: ${dir}; font-weight: bold;">
                    ⚠️ تنبيه: رصد النظام تقييماً حساساً يحتاج لمراجعتك الشخصية بعناية (${escapeHtml(review.flags.join(', ') || 'تقييم منخفض')}).
                  </td>
                </tr>
              </table>
            </td>
          </tr>`
              : ''
          }

          <!-- Main Body -->
          <tr>
            <td class="content-card" style="padding: 24px; text-align: ${textAlign}; direction: ${dir};">
              
              <!-- Review Metadata (Stars & Reviewer) -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td>
                    <div style="font-size: 22px; color: #F5A623; letter-spacing: 2px; margin-bottom: 4px;">
                      ${starsString}
                    </div>
                    <div style="font-size: 15px; font-weight: 700; color: #0B1F22;">
                      ${escapeHtml(review.reviewer_name || (isArabic ? 'عميل جوجل' : 'Google Reviewer'))}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Customer Review Text Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; margin-bottom: 20px;">
                <tr>
                  <td style="padding: 16px; font-size: 12px; color: #64748B; font-weight: 600; text-transform: uppercase; border-bottom: 1px solid #EDF2F7;">
                    ${isArabic ? 'نص تقييم العميل على جوجل' : 'Customer Review'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; font-size: 15px; color: #1E293B; line-height: 1.6;">
                    ${reviewText ? `«${escapeHtml(reviewText)}»` : `<em style="color: #94A3B8;">${isArabic ? '(تقييم بالنجوم فقط بدون تعليق)' : '(Star rating only, no written text)'}</em>`}
                  </td>
                </tr>
              </table>

              <!-- AI Drafted Suggested Reply Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F2F7F6; border: 1px solid #CBD5E1; border-left: 4px solid #0F5E63; border-right: 4px solid #0F5E63; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 16px; font-size: 12px; color: #0F5E63; font-weight: 700; border-bottom: 1px solid #E2E8F0;">
                    ${isArabic ? '✍️ الرد الذكي المقترح (جاهز للاعتماد)' : '✍️ Suggested AI Reply (Ready for Approval)'}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px; font-size: 15px; color: #0B1F22; line-height: 1.6; white-space: pre-wrap;">
                    ${escapeHtml(draft.body)}
                  </td>
                </tr>
              </table>

              <!-- Big Amber CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
                <tr>
                  <td align="center">
                    <a href="${approvalUrl}" class="cta-button" target="_blank" style="background-color: #F5A623; color: #0B1F22; display: inline-block; padding: 15px 36px; border-radius: 12px; font-weight: 800; font-size: 16px; text-decoration: none; box-shadow: 0 2px 6px rgba(245, 166, 35, 0.3); letter-spacing: -0.2px;">
                      ${isArabic ? 'اعتماد ونشر الرد بنقرة واحدة ←' : 'Review and Approve in One Tap →'}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #64748B; text-align: center; margin: 0;">
                ${isArabic ? 'يمكنك أيضاً تعديل الرد أو تخطيه مباشرة من الرابط أعلاه.' : 'You can also edit or skip the reply directly from the link.'}
              </p>
            </td>
          </tr>

          <!-- Footer & Fallback Link -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 24px; text-align: center;">
              <p style="font-size: 11px; color: #94A3B8; margin: 0 0 8px 0; word-break: break-all;">
                ${isArabic ? 'إذا لم يعمل الزر معك، انسخ الرابط المباشر التالي والصقه في متصفحك:' : 'If the button does not work, copy and paste this link in your browser:'}<br />
                <a href="${approvalUrl}" style="color: #0F5E63; text-decoration: underline;">${approvalUrl}</a>
              </p>
              <p style="font-size: 11px; color: #94A3B8; margin: 0;">
                © 2026 Radd (ردّ) • ${escapeHtml(location.display_name || business.name)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

  return { subject, html, text: plainText };
}
