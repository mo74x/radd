/* eslint-disable @typescript-eslint/no-explicit-any */
import { hashApprovalToken } from '@/lib/crypto/tokens';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { googleGBP } from '@/lib/google/client';
import {
  BusinessRow,
  DraftRow,
  LocationRow,
  ReviewRow,
} from '@/types/database';

export type ApprovalAction = 'approve' | 'edit' | 'skip';

export interface ApprovalContext {
  draft: DraftRow;
  review: ReviewRow;
  location: LocationRow;
  business: BusinessRow;
  isExpired: boolean;
  isAlreadyDecided: boolean;
}

export async function getApprovalContextByToken(
  rawToken: string
): Promise<ApprovalContext | null> {
  const tokenHash = hashApprovalToken(rawToken);

  const { data: draft, error: draftErr } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('approval_token_hash', tokenHash)
    .maybeSingle<DraftRow>();

  if (draftErr || !draft) return null;

  const [revRes, bizRes] = await Promise.all([
    supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', draft.review_id)
      .single<ReviewRow>(),
    supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', draft.business_id)
      .single<BusinessRow>(),
  ]);

  if (revRes.error || !revRes.data || bizRes.error || !bizRes.data) {
    return null;
  }

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('id', revRes.data.location_id)
    .single<LocationRow>();

  if (!location) return null;

  const isExpired = Boolean(
    draft.token_expires_at &&
      new Date(draft.token_expires_at).getTime() < Date.now()
  );

  const isAlreadyDecided = draft.status !== 'pending';

  return {
    draft,
    review: revRes.data,
    location,
    business: bizRes.data,
    isExpired,
    isAlreadyDecided,
  };
}

export async function executeApprovalDecision(params: {
  rawToken: string;
  action: ApprovalAction;
  editedBody?: string;
}): Promise<{
  status: DraftRow['status'];
  finalBody: string | null;
  postedAt: string | null;
}> {
  const { rawToken, action, editedBody } = params;
  const ctx = await getApprovalContextByToken(rawToken);

  if (!ctx) {
    throw new Error('Invalid approval link.');
  }

  if (ctx.isAlreadyDecided) {
    throw new Error(
      `This review draft has already been processed (status: ${ctx.draft.status}).`
    );
  }

  if (ctx.isExpired) {
    throw new Error('This approval link has expired.');
  }

  const now = new Date().toISOString();

  // 1. Handle Skip
  if (action === 'skip') {
    const { data: skipped, error: skipErr } = await supabaseAdmin
      .from('drafts')
      .update({
        status: 'skipped',
        decided_at: now,
      })
      .eq('id', ctx.draft.id)
      .eq('status', 'pending') // Single-use atomic guard
      .select('*')
      .maybeSingle<DraftRow>();

    if (skipErr || !skipped) {
      throw new Error('Draft was already processed by another request.');
    }

    return {
      status: 'skipped',
      finalBody: null,
      postedAt: null,
    };
  }

  // 2. Determine final reply text for Approve or Edit
  const finalReply =
    action === 'edit' ? (editedBody ?? '').trim() : ctx.draft.body.trim();

  if (finalReply.length < 5) {
    throw new Error('Reply text cannot be empty.');
  }

  // 3. Atomically claim the pending draft before calling external Google API
  const intermediateStatus = action === 'edit' ? 'edited' : 'approved';
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('drafts')
    .update({
      status: intermediateStatus,
      final_body: finalReply,
      decided_at: now,
    })
    .eq('id', ctx.draft.id)
    .eq('status', 'pending')
    .select('*')
    .maybeSingle<DraftRow>();

  if (claimErr || !claimed) {
    throw new Error('Draft was already processed by another tap.');
  }

  // 4. Publish reply to Google Business Profile
  try {
    await googleGBP.postReply(
      ctx.business.id,
      ctx.location.google_account_id,
      ctx.location.google_location_id,
      ctx.review.google_review_id,
      finalReply
    );

    const postedAt = new Date().toISOString();
    await supabaseAdmin
      .from('drafts')
      .update({
        status: 'posted',
        posted_at: postedAt,
        last_error: null,
      })
      .eq('id', ctx.draft.id);

    return {
      status: 'posted',
      finalBody: finalReply,
      postedAt,
    };
  } catch (err: any) {
    await supabaseAdmin
      .from('drafts')
      .update({
        status: 'failed',
        last_error: err.message,
      })
      .eq('id', ctx.draft.id);

    throw new Error(`Failed posting reply to Google: ${err.message}`);
  }
}