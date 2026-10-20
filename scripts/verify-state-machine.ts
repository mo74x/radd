/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { supabaseAdmin } from '../src/lib/supabase/admin';
import { generateApprovalToken } from '../src/lib/crypto/tokens';
import { googleGBP } from '../src/lib/google/client';
import {
  executeApprovalDecision,
  processFailedAndStuckDrafts,
} from '../src/lib/approvals/service';
import { BusinessRow, LocationRow, ReviewRow, DraftRow } from '../src/types/database';

async function main() {
  console.log('============================================================');
  console.log('VERIFYING SAFER PUBLISHING STATE MACHINE & RETRY WORKER');
  console.log('============================================================\n');

  // 1. Load active test business and location
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .limit(1)
    .single<BusinessRow>();

  if (!business) throw new Error('No business found. Run verify-foundation.ts first.');

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('business_id', business.id)
    .limit(1)
    .single<LocationRow>();

  if (!location) throw new Error('No location found for business.');

  // Helper to create a test review and draft
  async function createFixture(suffix: string) {
    const revId = `test_rev_${Date.now()}_${suffix}`;
    const { data: review, error: revErr } = await supabaseAdmin
      .from('reviews')
      .insert({
        business_id: business!.id,
        location_id: location!.id,
        google_review_id: revId,
        rating: 5,
        reviewer_name: `Tester ${suffix}`,
        text: `State machine test review ${suffix}`,
        language: 'ar',
        flags: [],
        requires_careful_review: false,
      })
      .select('*')
      .single<ReviewRow>();

    if (revErr || !review) throw revErr || new Error('Failed creating test review');

    const { rawToken, tokenHash, expiresAt } = generateApprovalToken(72);

    const { data: draft, error: draftErr } = await supabaseAdmin
      .from('drafts')
      .insert({
        business_id: business!.id,
        review_id: review.id,
        body: `شكراً لزيارتك وتجربتك المميزة (${suffix}) - إدارة Roastery & Co.`,
        status: 'pending',
        approval_token_hash: tokenHash,
        token_expires_at: expiresAt,
        model: 'test-model',
        prompt_version: 'v1.0',
        attempts: 0,
      })
      .select('*')
      .single<DraftRow>();

    if (draftErr || !draft) throw draftErr || new Error('Failed creating test draft');

    return { review, draft, rawToken };
  }

  // -------------------------------------------------------------
  // TEST 1: Concurrency Guard / Atomic Claim (Simulated Double-Tap)
  // -------------------------------------------------------------
  console.log('TEST 1: Simulating concurrent double-tap approval...');
  const fixture1 = await createFixture('doubletap');

  const [resA, resB] = await Promise.allSettled([
    executeApprovalDecision({ rawToken: fixture1.rawToken, action: 'approve' }),
    executeApprovalDecision({ rawToken: fixture1.rawToken, action: 'approve' }),
  ]);

  const fulfilledCount = [resA, resB].filter((r) => r.status === 'fulfilled').length;
  const rejectedCount = [resA, resB].filter((r) => r.status === 'rejected').length;

  if (fulfilledCount !== 1 || rejectedCount !== 1) {
    throw new Error(
      `Double-tap test failed! Expected 1 fulfilled and 1 rejected, got ${fulfilledCount} fulfilled and ${rejectedCount} rejected.`
    );
  }

  const rejected = (resA.status === 'rejected' ? resA : resB) as PromiseRejectedResult;
  console.log(`   OK: Exactly 1 tap won. Second tap blocked -> "${rejected.reason.message}"`);

  // Verify final database state for fixture 1
  const { data: dbDraft1 } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', fixture1.draft.id)
    .single<DraftRow>();

  if (dbDraft1?.status !== 'posted' || dbDraft1.attempts !== 1) {
    throw new Error(`Unexpected draft state: status=${dbDraft1?.status}, attempts=${dbDraft1?.attempts}`);
  }
  console.log(`   OK: Draft successfully posted with attempts = ${dbDraft1.attempts}.\n`);

  // -------------------------------------------------------------
  // TEST 2: Mock Google Failure (N fails before success) + Retry Worker
  // -------------------------------------------------------------
  console.log('TEST 2: Mock Google GBP fails 2 times then succeeds on 3rd attempt...');
  const fixture2 = await createFixture('retry_flow');

  // Configure mock to fail 2 times
  googleGBP.setMockFailCount(fixture2.review.google_review_id, 2);

  // Attempt 1: Should fail and transition to 'failed' with attempts = 1
  console.log('   -> Executing 1st attempt (expected to fail)...');
  let attempt1Failed = false;
  try {
    await executeApprovalDecision({ rawToken: fixture2.rawToken, action: 'approve' });
  } catch (err: any) {
    attempt1Failed = true;
    console.log(`   -> 1st attempt threw as expected: "${err.message}"`);
  }
  if (!attempt1Failed) throw new Error('1st attempt was expected to fail!');

  // Check draft state in DB after 1st attempt
  const { data: draftAfter1 } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', fixture2.draft.id)
    .single<DraftRow>();

  if (draftAfter1?.status !== 'failed' || draftAfter1.attempts !== 1 || !draftAfter1.next_retry_at) {
    throw new Error(`Draft after attempt 1 should be 'failed' with attempts=1 and next_retry_at set.`);
  }
  console.log(`   OK: Status is 'failed', attempts = 1, next retry = ${draftAfter1.next_retry_at}`);

  // Force next_retry_at to past so retry worker picks it up
  await supabaseAdmin
    .from('drafts')
    .update({ next_retry_at: new Date(Date.now() - 1000).toISOString() })
    .eq('id', fixture2.draft.id);

  // Attempt 2: Retry worker runs -> Should fail (1 mock fail remaining)
  console.log('   -> Running retry worker for 2nd attempt (expected to fail)...');
  const retrySummary1 = await processFailedAndStuckDrafts();
  console.log(`   -> Retry worker result: retried=${retrySummary1.retriedFailed}, failedAgain=${retrySummary1.failedAgain}`);

  const { data: draftAfter2 } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', fixture2.draft.id)
    .single<DraftRow>();

  if (draftAfter2?.status !== 'failed' || draftAfter2.attempts !== 2) {
    throw new Error(`Draft after attempt 2 should be 'failed' with attempts=2.`);
  }
  console.log(`   OK: Status is 'failed', attempts = 2.`);

  // Force next_retry_at to past again
  await supabaseAdmin
    .from('drafts')
    .update({ next_retry_at: new Date(Date.now() - 1000).toISOString() })
    .eq('id', fixture2.draft.id);

  // Attempt 3: Retry worker runs -> Should succeed!
  console.log('   -> Running retry worker for 3rd attempt (expected to succeed)...');
  const retrySummary2 = await processFailedAndStuckDrafts();
  console.log(`   -> Retry worker result: retried=${retrySummary2.retriedFailed}, succeeded=${retrySummary2.succeeded}`);

  const { data: draftAfter3 } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', fixture2.draft.id)
    .single<DraftRow>();

  if (
    draftAfter3?.status !== 'posted' ||
    draftAfter3.attempts !== 3 ||
    !draftAfter3.google_reply_posted_at ||
    draftAfter3.next_retry_at !== null
  ) {
    throw new Error(`Draft after attempt 3 should be 'posted' with attempts=3, google_reply_posted_at set, next_retry_at null.`);
  }
  console.log(`   OK: Draft transitioned to 'posted' with google_reply_posted_at = ${draftAfter3.google_reply_posted_at}\n`);

  // -------------------------------------------------------------
  // TEST 3: Crash Recovery (Draft stuck in 'posting' > 5 minutes)
  // -------------------------------------------------------------
  console.log('TEST 3: Crash recovery for draft stuck in "posting" > 5 minutes...');
  const fixture3 = await createFixture('stuck_crash');

  // Set draft to 'posting' with posting_started_at = 10 minutes ago
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabaseAdmin
    .from('drafts')
    .update({
      status: 'posting',
      posting_started_at: tenMinutesAgo,
      final_body: 'Recovered reply text',
      attempts: 1,
    })
    .eq('id', fixture3.draft.id);

  // Run retry worker
  const crashSummary = await processFailedAndStuckDrafts();
  console.log(`   -> Crash recovery worker result: recoveredStuck=${crashSummary.recoveredStuck}, succeeded=${crashSummary.succeeded}`);

  const { data: recoveredDraft } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', fixture3.draft.id)
    .single<DraftRow>();

  if (recoveredDraft?.status !== 'posted') {
    throw new Error(`Stuck draft was not recovered! Status: ${recoveredDraft?.status}`);
  }
  console.log(`   OK: Stuck 'posting' draft recovered and transitioned to 'posted'.\n`);

  // -------------------------------------------------------------
  // TEST 4: Max Retries Exhaustion (5 attempts cap)
  // -------------------------------------------------------------
  console.log('TEST 4: Max retries exhaustion (attempts >= 5 stops auto-retrying)...');
  const fixture4 = await createFixture('exhaustion');

  // Set draft to attempts = 4 and status = 'failed'
  await supabaseAdmin
    .from('drafts')
    .update({
      status: 'failed',
      attempts: 4,
      next_retry_at: new Date(Date.now() - 1000).toISOString(),
    })
    .eq('id', fixture4.draft.id);

  // Make mock client fail
  googleGBP.setMockFailCount(fixture4.review.google_review_id, 5);

  // Run retry worker (5th attempt fails and hits maxRetries = 5)
  const exhaustSummary = await processFailedAndStuckDrafts(5);
  console.log(`   -> Exhaustion summary: exhausted=${exhaustSummary.exhausted}, failedAgain=${exhaustSummary.failedAgain}`);

  const { data: exhaustedDraft } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', fixture4.draft.id)
    .single<DraftRow>();

  if (exhaustedDraft?.status !== 'failed' || exhaustedDraft.attempts !== 5 || exhaustedDraft.next_retry_at !== null) {
    throw new Error(
      `Exhausted draft should have attempts=5, next_retry_at=null, status='failed'. Got: attempts=${exhaustedDraft?.attempts}, next_retry=${exhaustedDraft?.next_retry_at}`
    );
  }
  console.log(`   OK: Draft marked failed permanently with attempts = 5 and next_retry_at = null.\n`);

  // Clean up test reviews & drafts
  await supabaseAdmin
    .from('reviews')
    .delete()
    .in('id', [fixture1.review.id, fixture2.review.id, fixture3.review.id, fixture4.review.id]);

  console.log('============================================================');
  console.log('ALL STATE MACHINE & RETRY WORKER TESTS PASSED CLEANLY! ✅');
  console.log('============================================================');
}

main().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
