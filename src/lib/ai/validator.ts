import { LocationRow } from '@/types/database';

export interface ValidationResult {
  valid: boolean;
  reasons: string[];
}

// Forbidden promises in outgoing replies (English & Arabic)
const FORBIDDEN_PROMISE_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(refund|reimburse|money\s+back|cash\s+back)\b/i,
    reason: 'Promises a refund or money back in English',
  },
  {
    pattern: /\b(free\s+(drink|coffee|meal|order|voucher|coupon)|discount\s+code|\d+%\s*off)\b/i,
    reason: 'Promises a discount, voucher, or free item in English',
  },
  {
    pattern: /\b\d+\s*(EGP|LE|USD|جنيه)\b/i,
    reason: 'Mentions a specific currency amount in the reply',
  },
  {
    pattern: /(استرجاع\s+المبلغ|نرجعلك\s+فلوسك|تعويض\s+مالي|خصم\s+خاص|كود\s+خصم|مشروب\s+مجاني|اوردر\s+مجاني)/,
    reason: 'Promises a refund, discount, or free item in Arabic',
  },
  {
    pattern: /<\/?untrusted_review_data>/i,
    reason: 'Leaked prompt delimiter tags',
  },
];

export function validateDraftReply(params: {
  draftText: string;
  location: LocationRow;
}): ValidationResult {
  const { draftText, location } = params;
  const reasons: string[] = [];
  const trimmed = draftText.trim();

  // 1. Length sanity check
  if (trimmed.length < 15) {
    reasons.push('Reply is too short (under 15 characters)');
  }
  if (trimmed.length > 900) {
    reasons.push('Reply is too long (exceeds 900 characters)');
  }

  // 2. Check forbidden compensation/refund/voucher patterns
  for (const rule of FORBIDDEN_PROMISE_PATTERNS) {
    if (rule.pattern.test(trimmed)) {
      reasons.push(rule.reason);
    }
  }

  // 3. Check that no unauthorized phone numbers appear in the reply
  const phoneMatches = trimmed.match(/(?:\+?20|0)?1[0125]\d{8}\b/g) ?? [];
  const normalizePhone = (p: string) => p.replace(/\D/g, '').replace(/^20/, '0');
  const allowedPhone = location.contact_phone ? normalizePhone(location.contact_phone) : null;

  for (const foundPhone of phoneMatches) {
    if (!allowedPhone || normalizePhone(foundPhone) !== allowedPhone) {
      reasons.push(`Contains unauthorized phone number: ${foundPhone}`);
    }
  }

  return {
    valid: reasons.length === 0,
    reasons,
  };
}