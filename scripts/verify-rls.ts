/* eslint-disable @typescript-eslint/no-explicit-any */
// Preload empty server-only in CLI execution mode so server-only modules resolve smoothly
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
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../src/lib/supabase/admin';
import { encryptSecret, decryptSecret } from '../src/lib/crypto/tokens';
import { scrubString, scrubObject } from '../src/lib/crypto/scrubber';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !anonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

async function getOrCreateTestUser(email: string, password: string): Promise<string> {
  const { data: list, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw listErr;

  const existing = list.users.find((u) => u.email === email);
  if (existing) {
    // Ensure password is up to date for sign-in
    await supabaseAdmin.auth.admin.updateUserById(existing.id, { password });
    return existing.id;
  }

  const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createErr || !created.user) {
    throw new Error(`Failed to create test user ${email}: ${createErr?.message}`);
  }

  return created.user.id;
}

async function main() {
  console.log('========================================================================');
  console.log('ITEM 6: MULTI-TENANT RLS TEST SUITE & SECRET ENCRYPTION VERIFICATION');
  console.log('========================================================================\n');

  // ------------------------------------------------------------------------
  // 1. Provision Two Distinct Tenant Accounts
  // ------------------------------------------------------------------------
  console.log('1. Setting up two isolated tenant accounts in Supabase Auth...');
  const tenantAEmail = 'tenant-a-rls@reviewbot.test';
  const tenantBEmail = 'tenant-b-rls@reviewbot.test';
  const tenantPass = 'TestingPassword123!';

  const [tenantAId, tenantBId] = await Promise.all([
    getOrCreateTestUser(tenantAEmail, tenantPass),
    getOrCreateTestUser(tenantBEmail, tenantPass),
  ]);

  console.log(`   OK: Tenant A ID = ${tenantAId} (${tenantAEmail})`);
  console.log(`   OK: Tenant B ID = ${tenantBId} (${tenantBEmail})`);

  // ------------------------------------------------------------------------
  // 2. Seed Tenant B's Protected Records (The Victim Data)
  // ------------------------------------------------------------------------
  console.log('\n2. Seeding Tenant B records across all 5 tables via service_role...');
  const bBizId = 'bbbbbbbb-0000-0000-0000-000000000001';
  const bLocId = 'bbbbbbbb-0000-0000-0000-000000000002';
  const bRevId = 'bbbbbbbb-0000-0000-0000-000000000003';
  const bDraftId = 'bbbbbbbb-0000-0000-0000-000000000004';

  const rawSecretRefreshToken = '1//0gTenantB_SensitiveRefreshToken_XYZ987654321';
  const encryptedRefreshToken = encryptSecret(rawSecretRefreshToken);

  // Clean any previous test run records
  await supabaseAdmin.from('drafts').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('reviews').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('brand_profiles').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('google_connections').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('locations').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('businesses').delete().eq('id', bBizId);

  // A. Tenant B Business
  const { error: bBizErr } = await supabaseAdmin.from('businesses').insert({
    id: bBizId,
    owner_id: tenantBId,
    name: 'Tenant B Specialty Roastery',
    plan: 'pro',
    status: 'active',
    notification_channel: 'email',
    notification_target: tenantBEmail,
  });
  if (bBizErr) throw new Error(`Failed to seed Tenant B business: ${bBizErr.message}`);

  // B. Tenant B Location
  const { error: bLocErr } = await supabaseAdmin.from('locations').insert({
    id: bLocId,
    business_id: bBizId,
    google_account_id: 'accounts/tenant-b-acc',
    google_location_id: 'locations/tenant-b-loc',
    display_name: 'Tenant B - Zamalek Branch',
    contact_phone: '+201099998888',
    contact_email: 'zamalek@tenant-b.test',
    is_polling_enabled: true,
  });
  if (bLocErr) throw new Error(`Failed to seed Tenant B location: ${bLocErr.message}`);

  // C. Tenant B Brand Profile
  const { error: bBrandErr } = await supabaseAdmin.from('brand_profiles').insert({
    business_id: bBizId,
    tone: 'Professional and courteous Egyptian Arabic',
    languages: ['ar'],
    arabic_dialect: 'egyptian',
    signature: 'Tenant B Management',
  });
  if (bBrandErr) throw new Error(`Failed to seed Tenant B brand profile: ${bBrandErr.message}`);

  // D. Tenant B Review
  const { error: bRevErr } = await supabaseAdmin.from('reviews').insert({
    id: bRevId,
    business_id: bBizId,
    location_id: bLocId,
    google_review_id: 'google-rev-tenant-b-001',
    rating: 5,
    reviewer_name: 'Customer of Tenant B',
    text: 'Best V60 coffee in Zamalek! Highly recommended.',
    language: 'en',
    requires_careful_review: false,
  });
  if (bRevErr) throw new Error(`Failed to seed Tenant B review: ${bRevErr.message}`);

  // E. Tenant B Draft
  const { error: bDraftErr } = await supabaseAdmin.from('drafts').insert({
    id: bDraftId,
    business_id: bBizId,
    review_id: bRevId,
    body: 'Thank you for visiting Tenant B Zamalek! We appreciate your support.',
    status: 'pending',
    model: 'claude-3-5-haiku-latest',
    prompt_version: 'v1.0',
  });
  if (bDraftErr) throw new Error(`Failed to seed Tenant B draft: ${bDraftErr.message}`);

  // F. Tenant B Google Connection (AES-256-GCM encrypted refresh token)
  const { error: bConnErr } = await supabaseAdmin.from('google_connections').insert({
    business_id: bBizId,
    google_email: 'google-admin@tenant-b.test',
    encrypted_refresh_token: encryptedRefreshToken,
    access_token: 'ya29.tenantBMockAccessToken123',
    status: 'active',
  });
  if (bConnErr) throw new Error(`Failed to seed Tenant B google_connections: ${bConnErr.message}`);

  console.log('   OK: Tenant B records created successfully across 5 tables + google_connections.');

  // ------------------------------------------------------------------------
  // 3. Seed Tenant A's Own Business (Attacker has their own valid tenant space)
  // ------------------------------------------------------------------------
  console.log("\n3. Seeding Tenant A's legitimate business record...");
  const aBizId = 'aaaaaaaa-0000-0000-0000-000000000001';
  await supabaseAdmin.from('businesses').delete().eq('id', aBizId);

  const { error: aBizErr } = await supabaseAdmin.from('businesses').insert({
    id: aBizId,
    owner_id: tenantAId,
    name: 'Tenant A Coffee Lab',
    plan: 'trial',
    status: 'active',
    notification_channel: 'email',
    notification_target: tenantAEmail,
  });
  if (aBizErr) throw new Error(`Failed to seed Tenant A business: ${aBizErr.message}`);
  console.log(`   OK: Tenant A Business ID = ${aBizId}`);

  // ------------------------------------------------------------------------
  // 4. Authenticate Supabase Client as Tenant A (Non-admin, standard RLS client)
  // ------------------------------------------------------------------------
  console.log('\n4. Authenticating Supabase Client as Tenant A (enforcing Row Level Security)...');
  const clientA = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authDataA, error: authErrA } = await clientA.auth.signInWithPassword({
    email: tenantAEmail,
    password: tenantPass,
  });

  if (authErrA || !authDataA.session) {
    throw new Error(`Failed to authenticate Tenant A: ${authErrA?.message}`);
  }
  console.log(`   OK: Client authenticated as Tenant A (JWT sub: ${authDataA.user?.id})`);

  // ------------------------------------------------------------------------
  // 5. Mathematical RLS Assertions Matrix (CRUD on all 5 tables + google_connections)
  // ------------------------------------------------------------------------
  console.log('\n5. Executing Mathematical RLS Assertions Matrix (Tenant A -> Tenant B)...');

  // --- Table 1: businesses ---
  console.log('\n   [TABLE 1: businesses]');
  // 1a. READ
  const { data: bBizRead } = await clientA
    .from('businesses')
    .select('*')
    .eq('id', bBizId);
  if (bBizRead && bBizRead.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to READ Tenant B business!');
  }
  console.log('   ✔ READ BLOCKED: Tenant A received 0 rows querying Tenant B business.');

  // 1b. INSERT (spoofing owner_id = tenantBId)
  const fakeBizId = crypto.randomUUID();
  const { error: bBizInsertErr } = await clientA.from('businesses').insert({
    id: fakeBizId,
    owner_id: tenantBId,
    name: 'Malicious Business Inject',
  });
  if (!bBizInsertErr) {
    throw new Error('RLS VIOLATION: Tenant A was able to INSERT business with Tenant B owner_id!');
  }
  console.log(`   ✔ INSERT BLOCKED: Insert rejected by RLS check -> "${bBizInsertErr.message}"`);

  // 1c. UPDATE
  const { data: bBizUpdateData } = await clientA
    .from('businesses')
    .update({ name: 'HACKED BY TENANT A' })
    .eq('id', bBizId)
    .select();
  if (bBizUpdateData && bBizUpdateData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to UPDATE Tenant B business!');
  }
  // Verify data remained unchanged in database
  const { data: verifiedBizB } = await supabaseAdmin.from('businesses').select('*').eq('id', bBizId).single();
  if (verifiedBizB.name !== 'Tenant B Specialty Roastery') {
    throw new Error('DATA INTEGRITY FAILURE: Tenant B business name was modified!');
  }
  console.log('   ✔ UPDATE BLOCKED: 0 rows modified; Tenant B business remained intact.');

  // 1d. DELETE
  const { data: bBizDeleteData } = await clientA
    .from('businesses')
    .delete()
    .eq('id', bBizId)
    .select();
  if (bBizDeleteData && bBizDeleteData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to DELETE Tenant B business!');
  }
  const { data: stillExistsBizB } = await supabaseAdmin.from('businesses').select('*').eq('id', bBizId).single();
  if (!stillExistsBizB) {
    throw new Error('DATA INTEGRITY FAILURE: Tenant B business was deleted!');
  }
  console.log('   ✔ DELETE BLOCKED: 0 rows deleted; Tenant B business still exists.');

  // --- Table 2: locations ---
  console.log('\n   [TABLE 2: locations]');
  // 2a. READ
  const { data: bLocRead } = await clientA.from('locations').select('*').eq('id', bLocId);
  if (bLocRead && bLocRead.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to READ Tenant B location!');
  }
  console.log('   ✔ READ BLOCKED: Tenant A received 0 rows querying Tenant B location.');

  // 2b. INSERT
  const { error: bLocInsertErr } = await clientA.from('locations').insert({
    business_id: bBizId,
    google_account_id: 'malicious-acc',
    google_location_id: 'malicious-loc',
    display_name: 'Injected Location',
  });
  if (!bLocInsertErr) {
    throw new Error('RLS VIOLATION: Tenant A was able to INSERT location linked to Tenant B!');
  }
  console.log(`   ✔ INSERT BLOCKED: Insert rejected by RLS check -> "${bLocInsertErr.message}"`);

  // 2c. UPDATE
  const { data: bLocUpdateData } = await clientA
    .from('locations')
    .update({ display_name: 'HACKED LOCATION' })
    .eq('id', bLocId)
    .select();
  if (bLocUpdateData && bLocUpdateData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to UPDATE Tenant B location!');
  }
  console.log('   ✔ UPDATE BLOCKED: 0 rows modified for Tenant B location.');

  // 2d. DELETE
  const { data: bLocDeleteData } = await clientA
    .from('locations')
    .delete()
    .eq('id', bLocId)
    .select();
  if (bLocDeleteData && bLocDeleteData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to DELETE Tenant B location!');
  }
  console.log('   ✔ DELETE BLOCKED: 0 rows deleted for Tenant B location.');

  // --- Table 3: brand_profiles ---
  console.log('\n   [TABLE 3: brand_profiles]');
  // 3a. READ
  const { data: bBrandRead } = await clientA.from('brand_profiles').select('*').eq('business_id', bBizId);
  if (bBrandRead && bBrandRead.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to READ Tenant B brand profile!');
  }
  console.log('   ✔ READ BLOCKED: Tenant A received 0 rows querying Tenant B brand profile.');

  // 3b. INSERT
  const { error: bBrandInsertErr } = await clientA.from('brand_profiles').insert({
    business_id: bBizId,
    tone: 'Malicious tone override',
  });
  if (!bBrandInsertErr) {
    throw new Error('RLS VIOLATION: Tenant A was able to INSERT brand profile for Tenant B!');
  }
  console.log(`   ✔ INSERT BLOCKED: Insert rejected by RLS check -> "${bBrandInsertErr.message}"`);

  // 3c. UPDATE
  const { data: bBrandUpdateData } = await clientA
    .from('brand_profiles')
    .update({ tone: 'HACKED TONE' })
    .eq('business_id', bBizId)
    .select();
  if (bBrandUpdateData && bBrandUpdateData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to UPDATE Tenant B brand profile!');
  }
  console.log('   ✔ UPDATE BLOCKED: 0 rows modified for Tenant B brand profile.');

  // 3d. DELETE
  const { data: bBrandDeleteData } = await clientA
    .from('brand_profiles')
    .delete()
    .eq('business_id', bBizId)
    .select();
  if (bBrandDeleteData && bBrandDeleteData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to DELETE Tenant B brand profile!');
  }
  console.log('   ✔ DELETE BLOCKED: 0 rows deleted for Tenant B brand profile.');

  // --- Table 4: reviews ---
  console.log('\n   [TABLE 4: reviews]');
  // 4a. READ
  const { data: bRevRead } = await clientA.from('reviews').select('*').eq('id', bRevId);
  if (bRevRead && bRevRead.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to READ Tenant B review!');
  }
  console.log('   ✔ READ BLOCKED: Tenant A received 0 rows querying Tenant B review.');

  // 4b. INSERT
  const { error: bRevInsertErr } = await clientA.from('reviews').insert({
    business_id: bBizId,
    location_id: bLocId,
    google_review_id: 'fake-google-rev',
    rating: 1,
    text: 'Defamatory fake review',
  });
  if (!bRevInsertErr) {
    throw new Error('RLS VIOLATION: Tenant A was able to INSERT review for Tenant B!');
  }
  console.log(`   ✔ INSERT BLOCKED: Insert rejected by RLS check -> "${bRevInsertErr.message}"`);

  // 4c. UPDATE
  const { data: bRevUpdateData } = await clientA
    .from('reviews')
    .update({ rating: 1, text: 'Hacked review' })
    .eq('id', bRevId)
    .select();
  if (bRevUpdateData && bRevUpdateData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to UPDATE Tenant B review!');
  }
  console.log('   ✔ UPDATE BLOCKED: 0 rows modified for Tenant B review.');

  // 4d. DELETE
  const { data: bRevDeleteData } = await clientA
    .from('reviews')
    .delete()
    .eq('id', bRevId)
    .select();
  if (bRevDeleteData && bRevDeleteData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to DELETE Tenant B review!');
  }
  console.log('   ✔ DELETE BLOCKED: 0 rows deleted for Tenant B review.');

  // --- Table 5: drafts ---
  console.log('\n   [TABLE 5: drafts]');
  // 5a. READ
  const { data: bDraftRead } = await clientA.from('drafts').select('*').eq('id', bDraftId);
  if (bDraftRead && bDraftRead.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to READ Tenant B draft!');
  }
  console.log('   ✔ READ BLOCKED: Tenant A received 0 rows querying Tenant B draft.');

  // 5b. INSERT
  const { error: bDraftInsertErr } = await clientA.from('drafts').insert({
    business_id: bBizId,
    review_id: bRevId,
    body: 'Malicious forged draft',
    model: 'mock',
    prompt_version: 'v0',
  });
  if (!bDraftInsertErr) {
    throw new Error('RLS VIOLATION: Tenant A was able to INSERT draft for Tenant B!');
  }
  console.log(`   ✔ INSERT BLOCKED: Insert rejected by RLS check -> "${bDraftInsertErr.message}"`);

  // 5c. UPDATE
  const { data: bDraftUpdateData } = await clientA
    .from('drafts')
    .update({ body: 'HACKED DRAFT CONTENT' })
    .eq('id', bDraftId)
    .select();
  if (bDraftUpdateData && bDraftUpdateData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to UPDATE Tenant B draft!');
  }
  console.log('   ✔ UPDATE BLOCKED: 0 rows modified for Tenant B draft.');

  // 5d. DELETE
  const { data: bDraftDeleteData } = await clientA
    .from('drafts')
    .delete()
    .eq('id', bDraftId)
    .select();
  if (bDraftDeleteData && bDraftDeleteData.length > 0) {
    throw new Error('RLS VIOLATION: Tenant A was able to DELETE Tenant B draft!');
  }
  console.log('   ✔ DELETE BLOCKED: 0 rows deleted for Tenant B draft.');

  // --- Table 6: google_connections (Client-side zero-access check) ---
  console.log('\n   [TABLE 6: google_connections]');
  const { data: bConnRead } = await clientA
    .from('google_connections')
    .select('*')
    .eq('business_id', bBizId);
  if (bConnRead && bConnRead.length > 0) {
    throw new Error('CRITICAL VIOLATION: Client-side Tenant A read google_connections!');
  }
  console.log('   ✔ READ BLOCKED: Tenant A received 0 rows from google_connections.');

  // ------------------------------------------------------------------------
  // 6. Positive Control: Verify Tenant B CAN Read Their Own Records
  // ------------------------------------------------------------------------
  console.log('\n6. Running Positive Control: Verifying Tenant B CAN read their OWN data...');
  const clientB = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error: authErrB } = await clientB.auth.signInWithPassword({
    email: tenantBEmail,
    password: tenantPass,
  });
  if (authErrB) throw new Error(`Failed to authenticate Tenant B: ${authErrB.message}`);

  const [bSelfBiz, bSelfLoc, bSelfBrand, bSelfRev, bSelfDraft] = await Promise.all([
    clientB.from('businesses').select('*').eq('id', bBizId).single(),
    clientB.from('locations').select('*').eq('id', bLocId).single(),
    clientB.from('brand_profiles').select('*').eq('business_id', bBizId).single(),
    clientB.from('reviews').select('*').eq('id', bRevId).single(),
    clientB.from('drafts').select('*').eq('id', bDraftId).single(),
  ]);

  if (!bSelfBiz.data || bSelfBiz.data.name !== 'Tenant B Specialty Roastery') {
    throw new Error('Tenant B could not read own business!');
  }
  if (!bSelfLoc.data || bSelfLoc.data.display_name !== 'Tenant B - Zamalek Branch') {
    throw new Error('Tenant B could not read own location!');
  }
  if (!bSelfBrand.data) throw new Error('Tenant B could not read own brand profile!');
  if (!bSelfRev.data) throw new Error('Tenant B could not read own review!');
  if (!bSelfDraft.data) throw new Error('Tenant B could not read own draft!');

  console.log('   ✔ POSITIVE CONTROL PASSED: Tenant B successfully reads all own records.');

  // Even Tenant B cannot read google_connections via public client (strictly server-only)
  const { data: bSelfConn } = await clientB.from('google_connections').select('*').eq('business_id', bBizId);
  if (bSelfConn && bSelfConn.length > 0) {
    throw new Error('SECURITY VIOLATION: google_connections must not be readable via client-side!');
  }
  console.log('   ✔ SERVER-ONLY ISOLATION: google_connections is blocked for client-side Tenant B as well.');

  // ------------------------------------------------------------------------
  // 7. Verify Encryption-At-Rest for google_connections.encrypted_refresh_token
  // ------------------------------------------------------------------------
  console.log('\n7. Verifying Encryption-At-Rest & Cryptographic Integrity...');
  const { data: dbConn, error: dbConnErr } = await supabaseAdmin
    .from('google_connections')
    .select('encrypted_refresh_token')
    .eq('business_id', bBizId)
    .single();

  if (dbConnErr || !dbConn) {
    throw new Error(`Failed to fetch google_connections via admin: ${dbConnErr?.message}`);
  }

  const storedToken = dbConn.encrypted_refresh_token;

  // 7a. Ensure plaintext is NEVER stored
  if (storedToken.includes('TenantB_SensitiveRefreshToken') || storedToken.includes('1//0g')) {
    throw new Error('SECURITY VULNERABILITY: Plaintext refresh token was stored directly in database!');
  }
  console.log('   ✔ CIPHERTEXT ONLY: Plaintext token is NOT present in database row.');

  // 7b. Ensure AES-256-GCM format: <12-byte IV base64>:<16-byte Tag base64>:<Ciphertext base64>
  const parts = storedToken.split(':');
  if (parts.length !== 3) {
    throw new Error('CIPHERTEXT FORMAT INVALID: Expected 3 parts (<iv>:<tag>:<ciphertext>)');
  }
  const [ivB64, tagB64, cipherB64] = parts;
  const ivBuf = Buffer.from(ivB64, 'base64');
  const tagBuf = Buffer.from(tagB64, 'base64');
  const cipherBuf = Buffer.from(cipherB64, 'base64');

  if (ivBuf.length !== 12) throw new Error(`Invalid IV length: ${ivBuf.length} (expected 12 bytes)`);
  if (tagBuf.length !== 16) throw new Error(`Invalid Auth Tag length: ${tagBuf.length} (expected 16 bytes)`);
  if (cipherBuf.length === 0) throw new Error('Ciphertext buffer is empty');

  console.log(`   ✔ AES-256-GCM FORMAT VALID: IV=${ivBuf.length}B, Tag=${tagBuf.length}B, Cipher=${cipherBuf.length}B.`);

  // 7c. Authenticated Decryption
  const decrypted = decryptSecret(storedToken);
  if (decrypted !== rawSecretRefreshToken) {
    throw new Error(`Decrypted secret mismatch! Expected: ${rawSecretRefreshToken}, got: ${decrypted}`);
  }
  console.log('   ✔ DECRYPTION VERIFIED: AES-256-GCM decrypted secret matches original plaintext.');

  // 7d. Tamper Resistance: Authenticated Tag Check
  let tamperDetected = false;
  try {
    const tamperedTag = Buffer.from(tagB64, 'base64');
    tamperedTag[0] ^= 0xff; // Flip bits in authentication tag
    const tamperedSerialized = [ivB64, tamperedTag.toString('base64'), cipherB64].join(':');
    decryptSecret(tamperedSerialized);
  } catch {
    tamperDetected = true;
  }
  if (!tamperDetected) {
    throw new Error('SECURITY FAILURE: AES-256-GCM accepted tampered authentication tag!');
  }
  console.log('   ✔ TAMPER RESISTANCE: Tampered authentication tag rejected by GCM decipher.');

  // ------------------------------------------------------------------------
  // 8. Verify Token Scrubber / Redaction Utility
  // ------------------------------------------------------------------------
  console.log('\n8. Verifying Token Scrubber / Redaction Utility against Log Leaks...');

  const sampleLogMessage =
    `OAuth Success: RefreshToken=1//0gMockRefreshTokenForTenantB_123456789 ` +
    `AccessToken=ya29.a0AfH6SMDIx1234567890abcdef ` +
    `ApprovalLink=https://myapp.com/approve/abc123DEF456ghi789JKL012mno345PQR678stu901vwx ` +
    `ResendKey=re_123456789abcdefABCDEF ` +
    `Telegram=123456789:ABCdefGHIjklMNOpqrSTUvwxYZ123456789`;

  const scrubbedLog = scrubString(sampleLogMessage);

  if (
    scrubbedLog.includes('1//0g') ||
    scrubbedLog.includes('ya29.') ||
    scrubbedLog.includes('re_1234') ||
    scrubbedLog.includes('ABCdefGHIjklMNOpqrSTUvwxYZ')
  ) {
    throw new Error(`Token scrubber leaked secrets into log string! Got:\n${scrubbedLog}`);
  }
  console.log('   ✔ STRING SCRUBBER: Redacted all OAuth, access, approval, and provider tokens from string.');

  const sampleObject = {
    businessId: '12345',
    refresh_token: '1//0gSecretRefreshToken',
    access_token: 'ya29.SecretAccessToken',
    nested: {
      encrypted_refresh_token: encryptedRefreshToken,
      apiKey: 'sk-ant-1234567890abcdef123456',
    },
    safeField: 'This is public safe text',
  };

  const scrubbedObj = scrubObject(sampleObject);
  if (
    scrubbedObj.refresh_token !== '[REDACTED]' ||
    scrubbedObj.access_token !== '[REDACTED]' ||
    scrubbedObj.nested.encrypted_refresh_token !== '[REDACTED]' ||
    scrubbedObj.nested.apiKey !== '[REDACTED]' ||
    scrubbedObj.safeField !== 'This is public safe text'
  ) {
    throw new Error(`Object scrubber failed! Got: ${JSON.stringify(scrubbedObj)}`);
  }
  console.log('   ✔ OBJECT SCRUBBER: Deeply masked sensitive object keys and ciphertexts.');

  // ------------------------------------------------------------------------
  // Cleanup Test Tenants (Idempotent cleanup)
  // ------------------------------------------------------------------------
  console.log('\n9. Cleaning up test tenants...');
  await supabaseAdmin.from('drafts').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('reviews').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('brand_profiles').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('google_connections').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('locations').delete().eq('business_id', bBizId);
  await supabaseAdmin.from('businesses').delete().eq('id', bBizId);
  await supabaseAdmin.from('businesses').delete().eq('id', aBizId);
  console.log('   OK: Cleaned up test records.');

  console.log('\n========================================================================');
  console.log('MULTI-TENANT RLS ISOLATION & TOKEN ENCRYPTION VERIFIED SUCCESSFULLY!');
  console.log('========================================================================');
}

main().catch((err) => {
  console.error('\n❌ RLS & Encryption Verification Failed:', err);
  process.exit(1);
});
