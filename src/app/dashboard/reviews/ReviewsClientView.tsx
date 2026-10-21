/* eslint-disable react-hooks/purity */
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Search,
  Filter,
  ShieldAlert,
  Calendar,
  ExternalLink,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MapPin,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Drawer,
  EmptyState,
  Icon,
  Input,
  Select,
  StarRating,
  Switch,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import PollNowButton from '../PollNowButton';
import {
  ReviewWithRelations,
  formatRelativeTimeWestern,
  formatShortDateWestern,
  getLanguageMeta,
  getPrimaryDraft,
  getReviewTextDir,
  getStatusMeta,
  isDraftEdited,
} from './review-helpers';
import { ReviewDetailContent } from './ReviewDetailContent';

export interface ReviewsClientViewProps {
  reviews: ReviewWithRelations[];
  locations: { id: string; display_name: string }[];
  isRevoked?: boolean;
}

const PAGE_SIZE = 10;

export const ReviewsClientView: React.FC<ReviewsClientViewProps> = ({
  reviews,
  locations,
  isRevoked = false,
}) => {
  const { locale, isRtl } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read URL-synced filters
  const statusFilter = searchParams.get('status') || 'all';
  const ratingFilter = searchParams.get('rating') || 'all';
  const langFilter = searchParams.get('lang') || 'all';
  const flaggedOnly = searchParams.get('flagged') === '1';
  const dateRange = searchParams.get('range') || 'all';
  const dateFrom = searchParams.get('from') || '';
  const dateTo = searchParams.get('to') || '';
  const searchQuery = searchParams.get('q') || '';
  const locationFilter = searchParams.get('locationId') || 'all';
  const selectedReviewId = searchParams.get('reviewId') || null;
  const currentPage = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

  const [visibleLimit, setVisibleLimit] = useState<number>(currentPage * PAGE_SIZE);

  // Helper to update URL query params cleanly without full page scroll
  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, val] of Object.entries(updates)) {
      if (val === null || val === '' || val === 'all' || val === '0') {
        next.delete(key);
      } else {
        next.set(key, val);
      }
    }
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const handleResetFilters = () => {
    const next = new URLSearchParams();
    const loc = searchParams.get('locationId');
    if (loc && loc !== 'all') next.set('locationId', loc);
    const qs = next.toString();
    setVisibleLimit(PAGE_SIZE);
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const hasActiveFilters =
    statusFilter !== 'all' ||
    ratingFilter !== 'all' ||
    langFilter !== 'all' ||
    flaggedOnly ||
    dateRange !== 'all' ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(searchQuery.trim());

  // Apply all filters
  const filteredReviews = useMemo(() => {
    const nowMs = Date.now();
    const qLower = searchQuery.trim().toLowerCase();

    return reviews.filter((rev) => {
      const draft = getPrimaryDraft(rev);

      // 1. Location filter
      if (locationFilter !== 'all' && rev.location_id !== locationFilter) {
        return false;
      }

      // 2. Status filter
      if (statusFilter !== 'all') {
        const st = draft?.status || 'none';
        if (statusFilter === 'published') {
          if (st !== 'posted' && st !== 'approved' && st !== 'edited') return false;
        } else if (statusFilter === 'edited') {
          if (st !== 'edited' && !isDraftEdited(draft)) return false;
        } else if (st !== statusFilter) {
          return false;
        }
      }

      // 3. Rating filter
      if (ratingFilter !== 'all') {
        if (ratingFilter === 'negative') {
          if (rev.rating > 2) return false;
        } else if (ratingFilter === 'positive') {
          if (rev.rating < 4) return false;
        } else {
          const exactRating = parseInt(ratingFilter, 10);
          if (!Number.isNaN(exactRating) && rev.rating !== exactRating) {
            return false;
          }
        }
      }

      // 4. Language filter
      if (langFilter !== 'all') {
        const revLang = rev.language || 'none';
        if (revLang !== langFilter) return false;
      }

      // 5. Flagged only filter
      if (flaggedOnly) {
        const hasFlags = Array.isArray(rev.flags) && rev.flags.length > 0;
        if (!hasFlags && !rev.requires_careful_review) return false;
      }

      // 6. Date range filter
      const createdStr = rev.google_created_at || rev.created_at;
      const createdMs = createdStr ? new Date(createdStr).getTime() : 0;

      if (dateRange === '7d') {
        if (nowMs - createdMs > 7 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === '30d') {
        if (nowMs - createdMs > 30 * 24 * 60 * 60 * 1000) return false;
      } else if (dateRange === '90d') {
        if (nowMs - createdMs > 90 * 24 * 60 * 60 * 1000) return false;
      }

      if (dateFrom) {
        const fromMs = new Date(`${dateFrom}T00:00:00`).getTime();
        if (!Number.isNaN(fromMs) && createdMs < fromMs) return false;
      }
      if (dateTo) {
        const toMs = new Date(`${dateTo}T23:59:59`).getTime();
        if (!Number.isNaN(toMs) && createdMs > toMs) return false;
      }

      // 7. Search by reviewer name or review text
      if (qLower) {
        const nameMatch = (rev.reviewer_name || '').toLowerCase().includes(qLower);
        const textMatch = (rev.text || '').toLowerCase().includes(qLower);
        if (!nameMatch && !textMatch) return false;
      }

      return true;
    });
  }, [
    reviews,
    locationFilter,
    statusFilter,
    ratingFilter,
    langFilter,
    flaggedOnly,
    dateRange,
    dateFrom,
    dateTo,
    searchQuery,
  ]);

  // Compute quick status counts for filter pills
  const counts = useMemo(() => {
    let pending = 0;
    let flagged = 0;
    let published = 0;
    for (const r of reviews) {
      if (locationFilter !== 'all' && r.location_id !== locationFilter) continue;
      const d = getPrimaryDraft(r);
      if (d?.status === 'pending') pending++;
      if (d?.status === 'posted' || d?.status === 'approved' || d?.status === 'edited') {
        published++;
      }
      if ((Array.isArray(r.flags) && r.flags.length > 0) || r.requires_careful_review) {
        flagged++;
      }
    }
    return { pending, flagged, published, total: reviews.length };
  }, [reviews, locationFilter]);

  const effectiveLimit = Math.max(visibleLimit, currentPage * PAGE_SIZE);
  const paginatedReviews = filteredReviews.slice(0, effectiveLimit);
  const hasMore = effectiveLimit < filteredReviews.length;

  const selectedReview = useMemo(
    () => reviews.find((r) => r.id === selectedReviewId) || null,
    [reviews, selectedReviewId]
  );

  const handleOpenReviewDesktop = (reviewId: string) => {
    updateParams({ reviewId });
  };

  const handleCloseDrawer = () => {
    updateParams({ reviewId: null });
  };

  const handleLoadMore = () => {
    const nextLimit = effectiveLimit + PAGE_SIZE;
    setVisibleLimit(nextLimit);
    const nextPage = Math.ceil(nextLimit / PAGE_SIZE);
    updateParams({ page: nextPage > 1 ? String(nextPage) : null });
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 select-none">
      {/* 1. Page Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs">
        <div className="space-y-1 text-start">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-extrabold text-text tracking-tight">
              {locale === 'ar' ? 'سجل التقييمات (Reviews)' : 'Customer Reviews'}
            </h1>
            <Badge variant="default" size="sm">
              {filteredReviews.length} / {counts.total}
            </Badge>
            {counts.pending > 0 && (
              <Badge variant="warning" dot size="sm">
                {locale === 'ar'
                  ? `${counts.pending} بانتظار الموافقة`
                  : `${counts.pending} Pending`}
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-text-muted">
            {locale === 'ar'
              ? 'تصفح وابحث في جميع تقييمات جوجل ومسودات الردود الذكية وحالات النشر'
              : 'Browse, filter, and inspect all Google reviews, AI reply drafts, and validation logs'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PollNowButton isRevoked={isRevoked} />
        </div>
      </section>

      {/* 2. URL-Synced Filter & Search Bar */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search by Reviewer Name or Review Text */}
          <div className="sm:col-span-2 lg:col-span-4">
            <Input
              label={locale === 'ar' ? 'بحث بالاسم أو النص' : 'Search reviewer or text'}
              placeholder={
                locale === 'ar'
                  ? 'ابحث باسم العميل أو كلمات التقييم...'
                  : 'Search reviewer name or review text...'
              }
              value={searchQuery}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ q: e.target.value, page: null });
              }}
              startIcon={<Icon icon={Search} size={16} />}
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-2">
            <Select
              label={locale === 'ar' ? 'حالة الرد' : 'Status'}
              value={statusFilter}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ status: e.target.value, page: null });
              }}
              options={[
                { value: 'all', label: locale === 'ar' ? 'كل الحالات' : 'All Statuses' },
                { value: 'pending', label: locale === 'ar' ? 'بانتظار الموافقة' : 'Pending Approval' },
                { value: 'published', label: locale === 'ar' ? 'تم النشر / الاعتماد' : 'Published / Approved' },
                { value: 'edited', label: locale === 'ar' ? 'مُعدّل بواسطة المالك' : 'Edited by Owner' },
                { value: 'skipped', label: locale === 'ar' ? 'تم التخطي' : 'Skipped' },
                { value: 'posting', label: locale === 'ar' ? 'جاري النشر' : 'Publishing' },
                { value: 'failed', label: locale === 'ar' ? 'فشل النشر' : 'Failed' },
                { value: 'expired', label: locale === 'ar' ? 'منتهي الصلاحية' : 'Expired' },
              ]}
            />
          </div>

          {/* Rating Filter */}
          <div className="lg:col-span-2">
            <Select
              label={locale === 'ar' ? 'التقييم بالنجوم' : 'Rating'}
              value={ratingFilter}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ rating: e.target.value, page: null });
              }}
              options={[
                { value: 'all', label: locale === 'ar' ? 'كل النجوم' : 'All Ratings' },
                { value: '5', label: '5 ★' },
                { value: '4', label: '4 ★' },
                { value: '3', label: '3 ★' },
                { value: '2', label: '2 ★' },
                { value: '1', label: '1 ★' },
                { value: 'negative', label: locale === 'ar' ? 'سلبي (1–2 ★)' : 'Negative (1–2 ★)' },
                { value: 'positive', label: locale === 'ar' ? 'إيجابي (4–5 ★)' : 'Positive (4–5 ★)' },
              ]}
            />
          </div>

          {/* Language Filter */}
          <div className="lg:col-span-2">
            <Select
              label={locale === 'ar' ? 'اللغة' : 'Language'}
              value={langFilter}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ lang: e.target.value, page: null });
              }}
              options={[
                { value: 'all', label: locale === 'ar' ? 'كل اللغات' : 'All Languages' },
                { value: 'ar', label: locale === 'ar' ? 'العربية (AR)' : 'Arabic (AR)' },
                { value: 'en', label: locale === 'ar' ? 'الإنجليزية (EN)' : 'English (EN)' },
                { value: 'mixed', label: locale === 'ar' ? 'مختلط / فرانكو' : 'Mixed / Arabizi' },
                { value: 'none', label: locale === 'ar' ? 'بدون نص (نجوم فقط)' : 'Stars Only (No text)' },
              ]}
            />
          </div>

          {/* Date Range Filter */}
          <div className="lg:col-span-2">
            <Select
              label={locale === 'ar' ? 'النطاق الزمني' : 'Date Range'}
              value={dateRange}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                const val = e.target.value;
                if (val !== 'custom') {
                  updateParams({ range: val, from: null, to: null, page: null });
                } else {
                  updateParams({ range: val, page: null });
                }
              }}
              options={[
                { value: 'all', label: locale === 'ar' ? 'كل الأوقات' : 'All Time' },
                { value: '7d', label: locale === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days' },
                { value: '30d', label: locale === 'ar' ? 'آخر 30 يوماً' : 'Last 30 Days' },
                { value: '90d', label: locale === 'ar' ? 'آخر 90 يوماً' : 'Last 90 Days' },
                { value: 'custom', label: locale === 'ar' ? 'تاريخ مخصص...' : 'Custom Range...' },
              ]}
            />
          </div>
        </div>

        {/* Custom Date Range Inputs (when 'custom' or dates selected) */}
        {(dateRange === 'custom' || dateFrom || dateTo) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
            <Input
              type="date"
              label={locale === 'ar' ? 'من تاريخ' : 'From Date'}
              value={dateFrom}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ range: 'custom', from: e.target.value, page: null });
              }}
              startIcon={<Icon icon={Calendar} size={15} />}
            />
            <Input
              type="date"
              label={locale === 'ar' ? 'إلى تاريخ' : 'To Date'}
              value={dateTo}
              onChange={(e) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ range: 'custom', to: e.target.value, page: null });
              }}
              startIcon={<Icon icon={Calendar} size={15} />}
            />
          </div>
        )}

        {/* Secondary Filter Bar: Flagged Only Toggle, Branch Filter, and Clear Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
          <div className="flex flex-wrap items-center gap-4">
            <Switch
              checked={flaggedOnly}
              onChange={(checked) => {
                setVisibleLimit(PAGE_SIZE);
                updateParams({ flagged: checked ? '1' : null, page: null });
              }}
              label={
                locale === 'ar'
                  ? `التقييمات الحساسة فقط (${counts.flagged})`
                  : `Flagged only (${counts.flagged})`
              }
            />

            {locations.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <Icon icon={MapPin} size={14} className="text-primary" />
                <select
                  aria-label={locale === 'ar' ? 'تصفية حسب الفرع' : 'Filter by branch'}
                  value={locationFilter}
                  onChange={(e) => {
                    setVisibleLimit(PAGE_SIZE);
                    updateParams({ locationId: e.target.value, page: null });
                  }}
                  className="min-h-[38px] px-2.5 py-1 rounded-lg border border-border bg-surface text-text font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="all">
                    {locale === 'ar' ? 'جميع الفروع' : 'All Branches'}
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.display_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                startIcon={<Icon icon={RotateCcw} size={14} />}
              >
                {locale === 'ar' ? 'مسح الفلاتر' : 'Reset Filters'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 3. Empty States vs. Reviews List */}
      {reviews.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title={locale === 'ar' ? 'لا توجد تقييمات مسجلة بعد' : 'No Reviews Yet'}
          description={
            locale === 'ar'
              ? 'لم يتم استيراد أي تقييمات من حساب Google Business Profile حتى الآن. اضغط على مزامنة لجلب أحدث التقييمات.'
              : 'No Google reviews have been synced for this business yet. Use Sync Reviews to poll Google Business Profile.'
          }
        />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={Filter}
          title={
            locale === 'ar'
              ? 'لا توجد تقييمات تطابق الفلاتر المحددة'
              : 'No Reviews Match Your Filters'
          }
          description={
            locale === 'ar'
              ? 'جرب تغيير معايير البحث أو إزالة الفلاتر لعرض جميع التقييمات.'
              : 'Try adjusting your search query, date range, or status filters to see more results.'
          }
          action={
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              {locale === 'ar' ? 'إعادة ضبط الفلاتر' : 'Clear All Filters'}
            </Button>
          }
        />
      ) : (
        <>
          {/* 3A. DESKTOP TABLE VIEW (lg and up) */}
          <Card className="hidden lg:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start">
                <thead>
                  <tr className="border-b border-border bg-surface-raised/70 text-xs font-bold uppercase tracking-wider text-text-muted">
                    <th scope="col" className="py-3.5 ps-5 pe-3 text-start">
                      {locale === 'ar' ? 'النجوم' : 'Rating'}
                    </th>
                    <th scope="col" className="py-3.5 px-3 text-start">
                      {locale === 'ar' ? 'العميل' : 'Reviewer'}
                    </th>
                    <th scope="col" className="py-3.5 px-3 text-start">
                      {locale === 'ar' ? 'مقتطف التقييم' : 'Review Snippet'}
                    </th>
                    <th scope="col" className="py-3.5 px-3 text-start">
                      {locale === 'ar' ? 'اللغة' : 'Lang'}
                    </th>
                    <th scope="col" className="py-3.5 px-3 text-start">
                      {locale === 'ar' ? 'التنبيهات' : 'Flags'}
                    </th>
                    <th scope="col" className="py-3.5 px-3 text-start">
                      {locale === 'ar' ? 'الحالة' : 'Status'}
                    </th>
                    <th scope="col" className="py-3.5 ps-3 pe-5 text-end">
                      {locale === 'ar' ? 'التاريخ' : 'Created'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 text-sm">
                  {paginatedReviews.map((rev) => {
                    const draft = getPrimaryDraft(rev);
                    const langMeta = getLanguageMeta(rev.language, locale);
                    const statusMeta = getStatusMeta(draft?.status, draft?.attempts, locale);
                    const textDir = getReviewTextDir(rev.language);
                    const hasFlags = Array.isArray(rev.flags) && rev.flags.length > 0;
                    const createdStr = rev.google_created_at || rev.created_at;
                    const isSelected = selectedReviewId === rev.id;

                    return (
                      <tr
                        key={rev.id}
                        tabIndex={0}
                        onClick={() => handleOpenReviewDesktop(rev.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleOpenReviewDesktop(rev.id);
                          }
                        }}
                        className={cn(
                          'group cursor-pointer transition-colors focus-visible:outline-none focus-visible:bg-teal-50/60 dark:focus-visible:bg-teal-950/30',
                          isSelected
                            ? 'bg-teal-50/70 dark:bg-teal-950/30'
                            : 'hover:bg-surface-raised/80'
                        )}
                      >
                        {/* Stars */}
                        <td className="py-4 ps-5 pe-3 align-top whitespace-nowrap">
                          <StarRating value={rev.rating} size="sm" />
                        </td>

                        {/* Reviewer */}
                        <td className="py-4 px-3 align-top max-w-[190px]">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={rev.reviewer_name || 'Customer'} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-text truncate">
                                <bdi>{rev.reviewer_name || (locale === 'ar' ? 'عميل' : 'Customer')}</bdi>
                              </p>
                              {rev.locations?.display_name && (
                                <p className="text-xs text-text-muted truncate">
                                  <bdi>{rev.locations.display_name}</bdi>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Snippet */}
                        <td className="py-4 px-3 align-top max-w-md">
                          {rev.text && rev.text.trim() ? (
                            <p
                              dir={textDir}
                              className="text-sm text-text line-clamp-2 leading-relaxed"
                            >
                              <bdi>{rev.text}</bdi>
                            </p>
                          ) : (
                            <span className="text-xs italic text-text-muted">
                              {locale === 'ar'
                                ? '(تقييم بالنجوم فقط)'
                                : '(Star rating only)'}
                            </span>
                          )}
                        </td>

                        {/* Language Chip */}
                        <td className="py-4 px-3 align-top whitespace-nowrap">
                          <Badge variant="neutral" size="sm">
                            {langMeta.shortLabel}
                          </Badge>
                        </td>

                        {/* Flag Badges */}
                        <td className="py-4 px-3 align-top">
                          {hasFlags ? (
                            <div className="flex flex-wrap gap-1">
                              {rev.flags.map((flag) => (
                                <Badge key={flag} variant="danger" size="sm">
                                  <Icon icon={ShieldAlert} size={11} className="me-1" />
                                  <span>{flag}</span>
                                </Badge>
                              ))}
                            </div>
                          ) : rev.requires_careful_review ? (
                            <Badge variant="warning" size="sm">
                              <Icon icon={AlertTriangle} size={11} className="me-1" />
                              <span>{locale === 'ar' ? 'حذر' : 'Care'}</span>
                            </Badge>
                          ) : (
                            <span className="text-xs text-text-muted">—</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-3 align-top whitespace-nowrap">
                          <Badge
                            variant={statusMeta.variant}
                            dot
                            size="sm"
                            className={statusMeta.pulse ? 'animate-pulse' : undefined}
                          >
                            {statusMeta.label}
                          </Badge>
                        </td>

                        {/* Created Time */}
                        <td className="py-4 ps-3 pe-5 align-top whitespace-nowrap text-end">
                          <div className="text-xs font-medium text-text">
                            {formatRelativeTimeWestern(createdStr, locale)}
                          </div>
                          <div className="text-[11px] text-text-muted">
                            {formatShortDateWestern(createdStr, locale)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* 3B. MOBILE CARD LIST VIEW (< lg: navigates to full page /dashboard/reviews/[id]) */}
          <div className="lg:hidden space-y-3">
            {paginatedReviews.map((rev) => {
              const draft = getPrimaryDraft(rev);
              const langMeta = getLanguageMeta(rev.language, locale);
              const statusMeta = getStatusMeta(draft?.status, draft?.attempts, locale);
              const textDir = getReviewTextDir(rev.language);
              const hasFlags = Array.isArray(rev.flags) && rev.flags.length > 0;
              const createdStr = rev.google_created_at || rev.created_at;

              return (
                <Link
                  key={rev.id}
                  href={`/dashboard/reviews/${rev.id}`}
                  className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
                >
                  <Card className="p-4 space-y-3 hover:border-primary/50 transition-colors text-start">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={rev.reviewer_name || 'Customer'} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-text truncate">
                              <bdi>{rev.reviewer_name || (locale === 'ar' ? 'عميل' : 'Customer')}</bdi>
                            </span>
                            <StarRating value={rev.rating} size="sm" />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-text-muted mt-0.5">
                            {rev.locations?.display_name && (
                              <span className="truncate">
                                📍 <bdi>{rev.locations.display_name}</bdi>
                              </span>
                            )}
                            <span>•</span>
                            <span>{formatRelativeTimeWestern(createdStr, locale)}</span>
                          </div>
                        </div>
                      </div>

                      <Badge
                        variant={statusMeta.variant}
                        dot
                        size="sm"
                        className={cn('shrink-0', statusMeta.pulse && 'animate-pulse')}
                      >
                        {statusMeta.label}
                      </Badge>
                    </div>

                    {/* Review Snippet */}
                    {rev.text && rev.text.trim() ? (
                      <p
                        dir={textDir}
                        className="text-sm text-text line-clamp-3 leading-relaxed"
                      >
                        <bdi>{rev.text}</bdi>
                      </p>
                    ) : (
                      <p className="text-xs italic text-text-muted">
                        {locale === 'ar'
                          ? '(تقييم بالنجوم فقط بدون تعليق)'
                          : '(Star rating only — no comment)'}
                      </p>
                    )}

                    {/* Bottom Chips: Language + Flags + Date */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="neutral" size="sm">
                          {langMeta.shortLabel}
                        </Badge>
                        {hasFlags &&
                          rev.flags.map((flag) => (
                            <Badge key={flag} variant="danger" size="sm">
                              <Icon icon={ShieldAlert} size={11} className="me-1" />
                              <span>{flag}</span>
                            </Badge>
                          ))}
                        {!hasFlags && rev.requires_careful_review && (
                          <Badge variant="warning" size="sm">
                            <Icon icon={AlertTriangle} size={11} className="me-1" />
                            <span>{locale === 'ar' ? 'مراجعة دقيقة' : 'Careful Review'}</span>
                          </Badge>
                        )}
                      </div>

                      <span className="text-xs text-primary font-semibold inline-flex items-center gap-1">
                        <span>{locale === 'ar' ? 'التفاصيل' : 'Details'}</span>
                        <Icon icon={isRtl ? ChevronLeft : ChevronRight} size={14} />
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* 4. Pagination / "Load More" Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <p className="text-xs text-text-muted">
              {locale === 'ar'
                ? `عرض ${paginatedReviews.length} من أصل ${filteredReviews.length} تقييم`
                : `Showing ${paginatedReviews.length} of ${filteredReviews.length} reviews`}
            </p>

            {hasMore && (
              <Button variant="outline" size="md" onClick={handleLoadMore}>
                {locale === 'ar'
                  ? `عرض المزيد (${filteredReviews.length - paginatedReviews.length} متبقي)`
                  : `Load More (${filteredReviews.length - paginatedReviews.length} remaining)`}
              </Button>
            )}
          </div>
        </>
      )}

      {/* 5. Desktop Review Detail Drawer */}
      <Drawer
        open={Boolean(selectedReview)}
        onClose={handleCloseDrawer}
        side="end"
        title={
          locale === 'ar'
            ? 'تفاصيل التقييم والرد الذكي'
            : 'Review & Reply Details'
        }
        headerActions={
          selectedReview ? (
            <Link
              href={`/dashboard/reviews/${selectedReview.id}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{locale === 'ar' ? 'صفحة كاملة' : 'Full Page'}</span>
              <Icon icon={ExternalLink} size={13} />
            </Link>
          ) : undefined
        }
      >
        {selectedReview && (
          <ReviewDetailContent
            review={selectedReview}
            onActionSuccess={() => {
              router.refresh();
            }}
          />
        )}
      </Drawer>
    </div>
  );
};
