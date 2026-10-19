/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabaseAdmin } from '@/lib/supabase/admin';
import { googleGBP, GoogleAuthRevokedError } from '@/lib/google/client';
import { processReviewAndCreateDraft } from '@/lib/ai/pipeline';
import { sendOwnerNotification } from '@/lib/notifications/dispatcher';
import { BusinessRow, LocationRow, ReviewRow } from '@/types/database';

export interface PollSummary {
  locationsPolled: number;
  newReviewsInserted: number;
  draftsCreated: number;
  notificationsSent: number;
  newReviewIds: string[];
  errors: { locationId: string; error: string }[];
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
    newReviewsInserted: 0,
    draftsCreated: 0,
    notificationsSent: 0,
    newReviewIds: [],
    errors: [],
  };

  for (const loc of locations ?? []) {
    const business = (loc as any).businesses as BusinessRow;

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
    }
  }

  return summary;
}