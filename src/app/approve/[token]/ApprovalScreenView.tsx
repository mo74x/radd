'use client';

import React from 'react';
import Link from 'next/link';
import { Link2Off, ArrowUpRight, MapPin } from 'lucide-react';
import {
  Avatar,
  Card,
  Icon,
  LanguageToggle,
  Logo,
  StarRating,
  ThemeToggle,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import ApprovalActions, { ApprovalOutcomeCard } from './ApprovalActions';
import ExpiredApprovalCard from './ExpiredApprovalCard';
import type { DraftStatus, ReviewFlag } from '@/types/database';

export interface ApprovalScreenData {
  token: string;
  businessName: string;
  locationName: string;
  reviewerName: string | null;
  rating: number;
  reviewText: string | null;
  requiresCarefulReview: boolean;
  flags: ReviewFlag[];
  draftBody: string;
  draftStatus: DraftStatus;
  finalBody: string | null;
  attempts: number;
  isExpired: boolean;
  isAlreadyDecided: boolean;
  initialEditing?: boolean;
}

function ApprovalTopBar() {
  return (
    <header className="w-full flex items-center justify-between gap-2 pb-3">
      <Logo variant="lockup" size="sm" />
      <div className="flex items-center gap-1.5">
        <LanguageToggle variant="compact" />
        <ThemeToggle variant="icon" className="min-h-[40px] min-w-[40px]" />
      </div>
    </header>
  );
}

export function InvalidApprovalLinkView() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-background text-text px-3.5 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-[420px] space-y-4">
        <ApprovalTopBar />

        <Card
          data-testid="approval-state-invalid"
          className="p-6 text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-danger-surface text-danger dark:bg-danger-surface/30">
            <Icon icon={Link2Off} size={22} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-extrabold text-text">
              {t('approval.invalidLinkTitle')}
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              {t('approval.invalidLinkDesc')}
            </p>
          </div>

          <div className="pt-1">
            <Link
              href="/dashboard"
              className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-raised transition-colors"
            >
              <span>{t('approval.goToDashboard')}</span>
              <Icon icon={ArrowUpRight} size={16} directional />
            </Link>
          </div>
        </Card>
      </div>
    </main>
  );
}

export default function ApprovalScreenView({
  data,
}: {
  data: ApprovalScreenData;
}) {
  const { t } = useI18n();
  const displayReviewer = data.reviewerName?.trim() || t('approval.customerFallback');

  return (
    <main className="min-h-screen bg-background text-text px-3.5 py-4 sm:py-8">
      <div className="mx-auto w-full max-w-[420px] flex flex-col gap-4">
        {/* 0. Minimal Header: Small Radd logo + compact Language & Theme toggles */}
        <ApprovalTopBar />

        {/* 1. Business & Location Name + 2. Star Rating + 3. Reviewer Name + 4. Review Text */}
        <Card className="p-4 sm:p-5 space-y-3.5">
          {/* 1. Business and location name */}
          <div className="border-b border-border-muted pb-3 text-start">
            <p
              dir="auto"
              className="text-xs font-bold uppercase tracking-wider text-primary truncate"
            >
              {data.businessName}
            </p>
            <div className="mt-0.5 flex items-center gap-1.5 text-text">
              <Icon
                icon={MapPin}
                size={15}
                className="text-text-muted shrink-0"
              />
              <h1
                dir="auto"
                className="text-base sm:text-lg font-extrabold tracking-tight text-text leading-snug"
              >
                {data.locationName}
              </h1>
            </div>
          </div>

          {/* 2. Star rating (unmirrored in RTL, Western digits) */}
          <div className="flex items-center justify-between gap-2">
            <StarRating value={data.rating} size="md" showScore />
          </div>

          {/* 3. Reviewer name */}
          <div className="flex items-center gap-2.5">
            <Avatar name={displayReviewer} size="sm" />
            <span
              dir="auto"
              className="text-sm sm:text-base font-bold text-text leading-tight"
            >
              {displayReviewer}
            </span>
          </div>

          {/* 4. Review text (bidi-safe, auto direction, readable size) */}
          <div className="rounded-xl bg-surface-raised border border-border-muted p-3.5 text-start">
            {data.reviewText && data.reviewText.trim().length > 0 ? (
              <p
                dir="auto"
                className="whitespace-pre-wrap text-base text-text leading-relaxed"
              >
                {data.reviewText}
              </p>
            ) : (
              <p className="text-sm italic text-text-muted">
                {t('approval.starOnlyReview')}
              </p>
            )}
          </div>
        </Card>

        {/* 5. Draft Status / Suggested Reply / Actions */}
        {data.draftStatus === 'posting' ? (
          <ApprovalOutcomeCard
            status="posting"
            finalBody={data.finalBody}
            attempts={data.attempts}
          />
        ) : data.draftStatus === 'posted' ? (
          <ApprovalOutcomeCard
            status="posted"
            finalBody={data.finalBody}
            attempts={data.attempts}
          />
        ) : data.draftStatus === 'failed' ? (
          <ApprovalOutcomeCard
            status="failed"
            finalBody={data.finalBody}
            attempts={data.attempts}
          />
        ) : data.draftStatus === 'skipped' ? (
          <ApprovalOutcomeCard status="skipped" />
        ) : data.isAlreadyDecided ? (
          <ApprovalOutcomeCard
            status="used"
            finalBody={data.finalBody}
          />
        ) : data.isExpired ? (
          <ExpiredApprovalCard token={data.token} />
        ) : (
          <ApprovalActions
            token={data.token}
            initialDraftBody={data.draftBody}
            requiresCarefulReview={data.requiresCarefulReview}
            flags={data.flags}
            initialEditing={data.initialEditing}
          />
        )}
      </div>
    </main>
  );
}
