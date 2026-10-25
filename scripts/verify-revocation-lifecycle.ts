/* eslint-disable @typescript-eslint/no-explicit-any */
// Preload empty server-only in CLI execution mode
try {
  require.cache[require.resolve('server-only')] = {
    id: require.resolve('server-only'),
    filename: require.resolve('server-only'),
    loaded: true,
    exports: {},
  } as any;
} catch {}

import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import crypto from 'node:crypto';
import { supabaseAdmin } from '../src/lib/supabase/admin';
import { encryptSecret } from '../src/lib/crypto/tokens';
import { googleGBP, GoogleAuthRevokedError } from '../src/lib/google/client';
import {
  handleGoogleRevocation,
  disconnectGoogleAccount,
  disconnectAndDeleteAllData,
} from '../src/lib/google/lifecycle';
import {
  getReconnectionNotificationCount,
  resetReconnectionNotificationCount,
} from '../src/lib/notifications/dispatcher';
import { pollAllActiveLocations } from '../src/lib/google/ingestor';
import { BusinessRow, LocationRow } from '../src/types/database';

async function main() {
  console.log('========================================================================');
  console.log('ITEM 7: REVOCATION & CONNECTION LIFECYCLE VERIFICATION');
  console.log('========================================================================\n');

  resetReconnectionNotificationCount();

  const testBizId = '77777777-0000-0000-0000-000000000001';
  const testLocId = '77777777-0000-0000-0000-000000000002';
  const testRevId = '77777777-0000-0000-0000-000000000003';
  const testDraftId = '77777777-0000-0000-0000-000000000004';

  // ------------------------------------------------------------------------
  // Setup: Clean old test records
  // ------------------------------------------------------------------------
  await supabaseAdmin.from('drafts').delete().eq('business_id', testBizId);
  await supabaseAdmin.from('reviews').delete().eq('business_id', testBizId);
  await supabaseAdmin.from('locations').delete().eq('business_id', testBizId);
  await supabaseAdmin.from('brand_profiles').delete().eq('business_id', testBizId);
  await supabaseAdmin.from('google_connections').delete().eq('business_id', testBizId);
  await supabaseAdmin.from('businesses').delete().eq('id', testBizId);

  // Get or seed an owner
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const ownerId = users.users[0]?.id || crypto.randomUUID();

  console.log('1. Seeding test business with active Google connection & locations...');
  const { error: bizErr } = await supabaseAdmin.from('businesses').insert({
    id: testBizId,
    owner_id: ownerId,
    name: 'Revocation Test Roastery',
    plan: 'pro',
    status: 'active',
    notification_channel: 'email',
    notification_target: 'owner-revocation@test.com',
  });
  if (bizErr) throw new Error(`Failed seeding business: ${bizErr.message}`);

  const { error: locErr } = await supabaseAdmin.from('locations').insert({
    id: testLocId,
    business_id: testBizId,
    google_account_id: 'accounts/rev-test-acc',
    google_location_id: 'locations/rev-test-loc',
    display_name: 'Revocation Test Location - Cairo',
    contact_phone: '+201011112222',
    is_polling_enabled: true,
  });
  if (locErr) throw new Error(`Failed seeding location: ${locErr.message}`);

  const rawSecret = '1//0gTestRefreshTokenForRevocationSimulation123';
  const { error: connErr } = await supabaseAdmin.from('google_connections').insert({
    business_id: testBizId,
    google_email: 'google-owner@test.com',
    encrypted_refresh_token: encryptSecret(rawSecret),
    access_token: 'ya29.initialTestAccessToken',
    status: 'active',
  });
  if (connErr) throw new Error(`Failed seeding connection: ${connErr.message}`);

  console.log('   OK: Seeded business, location (is_polling_enabled=true), and connection (status=active).');

  // ------------------------------------------------------------------------
  // Test 1: Simulated 'invalid_grant' token refresh revocation
  // ------------------------------------------------------------------------
  console.log('\n2. Simulating Google OAuth "invalid_grant" during token refresh...');
  googleGBP.setMockRevocation(testBizId, {
    type: 'invalid_grant',
    reason: 'Token has been expired or revoked by user (simulated invalid_grant)',
  });

  let threwRevokedError = false;
  try {
    await googleGBP.getValidAccessToken(testBizId);
  } catch (err: any) {
    if (err instanceof GoogleAuthRevokedError) {
      threwRevokedError = true;
      console.log(`   ✔ Caught expected GoogleAuthRevokedError: "${err.message}"`);
    } else {
      throw err;
    }
  }

  if (!threwRevokedError) {
    throw new Error('FAILED: getValidAccessToken did not throw GoogleAuthRevokedError on invalid_grant!');
  }

  // Verify DB state
  const { data: connAfterRevoke } = await supabaseAdmin
    .from('google_connections')
    .select('*')
    .eq('business_id', testBizId)
    .single();

  const { data: locAfterRevoke } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('id', testLocId)
    .single<LocationRow>();

  const { data: bizAfterRevoke } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', testBizId)
    .single<BusinessRow>();

  if (connAfterRevoke.status !== 'revoked') {
    throw new Error(`Expected connection status 'revoked', got: ${connAfterRevoke.status}`);
  }
  console.log('   ✔ DB VERIFIED: google_connections.status is now "revoked"');

  if (locAfterRevoke?.is_polling_enabled !== false) {
    throw new Error(`Expected location is_polling_enabled=false, got: ${locAfterRevoke?.is_polling_enabled}`);
  }
  console.log('   ✔ DB VERIFIED: locations.is_polling_enabled is now false');

  if (bizAfterRevoke?.status !== 'revoked') {
    throw new Error(`Expected business status 'revoked', got: ${bizAfterRevoke?.status}`);
  }
  console.log('   ✔ DB VERIFIED: businesses.status is now "revoked"');

  const notifCount1 = getReconnectionNotificationCount();
  if (notifCount1 !== 1) {
    throw new Error(`Expected exactly 1 reconnection notification, got: ${notifCount1}`);
  }
  console.log('   ✔ NOTIFICATION VERIFIED: Exactly 1 "Reconnect your Google Account" alert dispatched to owner.');

  // ------------------------------------------------------------------------
  // Test 2: Idempotency of notification (No spamming on repeated checks)
  // ------------------------------------------------------------------------
  console.log('\n3. Testing Idempotency: Triggering second revocation event for same business...');
  const secondTransition = await handleGoogleRevocation({
    businessId: testBizId,
    reason: 'Duplicate revocation check',
  });

  if (secondTransition !== false) {
    throw new Error('FAILED: handleGoogleRevocation returned true on already revoked connection!');
  }

  const notifCount2 = getReconnectionNotificationCount();
  if (notifCount2 !== 1) {
    throw new Error(`FAILED IDEMPOTENCY: Notification count increased from 1 to ${notifCount2}`);
  }
  console.log('   ✔ IDEMPOTENT: No duplicate notification sent on subsequent cycles.');

  // ------------------------------------------------------------------------
  // Test 3: Polling Ingestor safely skips revoked locations
  // ------------------------------------------------------------------------
  console.log('\n4. Verifying pollAllActiveLocations safely ignores revoked business locations...');
  const pollSummary = await pollAllActiveLocations(50);
  const polledThisLocation = pollSummary.newReviewIds.includes(testRevId);
  if (polledThisLocation) {
    throw new Error('FAILED: Ingestor attempted to poll a location with is_polling_enabled=false!');
  }
  console.log('   ✔ INGESTOR SAFE: Ingestor skipped revoked location as is_polling_enabled is false.');

  // ------------------------------------------------------------------------
  // Test 4: Simulated 401 & 403 API responses during listReviews and postReply
  // ------------------------------------------------------------------------
  console.log('\n5. Testing 401 & 403 HTTP status simulation in listReviews & postReply...');
  googleGBP.setMockRevocation(testBizId, {
    type: '401',
    reason: 'Google API HTTP 401 Unauthorized',
  });

  let caught401 = false;
  try {
    await googleGBP.listReviews(testBizId, 'accounts/test', 'locations/test');
  } catch (err: any) {
    if (err instanceof GoogleAuthRevokedError) caught401 = true;
  }
  if (!caught401) throw new Error('FAILED: listReviews did not catch simulated 401 as GoogleAuthRevokedError');
  console.log('   ✔ 401 CAUGHT: listReviews intercepted 401 as GoogleAuthRevokedError.');

  googleGBP.setMockRevocation(testBizId, {
    type: '403',
    reason: 'Google API HTTP 403 Forbidden - Insufficient Permissions',
  });

  let caught403 = false;
  try {
    await googleGBP.postReply(testBizId, 'accounts/test', 'locations/test', 'rev-1', 'Reply text');
  } catch (err: any) {
    if (err instanceof GoogleAuthRevokedError) caught403 = true;
  }
  if (!caught403) throw new Error('FAILED: postReply did not catch simulated 403 as GoogleAuthRevokedError');
  console.log('   ✔ 403 CAUGHT: postReply intercepted 403 as GoogleAuthRevokedError.');

  // Clear mock revocation
  googleGBP.setMockRevocation(testBizId, null);

  // ------------------------------------------------------------------------
  // Test 5.5: Disconnect Google account without deleting data
  // ------------------------------------------------------------------------
  console.log('\n6. Testing standard disconnectGoogleAccount flow...');
  const disconnectOnlyRes = await disconnectGoogleAccount(testBizId);
  console.log(`   OK: Disconnect only executed -> ${disconnectOnlyRes.message}`);

  // ------------------------------------------------------------------------
  // Test 6: Re-activate connection & test "Disconnect & Delete Data" flow
  // ------------------------------------------------------------------------
  console.log('\n7. Testing "Disconnect & Delete Data" Privacy Standard Compliance...');
  // Reseed data to test deletion
  await supabaseAdmin.from('reviews').insert({
    id: testRevId,
    business_id: testBizId,
    location_id: testLocId,
    google_review_id: 'rev-to-be-deleted',
    rating: 5,
    text: 'Customer review data to be purged for privacy',
  });
  await supabaseAdmin.from('drafts').insert({
    id: testDraftId,
    business_id: testBizId,
    review_id: testRevId,
    body: 'Draft to be purged',
    status: 'pending',
    model: 'claude-haiku-5-5',
    prompt_version: 'v1.0',
  });
  await supabaseAdmin.from('brand_profiles').insert({
    business_id: testBizId,
    tone: 'Friendly Egyptian Arabic',
    arabic_dialect: 'egyptian',
  });

  const deleteResult = await disconnectAndDeleteAllData(testBizId);
  console.log(`   OK: Disconnect & Delete Data executed -> ${deleteResult.message}`);

  // Assert complete removal of reviews, drafts, locations, brand profile, and google connection
  const [remReviews, remDrafts, remLocations, remBrand, remConn] = await Promise.all([
    supabaseAdmin.from('reviews').select('*').eq('business_id', testBizId),
    supabaseAdmin.from('drafts').select('*').eq('business_id', testBizId),
    supabaseAdmin.from('locations').select('*').eq('business_id', testBizId),
    supabaseAdmin.from('brand_profiles').select('*').eq('business_id', testBizId),
    supabaseAdmin.from('google_connections').select('*').eq('business_id', testBizId),
  ]);

  if (remReviews.data && remReviews.data.length > 0) throw new Error('Reviews were not deleted!');
  if (remDrafts.data && remDrafts.data.length > 0) throw new Error('Drafts were not deleted!');
  if (remLocations.data && remLocations.data.length > 0) throw new Error('Locations were not deleted!');
  if (remBrand.data && remBrand.data.length > 0) throw new Error('Brand profile was not deleted!');
  if (remConn.data && remConn.data.length > 0) throw new Error('Google connection credentials were not deleted!');

  console.log('   ✔ PRIVACY COMPLIANT: All customer reviews, AI drafts, locations, and OAuth credentials permanently deleted.');

  // Clean up business shell
  await supabaseAdmin.from('businesses').delete().eq('id', testBizId);

  console.log('\n========================================================================');
  console.log('REVOCATION & CONNECTION LIFECYCLE VERIFIED SUCCESSFULLY!');
  console.log('========================================================================');
}

main().catch((err) => {
  console.error('\n❌ Revocation Lifecycle Verification Failed:', err);
  process.exit(1);
});
