import 'server-only';

/**
 * Known sensitive token regex patterns for scrubbing from text and logs.
 */
const TOKEN_PATTERNS: { regex: RegExp; replacement: string }[] = [
  // 1. Google OAuth Refresh Tokens (starts with 1//0...)
  {
    regex: /\b1\/\/0[a-zA-Z0-9_\-\.]{20,}\b/g,
    replacement: '[REDACTED_GOOGLE_REFRESH_TOKEN]',
  },
  // 2. Google OAuth Access Tokens (starts with ya29....)
  {
    regex: /\bya29\.[a-zA-Z0-9_\-\.]{20,}\b/g,
    replacement: '[REDACTED_GOOGLE_ACCESS_TOKEN]',
  },
  // 3. Magic link approval tokens in URLs (/approve/<rawToken>)
  {
    regex: /(https?:\/\/[^\s\/]+\/approve\/)[a-zA-Z0-9_\-]{20,}/gi,
    replacement: '$1[REDACTED_APPROVAL_TOKEN]',
  },
  // 4. Standalone raw approval tokens (base64url 32-byte = ~43 chars)
  {
    regex: /\b[a-zA-Z0-9_-]{43,44}\b/g,
    replacement: '[REDACTED_RAW_TOKEN]',
  },
  // 5. AES-256-GCM serialized ciphertexts (<iv base64>:<authTag base64>:<ciphertext base64>)
  {
    regex: /\b[A-Za-z0-9+/=]{16}:[A-Za-z0-9+/=]{24}:[A-Za-z0-9+/=]{16,}\b/g,
    replacement: '[ENCRYPTED_SECRET_CIPHERTEXT]',
  },
  // 6. Resend API Keys (re_...)
  {
    regex: /\bre_[a-zA-Z0-9_]{20,}\b/g,
    replacement: '[REDACTED_RESEND_KEY]',
  },
  // 7. Telegram Bot Tokens (<id>:<hash>)
  {
    regex: /\b\d{8,12}:[a-zA-Z0-9_-]{35}\b/g,
    replacement: '[REDACTED_TELEGRAM_TOKEN]',
  },
  // 8. Anthropic API Keys (sk-ant-...)
  {
    regex: /\bsk-ant-[a-zA-Z0-9_\-]{20,}\b/g,
    replacement: '[REDACTED_ANTHROPIC_KEY]',
  },
  // 9. JWT access/service tokens (eyJ...)
  {
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    replacement: '[REDACTED_JWT]',
  },
  // 10. Supabase modern keys (sb_secret_..., sb_publishable_...)
  {
    regex: /\bsb_(?:secret|publishable)_[a-zA-Z0-9_\-]{20,}\b/g,
    replacement: '[REDACTED_SUPABASE_KEY]',
  },
];

/**
 * Case-insensitive sensitive property keys to mask completely in objects.
 */
const SENSITIVE_KEY_REGEX =
  /^(token|refreshtoken|refresh_token|accesstoken|access_token|encrypted_refresh_token|encryptedrefreshtoken|rawtoken|raw_token|approval_token_hash|tokenhash|token_hash|secret|password|apikey|api_key|authorization|client_secret|clientsecret|bottoken|bot_token|privatekey|private_key|encryptionkey|encryption_key)$/i;

/**
 * Scrubs any sensitive token patterns from a string.
 */
export function scrubString(input: string): string {
  if (!input || typeof input !== 'string') return input;

  let result = input;
  for (const { regex, replacement } of TOKEN_PATTERNS) {
    result = result.replace(regex, replacement);
  }
  return result;
}

/**
 * Deeply scrubs secrets from objects, arrays, and Error instances for safe logging.
 */
export function scrubObject<T>(input: T, seen = new WeakSet()): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return scrubString(input) as unknown as T;
  }

  if (typeof input !== 'object') {
    return input;
  }

  // Handle circular references safely
  if (seen.has(input as object)) {
    return '[Circular]' as unknown as T;
  }
  seen.add(input as object);

  // Handle Error instances
  if (input instanceof Error) {
    const scrubbedError = new Error(scrubString(input.message));
    scrubbedError.name = input.name;
    if (input.stack) {
      scrubbedError.stack = scrubString(input.stack);
    }
    return scrubbedError as unknown as T;
  }

  // Handle Arrays
  if (Array.isArray(input)) {
    return input.map((item) => scrubObject(item, seen)) as unknown as T;
  }

  // Handle plain objects
  const scrubbedObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      scrubbedObj[key] = '[REDACTED]';
    } else {
      scrubbedObj[key] = scrubObject(value, seen);
    }
  }

  return scrubbedObj as T;
}

/**
 * Formats and scrubs any arguments before logging.
 */
export function safeFormatArgs(...args: unknown[]): unknown[] {
  return args.map((arg) => scrubObject(arg));
}

/**
 * Provides safe logging methods that guarantee no sensitive tokens
 * are printed to stdout, stderr, or external log collectors.
 */
export const safeLogger = {
  log: (...args: unknown[]) => console.log(...safeFormatArgs(...args)),
  info: (...args: unknown[]) => console.info(...safeFormatArgs(...args)),
  warn: (...args: unknown[]) => console.warn(...safeFormatArgs(...args)),
  error: (...args: unknown[]) => console.error(...safeFormatArgs(...args)),
};
