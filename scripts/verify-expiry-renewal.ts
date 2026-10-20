/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { supabaseAdmin } from '../src/lib/supabase/admin';
import { generateApprovalToken, hashApprovalToken } from '../src/lib/crypto/tokens';
import {
  getApprovalContextByToken,
  executeApprovalDecision,
  renewApprovalToken,
  RateLimitError,
} from '../src/lib/approvals';
import { BusinessRow, LocationRow, ReviewRow, DraftRow } from '../src/types/database';

async function main() {
  console.log('============================================================');
  console.log('VERIFYING APPROVAL-LINK EXPIRY & SECURE RENEWAL');
  console.log('============================================================\n');

  // 1. Load active test business and location
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .limit(1)
    .single<BusinessRow>();

  if (!business) throw new Error('No business found. Seed the database first.');

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('business_id', business.id)
    .limit(1)
    .single<LocationRow>();

  if (!location) throw new Error('No location found for business.');

  // Helper to create test review and draft with arbitrary expiry
  async function createDraftFixture(expiresAtIso: string, label: string) {
    const revId = `test_rev_exp_${Date.now()}_${label}`;
    const { data: review, error: revErr } = await supabaseAdmin
      .from('reviews')
      .insert({
        business_id: business!.id,
        location_id: location!.id,
        google_review_id: revId,
        rating: 5,
        reviewer_name: `Expiry Tester ${label}`,
        text: `Expiry verification review ${label}`,
        language: 'ar',
        flags: [],
        requires_careful_review: false,
      })
      .select('*')
      .single<ReviewRow>();

    if (revErr || !review) throw revErr || new Error('Failed creating test review');

    const { rawToken, tokenHash } = generateApprovalToken(72);

    const { data: draft, error: draftErr } = await supabaseAdmin
      .from('drafts')
      .insert({
        business_id: business!.id,
        review_id: review.id,
        body: `Draft reply for expiry test ${label}`,
        status: 'pending',
        approval_token_hash: tokenHash,
        token_expires_at: expiresAtIso,
        expires_at: expiresAtIso,
        model: 'test-model',
        prompt_version: 'v1.0',
        attempts: 0,
        renewal_count: 0,
      })
      .select('*')
      .single<DraftRow>();

    if (draftErr || !draft) throw draftErr || new Error('Failed creating draft fixture');

    return { review, draft, rawToken, tokenHash };
  }

  // ------------------------------------------------------------
  // TEST 1: Expired token rejection
  // ------------------------------------------------------------
  console.log('TEST 1: Verifying expired token rejection...');
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();
  const expiredFixture = await createDraftFixture(oneHourAgo, 'expired_test');

  const context = await getApprovalContextByToken(expiredFixture.rawToken);
  if (!context) throw new Error('FAIL: Could not load approval context for expired token');
  if (!context.isExpired) throw new Error('FAIL: Draft should be marked isExpired = true');
  console.log('   OK: getApprovalContextByToken correctly detected isExpired = true');

  let rejected = false;
  try {
    await executeApprovalDecision({
      rawToken: expiredFixture.rawToken,
      action: 'approve',
    });
  } catch (err: any) {
    if (err.message.includes('expired')) {
      rejected = true;
      console.log(`   OK: executeApprovalDecision rejected: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!rejected) {
    throw new Error('FAIL: executeApprovalDecision should have rejected expired token');
  }

  // ------------------------------------------------------------
  // TEST 2: Secure Renewal Generation & Owner Delivery
  // ------------------------------------------------------------
  console.log('\nTEST 2: Verifying secure renewal generation & owner delivery...');
  const renewalResult = await renewApprovalToken(expiredFixture.rawToken);

  // Assert response does NOT leak raw token or magic URL
  if ((renewalResult as any).rawToken || (renewalResult as any).approvalUrl) {
    throw new Error('FAIL: SECURITY VIOLATION: rawToken or approvalUrl leaked in response!');
  }

  console.log('   OK: Response does NOT leak raw token or link:');
  console.log(`       channel: ${renewalResult.channel}, targetMasked: ${renewalResult.targetMasked}`);
  console.log(`       new expiresAt: ${renewalResult.expiresAt}`);

  const renewalExpiryMs = new Date(renewalResult.expiresAt).getTime();
  const expectedMinMs = Date.now() + 71 * 3600 * 1000;
  if (renewalExpiryMs < expectedMinMs) {
    throw new Error('FAIL: Fresh expires_at is not ~72 hours in future');
  }
  console.log('   OK: Fresh 72-hour expiry date confirmed.');

  // ------------------------------------------------------------
  // TEST 3: Invalidation of Old Token
  // ------------------------------------------------------------
  console.log('\nTEST 3: Verifying old token is immediately invalidated...');
  const oldCtxAfterRenew = await getApprovalContextByToken(expiredFixture.rawToken);
  if (oldCtxAfterRenew !== null) {
    throw new Error('FAIL: Old token still resolved! It should be invalidated.');
  }
  console.log('   OK: Old token returns null from getApprovalContextByToken');

  let oldTokenApproveBlocked = false;
  try {
    await executeApprovalDecision({
      rawToken: expiredFixture.rawToken,
      action: 'approve',
    });
  } catch (err: any) {
    oldTokenApproveBlocked = true;
    console.log(`   OK: Old token approval attempt blocked: "${err.message}"`);
  }
  if (!oldTokenApproveBlocked) {
    throw new Error('FAIL: Old token approval should be blocked');
  }

  let oldTokenRenewBlocked = false;
  try {
    await renewApprovalToken(expiredFixture.rawToken);
  } catch (err: any) {
    oldTokenRenewBlocked = true;
    console.log(`   OK: Renewing again with old token blocked: "${err.message}"`);
  }
  if (!oldTokenRenewBlocked) {
    throw new Error('FAIL: Old token renewal should be blocked');
  }

  // ------------------------------------------------------------
  // TEST 4: Rate Limiting Enforcement Per Draft
  // ------------------------------------------------------------
  console.log('\nTEST 4: Verifying rate limit enforcement per draft...');

  // Inspect the renewed draft in DB
  const { data: updatedDraft } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', expiredFixture.draft.id)
    .single<DraftRow>();

  if (!updatedDraft) throw new Error('FAIL: Could not fetch updated draft from DB');
  if (updatedDraft.renewal_count !== 1) {
    throw new Error(`FAIL: Expected renewal_count = 1, got ${updatedDraft.renewal_count}`);
  }
  if (!updatedDraft.last_renewed_at) {
    throw new Error('FAIL: last_renewed_at should be set');
  }
  console.log(`   OK: Draft in DB has renewal_count = ${updatedDraft.renewal_count}, last_renewed_at = ${updatedDraft.last_renewed_at}`);

  // Simulate an immediate renewal request using the fresh token in the DB
  // To test the rate limiter, we need the raw token or simulate the call.
  // We can test rate limiting on a new fixture where we immediately attempt a second renewal:
  const activeFixture = await createDraftFixture(
    new Date(Date.now() + 3600 * 1000).toISOString(),
    'ratelimit_test'
  );

  // First renewal should succeed
  const firstRenew = await renewApprovalToken(activeFixture.rawToken);
  console.log(`   OK: First renewal succeeded (renewal_count: ${firstRenew.renewalCount})`);

  // To simulate immediate second renewal, we can generate a known token and test the cooldown guard:
  const testCooldownToken = generateApprovalToken(72);
  const { data: cooldownDraft } = await supabaseAdmin
    .from('drafts')
    .insert({
      business_id: business.id,
      review_id: expiredFixture.review.id,
      body: 'Cooldown test draft',
      status: 'pending',
      approval_token_hash: testCooldownToken.tokenHash,
      expires_at: new Date(Date.now() - 1000).toISOString(),
      last_renewed_at: new Date().toISOString(), // Just renewed seconds ago!
      renewal_count: 1,
      model: 'test-model',
      prompt_version: 'v1.0',
    })
    .select('*')
    .single<DraftRow>();

  let rateLimitCaught = false;
  try {
    await renewApprovalToken(testCooldownToken.rawToken);
  } catch (err: any) {
    if (err instanceof RateLimitError || err.message.includes('Please wait')) {
      rateLimitCaught = true;
      console.log(`   OK: Rate limiter caught immediate second request: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!rateLimitCaught) {
    throw new Error('FAIL: Expected RateLimitError for immediate second renewal');
  }

  // ------------------------------------------------------------
  // TEST 5: Security Hardening & Zero Side-Effects
  // ------------------------------------------------------------
  console.log('\nTEST 5: Verifying GET has no side-effects on drafts...');
  const untouchedFixture = await createDraftFixture(
    new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    'no_side_effects'
  );

  // Perform multiple GET context lookups (simulating email scanner prefetch)
  await getApprovalContextByToken(untouchedFixture.rawToken);
  await getApprovalContextByToken(untouchedFixture.rawToken);
  await getApprovalContextByToken(untouchedFixture.rawToken);

  const { data: postPrefetchDraft } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('id', untouchedFixture.draft.id)
    .single<DraftRow>();

  if (postPrefetchDraft?.status !== 'pending') {
    throw new Error('FAIL: GET altered draft status!');
  }
  if (postPrefetchDraft?.approval_token_hash !== untouchedFixture.tokenHash) {
    throw new Error('FAIL: GET altered token hash!');
  }
  if (postPrefetchDraft?.renewal_count !== 0) {
    throw new Error('FAIL: GET altered renewal count!');
  }
  console.log('   OK: Multiple GET operations had ZERO side-effects (safe against email scanner prefetching).');

  // Clean up test records
  console.log('\nCleaning up test artifacts...');
  await supabaseAdmin.from('reviews').delete().like('google_review_id', 'test_rev_exp_%');

  console.log('\n============================================================');
  console.log('ALL EXPIRY & SECURE RENEWAL VERIFICATION TESTS PASSED! ✅');
  console.log('============================================================');
}

main().catch((err) => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
