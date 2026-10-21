'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { ReviewWithRelations } from '../review-helpers';
import { ReviewDetailContent } from '../ReviewDetailContent';

export interface ReviewDetailPageClientProps {
  review: ReviewWithRelations;
  backHref?: string;
}

export const ReviewDetailPageClient: React.FC<ReviewDetailPageClientProps> = ({
  review,
  backHref = '/dashboard/reviews',
}) => {
  const { locale, isRtl } = useI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Top Back Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref}>
          <Button
            variant="outline"
            size="sm"
            startIcon={<Icon icon={isRtl ? ArrowRight : ArrowLeft} size={16} />}
          >
            {locale === 'ar' ? 'العودة إلى قائمة التقييمات' : 'Back to Reviews'}
          </Button>
        </Link>

        <span className="text-xs font-mono text-text-muted">
          ID: {review.id.slice(0, 8)}
        </span>
      </div>

      {/* Shared Review Detail Body */}
      <ReviewDetailContent review={review} />
    </div>
  );
};
