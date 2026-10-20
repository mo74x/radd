/* eslint-disable @typescript-eslint/no-explicit-any */
// Preload empty server-only in CLI test execution mode
try {
  require.cache[require.resolve('server-only')] = {
    id: require.resolve('server-only'),
    filename: require.resolve('server-only'),
    loaded: true,
    exports: {},
  } as any;
} catch {}

if (!process.env.TOKEN_ENCRYPTION_KEY) {
  process.env.TOKEN_ENCRYPTION_KEY = '3df08257e3f1cf000974466aea7ac40818a08c8cf691ca9badb8a9320605e05b';
}

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSecret,
  decryptSecret,
  generateApprovalToken,
  hashApprovalToken,
} from '../src/lib/crypto/tokens';
import { scrubString, scrubObject } from '../src/lib/crypto/scrubber';

describe('AES-256-GCM Encryption & Cryptographic Integrity', () => {
  it('encrypts secrets into <iv>:<tag>:<ciphertext> base64 format without leaking plaintext', () => {
    const rawSecret = '1//0gSensitiveGoogleRefreshToken_ABC123XYZ';
    const encrypted = encryptSecret(rawSecret);

    assert.ok(!encrypted.includes(rawSecret), 'Ciphertext must never contain the raw secret plaintext');
    assert.ok(!encrypted.includes('1//0g'), 'Prefix must not leak in ciphertext');

    const parts = encrypted.split(':');
    assert.equal(parts.length, 3, 'Must contain exactly 3 colon-separated parts');

    const [ivB64, tagB64, cipherB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const cipher = Buffer.from(cipherB64, 'base64');

    assert.equal(iv.length, 12, 'AES-256-GCM IV must be 12 bytes');
    assert.equal(tag.length, 16, 'AES-256-GCM Auth Tag must be 16 bytes');
    assert.ok(cipher.length > 0, 'Ciphertext payload must not be empty');
  });

  it('decrypts encrypted secrets back to identical plaintext', () => {
    const rawSecret = 'ya29.a0AfH6SMCustomerOAuthAccessTokenExample98765';
    const encrypted = encryptSecret(rawSecret);
    const decrypted = decryptSecret(encrypted);

    assert.equal(decrypted, rawSecret, 'Decrypted secret must match original plaintext');
  });

  it('rejects tampered auth tag with authentication error', () => {
    const rawSecret = 'super-confidential-secret-token';
    const encrypted = encryptSecret(rawSecret);
    const [ivB64, tagB64, cipherB64] = encrypted.split(':');

    // Flip bits in the authentication tag
    const tamperedTag = Buffer.from(tagB64, 'base64');
    tamperedTag[0] ^= 0xff;

    const tamperedPayload = [ivB64, tamperedTag.toString('base64'), cipherB64].join(':');

    assert.throws(
      () => decryptSecret(tamperedPayload),
      /Unsupported state or unable to authenticate data/,
      'Tampered authentication tag must be rejected by GCM auth tag check'
    );
  });

  it('rejects tampered ciphertext with authentication error', () => {
    const rawSecret = 'super-confidential-secret-token';
    const encrypted = encryptSecret(rawSecret);
    const [ivB64, tagB64, cipherB64] = encrypted.split(':');

    // Flip bits in the ciphertext
    const tamperedCipher = Buffer.from(cipherB64, 'base64');
    tamperedCipher[0] ^= 0xff;

    const tamperedPayload = [ivB64, tagB64, tamperedCipher.toString('base64')].join(':');

    assert.throws(
      () => decryptSecret(tamperedPayload),
      /Unsupported state or unable to authenticate data/,
      'Tampered ciphertext must be rejected by GCM decipher'
    );
  });

  it('generates cryptographically secure approval tokens with SHA-256 hash', () => {
    const { rawToken, tokenHash, expiresAt } = generateApprovalToken(72);

    assert.equal(typeof rawToken, 'string');
    assert.ok(rawToken.length >= 40, 'Raw token should be at least 40 chars base64url');
    assert.equal(tokenHash, hashApprovalToken(rawToken), 'Hash must match SHA-256 digest of raw token');
    assert.ok(new Date(expiresAt).getTime() > Date.now(), 'Expiry must be in the future');
  });
});

describe('Token Scrubber & Log Redaction Utility', () => {
  it('redacts Google OAuth refresh tokens from strings', () => {
    const input = 'Fetched refresh token: 1//0gLongGoogleRefreshTokenExample123456789 from GBP API';
    const scrubbed = scrubString(input);

    assert.ok(!scrubbed.includes('1//0gLongGoogleRefreshTokenExample123456789'));
    assert.ok(scrubbed.includes('[REDACTED_GOOGLE_REFRESH_TOKEN]'));
  });

  it('redacts Google OAuth access tokens from strings', () => {
    const input = 'Access token ya29.a0AfH6SMCustomerOAuthAccessTokenExample98765 assigned';
    const scrubbed = scrubString(input);

    assert.ok(!scrubbed.includes('ya29.a0AfH6SMCustomerOAuthAccessTokenExample98765'));
    assert.ok(scrubbed.includes('[REDACTED_GOOGLE_ACCESS_TOKEN]'));
  });

  it('redacts raw approval tokens inside approval URLs', () => {
    const url = 'https://bot.example.com/approve/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-example';
    const scrubbed = scrubString(url);

    assert.ok(!scrubbed.includes('AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-example'));
    assert.ok(scrubbed.includes('https://bot.example.com/approve/[REDACTED_APPROVAL_TOKEN]'));
  });

  it('redacts Resend API keys, Telegram bot tokens, and Anthropic keys', () => {
    const input =
      'Keys: resend=re_1234567890abcdef123456 tg=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ123456789 ant=sk-ant-api03-abcdef1234567890abcdef123456';
    const scrubbed = scrubString(input);

    assert.ok(!scrubbed.includes('re_1234567890abcdef123456'));
    assert.ok(!scrubbed.includes('123456789:ABCdefGHIjklMNOpqrSTUvwxYZ123456789'));
    assert.ok(!scrubbed.includes('sk-ant-api03-abcdef1234567890abcdef123456'));
    assert.ok(scrubbed.includes('[REDACTED_RESEND_KEY]'));
    assert.ok(scrubbed.includes('[REDACTED_TELEGRAM_TOKEN]'));
    assert.ok(scrubbed.includes('[REDACTED_ANTHROPIC_KEY]'));
  });

  it('deeply scrubs sensitive properties in nested objects, arrays, and errors', () => {
    const payload = {
      businessId: 'biz-123',
      refresh_token: '1//0gMockRefreshTokenXYZ',
      access_token: 'ya29.mockAccessToken',
      nested: {
        apiKey: 'sk-ant-secretKey',
        authorization: 'Bearer eyJhbGciOi.eyJzdWIiOi.test',
        encrypted_refresh_token: 'iv:tag:cipher',
      },
      tokensList: ['1//0gAnotherToken', 'safe_string'],
      safeData: {
        locationName: 'Downtown Branch',
        rating: 5,
      },
    };

    const scrubbed = scrubObject(payload);

    assert.equal(scrubbed.businessId, 'biz-123');
    assert.equal(scrubbed.refresh_token, '[REDACTED]');
    assert.equal(scrubbed.access_token, '[REDACTED]');
    assert.equal(scrubbed.nested.apiKey, '[REDACTED]');
    assert.equal(scrubbed.nested.authorization, '[REDACTED]');
    assert.equal(scrubbed.nested.encrypted_refresh_token, '[REDACTED]');
    assert.equal(scrubbed.safeData.locationName, 'Downtown Branch');
    assert.equal(scrubbed.safeData.rating, 5);
    assert.equal(scrubbed.tokensList[1], 'safe_string');
  });

  it('scrubs error messages and stack traces', () => {
    const err = new Error('OAuth error with token 1//0gLeakedRefreshTokenInError');
    const scrubbedErr = scrubObject(err);

    assert.ok(!scrubbedErr.message.includes('1//0gLeakedRefreshTokenInError'));
    assert.ok(scrubbedErr.message.includes('[REDACTED_GOOGLE_REFRESH_TOKEN]'));
  });
});
