/* eslint-disable react-hooks/purity */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  Clock,
  Send,
  MapPin,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Icon,
  InlineBanner,
  StarRating,
  StatCard,
} from '@/components/ui';
import PollNowButton from './PollNowButton';
import LocationSelector from './LocationSelector';
import { ReviewActionModal, ReviewItemData } from './ReviewActionModal';

export interface DashboardClientViewProps {
  business: {
    id: string;
    name: string;
    plan: string;
    status: string;
    notification_channel: string;
    notification_target: string;
  };
  googleConn: {
    status?: string;
    google_email?: string | null;
    last_error?: string | null;
    updated_at?: string;
  } | null;
  locations: any[];
  brand: any;
  allReviews: any[];
  rawReviewsCount: number;
  selectedLocationId?: string;
  stats: {
    totalReviews: number;
    postedCount: number;
    approvedWithoutEditCount: number;
    editedCount: number;
    pendingCount: number;
    shareAnsweredPct: number;
    approvedWithoutEditPct: number;
  };
}

export function DashboardClientView({
  business,
  googleConn,
  locations,
  brand,
  allReviews,
  rawReviewsCount,
  selectedLocationId,
  stats,
}: DashboardClientViewProps) {
  const [activeModalReview, setActiveModalReview] = useState<ReviewItemData | null>(null);

  const isRevoked =
    business.status === 'revoked' ||
    googleConn?.status === 'revoked' ||
    (googleConn?.status === 'error' && Boolean(googleConn.last_error?.includes('revoked')));

  // Filter reviews that need attention: status === 'pending' OR has flags OR failed
  const attentionReviews = allReviews.filter((r) => {
    const draft = Array.isArray(r.drafts) ? r.drafts[0] : r.drafts;
    const isPending = draft?.status === 'pending';
    const isFailed = draft?.status === 'failed';
    const hasFlags = Array.isArray(r.flags) && r.flags.length > 0;
    return isPending || isFailed || hasFlags;
  });

  // Format relative timestamp helper
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  // Helper for detected language label
  const getLanguageLabel = (lang?: string) => {
    if (!lang) return 'Auto';
    const l = lang.toLowerCase();
    if (l === 'ar' || l.includes('arabic')) return 'العربية (ar)';
    if (l === 'en' || l.includes('english')) return 'English (en)';
    if (l === 'mixed') return 'Mixed (ar/en)';
    return lang.toUpperCase();
  };

  // Status badge styling helper
  const renderStatusBadge = (status?: string, attempts?: number) => {
    if (!status) return null;

    if (status === 'posted' || status === 'approved') {
      return (
        <Badge variant="success" dot size="sm">
          {status === 'posted' ? 'Published' : 'Approved'}
        </Badge>
      );
    }
    if (status === 'posting') {
      return (
        <Badge variant="accent" dot size="sm" className="animate-pulse">
          Publishing...
        </Badge>
      );
    }
    if (status === 'pending') {
      return (
        <Badge variant="warning" dot size="sm">
          Pending Approval
        </Badge>
      );
    }
    if (status === 'failed') {
      return (
        <Badge variant="danger" dot size="sm">
          {(attempts || 0) < 5 ? `Failed (Retry ${attempts || 1}/5)` : 'Failed'}
        </Badge>
      );
    }
    if (status === 'edited') {
      return (
        <Badge variant="default" dot size="sm">
          Edited by Owner
        </Badge>
      );
    }
    return (
      <Badge variant="neutral" size="sm">
        {status}
      </Badge>
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 select-none">
      {/* 1. Header Section */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
              {business.name}
            </h1>
            <Badge variant="accent" size="sm">
              {business.plan.toUpperCase()}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-text-muted">
            {googleConn?.updated_at ? (
              <span>Last synced with Google {formatTimeAgo(googleConn.updated_at)}</span>
            ) : (
              <span>Connected to Google Business Profile</span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/onboarding">
            <Button variant="outline" size="sm">
              Voice & Settings
            </Button>
          </Link>
          <PollNowButton isRevoked={isRevoked} />
        </div>
      </section>

      {/* Reconnection Alert Banner if Revoked */}
      {isRevoked && (
        <InlineBanner
          variant="danger"
          title="Google Business Profile Disconnected (تم إلغاء ربط حساب Google)"
        >
          <div className="space-y-2 mt-1">
            <p className="text-sm">
              Google OAuth authorization has expired or was revoked. Automated review polling and reply publishing are paused.
            </p>
            {googleConn?.last_error && (
              <p className="font-mono text-xs opacity-90">
                Reason: {googleConn.last_error}
              </p>
            )}
            <div className="pt-1 flex gap-2">
              <Link
                href={`/api/google/oauth/connect?businessId=${business.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-danger text-white text-xs font-bold shadow-xs hover:opacity-90"
              >
                <span>Reconnect Google Account</span>
                <Icon icon={ExternalLink} size={14} />
              </Link>
            </div>
          </div>
        </InlineBanner>
      )}

      {/* 2. KPI StatCards Row (4 Metrics) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Reviews Answered */}
        <StatCard
          label="Reviews Answered"
          value={`${stats.shareAnsweredPct}%`}
          icon={CheckCircle2}
          helper={`${stats.postedCount} of ${stats.totalReviews} reviews replied`}
          trend={{ value: `${stats.shareAnsweredPct}%`, positive: stats.shareAnsweredPct >= 80, label: 'coverage' }}
        />

        {/* Metric 2: Zero-Edit Approval */}
        <StatCard
          label="Zero-Edit Approvals"
          value={`${stats.approvedWithoutEditPct}%`}
          icon={Sparkles}
          helper={`${stats.approvedWithoutEditCount} published without edits`}
          trend={{ value: `${stats.approvedWithoutEditPct}%`, positive: stats.approvedWithoutEditPct >= 70, label: 'quality' }}
        />

        {/* Metric 3: Pending Approval (Deep-link to attention panel) */}
        <a href="#attention-panel" className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl">
          <StatCard
            label="Pending Approval"
            value={stats.pendingCount}
            icon={Clock}
            helper="Awaiting your one-tap review"
            className={cn(
              'transition-all duration-150 hover:border-accent hover:shadow-md cursor-pointer',
              stats.pendingCount > 0 && 'border-amber-300 dark:border-amber-700/60'
            )}
            trend={
              stats.pendingCount > 0
                ? { value: `${stats.pendingCount} new`, positive: false, label: 'needs action' }
                : undefined
            }
          />
        </a>

        {/* Metric 4: Alert Channel */}
        <StatCard
          label="Alert Destination"
          value={business.notification_channel.toUpperCase()}
          icon={Send}
          helper={business.notification_target || 'Bot connected'}
        />
      </section>

      {/* Location Selector & Branch Overrides Bar */}
      <LocationSelector
        locations={locations}
        defaultBrandSignature={brand?.signature ?? null}
        totalReviewsCount={rawReviewsCount}
      />

      {/* 3. Needs Your Attention Priority Panel */}
      <section id="attention-panel" className="space-y-4">
        <div className="flex items-center justify-between text-start">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-text">
              Needs Your Attention
            </h2>
            <Badge
              variant={attentionReviews.length > 0 ? 'accent' : 'success'}
              size="sm"
            >
              {attentionReviews.length}
            </Badge>
          </div>
          <span className="text-xs text-text-muted">
            Pending confirmation & flagged reviews
          </span>
        </div>

        {attentionReviews.length === 0 ? (
          <Card className="p-6 sm:p-8 text-center bg-teal-50/40 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/60">
            <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-900/40 text-primary flex items-center justify-center mx-auto mb-3">
              <Icon icon={CheckCircle2} size={24} />
            </div>
            <h3 className="text-base font-bold text-text">
              All Caught Up! (كل التقييمات تمت مراجعتها)
            </h3>
            <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mt-1 leading-relaxed">
              No customer reviews are pending your approval or flagged for intervention. You will receive an instant one-tap alert when new feedback arrives.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {attentionReviews.map((rev: any) => {
              const draft = Array.isArray(rev.drafts) ? rev.drafts[0] : rev.drafts;
              const hasFlags = Array.isArray(rev.flags) && rev.flags.length > 0;

              return (
                <Card
                  key={`attention-${rev.id}`}
                  className="p-5 sm:p-6 border-amber-200 dark:border-amber-900/60 bg-surface shadow-xs transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-border/70">
                    <div className="flex flex-wrap items-center gap-2 text-start">
                      <span className="font-bold text-text text-base">
                        {rev.reviewer_name || 'Customer'}
                      </span>
                      <StarRating value={rev.rating} size="sm" />
                      {rev.locations?.display_name && (
                        <span className="text-xs text-text-muted flex items-center gap-1">
                          <Icon icon={MapPin} size={12} className="text-primary" />
                          <span>{rev.locations.display_name}</span>
                        </span>
                      )}
                      <span className="text-xs text-text-muted">
                        • {formatTimeAgo(rev.publish_time || rev.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {renderStatusBadge(draft?.status, draft?.attempts)}
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setActiveModalReview({
                            id: rev.id,
                            reviewer_name: rev.reviewer_name,
                            rating: rev.rating,
                            text: rev.text,
                            flags: rev.flags,
                            location_name: rev.locations?.display_name,
                            draft,
                          })
                        }
                      >
                        Review & Approve
                      </Button>
                    </div>
                  </div>

                  {/* Flag Warnings */}
                  {hasFlags && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {rev.flags.map((flag: string) => (
                        <Badge key={flag} variant="danger" size="sm">
                          <Icon icon={ShieldAlert} size={13} className="me-1" />
                          <span>Flagged: {flag}</span>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Customer Review Body */}
                  <p dir="auto" className="text-sm text-text mt-3 text-start leading-relaxed">
                    {rev.text || <span className="italic text-text-muted">(Star rating only — no comment)</span>}
                  </p>

                  {/* Proposed AI Reply Box */}
                  {draft && (
                    <div className="mt-3.5 p-3.5 rounded-xl border border-teal-200/70 dark:border-teal-900/40 bg-teal-50/40 dark:bg-teal-950/20 text-start space-y-1">
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span className="font-semibold text-primary flex items-center gap-1">
                          <Icon icon={Sparkles} size={13} />
                          <span>Proposed AI Reply (مسودة الرد):</span>
                        </span>
                        {draft.model && (
                          <span className="font-mono text-[11px]">
                            {draft.model} ({draft.prompt_version})
                          </span>
                        )}
                      </div>
                      <p dir="auto" className="text-sm text-text leading-relaxed">
                        {draft.final_body || draft.body}
                      </p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Recent Activity Timeline */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-start">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-bold text-text">
              Recent Review Activity
            </h2>
            <p className="text-xs text-text-muted">
              Chronological log of customer reviews and published responses ({stats.totalReviews})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedLocationId && selectedLocationId !== 'all' && (
              <Badge variant="neutral" size="sm">
                Filtered by Branch
              </Badge>
            )}
            <Link href="/dashboard/reviews">
              <Button variant="outline" size="sm">
                View All Reviews
              </Button>
            </Link>
          </div>
        </div>

        {allReviews.length === 0 ? (
          <EmptyState
            title="No reviews found for this selection"
            description="There are no reviews logged under the selected branch filter. Switch to all branches or sync new reviews."
            action={
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  View All Branches
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {allReviews.map((rev: any) => {
              const draft = Array.isArray(rev.drafts) ? rev.drafts[0] : rev.drafts;

              return (
                <Card
                  key={rev.id}
                  className="p-5 sm:p-6 bg-surface shadow-xs transition-shadow hover:shadow-xs text-start"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border/60">
                    <div className="flex items-center gap-3">
                      <Avatar name={rev.reviewer_name || 'Customer'} size="sm" />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-text text-sm">
                            {rev.reviewer_name || 'Customer'}
                          </span>
                          <StarRating value={rev.rating} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                          {rev.locations?.display_name && (
                            <span>📍 {rev.locations.display_name}</span>
                          )}
                          <span>• {formatTimeAgo(rev.publish_time || rev.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="neutral" size="sm">
                        {getLanguageLabel(rev.language)}
                      </Badge>
                      {renderStatusBadge(draft?.status, draft?.attempts)}
                    </div>
                  </div>

                  {/* Customer Text */}
                  <p dir="auto" className="text-sm text-text mt-3 leading-relaxed">
                    {rev.text || <span className="italic text-text-muted">(Star rating only — no comment)</span>}
                  </p>

                  {/* AI Draft or Published Reply */}
                  {draft && (
                    <div
                      className={cn(
                        'mt-3.5 p-3.5 rounded-xl border space-y-1',
                        draft.status === 'failed'
                          ? 'border-danger/30 bg-danger-surface/40'
                          : draft.status === 'posting'
                          ? 'border-info/30 bg-info-surface/40'
                          : 'border-border bg-surface-raised'
                      )}
                    >
                      <div className="flex items-center justify-between text-xs text-text-muted">
                        <span className="font-semibold text-text">
                          {draft.final_body ? 'Final Reply:' : 'AI Drafted Reply:'}
                        </span>
                        {draft.model && (
                          <span className="font-mono text-[11px]">
                            {draft.model} ({draft.prompt_version})
                          </span>
                        )}
                      </div>
                      <p dir="auto" className="text-sm text-text leading-relaxed">
                        {draft.final_body || draft.body}
                      </p>

                      {/* Failed status retry note */}
                      {draft.status === 'failed' && (
                        <div className="mt-2 p-2.5 rounded-lg bg-danger/10 text-xs text-danger space-y-1">
                          <p className="font-semibold">
                            {(draft.attempts || 0) < 5
                              ? '⚠️ Google publishing failed — automatic retry scheduled'
                              : '❌ Google publishing failed permanently — needs intervention'}
                          </p>
                          {draft.last_error && (
                            <p className="font-mono text-[11px] opacity-90">
                              Error: {draft.last_error}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Review Detail & Approval Modal */}
      <ReviewActionModal
        review={activeModalReview}
        open={Boolean(activeModalReview)}
        onClose={() => setActiveModalReview(null)}
      />
    </div>
  );
}
