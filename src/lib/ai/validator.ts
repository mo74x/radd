import { LocationRow } from '@/types/database';

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
  warnings: string[];
  normalizedText: string;
}

export interface ValidateDraftParams {
  draftText: string;
  location?: Partial<LocationRow> | { contact_phone?: string | null; contact_email?: string | null } | null;
  isOwnerEdit?: boolean;
}

/**
 * Normalizes text to defend against prompt injection and safety bypasses:
 * - Strips zero-width & invisible formatting characters (\u200B-\u200D, \uFEFF, \u00AD, bidi controls)
 * - Strips Arabic diacritics (tashkeel \u064B-\u065F, \u0670) and tatweel / kashida (\u0640)
 * - Normalizes Alef variants (أ, إ, آ, ٱ -> ا)
 * - Normalizes Ya / Alef Maqsura (ى -> ي)
 * - Normalizes Ta Marbuta (ة, ۀ -> ه)
 * - Converts Arabic-Indic numerals (٠-٩) and Eastern numerals (۰-۹) to ASCII (0-9)
 * - Collapses repeated whitespace and trims
 */
export function normalizeText(text: string): string {
  if (!text) return '';

  return (
    text
      // 1. Strip zero-width and invisible bidi control characters
      .replace(/[\u200B-\u200D\uFEFF\u00AD\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '')
      // 2. Strip Arabic tashkeel (diacritics) and tatweel (ـ)
      .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
      // 3. Normalize Alef variants (أ, إ, آ, ٱ -> ا)
      .replace(/[أإآٱ]/g, 'ا')
      // 4. Normalize Ya / Alef Maqsura (ى -> ي)
      .replace(/ى/g, 'ي')
      // 5. Normalize Ta Marbuta (ة, ۀ -> ه)
      .replace(/[ةۀ]/g, 'ه')
      // 6. Convert Arabic-Indic numerals (٠-٩) & Eastern (۰-۹) to ASCII (0-9)
      .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0660 + 48))
      .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x06F0 + 48))
      // 7. Collapse repeated spaces and trim
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Normalizes phone numbers to digits-only with standard Egyptian mobile prefix:
 * Converts international (+20 or 0020) or raw 10-digit to local '0' prefix.
 * e.g., '+201001234567' -> '01001234567'
 *       '010-0123-4567' -> '01001234567'
 */
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0020')) {
    return '0' + digits.slice(4);
  }
  if (digits.startsWith('20') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length === 10 && digits.startsWith('1')) {
    return '0' + digits;
  }
  return digits;
}

/**
 * Extracts candidate phone numbers from normalized text.
 * Matches Egyptian mobile prefixes (010, 011, 012, 015) in raw, formatted,
 * or spaced-out patterns (+20, 0020, or local 0).
 */
export function extractPhoneNumbers(normalizedText: string): string[] {
  const phoneRegex = /(?:\+?20|0020|0)?[\s.-]?1[0125](?:[\s.-]?\d){8}\b/g;
  return normalizedText.match(phoneRegex) ?? [];
}

// Forbidden promise and compensation patterns (checked against normalizedText)
export const FORBIDDEN_PROMISE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  // 1. English refund & reimbursement promises
  {
    pattern: /\b(refund|reimburse|reimbursement|money\s+back|cash\s+back|cashback)\b/i,
    reason: 'Promises a refund or money back in English',
  },
  // 2. English discounts, vouchers, coupons, free items
  {
    pattern:
      /\b(free\s+(drink|coffee|meal|order|item|dessert|voucher|coupon|ticket)|discount\s+code|promo\s+code|coupon\s+code|voucher\s+code|\d+%\s*(off|discount)|complimentary\s+(drink|coffee|meal|order|dessert)|on\s+the\s+house)\b/i,
    reason: 'Promises a discount, voucher, or free item in English',
  },
  // 3. Mentions of specific currency or financial amounts
  {
    pattern:
      /(?:^|\s|\b)\d+\s*(egp|le|usd|eur|gbp|جنيه|دولار|يورو|ريال|درهم|geneih|gneh|genh|pound|pounds)(?:\s|[.,!?؛،]|\b|$)/i,
    reason: 'Mentions a specific currency amount in the reply',
  },
  // 4. Arabic Standard & Dialectal refund promises (Normalized: ا, ي, ه, no diacritics/tatweel)
  {
    pattern:
      /(استرجاع\s+(المبلغ|الفلوس|فلوسك?|تمن|ثمن|حسابك|حقك|نقدي?|نقود)|استرداد\s+(المبلغ|الفلوس|فلوسك?|تمن|ثمن|حسابك|حقك|نقدي?|نقود|كاش)|نرجعلك\s+(فلوسك|المبلغ|حسابك|تمن|ثمن|حقك)|نرجع\s+لك\s+(فلوسك|المبلغ|حقك)|(هرجعلك|هنرجعلك|هانرجعلك)\s+(فلوسك|المبلغ|حقك)|فلوسك\s+ه?ترجعلك?|حقك\s+ه?يرجعلك?|تعويض\s+(مالي|مادي|نقدي)|نعوضك\s+(ماليا?|ماديا?|فلوس)|كاش\s*باك|موني\s*باك)/i,
    reason: 'Promises a refund or financial compensation in Arabic',
  },
  // 5. Arabic Standard & Dialectal discounts, vouchers, freebies (Normalized)
  {
    pattern:
      /(خصم\s+خاص|كود\s+خصم|كوبون\s+خصم|برومو\s+كود|نسبه\s+خصم|\d+%\s*خصم|خصم\s*\d+%|قسيمه\s+(شراء|مجانيه|هديه)|كوبون\s+هديه|مشروب\s+(مجاني|ببلاش)|اوردر\s+(مجاني|ببلاش)|وجبه\s+(مجانيه|ببلاش)|طلب\s+(مجاني|ببلاش)|حلو\s+مجاني|تحليه\s+مجانيه|هديه\s+(مجانيه|خاصه)|علي\s+حسابنا|علي\s+حساب\s+المحل|حسابك\s+علينا|الاوردر\s+علينا|الطلب\s+علينا|القهوه\s+علينا|المشروب\s+علينا|عزومه\s+علينا|معزوم\s+عندنا)/i,
    reason: 'Promises a discount, voucher, or free item in Arabic',
  },
  // 6. Franco-Arabic (Arabizi) refund & compensation terms
  {
    pattern:
      /\b(estrgac|esterga3|estergaa|estirga3|estrdad)\b|\b(neraga3lek|nrg3lk|nraga3lek|neraga3lak|hraga3lek|hanraga3lek)\b|\b(flousak|floosak)\s+(hatraga3|hatrg3|htrga3)\b|\b(ta3weed|taweed|ta3wid)\s*(maly|madi)?\b/i,
    reason: 'Promises a refund or compensation in Franco-Arabic',
  },
  // 7. Franco-Arabic (Arabizi) discounts, freebies, and vouchers
  {
    pattern:
      /\b(code\s+)?(khasm|5asm|5osm|5esm)\b|\b(khasm|5asm)\s*(khas|5as|\d+%)\b|\b\d+%\s*(khasm|5asm)\b|\b(mashroob|order|mashrob|akla|meal|coffee|ahwa)\s+(magany|free|bbash|bbalash|fabor)\b|\b(hedya|hadya)\s+(maganya|free)\b|\b(3la\s*hesabna|hesabak\s*3leina|hesabak\s*3lina|el\s*order\s*3lina|el\s*order\s*3leina|3zoma)\b/i,
    reason: 'Promises a discount or free item in Franco-Arabic',
  },
  // 8. Leaked prompt delimiter tags & system override keywords
  {
    pattern: /<\/?(untrusted_review_data|system_override|instructions)>/i,
    reason: 'Leaked prompt delimiter tags',
  },
  {
    pattern: /\b(ignore\s+(all\s+)?previous\s+instructions|system\s+override)\b/i,
    reason: 'Prompt injection or system override phrase in English',
  },
  {
    pattern: /(تجاهل\s+(كل\s+)?التعليمات\s+السابقه|تخطي\s+التعليمات)/i,
    reason: 'Prompt injection or instruction override phrase in Arabic',
  },
];

// Contact leak rules (external URLs, emails, social handles, WhatsApp links & phrases)
export const CONTACT_LEAK_RULES: {
  test: (
    text: string,
    location?: Partial<LocationRow> | { contact_phone?: string | null; contact_email?: string | null } | null
  ) => string | null;
}[] = [
  // 1. External URLs (http/https/www/domain extensions)
  {
    test: (text) => {
      const urlPattern =
        /\b(?:https?:\/\/|www\.)[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s]*)?|\b[a-z0-9-]+\.(?:com|net|org|io|me|app|site|online|xyz|link|info|page|cc|ly|to)(?:\/[^\s]*)?\b/i;
      const match = text.match(urlPattern);
      return match ? `Contains external URL: ${match[0]}` : null;
    },
  },
  // 2. Email addresses
  {
    test: (text, location) => {
      const emailPattern = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;
      const matches = text.match(emailPattern);
      if (!matches) return null;

      const allowedEmail = location?.contact_email ? location.contact_email.toLowerCase().trim() : null;
      for (const email of matches) {
        if (!allowedEmail || email.toLowerCase() !== allowedEmail) {
          return `Contains unauthorized email address: ${email}`;
        }
      }
      return null;
    },
  },
  // 3. Social media handles (@usernames) & profile links
  {
    test: (text) => {
      const handlePattern = /(?:^|[\s(])@([a-zA-Z0-9_.]{3,30})\b/;
      const match = text.match(handlePattern);
      if (match) {
        return `Contains social media handle: @${match[1]}`;
      }
      const profileLinkPattern =
        /\b(?:instagram|tiktok|facebook|fb|twitter|x)\.com\/[a-zA-Z0-9_.]+/i;
      const profileMatch = text.match(profileLinkPattern);
      if (profileMatch) {
        return `Contains social profile link: ${profileMatch[0]}`;
      }
      return null;
    },
  },
  // 4. WhatsApp link domains & invitation phrases
  {
    test: (text) => {
      // WhatsApp URL links
      const waLinkPattern =
        /\b(?:wa\.me|wa\.link|api\.whatsapp\.com|chat\.whatsapp\.com|whatsapp\.com\/[^\s]+)\b/i;
      const waLinkMatch = text.match(waLinkPattern);
      if (waLinkMatch) {
        return `Contains WhatsApp link: ${waLinkMatch[0]}`;
      }

      // WhatsApp phrases (Arabic / Franco / English)
      const waPhrasePattern =
        /((كلمنا|تواصل\s+مع(نا|انا)?|ابعتلنا|راسلنا)\s*(?:(عبر|علي|على)\s+)?(الواتس(اب)?|واتس(اب)?)|(رقم|علي|على)\s+الواتس(اب)?|\b(contact|message|reach|dm|chat|text)\s+(us\s+)?(on|via|through)?\s*whats?app\b|\bwhats?app\s+(us|me|link)\b|\b(kallimna|kalemna|eb3atlna|eb3at|tawasal)\s+(3la|ala)?\s*whats?(app)?\b)/i;
      const phraseMatch = text.match(waPhrasePattern);
      if (phraseMatch) {
        return `Contains unauthorized WhatsApp invitation phrase: "${phraseMatch[0]}"`;
      }
      return null;
    },
  },
];

export function validateDraftReply(params: {
  draftText: string;
  location?: Partial<LocationRow> | { contact_phone?: string | null; contact_email?: string | null } | null;
  isOwnerEdit?: boolean;
}): ValidationResult {
  const { draftText, location, isOwnerEdit = false } = params;
  const reasons: string[] = [];
  const warnings: string[] = [];

  const rawTrimmed = (draftText ?? '').trim();
  const normalized = normalizeText(rawTrimmed);

  // Helper to record an issue: hard-blocking reason for AI, or confirmation warning for owner edit
  const recordRestrictedIssue = (message: string) => {
    if (isOwnerEdit) {
      warnings.push(message);
    } else {
      reasons.push(message);
    }
  };

  // 1. Length sanity check (Always hard-blocking)
  const minLength = isOwnerEdit ? 5 : 15;
  if (rawTrimmed.length < minLength) {
    reasons.push(`Reply is too short (under ${minLength} characters)`);
  }
  if (rawTrimmed.length > 900) {
    reasons.push('Reply is too long (exceeds 900 characters)');
  }

  // 2. Delimiter leak check (Always hard-blocking prompt injection artifact)
  if (/<\/?(untrusted_review_data|system_override|instructions)>/i.test(normalized)) {
    reasons.push('Leaked prompt delimiter tags');
  }

  // 3. Check forbidden compensation/refund/voucher patterns
  for (const rule of FORBIDDEN_PROMISE_PATTERNS) {
    if (rule.pattern.source.includes('untrusted_review_data')) continue;
    if (rule.pattern.test(normalized)) {
      recordRestrictedIssue(rule.reason);
    }
  }

  // 4. Contact leak checks: external URLs, emails, social handles, WhatsApp link phrases
  for (const contactRule of CONTACT_LEAK_RULES) {
    const leakReason = contactRule.test(normalized, location);
    if (leakReason) {
      recordRestrictedIssue(leakReason);
    }
  }

  // 5. Unauthorized phone numbers check
  const phoneMatches = extractPhoneNumbers(normalized);
  const allowedPhone = location?.contact_phone ? normalizePhoneNumber(location.contact_phone) : null;

  for (const foundPhone of phoneMatches) {
    const normalizedFound = normalizePhoneNumber(foundPhone);
    if (!allowedPhone || normalizedFound !== allowedPhone) {
      recordRestrictedIssue(`Contains unauthorized phone number: ${foundPhone.trim()}`);
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
    warnings,
    normalizedText: normalized,
  };
}