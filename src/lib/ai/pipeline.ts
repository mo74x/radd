import { supabaseAdmin } from '@/lib/supabase/admin';
import { generateApprovalToken } from '@/lib/crypto/tokens';
import { classifyReview } from '@/lib/ai/classifier';
import { generateReviewDraft } from '@/lib/ai/drafter';
import { validateDraftReply } from '@/lib/ai/validator';
import {
  BrandProfileRow,
  BusinessRow,
  DraftRow,
  LocationRow,
  ReviewRow,
} from '@/types/database';

export interface DraftPipelineOutput {
  reviewId: string;
  draft: DraftRow;
  rawApprovalToken: string;
  approvalUrl: string;
  classification: {
    language: string;
    flags: string[];
    requiresCarefulReview: boolean;
  };
}

export async function processReviewAndCreateDraft(
  reviewId: string
): Promise<DraftPipelineOutput> {
  // 1. Fetch the review
  const { data: review, error: revErr } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('id', reviewId)
    .single<ReviewRow>();

  if (revErr || !review) {
    throw new Error(`Review ${reviewId} not found: ${revErr?.message}`);
  }

  // Check if a pending or posted draft already exists for this review
  const { data: existingDraft } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('review_id', review.id)
    .in('status', ['pending', 'approved', 'edited', 'posted'])
    .maybeSingle<DraftRow>();

  // 2. Fetch business, location, and brand profile in parallel
  const [bizRes, locRes, brandRes] = await Promise.all([
    supabaseAdmin.from('businesses').select('*').eq('id', review.business_id).single<BusinessRow>(),
    supabaseAdmin.from('locations').select('*').eq('id', review.location_id).single<LocationRow>(),
    supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('business_id', review.business_id)
      .maybeSingle<BrandProfileRow>(),
  ]);

  if (bizRes.error || !bizRes.data) throw new Error('Business not found');
  if (locRes.error || !locRes.data) throw new Error('Location not found');

  const business = bizRes.data;
  const location = locRes.data;
  const brand: BrandProfileRow = brandRes.data ?? {
    business_id: business.id,
    tone: 'warm, polite Egyptian hospitality',
    languages: ['ar', 'en'],
    arabic_dialect: 'egyptian',
    signature: business.name,
    do_list: [],
    dont_list: [],
    example_replies: [],
    updated_at: new Date().toISOString(),
  };

  // 3. Classify review & detect safety/injection flags
  const classification = await classifyReview({
    rating: review.rating,
    reviewerName: review.reviewer_name,
    text: review.text,
  });

  // Update review row with classification metadata
  await supabaseAdmin
    .from('reviews')
    .update({
      language: classification.language,
      flags: classification.flags,
      requires_careful_review: classification.requiresCarefulReview,
    })
    .eq('id', review.id);

  // 4. Draft reply and run safety validator (with 1 automatic self-correction retry)
  let generated = await generateReviewDraft({
    businessName: business.name,
    location,
    brand,
    review,
    detectedLanguage: classification.language,
    isFlagged: classification.flags.length > 0,
  });

  let validation = validateDraftReply({
    draftText: generated.body,
    location,
  });

  if (!validation.valid) {
    generated = await generateReviewDraft({
      businessName: business.name,
      location,
      brand,
      review,
      detectedLanguage: classification.language,
      isFlagged: true,
      retryFeedback: validation.reasons,
    });
    validation = validateDraftReply({
      draftText: generated.body,
      location,
    });

    if (!validation.valid) {
      throw new Error(
        `Draft failed safety validation after retry: ${validation.reasons.join(', ')}`
      );
    }
  }

  // 5. Generate single-use magic link token and upsert the draft
  const { rawToken, tokenHash, expiresAt } = generateApprovalToken(72);

  if (existingDraft && existingDraft.status === 'pending') {
    const { data: updatedDraft, error: updErr } = await supabaseAdmin
      .from('drafts')
      .update({
        body: generated.body,
        approval_token_hash: tokenHash,
        token_expires_at: expiresAt,
        expires_at: expiresAt,
        model: generated.model,
        prompt_version: generated.promptVersion,
      })
      .eq('id', existingDraft.id)
      .select('*')
      .single<DraftRow>();

    if (updErr || !updatedDraft) throw new Error(`Failed updating draft: ${updErr?.message}`);

    return {
      reviewId: review.id,
      draft: updatedDraft,
      rawApprovalToken: rawToken,
      approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/approve/${rawToken}`,
      classification,
    };
  }

  const { data: insertedDraft, error: draftErr } = await supabaseAdmin
    .from('drafts')
    .insert({
      business_id: business.id,
      review_id: review.id,
      body: generated.body,
      status: 'pending',
      approval_token_hash: tokenHash,
      token_expires_at: expiresAt,
      expires_at: expiresAt,
      model: generated.model,
      prompt_version: generated.promptVersion,
    })
    .select('*')
    .single<DraftRow>();

  if (draftErr || !insertedDraft) {
    throw new Error(`Failed inserting draft: ${draftErr?.message}`);
  }

  return {
    reviewId: review.id,
    draft: insertedDraft,
    rawApprovalToken: rawToken,
    approvalUrl: `${process.env.NEXT_PUBLIC_APP_URL}/approve/${rawToken}`,
    classification,
  };
}