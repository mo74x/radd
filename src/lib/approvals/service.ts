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

  // 3. Atomically claim the pending draft with 'posting' status before calling Google API
  const nextAttempt = (ctx.draft.attempts || 0) + 1;
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from('drafts')
    .update({
      status: 'posting',
      final_body: finalReply,
      decided_at: now,
      posting_started_at: now,
      attempts: nextAttempt,
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
        google_reply_posted_at: postedAt,
        last_error: null,
        next_retry_at: null,
      })
      .eq('id', ctx.draft.id);

    return {
      status: 'posted',
      finalBody: finalReply,
      postedAt,
    };
  } catch (err: any) {
    const nextRetryAt = computeNextRetryAt(nextAttempt);
    await supabaseAdmin
      .from('drafts')
      .update({
        status: 'failed',
        last_error: err.message,
        next_retry_at: nextRetryAt,
      })
      .eq('id', ctx.draft.id);

    throw new Error(`Failed posting reply to Google: ${err.message}`);
  }
}

/**
 * Computes next retry timestamp using exponential backoff with randomized jitter.
 */
export function computeNextRetryAt(attemptNumber: number): string {
  const baseSeconds = Math.min(3600, 30 * Math.pow(2, Math.max(0, attemptNumber - 1)));
  const jitterSeconds = Math.floor(Math.random() * 15);
  const totalMs = (baseSeconds + jitterSeconds) * 1000;
  return new Date(Date.now() + totalMs).toISOString();
}

export interface RetryWorkerSummary {
  checked: number;
  recoveredStuck: number;
  retriedFailed: number;
  succeeded: number;
  failedAgain: number;
  exhausted: number;
}

/**
 * Recovers crashed/stuck 'posting' drafts (> 5 min) and retries 'failed' drafts whose backoff has expired.
 */
export async function processFailedAndStuckDrafts(
  maxRetries = 5
): Promise<RetryWorkerSummary> {
  const now = new Date();
  const nowIso = now.toISOString();
  const stuckThresholdIso = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

  const summary: RetryWorkerSummary = {
    checked: 0,
    recoveredStuck: 0,
    retriedFailed: 0,
    succeeded: 0,
    failedAgain: 0,
    exhausted: 0,
  };

  // 1. Fetch failed drafts eligible for retry + drafts stuck in posting
  const [failedRes, stuckRes] = await Promise.all([
    supabaseAdmin
      .from('drafts')
      .select('*')
      .eq('status', 'failed')
      .lt('attempts', maxRetries)
      .or(`next_retry_at.lte.${nowIso},next_retry_at.is.null`),
    supabaseAdmin
      .from('drafts')
      .select('*')
      .eq('status', 'posting')
      .lt('posting_started_at', stuckThresholdIso),
  ]);

  const eligibleDrafts: DraftRow[] = [
    ...(failedRes.data || []),
    ...(stuckRes.data || []),
  ];

  summary.checked = eligibleDrafts.length;

  for (const draft of eligibleDrafts) {
    const isStuck = draft.status === 'posting';
    if (isStuck) summary.recoveredStuck++;
    else summary.retriedFailed++;

    // Atomic claim for retry
    const claimTime = new Date().toISOString();
    const nextAttempt = (draft.attempts || 0) + 1;

    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from('drafts')
      .update({
        status: 'posting',
        attempts: nextAttempt,
        posting_started_at: claimTime,
      })
      .eq('id', draft.id)
      .eq('status', draft.status)
      .select('*')
      .maybeSingle<DraftRow>();

    if (claimErr || !claimed) {
      continue;
    }

    // Fetch review & location details needed to post reply
    const { data: review } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .eq('id', draft.review_id)
      .single<ReviewRow>();

    if (!review) {
      await supabaseAdmin
        .from('drafts')
        .update({
          status: 'failed',
          last_error: 'Associated review not found',
        })
        .eq('id', draft.id);
      summary.failedAgain++;
      continue;
    }

    const { data: location } = await supabaseAdmin
      .from('locations')
      .select('*')
      .eq('id', review.location_id)
      .single<LocationRow>();

    if (!location) {
      await supabaseAdmin
        .from('drafts')
        .update({
          status: 'failed',
          last_error: 'Associated location not found',
        })
        .eq('id', draft.id);
      summary.failedAgain++;
      continue;
    }

    const replyText = draft.final_body || draft.body;

    try {
      await googleGBP.postReply(
        draft.business_id,
        location.google_account_id,
        location.google_location_id,
        review.google_review_id,
        replyText
      );

      const postedAt = new Date().toISOString();
      await supabaseAdmin
        .from('drafts')
        .update({
          status: 'posted',
          posted_at: postedAt,
          google_reply_posted_at: postedAt,
          last_error: null,
          next_retry_at: null,
        })
        .eq('id', draft.id);

      summary.succeeded++;
    } catch (err: any) {
      const isExhausted = nextAttempt >= maxRetries;
      const nextRetry = isExhausted ? null : computeNextRetryAt(nextAttempt);

      await supabaseAdmin
        .from('drafts')
        .update({
          status: 'failed',
          last_error: err.message,
          next_retry_at: nextRetry,
        })
        .eq('id', draft.id);

      if (isExhausted) summary.exhausted++;
      else summary.failedAgain++;
    }
  }

  return summary;
}