import {
  DraftRow,
  DraftStatus,
  LocationRow,
  ReviewFlag,
  ReviewLanguage,
  ReviewRow,
} from '@/types/database';
import {
  CONTACT_LEAK_RULES,
  FORBIDDEN_PROMISE_PATTERNS,
  extractPhoneNumbers,
  normalizePhoneNumber,
  normalizeText,
  validateDraftReply,
} from '@/lib/ai/validator';
import { Locale } from '@/lib/i18n/types';

export type SafeDraftRow = Omit<DraftRow, 'approval_token_hash'> & {
  approval_token?: string;
};

export interface ReviewLocationSummary {
  id: string;
  display_name: string;
  contact_phone: string | null;
  contact_email?: string | null;
  signature_override?: string | null;
}

export interface ReviewWithRelations extends ReviewRow {
  locations?: ReviewLocationSummary | null;
  drafts?: SafeDraftRow[] | SafeDraftRow | null;
}

export interface FlagExplanation {
  flag: ReviewFlag | 'careful_review';
  label: string;
  explanation: string;
  severity: 'danger' | 'warning';
}

export interface DiffToken {
  type: 'equal' | 'removed' | 'added';
  value: string;
}

export interface ValidationNote {
  id: string;
  type: 'stripped' | 'blocked' | 'warning' | 'verified';
  message: string;
}

export function getPrimaryDraft(review: ReviewWithRelations): SafeDraftRow | null {
  if (!review.drafts) return null;
  if (Array.isArray(review.drafts)) {
    return review.drafts[0] ?? null;
  }
  return review.drafts;
}

export function isDraftEdited(draft?: SafeDraftRow | null): boolean {
  if (!draft || !draft.final_body) return false;
  return draft.final_body.trim() !== draft.body.trim();
}

export function getReviewTextDir(language?: ReviewLanguage | null): 'rtl' | 'ltr' | 'auto' {
  if (language === 'ar') return 'rtl';
  if (language === 'en') return 'ltr';
  return 'auto';
}

export function getLanguageMeta(
  language: ReviewLanguage | null | undefined,
  locale: Locale
): { code: string; label: string; shortLabel: string } {
  const lang = language || 'none';
  if (lang === 'ar') {
    return {
      code: 'ar',
      label: locale === 'ar' ? 'العربية (AR)' : 'Arabic (AR)',
      shortLabel: locale === 'ar' ? 'عربي' : 'AR',
    };
  }
  if (lang === 'en') {
    return {
      code: 'en',
      label: locale === 'ar' ? 'الإنجليزية (EN)' : 'English (EN)',
      shortLabel: 'EN',
    };
  }
  if (lang === 'mixed') {
    return {
      code: 'mixed',
      label: locale === 'ar' ? 'مختلط / فرانكو (AR/EN)' : 'Mixed / Arabizi (AR/EN)',
      shortLabel: locale === 'ar' ? 'مختلط' : 'Mixed',
    };
  }
  return {
    code: 'none',
    label: locale === 'ar' ? 'تقييم بالنجوم فقط' : 'Stars Only',
    shortLabel: locale === 'ar' ? 'نجوم فقط' : 'No Text',
  };
}

export function getStatusMeta(
  status: DraftStatus | undefined | null,
  attempts: number | undefined,
  locale: Locale
): {
  variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' | 'neutral';
  label: string;
  pulse?: boolean;
} {
  if (!status) {
    return {
      variant: 'neutral',
      label: locale === 'ar' ? 'بدون مسودة' : 'No Draft',
    };
  }

  switch (status) {
    case 'pending':
      return {
        variant: 'warning',
        label: locale === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval',
      };
    case 'posting':
      return {
        variant: 'accent',
        label: locale === 'ar' ? 'جاري النشر...' : 'Publishing...',
        pulse: true,
      };
    case 'posted':
      return {
        variant: 'success',
        label: locale === 'ar' ? 'تم النشر' : 'Published',
      };
    case 'approved':
      return {
        variant: 'success',
        label: locale === 'ar' ? 'تمت الموافقة' : 'Approved',
      };
    case 'edited':
      return {
        variant: 'default',
        label: locale === 'ar' ? 'مُعدّل بواسطة المالك' : 'Edited by Owner',
      };
    case 'skipped':
      return {
        variant: 'neutral',
        label: locale === 'ar' ? 'تم التخطي' : 'Skipped',
      };
    case 'failed': {
      const retryNote =
        (attempts || 0) < 5
          ? locale === 'ar'
            ? `فشل النشر (محاولة ${attempts || 1}/5)`
            : `Failed (Retry ${attempts || 1}/5)`
          : locale === 'ar'
          ? 'فشل النشر نهائياً'
          : 'Failed';
      return {
        variant: 'danger',
        label: retryNote,
      };
    }
    case 'expired':
      return {
        variant: 'neutral',
        label: locale === 'ar' ? 'منتهي الصلاحية' : 'Expired',
      };
    default:
      return {
        variant: 'neutral',
        label: status,
      };
  }
}

export function getDecisionSummary(
  draft: SafeDraftRow | null | undefined,
  locale: Locale
): {
  badgeLabel: string;
  description: string;
  variant: 'success' | 'warning' | 'danger' | 'accent' | 'default' | 'neutral';
  edited: boolean;
} {
  if (!draft) {
    return {
      badgeLabel: locale === 'ar' ? 'لم يتم إنشاء مسودة' : 'No draft generated',
      description:
        locale === 'ar'
          ? 'لم يتم توليد مسودة رد لهذا التقييم بعد.'
          : 'No AI reply draft has been generated for this review yet.',
      variant: 'neutral',
      edited: false,
    };
  }

  const edited = isDraftEdited(draft);

  if (draft.status === 'skipped') {
    return {
      badgeLabel: locale === 'ar' ? 'تم التخطي بواسطة المالك' : 'Skipped by owner',
      description:
        locale === 'ar'
          ? 'اختار المالك عدم نشر رد على هذا التقييم.'
          : 'The business owner chose to skip replying to this review.',
      variant: 'neutral',
      edited: false,
    };
  }

  if (draft.status === 'edited' || ((draft.status === 'posted' || draft.status === 'approved') && edited)) {
    return {
      badgeLabel: locale === 'ar' ? 'عُدّل بواسطة المالك' : 'Edited by owner',
      description:
        locale === 'ar'
          ? 'قام المالك بتعديل مسودة الذكاء الاصطناعي قبل اعتمادها ونشرها.'
          : 'The owner customized the AI draft before approving and publishing.',
      variant: 'default',
      edited: true,
    };
  }

  if (draft.status === 'posted' || draft.status === 'approved') {
    return {
      badgeLabel: locale === 'ar' ? 'اعتُمد كما صيغ' : 'Approved as drafted',
      description:
        locale === 'ar'
          ? 'تمت الموافقة على مسودة الذكاء الاصطناعي بنقرة واحدة دون أي تعديل.'
          : 'Approved in one tap exactly as drafted by AI without edits.',
      variant: 'success',
      edited: false,
    };
  }

  if (draft.status === 'posting') {
    return {
      badgeLabel:
        locale === 'ar'
          ? edited
            ? 'عُدّل وجاري النشر'
            : 'اعتُمد وجاري النشر'
          : edited
          ? 'Edited by owner (Posting)'
          : 'Approved as drafted (Posting)',
      description:
        locale === 'ar'
          ? 'تم تسجيل قرار المالك وجاري إرسال الرد إلى جوجل.'
          : 'Owner decision recorded; reply is currently being published to Google.',
      variant: 'accent',
      edited,
    };
  }

  if (draft.status === 'failed') {
    return {
      badgeLabel:
        locale === 'ar'
          ? edited
            ? 'عُدّل بواسطة المالك (فشل النشر)'
            : 'اعتُمد كما صيغ (فشل النشر)'
          : edited
          ? 'Edited by owner (Post failed)'
          : 'Approved as drafted (Post failed)',
      description:
        locale === 'ar'
          ? 'اعتمد المالك الرد ولكن تعذر النشر على جوجل.'
          : 'Approved by owner, but publishing to Google encountered an error.',
      variant: 'danger',
      edited,
    };
  }

  if (draft.status === 'expired') {
    return {
      badgeLabel: locale === 'ar' ? 'انتهت الصلاحية دون قرار' : 'Expired without decision',
      description:
        locale === 'ar'
          ? 'انتهت صلاحية رابط الموافقة قبل اتخاذ قرار.'
          : 'The approval token expired before a decision was made.',
      variant: 'neutral',
      edited: false,
    };
  }

  return {
    badgeLabel: locale === 'ar' ? 'بانتظار قرار المالك' : 'Pending owner decision',
    description:
      locale === 'ar'
        ? 'المسودة جاهزة وبانتظار الموافقة أو التعديل أو التخطي.'
        : 'Draft is ready and awaiting Approve, Edit, or Skip action.',
    variant: 'warning',
    edited: false,
  };
}

export function getFlagExplanations(
  flags: ReviewFlag[] | null | undefined,
  requiresCarefulReview: boolean,
  rating: number,
  locale: Locale
): FlagExplanation[] {
  const list: FlagExplanation[] = [];
  const safeFlags = Array.isArray(flags) ? flags : [];

  const explanationsMap: Record<
    ReviewFlag,
    { labelEn: string; labelAr: string; descEn: string; descAr: string }
  > = {
    medical: {
      labelEn: 'Health & Safety',
      labelAr: 'صحة وسلامة غذائية',
      descEn: 'Mentions health: reply with care and move the conversation offline.',
      descAr: 'يذكر حالة صحية: يرجى الرد بحذر وعناية ونقل التواصل للخاص.',
    },
    refund: {
      labelEn: 'Refund / Money',
      labelAr: 'استرجاع مالي / تعويض',
      descEn: 'Mentions billing or refund: reply with care and avoid promising compensation publicly.',
      descAr: 'يذكر استرجاع مبلغ أو تعويض: يرجى الرد بحذر وتجنب الوعد بتعويض مالي علناً.',
    },
    legal: {
      labelEn: 'Legal / Authorities',
      labelAr: 'إجراء قانوني / رقابي',
      descEn: 'Mentions legal action or consumer protection: keep reply brief and factual.',
      descAr: 'يذكر إجراءات قانونية أو حماية المستهلك: اجعل الرد موجزاً ومهنياً.',
    },
    threat: {
      labelEn: 'Reputation Threat',
      labelAr: 'تهديد بالسمعة',
      descEn: 'Contains threat or escalation warning: stay calm and invite direct contact.',
      descAr: 'يحتوي على تهديد أو تصعيد: التزم بالهدوء وادعُ العميل للتواصل المباشر.',
    },
    abuse: {
      labelEn: 'Hostile Language',
      labelAr: 'ألفاظ مسيئة',
      descEn: 'Contains abusive or hostile language: maintain a polite, neutral tone.',
      descAr: 'يحتوي على ألفاظ هجومية: حافظ على نبرة مهنية وهادئة.',
    },
    injection_suspected: {
      labelEn: 'Prompt Manipulation',
      labelAr: 'اشتباه تلاعب بالرد',
      descEn: 'Suspected attempt to manipulate AI instructions: verify draft carefully before posting.',
      descAr: 'اشتباه في محاولة التلاعب بتعليمات الذكاء الاصطناعي: راجع المسودة بدقة قبل النشر.',
    },
  };

  for (const flag of safeFlags) {
    const meta = explanationsMap[flag];
    if (meta) {
      list.push({
        flag,
        label: locale === 'ar' ? meta.labelAr : meta.labelEn,
        explanation: locale === 'ar' ? meta.descAr : meta.descEn,
        severity: 'danger',
      });
    }
  }

  if (requiresCarefulReview && list.length === 0) {
    list.push({
      flag: 'careful_review',
      label: locale === 'ar' ? 'مراجعة دقيقة مطلوبة' : 'Careful Review Required',
      explanation:
        locale === 'ar'
          ? `تقييم منخفض (${rating} نجوم): يرجى مراجعة المسودة بعناية قبل النشر.`
          : `Low star rating (${rating} stars): please review the reply carefully before publishing.`,
      severity: 'warning',
    });
  }

  return list;
}

/**
 * Computes a simple word-level diff between the original AI draft and the owner's edited reply.
 */
export function computeWordDiff(beforeText: string, afterText: string): DiffToken[] {
  const beforeWords = beforeText.trim().split(/(\s+)/).filter(Boolean);
  const afterWords = afterText.trim().split(/(\s+)/).filter(Boolean);

  const m = beforeWords.length;
  const n = afterWords.length;

  // LCS dynamic programming table
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (beforeWords[i] === afterWords[j]) {
        dp[i][j] = 1 + dp[i + 1][j + 1];
      } else {
        dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const rawTokens: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < m && j < n) {
    if (beforeWords[i] === afterWords[j]) {
      rawTokens.push({ type: 'equal', value: beforeWords[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawTokens.push({ type: 'removed', value: beforeWords[i] });
      i++;
    } else {
      rawTokens.push({ type: 'added', value: afterWords[j] });
      j++;
    }
  }

  while (i < m) {
    rawTokens.push({ type: 'removed', value: beforeWords[i] });
    i++;
  }
  while (j < n) {
    rawTokens.push({ type: 'added', value: afterWords[j] });
    j++;
  }

  // Merge adjacent tokens of the same type for cleaner rendering
  const merged: DiffToken[] = [];
  for (const token of rawTokens) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === token.type) {
      prev.value += token.value;
    } else {
      merged.push({ ...token });
    }
  }

  return merged;
}

/**
 * Generates plain-language validation notes explaining what the safety validator
 * stripped, blocked, warned about, or verified for a review and its reply.
 */
export function computeValidationNotes(params: {
  review: ReviewWithRelations;
  draft: SafeDraftRow | null;
  location?: Partial<LocationRow> | ReviewLocationSummary | null;
  locale: Locale;
}): ValidationNote[] {
  const { review, draft, location, locale } = params;
  const notes: ValidationNote[] = [];

  if (!draft) {
    return notes;
  }

  const activeReply = draft.final_body || draft.body || '';
  const normalizedReview = normalizeText(review.text || '');
  const normalizedDraft = normalizeText(draft.body || '');
  const allowedPhone = location?.contact_phone
    ? normalizePhoneNumber(location.contact_phone)
    : null;

  // 1. Check if customer review contained an unauthorized phone number that was stripped/omitted from draft
  const reviewPhones = extractPhoneNumbers(normalizedReview);
  const draftPhones = extractPhoneNumbers(normalizedDraft);
  for (const phone of reviewPhones) {
    const normPhone = normalizePhoneNumber(phone);
    if (!allowedPhone || normPhone !== allowedPhone) {
      const presentInDraft = draftPhones.some((dp) => normalizePhoneNumber(dp) === normPhone);
      if (!presentInDraft) {
        notes.push({
          id: `stripped-phone-${normPhone}`,
          type: 'stripped',
          message:
            locale === 'ar'
              ? `تم استبعاد رقم الهاتف (${phone.trim()}) لأنه ليس رقم التواصل الرسمي للفرع.`
              : `Phone number (${phone.trim()}) removed because it is not the official contact.`,
        });
      }
    }
  }

  // 2. Check if customer review requested a refund/discount/voucher and validator prevented promising compensation
  const reviewHasRefundDemand =
    review.flags?.includes('refund') ||
    FORBIDDEN_PROMISE_PATTERNS.some((rule) => rule.pattern.test(normalizedReview));
  const draftHasPromise = FORBIDDEN_PROMISE_PATTERNS.some((rule) =>
    rule.pattern.test(normalizedDraft)
  );
  if (reviewHasRefundDemand && !draftHasPromise) {
    notes.push({
      id: 'stripped-compensation',
      type: 'stripped',
      message:
        locale === 'ar'
          ? 'تم حجب أي وعد باسترجاع مالي أو خصم في الرد التلقائي التزاماً بسياسة الأمان.'
          : 'Refund and compensation promises withheld from AI draft per safety policy.',
    });
  }

  // 3. Check if review had external links / WhatsApp / social handles that were stripped from the AI draft
  for (const rule of CONTACT_LEAK_RULES) {
    const reviewLeak = rule.test(normalizedReview, location);
    const draftLeak = rule.test(normalizedDraft, location);
    if (reviewLeak && !draftLeak) {
      notes.push({
        id: `stripped-contact-${notes.length}`,
        type: 'stripped',
        message:
          locale === 'ar'
            ? 'تمت إزالة الروابط الخارجية أو قنوات التواصل غير المصرح بها من مسودة الرد.'
            : 'External link or unauthorized contact channel stripped because it is not an official branch contact.',
      });
      break;
    }
  }

  // 4. Check if prompt injection was suspected and sanitized
  if (
    review.flags?.includes('injection_suspected') ||
    /<\/?(untrusted_review_data|system_override|instructions)>/i.test(review.text || '')
  ) {
    notes.push({
      id: 'stripped-injection',
      type: 'stripped',
      message:
        locale === 'ar'
          ? 'تم تجريد محاولة التلاعب بالتعليمات (Prompt Injection) وتنقية النص قبل صياغة الرد.'
          : 'Prompt manipulation directives stripped and neutralized by the safety filter.',
    });
  }

  // 5. Run validator on the active reply (draft or owner-edited final reply)
  const validation = validateDraftReply({
    draftText: activeReply,
    location,
    isOwnerEdit: isDraftEdited(draft),
  });

  for (const reason of validation.reasons) {
    notes.push({
      id: `blocked-${reason}`,
      type: 'blocked',
      message: mapValidatorReasonToPlainLanguage(reason, locale),
    });
  }

  for (const warning of validation.warnings) {
    notes.push({
      id: `warning-${warning}`,
      type: 'warning',
      message: mapValidatorReasonToPlainLanguage(warning, locale),
    });
  }

  // 6. Check if official branch phone number is used and verified in the reply
  const activePhones = extractPhoneNumbers(normalizeText(activeReply));
  if (
    allowedPhone &&
    activePhones.some((p) => normalizePhoneNumber(p) === allowedPhone)
  ) {
    notes.push({
      id: 'verified-phone',
      type: 'verified',
      message:
        locale === 'ar'
          ? `تم التحقق من رقم التواصل الرسمي للفرع (${location?.contact_phone}).`
          : `Official branch contact phone (${location?.contact_phone}) verified.`,
    });
  }

  // 7. If no issues were found at all, provide a clean verification note
  if (notes.length === 0) {
    notes.push({
      id: 'verified-clean',
      type: 'verified',
      message:
        locale === 'ar'
          ? 'اجتاز الرد جميع فحوصات الأمان (لا توجد أرقام غير مصرح بها أو وعود مالية أو روابط خارجية).'
          : 'Passed all safety checks (no unauthorized phone numbers, external links, or financial promises).',
    });
  }

  return notes;
}

function mapValidatorReasonToPlainLanguage(reason: string, locale: Locale): string {
  if (reason.startsWith('Contains unauthorized phone number:')) {
    const phone = reason.replace('Contains unauthorized phone number:', '').trim();
    return locale === 'ar'
      ? `تم حظر/رصد رقم هاتف غير مصرح به (${phone}) لأنه ليس رقم التواصل الرسمي للفرع.`
      : `Phone number (${phone}) flagged because it is not the official branch contact.`;
  }
  if (reason.startsWith('Contains unauthorized email address:')) {
    const email = reason.replace('Contains unauthorized email address:', '').trim();
    return locale === 'ar'
      ? `تم رصد بريد إلكتروني غير مصرح به (${email}) لأنه ليس البريد الرسمي للفرع.`
      : `Email address (${email}) flagged because it is not the official branch contact.`;
  }
  if (reason.startsWith('Contains external URL:')) {
    return locale === 'ar'
      ? `تم حظر رابط خارجي في الرد (${reason.replace('Contains external URL:', '').trim()}).`
      : `External link blocked (${reason.replace('Contains external URL:', '').trim()}).`;
  }
  if (reason.includes('WhatsApp')) {
    return locale === 'ar'
      ? 'تم رصد دعوة أو رابط واتساب غير مصرح به ضمن إعدادات الفرع.'
      : 'WhatsApp link or invitation flagged because it is not configured as an official contact.';
  }
  if (reason.includes('refund') || reason.includes('compensation') || reason.includes('currency')) {
    return locale === 'ar'
      ? 'يحتوي الرد على وعد بتعويض مالي أو استرجاع مبلغ (يتطلب تأكيد المالك).'
      : 'Reply mentions a refund or financial compensation (requires owner confirmation).';
  }
  if (reason.includes('discount') || reason.includes('voucher') || reason.includes('free item')) {
    return locale === 'ar'
      ? 'يحتوي الرد على وعد بخصم أو قسيمة مجانية (يتطلب تأكيد المالك).'
      : 'Reply promises a discount, voucher, or free item (requires owner confirmation).';
  }
  return reason;
}

/**
 * Formats a date string using Western digits (0-9) per brand guidelines.
 */
export function formatDateTimeWestern(dateStr: string | null | undefined, locale: Locale): string {
  if (!dateStr) return locale === 'ar' ? 'غير متوفر' : 'N/A';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return locale === 'ar' ? 'غير متوفر' : 'N/A';

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDateWestern(dateStr: string | null | undefined, locale: Locale): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG-u-nu-latn' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatRelativeTimeWestern(
  dateStr: string | null | undefined,
  locale: Locale
): string {
  if (!dateStr) return locale === 'ar' ? 'مؤخراً' : 'Recently';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 1) return locale === 'ar' ? 'الآن' : 'Just now';
  if (diffMins < 60) return locale === 'ar' ? `منذ ${diffMins} د` : `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return locale === 'ar' ? `منذ ${diffHours} س` : `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return locale === 'ar' ? `منذ ${diffDays} ي` : `${diffDays}d ago`;
  return formatShortDateWestern(dateStr, locale);
}
