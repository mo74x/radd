import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { supabaseAdmin } from '../src/lib/supabase/admin';
import { googleGBP } from '../src/lib/google/client';
import {
  pollAllActiveLocations,
  acquireLocationPollLease,
  releaseLocationPollLease,
} from '../src/lib/google/ingestor';
import { processReviewAndCreateDraft } from '../src/lib/ai/pipeline';
import {
  getDispatchedNotificationCount,
  resetDispatchedNotificationCount,
} from '../src/lib/notifications/dispatcher';
import { BusinessRow, LocationRow, ReviewRow } from '../src/types/database';

async function main() {
  console.log('============================================================');
  console.log('VERIFYING CRON ROW-LEVEL LEASING & RACE CONCURRENCY (ITEM 4)');
  console.log('============================================================\n');

  // 1. Fetch active test business and location
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('status', 'active')
    .limit(1)
    .single<BusinessRow>();

  if (!business) throw new Error('No active business found.');

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('business_id', business.id)
    .eq('is_polling_enabled', true)
    .limit(1)
    .single<LocationRow>();

  if (!location) throw new Error('No pollable location found.');

  console.log(`Using Business: "${business.name}" (${business.id})`);
  console.log(`Using Location: "${location.display_name}" (${location.id})\n`);

  // Ensure clean starting lease state
  await supabaseAdmin
    .from('locations')
    .update({ poll_lock_until: null, poll_lock_token: null })
    .eq('id', location.id);

  // ------------------------------------------------------------
  // TEST 1: Lease Acquisition & Release Semantics
  // ------------------------------------------------------------
  console.log('TEST 1: Verifying lease acquisition and conflict rejection...');
  const tokenA = '11111111-1111-4111-8111-111111111111';
  const tokenB = '22222222-2222-4222-8222-222222222222';

  const acquiredA = await acquireLocationPollLease(location.id, tokenA);
  if (!acquiredA) throw new Error('FAIL: Worker A should have acquired available lease');
  console.log('   OK: Worker A successfully acquired lease (poll_lock_until = now() + 5 min)');

  const acquiredB = await acquireLocationPollLease(location.id, tokenB);
  if (acquiredB) throw new Error('FAIL: Worker B should NOT acquire active lease held by Worker A');
  console.log('   OK: Worker B was blocked from acquiring the same active lease (0 rows returned)');

  const releasedA = await releaseLocationPollLease(location.id, tokenA);
  if (!releasedA) throw new Error('FAIL: Worker A should have released its lease');
  console.log('   OK: Worker A successfully released lease');

  const acquiredBAfterRelease = await acquireLocationPollLease(location.id, tokenB);
  if (!acquiredBAfterRelease) throw new Error('FAIL: Worker B should acquire lease after Worker A released');
  console.log('   OK: Worker B successfully acquired lease after release');

  await releaseLocationPollLease(location.id, tokenB);
  console.log('   OK: Cleaned up test lease.');

  // ------------------------------------------------------------
  // TEST 2: 5 Concurrent Pollers Against Mock Fixture
  // ------------------------------------------------------------
  console.log('\nTEST 2: Simulating 5 concurrent pollers against the same mock fixture...');
  const testReviewId = `mock_rev_concurrency_${Date.now()}`;
  const nowIso = new Date().toISOString();

  // Configure custom mock review
  googleGBP.setCustomMockReviews([
    {
      googleReviewId: testReviewId,
      rating: 5,
      reviewerName: 'Concurrent Tester',
      text: 'المكان ممتاز والخدمة سريعة ومميزة جداً (5-Poller Concurrency Test)',
      hasExistingReply: false,
      googleCreatedAt: nowIso,
      googleUpdatedAt: nowIso,
    },
  ]);

  resetDispatchedNotificationCount();

  // Launch 5 simultaneous pollers
  const pollerPromises = [
    pollAllActiveLocations(),
    pollAllActiveLocations(),
    pollAllActiveLocations(),
    pollAllActiveLocations(),
    pollAllActiveLocations(),
  ];

  const results = await Promise.all(pollerPromises);

  console.log('Poller execution summaries:');
  results.forEach((res, idx) => {
    console.log(
      `   Poller ${idx + 1}: polled=${res.locationsPolled}, lockedSkipped=${
        res.locationsSkippedDueToLock
      }, newReviews=${res.newReviewsInserted}, drafts=${res.draftsCreated}, notifications=${
        res.notificationsSent
      }`
    );
  });

  // Verify that exactly 1 poller processed the review
  const totalReviewsInserted = results.reduce((acc, r) => acc + r.newReviewsInserted, 0);
  const totalDraftsCreated = results.reduce((acc, r) => acc + r.draftsCreated, 0);
  const totalNotificationsSent = results.reduce((acc, r) => acc + r.notificationsSent, 0);

  if (totalReviewsInserted !== 1) {
    throw new Error(`FAIL: Expected exactly 1 review inserted across all 5 pollers, got ${totalReviewsInserted}`);
  }
  if (totalDraftsCreated !== 1) {
    throw new Error(`FAIL: Expected exactly 1 draft created across all 5 pollers, got ${totalDraftsCreated}`);
  }
  if (totalNotificationsSent !== 1) {
    throw new Error(`FAIL: Expected exactly 1 notification sent across all 5 pollers, got ${totalNotificationsSent}`);
  }

  // Verify in Database
  const { data: dbReviews } = await supabaseAdmin
    .from('reviews')
    .select('id, google_review_id')
    .eq('google_review_id', testReviewId);

  if (!dbReviews || dbReviews.length !== 1) {
    throw new Error(`FAIL: Database contains ${dbReviews?.length} reviews, expected exactly 1`);
  }

  const { data: dbDrafts } = await supabaseAdmin
    .from('drafts')
    .select('id, review_id, status')
    .eq('review_id', dbReviews[0].id)
    .in('status', ['pending', 'posting', 'posted']);

  if (!dbDrafts || dbDrafts.length !== 1) {
    throw new Error(`FAIL: Database contains ${dbDrafts?.length} active drafts, expected exactly 1 (Zero duplicates allowed!)`);
  }

  const notificationCount = getDispatchedNotificationCount();
  if (notificationCount !== 1) {
    throw new Error(`FAIL: Dispatched ${notificationCount} notifications, expected exactly 1`);
  }

  console.log('\n   OK: Database verification confirmed:');
  console.log(`       - Reviews count in DB: ${dbReviews.length}`);
  console.log(`       - Active drafts in DB: ${dbDrafts.length} (ZERO DUPLICATES)`);
  console.log(`       - Dispatched notifications: ${notificationCount} (ZERO DUPLICATES)`);

  // Verify lease was automatically released upon completion
  const { data: finalLoc } = await supabaseAdmin
    .from('locations')
    .select('poll_lock_until, poll_lock_token')
    .eq('id', location.id)
    .single<LocationRow>();

  if (finalLoc?.poll_lock_token !== null || finalLoc?.poll_lock_until !== null) {
    throw new Error('FAIL: Location lease was not released after polling finished');
  }
  console.log('   OK: Location lease automatically released (poll_lock_token = null, poll_lock_until = null)');

  // ------------------------------------------------------------
  // TEST 3: Partial Unique Index Stress Test (5 Concurrent Draft Creations)
  // ------------------------------------------------------------
  console.log('\nTEST 3: Stress-testing partial unique index (5 simultaneous draft creation calls)...');
  const freshReviewId = `test_unique_idx_${Date.now()}`;
  const { data: stressReview } = await supabaseAdmin
    .from('reviews')
    .insert({
      business_id: business.id,
      location_id: location.id,
      google_review_id: freshReviewId,
      rating: 4,
      reviewer_name: 'Stress Tester',
      text: 'Testing partial unique index under concurrency',
      language: 'ar',
      flags: [],
      requires_careful_review: false,
    })
    .select('*')
    .single<ReviewRow>();

  if (!stressReview) throw new Error('FAIL: Could not create stress review fixture');

  // Trigger 5 concurrent processReviewAndCreateDraft calls for the same review
  const draftAttempts = await Promise.all([
    processReviewAndCreateDraft(stressReview.id),
    processReviewAndCreateDraft(stressReview.id),
    processReviewAndCreateDraft(stressReview.id),
    processReviewAndCreateDraft(stressReview.id),
    processReviewAndCreateDraft(stressReview.id),
  ]);

  const duplicatesHandled = draftAttempts.filter((d) => d.isDuplicate).length;
  console.log(`   OK: 5 concurrent drafting calls completed. Duplicates caught/handled: ${duplicatesHandled}/4`);

  const { data: stressDrafts } = await supabaseAdmin
    .from('drafts')
    .select('id, status')
    .eq('review_id', stressReview.id)
    .in('status', ['pending', 'posting', 'posted']);

  if (!stressDrafts || stressDrafts.length !== 1) {
    throw new Error(`FAIL: Found ${stressDrafts?.length} drafts, expected exactly 1`);
  }
  console.log(`   OK: Exactly 1 draft exists in DB for review (idx_drafts_active_review enforced)`);

  // Clean up
  console.log('\nCleaning up test records...');
  googleGBP.setCustomMockReviews(null);
  await supabaseAdmin.from('reviews').delete().in('google_review_id', [testReviewId, freshReviewId]);

  console.log('\n============================================================');
  console.log('ALL CRON LEASING & RACE CONCURRENCY TESTS PASSED! ✅');
  console.log('============================================================');
}

main().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
