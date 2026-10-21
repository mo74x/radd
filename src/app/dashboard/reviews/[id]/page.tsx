import React from 'react';
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Button, EmptyState } from '@/components/ui';
import { ReviewWithRelations } from '../review-helpers';
import { ReviewDetailPageClient } from './ReviewDetailPageClient';

interface ReviewDetailPageProps {
  params: Promise<{ id: string }>;
}

const SAFE_DRAFT_COLUMNS = `
  id,
  business_id,
  review_id,
  body,
  status,
  final_body,
  token_expires_at,
  expires_at,
  last_renewed_at,
  renewal_count,
  decided_at,
  posted_at,
  last_error,
  attempts,
  posting_started_at,
  next_retry_at,
  google_reply_posted_at,
  model,
  prompt_version,
  created_at
`;

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { id } = await params;

  const { data: review } = await supabaseAdmin
    .from('reviews')
    .select(
      `
      *,
      locations ( id, display_name, contact_phone, contact_email, signature_override ),
      drafts ( ${SAFE_DRAFT_COLUMNS} )
    `
    )
    .eq('id', id)
    .maybeSingle<ReviewWithRelations>();

  if (!review) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4">
        <EmptyState
          title="Review Not Found (التقييم غير موجود)"
          description="The requested review could not be found or may have been removed."
          action={
            <Link href="/dashboard/reviews">
              <Button variant="primary" size="sm">
                Back to Reviews
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return <ReviewDetailPageClient review={review} />;
}
