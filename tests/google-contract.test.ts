/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  GoogleGBPClient,
  GoogleRateLimitError,
  GoogleReviewNotFoundError,
  GoogleReplyConflictError,
  parseRetryAfter,
  normalizeGoogleReviews,
  normalizeGoogleLocations,
} from '../src/lib/google/client';
import { generateReviewDraft } from '../src/lib/ai/drafter';
import { LocationRow, BrandProfileRow, ReviewRow } from '../src/types/database';

describe('Google GBP Contract Test Fixtures & Normalization', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'google-api');

  it('correctly normalizes real GBP Accounts and Locations API payload fixtures', () => {
    const accountsData = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'accounts.json'), 'utf8')
    );
    const locationsData = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'locations.json'), 'utf8')
    );

    const account = accountsData.accounts[0];
    const normalized = normalizeGoogleLocations(account, locationsData);

    assert.strictEqual(normalized.length, 2);

    // Branch 1: Maadi
    assert.strictEqual(normalized[0].googleAccountId, 'accounts/100998877');
    assert.strictEqual(normalized[0].googleLocationId, 'locations/5544332211');
    assert.strictEqual(normalized[0].displayName, 'Roastery & Co. Specialty Coffee - Maadi');
    assert.strictEqual(normalized[0].contactPhone, '+201001234567');

    // Branch 2: Sheikh Zayed
    assert.strictEqual(normalized[1].googleAccountId, 'accounts/100998877');
    assert.strictEqual(normalized[1].googleLocationId, 'locations/8877665544');
    assert.strictEqual(normalized[1].displayName, 'Roastery & Co. Specialty Coffee - Sheikh Zayed');
    assert.strictEqual(normalized[1].contactPhone, '+201109876543');
  });

  it('correctly normalizes real GBP v4 Reviews API payload fixture', () => {
    const reviewsData = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'reviews.json'), 'utf8')
    );

    const reviews = normalizeGoogleReviews(reviewsData);
    assert.strictEqual(reviews.length, 5);

    // 1. Positive review
    assert.strictEqual(reviews[0].googleReviewId, 'google_rev_pos_001');
    assert.strictEqual(reviews[0].rating, 5);
    assert.strictEqual(reviews[0].reviewerName, 'أحمد محمود');
    assert.strictEqual(reviews[0].hasExistingReply, false);
    assert.ok(reviews[0].text?.includes('السبانيش لاتيه'));

    // 2. Complaint review
    assert.strictEqual(reviews[1].googleReviewId, 'google_rev_neg_002');
    assert.strictEqual(reviews[1].rating, 1);
    assert.strictEqual(reviews[1].reviewerName, 'Mariam Hassan');
    assert.strictEqual(reviews[1].hasExistingReply, false);

    // 3. Review with existing reply
    assert.strictEqual(reviews[2].googleReviewId, 'google_rev_replied_003');
    assert.strictEqual(reviews[2].hasExistingReply, true);

    // 4. Star-only review (no comment)
    assert.strictEqual(reviews[3].googleReviewId, 'google_rev_star_only_004');
    assert.strictEqual(reviews[3].rating, 4);
    assert.strictEqual(reviews[3].text, null);
    assert.strictEqual(reviews[3].hasExistingReply, false);

    // 5. Edited review (updateTime > createTime)
    assert.strictEqual(reviews[4].googleReviewId, 'google_rev_edited_005');
    assert.strictEqual(reviews[4].rating, 5);
    assert.ok(reviews[4].googleUpdatedAt > reviews[4].googleCreatedAt);
  });
});

describe('Live Google GBP Switch & Edge Case Handling', () => {
  const fixturesDir = path.join(__dirname, 'fixtures', 'google-api');

  it('switches between GOOGLE_MODE=mock and live dynamically', () => {
    const client = new GoogleGBPClient();
    assert.strictEqual(client.getMode(), 'mock');

    client.setMode('live');
    assert.strictEqual(client.getMode(), 'live');

    client.setMode('mock');
    assert.strictEqual(client.getMode(), 'mock');
  });

  it('extracts retry delay from real Google 429 RESOURCE_EXHAUSTED payload and headers', () => {
    const error429 = JSON.parse(
      fs.readFileSync(path.join(fixturesDir, 'error-429-rate-limit.json'), 'utf8')
    );

    // From body details (45s)
    const delayFromBody = parseRetryAfter(undefined, error429);
    assert.strictEqual(delayFromBody, 45);

    // From Retry-After HTTP header
    const mockRes = {
      headers: new Headers([['retry-after', '120']]),
    } as any;

    const delayFromHeader = parseRetryAfter(mockRes, error429);
    assert.strictEqual(delayFromHeader, 120);
  });

  it('simulates 429 rate limit error when configured on client', async () => {
    const client = new GoogleGBPClient();
    client.setMockRateLimit('biz-123', 45);

    await assert.rejects(
      async () => client.getValidAccessToken('biz-123'),
      (err: any) => {
        assert.ok(err instanceof GoogleRateLimitError);
        assert.strictEqual(err.businessId, 'biz-123');
        assert.strictEqual(err.retryAfterSeconds, 45);
        return true;
      }
    );

    // Clearing rate limit allows normal mock access token
    client.setMockRateLimit('biz-123', null);
    const token = await client.getValidAccessToken('biz-123');
    assert.strictEqual(token, 'mock_access_token');
  });

  it('handles 404 deleted review edge case in postReply', async () => {
    const client = new GoogleGBPClient();
    client.setMockDeletedReview('rev-deleted-404', true);

    await assert.rejects(
      async () =>
        client.postReply(
          'biz-1',
          'accounts/1',
          'locations/1',
          'rev-deleted-404',
          'Thank you!'
        ),
      (err: any) => {
        assert.ok(err instanceof GoogleReviewNotFoundError);
        assert.strictEqual(err.googleReviewId, 'rev-deleted-404');
        return true;
      }
    );
  });

  it('handles 409 reply conflict edge case in postReply', async () => {
    const client = new GoogleGBPClient();
    client.setMockReplyConflict('rev-conflict-409', true);

    await assert.rejects(
      async () =>
        client.postReply(
          'biz-1',
          'accounts/1',
          'locations/1',
          'rev-conflict-409',
          'Thank you!'
        ),
      (err: any) => {
        assert.ok(err instanceof GoogleReplyConflictError);
        assert.strictEqual(err.googleReviewId, 'rev-conflict-409');
        return true;
      }
    );
  });
});

describe('Multi-Location Support: Per-Location Overrides (Item 10)', () => {
  const testBrand: BrandProfileRow = {
    business_id: 'biz-multi-1',
    tone: 'ودود ومهذب',
    languages: ['ar', 'en'],
    arabic_dialect: 'egyptian',
    signature: 'فريق Roastery & Co. العام',
    do_list: [],
    dont_list: [],
    example_replies: [],
    updated_at: new Date().toISOString(),
  };

  const maadiLocation: LocationRow = {
    id: 'loc-maadi',
    business_id: 'biz-multi-1',
    google_account_id: 'accounts/1',
    google_location_id: 'locations/1',
    display_name: 'Roastery & Co. - Maadi',
    contact_phone: '+201001234567',
    contact_email: 'maadi@roastery.test',
    signature_override: 'فريق Roastery & Co. - فرع المعادي',
    is_polling_enabled: true,
    last_polled_at: null,
    last_review_update_time: null,
    poll_lock_until: null,
    poll_lock_token: null,
    created_at: new Date().toISOString(),
  };

  const zayedLocation: LocationRow = {
    id: 'loc-zayed',
    business_id: 'biz-multi-1',
    google_account_id: 'accounts/1',
    google_location_id: 'locations/2',
    display_name: 'Roastery & Co. - Sheikh Zayed',
    contact_phone: '+201109876543',
    contact_email: 'zayed@roastery.test',
    signature_override: 'فريق Roastery & Co. - فرع الشيخ زايد',
    is_polling_enabled: true,
    last_polled_at: null,
    last_review_update_time: null,
    poll_lock_until: null,
    poll_lock_token: null,
    created_at: new Date().toISOString(),
  };

  const noOverrideLocation: LocationRow = {
    id: 'loc-default',
    business_id: 'biz-multi-1',
    google_account_id: 'accounts/1',
    google_location_id: 'locations/3',
    display_name: 'Roastery & Co. - New Cairo',
    contact_phone: null,
    contact_email: null,
    signature_override: null,
    is_polling_enabled: true,
    last_polled_at: null,
    last_review_update_time: null,
    poll_lock_until: null,
    poll_lock_token: null,
    created_at: new Date().toISOString(),
  };

  it('uses per-location signature override and phone number for Maadi branch', async () => {
    const review: ReviewRow = {
      id: 'rev-m1',
      business_id: 'biz-multi-1',
      location_id: maadiLocation.id,
      google_review_id: 'g-rev-m1',
      rating: 2,
      reviewer_name: 'Tamer',
      text: 'القهوة اتأخرت جداً',
      language: 'ar',
      flags: [],
      requires_careful_review: true,
      google_created_at: null,
      google_updated_at: null,
      created_at: new Date().toISOString(),
    };

    const draft = await generateReviewDraft({
      businessName: 'Roastery & Co.',
      location: maadiLocation,
      brand: testBrand,
      review,
      detectedLanguage: 'ar',
      isFlagged: false,
    });

    // Asserts branch signature override is used
    assert.ok(draft.body.includes('فريق Roastery & Co. - فرع المعادي'));
    // Asserts branch phone number override is used
    assert.ok(draft.body.includes('+201001234567'));
  });

  it('uses per-location signature override and phone number for Sheikh Zayed branch', async () => {
    const review: ReviewRow = {
      id: 'rev-z1',
      business_id: 'biz-multi-1',
      location_id: zayedLocation.id,
      google_review_id: 'g-rev-z1',
      rating: 2,
      reviewer_name: 'Mona',
      text: 'الخدمة بطيئة',
      language: 'ar',
      flags: [],
      requires_careful_review: true,
      google_created_at: null,
      google_updated_at: null,
      created_at: new Date().toISOString(),
    };

    const draft = await generateReviewDraft({
      businessName: 'Roastery & Co.',
      location: zayedLocation,
      brand: testBrand,
      review,
      detectedLanguage: 'ar',
      isFlagged: false,
    });

    // Asserts branch signature override is used
    assert.ok(draft.body.includes('فريق Roastery & Co. - فرع الشيخ زايد'));
    // Asserts branch phone number override is used
    assert.ok(draft.body.includes('+201109876543'));
  });

  it('falls back to default brand signature when location has no signature_override', async () => {
    const review: ReviewRow = {
      id: 'rev-def1',
      business_id: 'biz-multi-1',
      location_id: noOverrideLocation.id,
      google_review_id: 'g-rev-def1',
      rating: 5,
      reviewer_name: 'Salma',
      text: 'القهوة تحفة',
      language: 'ar',
      flags: [],
      requires_careful_review: false,
      google_created_at: null,
      google_updated_at: null,
      created_at: new Date().toISOString(),
    };

    const draft = await generateReviewDraft({
      businessName: 'Roastery & Co.',
      location: noOverrideLocation,
      brand: testBrand,
      review,
      detectedLanguage: 'ar',
      isFlagged: false,
    });

    // Asserts fallback to default brand signature
    assert.ok(draft.body.includes('فريق Roastery & Co. العام'));
  });
});
