/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateApprovalToken, hashApprovalToken } from '@/lib/crypto/tokens';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { googleGBP } from '@/lib/google/client';
import { sendOwnerNotification } from '@/lib/notifications/dispatcher';
import { validateDraftReply } from '@/lib/ai/validator';
import {
  BusinessRow,
  DraftRow,
  LocationRow,
  ReviewRow,
} from '@/types/database';

export type ApprovalAction = 'approve' | 'edit' | 'skip';

export class ConfirmationRequiredError extends Error {
  warnings: string[];
  constructor(warnings: string[]) {
    super(`Restricted phrasing detected: ${warnings.join('; ')}`);
    this.name = 'ConfirmationRequiredError';
    this.warnings = warnings;
  }
}

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

  const expiresAtValue = draft.expires_at || draft.token_expires_at;
  const isExpired = Boolean(
    draft.status === 'expired' ||
      (expiresAtValue && new Date(expiresAtValue).getTime() <= Date.now())
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
  confirmWarnings?: boolean;
}): Promise<{
  status: DraftRow['status'];
  finalBody: string | null;
  postedAt: string | null;
  warnings?: string[];
}> {
  const { rawToken, action, editedBody, confirmWarnings = false } = params;
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
    throw new Error('Reply text cannot be empty (must be at least 5 characters).');
  }

  // 2b. Safety validation for Owner Edits (warning mode)
  let ownerWarnings: string[] = [];
  if (action === 'edit') {
    const validation = validateDraftReply({
      draftText: finalReply,
      location: ctx.location,
      isOwnerEdit: true,
    });

    if (!validation.valid) {
      throw new Error(`Cannot post reply: ${validation.reasons.join(', ')}`);
    }

    if (validation.warnings.length > 0) {
      ownerWarnings = validation.warnings;
      if (!confirmWarnings) {
        throw new ConfirmationRequiredError(validation.warnings);
      }
    }
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
      warnings: ownerWarnings.length > 0 ? ownerWarnings : undefined,
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

export class RateLimitError extends Error {
  constructor(message: string, public retryAfterSeconds?: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export function maskNotificationTarget(
  target: string | null | undefined,
  channel: string
): string {
  if (!target) return `Registered ${channel}`;
  if (channel === 'email' && target.includes('@')) {
    const [user, domain] = target.split('@');
    if (user.length <= 2) return `${user[0]}***@${domain}`;
    return `${user[0]}***${user[user.length - 1]}@${domain}`;
  }
  if (channel === 'telegram') {
    if (target.length <= 4) return `Telegram (***)`;
    return `Telegram (***${target.slice(-3)})`;
  }
  return target.length > 4 ? `***${target.slice(-4)}` : '***';
}

export interface RenewalResult {
  ok: boolean;
  channel: string;
  targetMasked: string;
  expiresAt: string;
  renewalCount: number;
}

/**
 * Renews an approval token for a draft:
 * 1. Verifies draft exists and is not already finalized.
 * 2. Enforces per-draft rate limits (cooldown + max renewal threshold).
 * 3. Generates a fresh 256-bit token + SHA-256 hash.
 * 4. Atomically replaces the old token hash and sets fresh 72h expires_at.
 * 5. Dispatches new link strictly to owner notification channel (never exposed in response).
 */
export async function renewApprovalToken(
  rawToken: string
): Promise<RenewalResult> {
  const tokenHash = hashApprovalToken(rawToken);

  const { data: draft, error: draftErr } = await supabaseAdmin
    .from('drafts')
    .select('*')
    .eq('approval_token_hash', tokenHash)
    .maybeSingle<DraftRow>();

  if (draftErr || !draft) {
    throw new Error('Invalid or non-existent approval link.');
  }

  // Reject renewal if draft is already in a terminal state
  if (draft.status !== 'pending' && draft.status !== 'expired') {
    throw new Error(
      `This review draft has already been processed (status: ${draft.status}) and cannot be renewed.`
    );
  }

  // Rate Limiting Check: 60s cooldown per draft
  const COOLDOWN_SECONDS = 60;
  if (draft.last_renewed_at) {
    const elapsedMs = Date.now() - new Date(draft.last_renewed_at).getTime();
    const cooldownMs = COOLDOWN_SECONDS * 1000;
    if (elapsedMs < cooldownMs) {
      const remainingSeconds = Math.ceil((cooldownMs - elapsedMs) / 1000);
      throw new RateLimitError(
        `Please wait ${remainingSeconds}s before requesting another renewal link.`,
        remainingSeconds
      );
    }
  }

  // Maximum renewals guard (max 10 renewals per draft to mitigate spamming)
  const MAX_RENEWALS = 10;
  if ((draft.renewal_count || 0) >= MAX_RENEWALS) {
    throw new RateLimitError(
      'Maximum renewal attempts reached for this review. Please check your dashboard or contact support.'
    );
  }

  // Generate fresh 256-bit random token + SHA-256 hash + fresh 72h expiry
  const { rawToken: newRawToken, tokenHash: newTokenHash, expiresAt: newExpiresAt } =
    generateApprovalToken(72);

  const nowIso = new Date().toISOString();
  const nextRenewalCount = (draft.renewal_count || 0) + 1;

  // Invalidate old token hash atomically and update expiry
  const { data: updatedDraft, error: updErr } = await supabaseAdmin
    .from('drafts')
    .update({
      approval_token_hash: newTokenHash,
      expires_at: newExpiresAt,
      token_expires_at: newExpiresAt,
      status: 'pending',
      last_renewed_at: nowIso,
      renewal_count: nextRenewalCount,
    })
    .eq('id', draft.id)
    .eq('approval_token_hash', tokenHash) // atomic condition ensures single renewal winner
    .select('*')
    .single<DraftRow>();

  if (updErr || !updatedDraft) {
    throw new Error('Failed to renew approval link or link was concurrently renewed.');
  }

  // Fetch associated records for owner notification
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

  if (!revRes.data || !bizRes.data) {
    throw new Error('Associated review or business record not found.');
  }

  const { data: location } = await supabaseAdmin
    .from('locations')
    .select('*')
    .eq('id', revRes.data.location_id)
    .single<LocationRow>();

  if (!location) {
    throw new Error('Associated location record not found.');
  }

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const newApprovalUrl = `${appBaseUrl}/approve/${newRawToken}`;

  // Dispatch strictly to owner registered channel (never returned in HTTP response)
  await sendOwnerNotification({
    business: bizRes.data,
    location,
    review: revRes.data,
    draft: updatedDraft,
    approvalUrl: newApprovalUrl,
    isRenewal: true,
  });

  return {
    ok: true,
    channel: bizRes.data.notification_channel,
    targetMasked: maskNotificationTarget(
      bizRes.data.notification_target,
      bizRes.data.notification_channel
    ),
    expiresAt: newExpiresAt,
    renewalCount: nextRenewalCount,
  };
}