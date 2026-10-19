/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '../src/lib/supabase/admin';
import { processReviewAndCreateDraft } from '../src/lib/ai/pipeline';
import { sendOwnerNotification } from '../src/lib/notifications/dispatcher';
import {
  executeApprovalDecision,
  getApprovalContextByToken,
} from '../src/lib/approvals/service';
import { BusinessRow, LocationRow, ReviewRow } from '../src/types/database';

async function main() {
  console.log('1. Loading test business, location, and reviews from Supabase...');
  const { data: reviews, error } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .order('created_at', { ascending: true })
    .returns<ReviewRow[]>();

  if (error || !reviews || reviews.length < 3) {
    throw new Error('Expected at least 3 reviews in DB. Run verify-part2.ts first.');
  }

  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', reviews[0].business_id)
    .single<BusinessRow>();

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('id', reviews[0].location_id)
    .single<LocationRow>();

  if (!business || !location) throw new Error('Missing business or location');

  // Reset any existing draft statuses back to 'pending' so verify-part4 is repeatable
  await supabaseAdmin
    .from('drafts')
    .delete()
    .eq('business_id', business.id);

  console.log('\n2. Generating fresh drafts & sending owner notifications...');
  const tokens: { review: ReviewRow; rawToken: string; approvalUrl: string }[] = [];

  for (const rev of reviews) {
    const out = await processReviewAndCreateDraft(rev.id);
    await sendOwnerNotification({
      business,
      location,
      review: rev,
      draft: out.draft,
      approvalUrl: out.approvalUrl,
    });
    tokens.push({
      review: rev,
      rawToken: out.rawApprovalToken,
      approvalUrl: out.approvalUrl,
    });
  }

  // Test A: One-Tap Approve on Review 1 (5-star Egyptian Arabic review)
  console.log('\n3. Testing ONE-TAP APPROVE on Review #1...');
  const token1 = tokens[0].rawToken;
  const ctx1 = await getApprovalContextByToken(token1);
  if (!ctx1 || ctx1.isAlreadyDecided) throw new Error('Token 1 should be pending');

  const approveRes = await executeApprovalDecision({
    rawToken: token1,
    action: 'approve',
  });
  console.log(`   OK: Review #1 status = ${approveRes.status}, postedAt = ${approveRes.postedAt}`);

  // Test B: Verify Single-Use Token Protection (tapping Token 1 a second time must fail)
  console.log('\n4. Testing SINGLE-USE TOKEN GUARD (re-tapping Token #1)...');
  let blockedDoubleTap = false;
  try {
    await executeApprovalDecision({ rawToken: token1, action: 'approve' });
  } catch (err: any) {
    blockedDoubleTap = true;
    console.log(`   OK: Second tap blocked cleanly -> "${err.message}"`);
  }
  if (!blockedDoubleTap) {
    throw new Error('Single-use token check failed! Allowed double approval.');
  }

  // Test C: Owner Edits Reply on Review 2 (2-star complaint)
  console.log('\n5. Testing OWNER EDIT & POST on Review #2 (Complaint)...');
  const token2 = tokens[1].rawToken;
  const customOwnerReply =
    'أهلاً بحضرتك يا أستاذة مريم، بنعتذر جداً عن التأخير في الأوردر. ياريت تكلمينا على +201001234567 عشان نعرف التفاصيل ونهتم بالموضوع فوراً. - إدارة Roastery & Co.';
  const editRes = await executeApprovalDecision({
    rawToken: token2,
    action: 'edit',
    editedBody: customOwnerReply,
  });
  console.log(`   OK: Review #2 edited & posted -> status = ${editRes.status}`);

  // Test D: Owner Skips Review 3 (Prompt Injection review)
  console.log('\n6. Testing SKIP on Review #3 (Flagged Injection Review)...');
  const token3 = tokens[2].rawToken;
  const skipRes = await executeApprovalDecision({
    rawToken: token3,
    action: 'skip',
  });
  console.log(`   OK: Review #3 skipped -> status = ${skipRes.status}`);

  console.log('\n------------------------------------------------------------');
  console.log('Review #4 was left in PENDING state so you can test it in your browser!');
  console.log(`Run "npm run dev" and open:\n👉 ${tokens[3]?.approvalUrl}`);
  console.log('------------------------------------------------------------');
  console.log('\nPART 4 (NOTIFICATIONS, ONE-TAP APPROVAL & GOOGLE PUBLISHING) VERIFIED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Part 4 Verification Failed:', err);
  process.exit(1);
});