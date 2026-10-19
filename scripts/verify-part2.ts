import { supabaseAdmin } from '../src/lib/supabase/admin';
import { connectBusinessGoogleAccount } from '../src/lib/google/onboarding';
import { pollAllActiveLocations } from '../src/lib/google/ingestor';

async function main() {
  console.log('1. Fetching seeded test business from Supabase...');
  const { data: business, error: bizErr } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('name', 'Roastery & Co. Café')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (bizErr || !business) {
    throw new Error('Could not find test business. Run verify-foundation.ts first.');
  }
  console.log(`   OK: Found Business "${business.name}" (${business.id})`);

  console.log('2. Simulating Google OAuth callback & Location discovery...');
  const locations = await connectBusinessGoogleAccount({
    businessId: business.id,
    refreshToken: '1//0gMockRefreshTokenForRoasteryMaadi',
    accessToken: 'ya29.mockAccessToken',
    expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  });
  console.log(`   OK: Encrypted OAuth token saved. Synced ${locations.length} location(s):`);
  for (const loc of locations) {
    console.log(`       -> ${loc.displayName} (${loc.googleLocationId})`);
  }

  console.log('3. Running First Poll (should insert 4 mock reviews)...');
  const firstPoll = await pollAllActiveLocations();
  console.log('   First Poll Summary:', JSON.stringify(firstPoll, null, 2));

  console.log('4. Running Second Poll Immediately (should insert 0 duplicates)...');
  const secondPoll = await pollAllActiveLocations();
  console.log('   Second Poll Summary:', JSON.stringify(secondPoll, null, 2));

  if (secondPoll.newReviewsInserted !== 0) {
    throw new Error('Deduplication check failed! Expected 0 new reviews on second poll.');
  }

  const { data: storedReviews } = await supabaseAdmin
    .from('reviews')
    .select('google_review_id, rating, reviewer_name, text')
    .eq('business_id', business.id)
    .order('created_at', { ascending: true });

  console.log(`\n5. Total stored reviews in Supabase for ${business.name}: ${storedReviews?.length}`);
  for (const r of storedReviews ?? []) {
    console.log(`   - [${r.rating}★] ${r.reviewer_name}: ${r.text ?? '(Star-only review, no text)'}`);
  }

  console.log('\nPART 2 (INGESTION & DEDUPLICATION) VERIFIED SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Part 2 Verification Failed:', err);
  process.exit(1);
});