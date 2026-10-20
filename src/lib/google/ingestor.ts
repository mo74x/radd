/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import crypto from 'node:crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { googleGBP, GoogleAuthRevokedError } from '@/lib/google/client';
import { processReviewAndCreateDraft } from '@/lib/ai/pipeline';
import { sendOwnerNotification } from '@/lib/notifications/dispatcher';
import { BusinessRow, LocationRow, ReviewRow } from '@/types/database';

export interface PollSummary {
  locationsPolled: number;
  locationsSkippedDueToLock: number;
  newReviewsInserted: number;
  draftsCreated: number;
  notificationsSent: number;
  newReviewIds: string[];
  errors: { locationId: string; error: string }[];
}

/**
 * Atomically acquires a 5-minute lease lock on a location to prevent concurrent polling races.
 * Executes:
 * update locations
 * set poll_lock_until = now() + interval '5 minutes', poll_lock_token = $token
 * where id = $locationId and (poll_lock_until is null or poll_lock_until < now())
 * returning id;
 */
export async function acquireLocationPollLease(
  locationId: string,
  lockToken: string
): Promise<boolean> {
  const { data: rpcAcquired, error: rpcErr } = await supabaseAdmin.rpc(
    'acquire_location_poll_lease',
    { loc_id: locationId, lock_token: lockToken }
  );

  if (!rpcErr && typeof rpcAcquired === 'boolean') {
    return rpcAcquired;
  }

  // Fallback to direct query builder matching exact predicate
  const nowIso = new Date().toISOString();
  const lockUntilIso = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const { data: updated, error: updErr } = await supabaseAdmin
    .from('locations')
    .update({
      poll_lock_until: lockUntilIso,
      poll_lock_token: lockToken,
    })
    .eq('id', locationId)
    .or(`poll_lock_until.is.null,poll_lock_until.lt.${nowIso}`)
    .select('id')
    .maybeSingle();

  return !updErr && Boolean(updated?.id);
}

/**
 * Releases the polling lease upon completion.
 */
export async function releaseLocationPollLease(
  locationId: string,
  lockToken: string
): Promise<boolean> {
  const { data: rpcReleased, error: rpcErr } = await supabaseAdmin.rpc(
    'release_location_poll_lease',
    { loc_id: locationId, lock_token: lockToken }
  );

  if (!rpcErr && typeof rpcReleased === 'boolean') {
    return rpcReleased;
  }

  const { data: released, error: relErr } = await supabaseAdmin
    .from('locations')
    .update({
      poll_lock_until: null,
      poll_lock_token: null,
    })
    .eq('id', locationId)
    .eq('poll_lock_token', lockToken)
    .select('id')
    .maybeSingle();

  return !relErr && Boolean(released?.id);
}

export async function pollAllActiveLocations(batchSize = 25): Promise<PollSummary> {
  const { data: locations, error: locErr } = await supabaseAdmin
    .from('locations')
    .select(`
      *,
      businesses!inner (*)
    `)
    .eq('is_polling_enabled', true)
    .eq('businesses.status', 'active')
    .order('last_polled_at', { ascending: true, nullsFirst: true })
    .limit(batchSize);

  if (locErr) {
    throw new Error(`Failed to fetch pollable locations: ${locErr.message}`);
  }

  const summary: PollSummary = {
    locationsPolled: 0,
    locationsSkippedDueToLock: 0,
    newReviewsInserted: 0,
    draftsCreated: 0,
    notificationsSent: 0,
    newReviewIds: [],
    errors: [],
  };

  for (const loc of locations ?? []) {
    const business = (loc as any).businesses as BusinessRow;
    const lockToken = crypto.randomUUID();

    // 1. Lease Acquisition: skip location if lock cannot be acquired
    const acquired = await acquireLocationPollLease(loc.id, lockToken);
    if (!acquired) {
      summary.locationsSkippedDueToLock += 1;
      continue;
    }

    try {
      const fetchedReviews = await googleGBP.listReviews(
        loc.business_id,
        loc.google_account_id,
        loc.google_location_id
      );

      summary.locationsPolled += 1;

      const unanswered = fetchedReviews.filter((r) => !r.hasExistingReply);

      for (const rev of unanswered) {
        const { data: inserted, error: insertErr } = await supabaseAdmin
          .from('reviews')
          .upsert(
            {
              business_id: loc.business_id,
              location_id: loc.id,
              google_review_id: rev.googleReviewId,
              rating: rev.rating,
              reviewer_name: rev.reviewerName,
              text: rev.text,
              google_created_at: rev.googleCreatedAt,
              google_updated_at: rev.googleUpdatedAt,
            },
            {
              onConflict: 'location_id,google_review_id',
              ignoreDuplicates: true,
            }
          )
          .select('*')
          .maybeSingle<ReviewRow>();

        if (insertErr) {
          throw new Error(`Failed inserting review ${rev.googleReviewId}: ${insertErr.message}`);
        }

        if (inserted?.id) {
          summary.newReviewsInserted += 1;
          summary.newReviewIds.push(inserted.id);

          // Automatically run Phase 2 (Drafting) + Phase 3 (Notification)
          const pipelineOut = await processReviewAndCreateDraft(inserted.id);

          if (pipelineOut.isDuplicate) {
            // Conflict-tolerant: draft already created by concurrent worker; skip duplicate notification
            continue;
          }

          summary.draftsCreated += 1;

          const { data: updatedReview } = await supabaseAdmin
            .from('reviews')
            .select('*')
            .eq('id', inserted.id)
            .single<ReviewRow>();

          await sendOwnerNotification({
            business,
            location: loc as LocationRow,
            review: updatedReview ?? inserted,
            draft: pipelineOut.draft,
            approvalUrl: pipelineOut.approvalUrl,
          });
          summary.notificationsSent += 1;
        }
      }

      await supabaseAdmin
        .from('locations')
        .update({
          last_polled_at: new Date().toISOString(),
          last_review_update_time:
            fetchedReviews[0]?.googleUpdatedAt ?? loc.last_review_update_time,
        })
        .eq('id', loc.id);
    } catch (err: any) {
      if (err instanceof GoogleAuthRevokedError) {
        summary.errors.push({
          locationId: loc.id,
          error: 'OAuth access revoked by user — business paused',
        });
      } else {
        summary.errors.push({ locationId: loc.id, error: err.message });
      }
    } finally {
      // 2. Lease Release: always clear lock token and lock expiration on completion
      await releaseLocationPollLease(loc.id, lockToken);
    }
  }

  return summary;
}