/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateEnv } from '../src/lib/env';
import nextConfig from '../next.config';

describe('Deployment Readiness & Environment Validation (Prompt 4)', () => {
  const validProductionEnv = {
    NODE_ENV: 'production',
    NEXT_PUBLIC_APP_URL: 'https://radd.app',
    APP_URL: 'https://radd.app',
    NEXT_PUBLIC_SUPABASE_URL: 'https://xyzcompany.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'valid_anon_key_string_value',
    SUPABASE_SERVICE_ROLE_KEY: 'valid_service_role_key_string_value',
    TOKEN_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    CRON_SECRET: 'super_secret_cron_passphrase_123',
    GOOGLE_API_MODE: 'live',
  };

  describe('validateEnv()', () => {
    it('passes for fully valid production environment', () => {
      const res = validateEnv(validProductionEnv);
      assert.equal(res.valid, true);
      assert.equal(res.errors.length, 0);
    });

    it('throws in production when required variables are missing', () => {
      const incompleteEnv = {
        NODE_ENV: 'production',
        NEXT_PUBLIC_APP_URL: 'https://radd.app',
      };

      assert.throws(
        () => validateEnv(incompleteEnv as any),
        (err: Error) => {
          assert.ok(err.message.includes('Configuration validation failed in production'));
          assert.ok(err.message.includes('NEXT_PUBLIC_SUPABASE_URL'));
          assert.ok(err.message.includes('TOKEN_ENCRYPTION_KEY'));
          assert.ok(err.message.includes('CRON_SECRET'));
          // Ensure no secret values leaked
          assert.equal(err.message.includes('valid_anon_key_string_value'), false);
          return true;
        }
      );
    });

    it('rejects TOKEN_ENCRYPTION_KEY that is not exactly 64 hex characters', () => {
      const invalidKeyEnv = {
        ...validProductionEnv,
        TOKEN_ENCRYPTION_KEY: 'too_short_key',
      };

      assert.throws(
        () => validateEnv(invalidKeyEnv),
        (err: Error) => {
          assert.ok(err.message.includes('TOKEN_ENCRYPTION_KEY'));
          assert.ok(err.message.includes('64 hexadecimal characters'));
          assert.equal(err.message.includes('too_short_key'), false);
          return true;
        }
      );
    });

    it('rejects GOOGLE_API_MODE=mock in production unless ALLOW_MOCK_IN_PRODUCTION=true', () => {
      const mockEnv = {
        ...validProductionEnv,
        GOOGLE_API_MODE: 'mock',
      };

      assert.throws(
        () => validateEnv(mockEnv),
        (err: Error) => {
          assert.ok(err.message.includes('GOOGLE_API_MODE'));
          assert.ok(err.message.includes('ALLOW_MOCK_IN_PRODUCTION=true'));
          return true;
        }
      );

      // Allowed when explicit override is provided
      const allowedMockEnv = {
        ...mockEnv,
        ALLOW_MOCK_IN_PRODUCTION: 'true',
      };
      const res = validateEnv(allowedMockEnv);
      assert.equal(res.valid, true);
    });

    it('permits non-production environments with partial configurations', () => {
      const devEnv = {
        NODE_ENV: 'development',
      };
      const res = validateEnv(devEnv);
      assert.equal(res.valid, true);
    });
  });

  describe('next.config.ts Security Headers', () => {
    it('configures global security headers and preserves approval page privacy', async () => {
      assert.ok(nextConfig.headers, 'headers must be configured on nextConfig');
      const headerRules = await nextConfig.headers!();

      // 1. Global security headers (/*)
      const globalRule = headerRules.find((r) => r.source === '/:path*');
      assert.ok(globalRule, 'Global security headers rule must exist');
      const globalHeaders = globalRule.headers.reduce(
        (acc, h) => ({ ...acc, [h.key]: h.value }),
        {} as Record<string, string>
      );

      assert.equal(globalHeaders['X-Content-Type-Options'], 'nosniff');
      assert.equal(globalHeaders['Referrer-Policy'], 'strict-origin-when-cross-origin');
      assert.equal(globalHeaders['X-Frame-Options'], 'DENY');
      assert.ok(globalHeaders['Permissions-Policy']);
      assert.ok(globalHeaders['Content-Security-Policy-Report-Only']);
      assert.ok(globalHeaders['Content-Security-Policy-Report-Only'].includes("frame-ancestors 'none'"));

      // 2. Approval route headers (/approve/:token*)
      const approveRule = headerRules.find((r) => r.source === '/approve/:token*');
      assert.ok(approveRule, 'Approval route headers must exist');
      const approveHeaders = approveRule.headers.reduce(
        (acc, h) => ({ ...acc, [h.key]: h.value }),
        {} as Record<string, string>
      );

      assert.equal(approveHeaders['Referrer-Policy'], 'no-referrer');
      assert.equal(approveHeaders['X-Robots-Tag'], 'noindex, nofollow, noarchive');
      assert.ok(approveHeaders['Cache-Control'].includes('no-store'));
    });
  });
});
