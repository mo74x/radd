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
import { GoogleGBPClient, GoogleAuthRevokedError } from '../src/lib/google/client';
import {
  sendReconnectionNotification,
  getReconnectionNotificationCount,
  resetReconnectionNotificationCount,
} from '../src/lib/notifications/dispatcher';
import { BusinessRow } from '../src/types/database';

describe('Google OAuth Revocation & Error Lifecycle', () => {
  it('instantiates GoogleAuthRevokedError with businessId and message', () => {
    const err = new GoogleAuthRevokedError('biz-123', 'Access token revoked');
    assert.equal(err.name, 'GoogleAuthRevokedError');
    assert.equal(err.businessId, 'biz-123');
    assert.equal(err.message, 'Access token revoked');
    assert.ok(err instanceof Error);
  });

  it('correctly tracks and clears mock revocation state in GoogleGBPClient', () => {
    const client = new GoogleGBPClient();
    const testBiz = 'mock-biz-uuid-1';

    assert.equal(client.isMockRevoked(testBiz), false);

    client.setMockRevocation(testBiz, {
      type: 'invalid_grant',
      reason: 'User revoked token in Google Account Settings',
    });
    assert.equal(client.isMockRevoked(testBiz), true);

    client.setMockRevocation(testBiz, null);
    assert.equal(client.isMockRevoked(testBiz), false);
  });

  it('dispatches single reconnection notification and increments counter', async () => {
    resetReconnectionNotificationCount();
    assert.equal(getReconnectionNotificationCount(), 0);

    const mockBusiness: BusinessRow = {
      id: 'biz-test-notif-1',
      owner_id: 'user-1',
      name: 'Specialty Coffee Zamalek',
      plan: 'pro',
      status: 'active',
      trial_ends_at: new Date().toISOString(),
      notification_channel: 'email',
      notification_target: 'owner@zamalekcoffee.test',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const res = await sendReconnectionNotification({
      business: mockBusiness,
      reason: 'OAuth token expired (invalid_grant)',
    });

    assert.equal(res.delivered, true);
    assert.equal(res.channel, 'email');
    assert.equal(getReconnectionNotificationCount(), 1);

    // Telegram channel notification format
    mockBusiness.notification_channel = 'telegram';
    mockBusiness.notification_target = '123456789';

    const resTg = await sendReconnectionNotification({
      business: mockBusiness,
      reason: 'HTTP 401 Unauthorized',
    });

    assert.equal(resTg.delivered, true);
    assert.equal(resTg.channel, 'telegram');
    assert.equal(getReconnectionNotificationCount(), 2);
  });
});
