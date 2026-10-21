'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  MapPin,
  Clock,
  GitCompare,
  UserCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Button,
  Card,
  DataRow,
  Icon,
  StarRating,
  useToast,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import ApprovalActions from '@/app/approve/[token]/ApprovalActions';
import {
  ReviewWithRelations,
  computeValidationNotes,
  computeWordDiff,
  formatDateTimeWestern,
  formatRelativeTimeWestern,
  getDecisionSummary,
  getFlagExplanations,
  getLanguageMeta,
  getPrimaryDraft,
  getReviewTextDir,
  getStatusMeta,
  isDraftEdited,
} from './review-helpers';

export interface ReviewDetailContentProps {
  review: ReviewWithRelations;
  onActionSuccess?: () => void;
  className?: string;
}

export const ReviewDetailContent: React.FC<ReviewDetailContentProps> = ({
  review,
  className,
}) => {
  const { locale } = useI18n();
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const draft = getPrimaryDraft(review);
  const textDir = getReviewTextDir(review.language);
  const langMeta = getLanguageMeta(review.language, locale);
  const statusMeta = getStatusMeta(draft?.status, draft?.attempts, locale);
  const decisionMeta = getDecisionSummary(draft, locale);
  const flagExplanations = getFlagExplanations(
    review.flags,
    review.requires_careful_review,
    review.rating,
    locale
  );
  const validationNotes = computeValidationNotes({
    review,
    draft,
    location: review.locations,
    locale,
  });

  const edited = isDraftEdited(draft);
  const diffTokens =
    edited && draft && draft.final_body
      ? computeWordDiff(draft.body, draft.final_body)
      : [];

  const replyTextToDisplay = draft?.final_body || draft?.body || '';
  const reviewCreatedDate = review.google_created_at || review.created_at;

  const handleCopyReply = async () => {
    if (!replyTextToDisplay) return;
    try {
      await navigator.clipboard.writeText(replyTextToDisplay);
      setCopied(true);
      toast.success(locale === 'ar' ? 'تم نسخ نص الرد!' : 'Reply copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(locale === 'ar' ? 'تعذر نسخ النص' : 'Failed to copy text');
    }
  };

  return (
    <div className={cn('space-y-6 text-start', className)}>
      {/* 1. Customer Review Card */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-border/70">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={review.reviewer_name || 'Customer'} size="md" />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-text truncate">
                  <bdi>{review.reviewer_name || (locale === 'ar' ? 'عميل جوجل' : 'Google Reviewer')}</bdi>
                </h2>
                <Badge variant="neutral" size="sm">
                  {langMeta.label}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                {review.locations?.display_name && (
                  <span className="inline-flex items-center gap-1 font-medium text-text">
                    <Icon icon={MapPin} size={13} className="text-primary" />
                    <bdi>{review.locations.display_name}</bdi>
                  </span>
                )}
                <span>•</span>
                <span className="inline-flex items-center gap-1">
                  <Icon icon={Clock} size={13} />
                  <span>{formatDateTimeWestern(reviewCreatedDate, locale)}</span>
                  <span className="opacity-75">
                    ({formatRelativeTimeWestern(reviewCreatedDate, locale)})
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <StarRating value={review.rating} size="md" showScore />
          </div>
        </div>

        {/* Full Review Text (Bi-directional safe) */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
            {locale === 'ar' ? 'نص تقييم العميل' : 'Customer Review'}
          </span>
          {review.text && review.text.trim() ? (
            <div
              dir={textDir}
              lang={
                review.language === 'ar'
                  ? 'ar'
                  : review.language === 'en'
                  ? 'en'
                  : undefined
              }
              className="p-4 rounded-xl bg-surface-raised border border-border/80 text-base text-text leading-relaxed whitespace-pre-wrap break-words"
            >
              <bdi>{review.text}</bdi>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-surface-raised border border-border/80 text-sm italic text-text-muted">
              {locale === 'ar'
                ? '(تقييم بالنجوم فقط بدون تعليق نصي)'
                : '(Star rating only — customer did not leave a written comment)'}
            </div>
          )}
        </div>
      </Card>

      {/* 2. Flags with Plain-Language Explanations */}
      {flagExplanations.length > 0 && (
        <Card className="p-5 border-amber-300/80 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
              <Icon icon={ShieldAlert} size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-text">
                {locale === 'ar'
                  ? 'تنبيهات الحساسية والمراجعة الدقيقة'
                  : 'Sensitivity Flags & Care Guidance'}
              </h3>
              <p className="text-xs text-text-muted">
                {locale === 'ar'
                  ? 'رصد النظام إشارات تتطلب انتباهاً خاصاً قبل الرد'
                  : 'Plain-language guidance based on automated review screening'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {flagExplanations.map((item) => (
              <div
                key={item.flag}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-surface border border-border/80"
              >
                <div className="flex items-start gap-2.5">
                  <Badge variant={item.severity} size="sm" className="shrink-0 mt-0.5">
                    <Icon icon={AlertTriangle} size={12} className="me-1" />
                    <span>{item.label}</span>
                  </Badge>
                  <p className="text-sm text-text font-medium leading-snug">
                    {item.explanation}
                  </p>
                </div>
                <span className="text-[11px] font-mono text-text-muted shrink-0">
                  #{item.flag}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 3. Drafted Reply, Status & Decision Attribution */}
      <Card className="p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-border/70">
          <div className="flex items-center gap-2">
            <Icon icon={Sparkles} size={18} className="text-primary" />
            <h3 className="text-base font-bold text-text">
              {locale === 'ar' ? 'مسودة الرد وحالة القرار' : 'Drafted Reply & Decision Status'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={statusMeta.variant}
              dot
              size="sm"
              className={statusMeta.pulse ? 'animate-pulse' : undefined}
            >
              {statusMeta.label}
            </Badge>
            <Badge variant={decisionMeta.variant} size="sm">
              <Icon icon={UserCheck} size={12} className="me-1" />
              <span>{decisionMeta.badgeLabel}</span>
            </Badge>
          </div>
        </div>

        {/* Decision explanation banner */}
        <div className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl bg-surface-raised border border-border/60 text-xs text-text-muted">
          <span>{decisionMeta.description}</span>
          {replyTextToDisplay && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopyReply}
              startIcon={<Icon icon={copied ? Check : Copy} size={14} />}
              className="shrink-0"
            >
              {copied
                ? locale === 'ar'
                  ? 'تم النسخ'
                  : 'Copied'
                : locale === 'ar'
                ? 'نسخ الرد'
                : 'Copy Reply'}
            </Button>
          )}
        </div>

        {/* Pending Action Controls (reusing ApprovalActions from /approve/[token]) OR Read-Only Display */}
        {!draft ? (
          <div className="p-4 rounded-xl bg-surface-raised border border-border text-sm text-text-muted text-center">
            {locale === 'ar'
              ? 'لا توجد مسودة رد مرتبطة بهذا التقييم حالياً.'
              : 'No reply draft is associated with this review yet.'}
          </div>
        ) : draft.status === 'pending' ? (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-semibold text-primary">
                {locale === 'ar'
                  ? 'إجراءات الموافقة والنشر الفوري:'
                  : 'Pending Approval — Approve, Edit, or Skip:'}
              </span>
              {draft.model && (
                <span className="font-mono">
                  {draft.model} ({draft.prompt_version})
                </span>
              )}
            </div>
            <ApprovalActions
              token={draft.approval_token || draft.id}
              initialDraftBody={draft.body}
              requiresCarefulReview={review.requires_careful_review}
              flags={review.flags || []}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span className="font-semibold text-text">
                {draft.final_body
                  ? locale === 'ar'
                    ? 'الرد النهائي المعتمد (للقراءة فقط):'
                    : 'Final Reply (Read-only):'
                  : locale === 'ar'
                  ? 'مسودة الذكاء الاصطناعي (للقراءة فقط):'
                  : 'AI Drafted Reply (Read-only):'}
              </span>
              {draft.model && (
                <span className="font-mono">
                  {draft.model} ({draft.prompt_version})
                </span>
              )}
            </div>

            <div
              dir={textDir}
              className="p-4 rounded-xl border border-teal-200/80 dark:border-teal-900/50 bg-teal-50/30 dark:bg-teal-950/20 text-base text-text leading-relaxed whitespace-pre-wrap break-words"
            >
              <bdi>{replyTextToDisplay}</bdi>
            </div>

            {/* Failed error diagnostic if status === 'failed' */}
            {draft.status === 'failed' && draft.last_error && (
              <div className="p-3.5 rounded-xl border border-danger/30 bg-danger-surface/30 text-xs text-danger space-y-1">
                <p className="font-bold">
                  {locale === 'ar'
                    ? 'سبب تعذر النشر على جوجل:'
                    : 'Google Publishing Error:'}
                </p>
                <p className="font-mono break-all">{draft.last_error}</p>
              </div>
            )}
          </div>
        )}

        {/* 4. Before / After Diff when Edited by Owner */}
        {edited && draft && draft.final_body && (
          <div className="pt-3 border-t border-border space-y-3">
            <div className="flex items-center gap-2">
              <Icon icon={GitCompare} size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-text">
                {locale === 'ar'
                  ? 'مقارنة التعديل (قبل / بعد تعديل المالك)'
                  : 'Before / After Diff (AI Draft vs. Final Reply)'}
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Before: Original AI Draft */}
              <div className="p-3.5 rounded-xl border border-border bg-surface-raised space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-text-muted block">
                  {locale === 'ar' ? 'قبل (مسودة الذكاء الاصطناعي)' : 'Before (Original AI Draft)'}
                </span>
                <p
                  dir={textDir}
                  className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap break-words"
                >
                  <bdi>{draft.body}</bdi>
                </p>
              </div>

              {/* After: Final Owner Edited Reply */}
              <div className="p-3.5 rounded-xl border border-teal-300/70 dark:border-teal-800/60 bg-teal-50/30 dark:bg-teal-950/20 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary block">
                  {locale === 'ar' ? 'بعد (الرد النهائي للمالك)' : 'After (Owner Final Reply)'}
                </span>
                <p
                  dir={textDir}
                  className="text-sm text-text leading-relaxed whitespace-pre-wrap break-words"
                >
                  <bdi>{draft.final_body}</bdi>
                </p>
              </div>
            </div>

            {/* Inline Word-Level Highlighted Diff */}
            <div className="p-3.5 rounded-xl border border-border bg-surface space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                <span className="font-semibold">
                  {locale === 'ar' ? 'التغييرات المظللة:' : 'Highlighted Changes:'}
                </span>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-red-500/20 border border-red-500/40 inline-block" />
                    <span>{locale === 'ar' ? 'محذوف' : 'Removed'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500/20 border border-emerald-500/40 inline-block" />
                    <span>{locale === 'ar' ? 'مضاف' : 'Added'}</span>
                  </span>
                </div>
              </div>
              <div
                dir={textDir}
                className="text-sm leading-relaxed whitespace-pre-wrap break-words pt-1"
              >
                {diffTokens.map((tok, idx) => {
                  if (tok.type === 'removed') {
                    return (
                      <del
                        key={idx}
                        className="bg-red-500/15 text-red-700 dark:text-red-300 line-through px-1 rounded-xs mx-0.5"
                      >
                        {tok.value}
                      </del>
                    );
                  }
                  if (tok.type === 'added') {
                    return (
                      <ins
                        key={idx}
                        className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-200 no-underline font-semibold px-1 rounded-xs mx-0.5"
                      >
                        {tok.value}
                      </ins>
                    );
                  }
                  return <span key={idx}>{tok.value}</span>;
                })}
              </div>
            </div>
          </div>
        )}

        {/* Lifecycle Timestamps & Model Metadata */}
        {draft && (
          <div className="pt-2 border-t border-border/70 divide-y divide-border/50">
            <DataRow
              label={locale === 'ar' ? 'قرار المراجعة' : 'Decision Attribution'}
              value={<span className="font-semibold">{decisionMeta.badgeLabel}</span>}
              border={false}
            />
            <DataRow
              label={locale === 'ar' ? 'تاريخ إنشاء المسودة' : 'Draft Created'}
              value={formatDateTimeWestern(draft.created_at, locale)}
              border={false}
            />
            {draft.decided_at && (
              <DataRow
                label={locale === 'ar' ? 'تاريخ اتخاذ القرار' : 'Decided At'}
                value={formatDateTimeWestern(draft.decided_at, locale)}
                border={false}
              />
            )}
            {(draft.google_reply_posted_at || draft.posted_at) && (
              <DataRow
                label={locale === 'ar' ? 'تاريخ النشر على جوجل' : 'Published to Google'}
                value={formatDateTimeWestern(
                  draft.google_reply_posted_at || draft.posted_at,
                  locale
                )}
                border={false}
              />
            )}
          </div>
        )}
      </Card>

      {/* 5. Validation Notes Card */}
      <Card className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Icon icon={ShieldCheck} size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-bold text-text">
              {locale === 'ar'
                ? 'ملاحظات مدقق الأمان (Validation Notes)'
                : 'Safety & Contact Validation Notes'}
            </h3>
            <p className="text-xs text-text-muted">
              {locale === 'ar'
                ? 'تفاصيل ما قام المدقق بحجبه أو التحقق منه (مثل أرقام الهواتف والروابط والوعود المالية)'
                : 'Items stripped, blocked, or verified by the reply validator'}
            </p>
          </div>
        </div>

        {validationNotes.length === 0 ? (
          <p className="text-xs text-text-muted">
            {locale === 'ar'
              ? 'لا توجد ملاحظات تحقق إضافية.'
              : 'No validation notes recorded for this review.'}
          </p>
        ) : (
          <ul className="space-y-2">
            {validationNotes.map((note) => {
              const badgeVariant =
                note.type === 'blocked'
                  ? 'danger'
                  : note.type === 'stripped' || note.type === 'warning'
                  ? 'warning'
                  : 'success';
              const badgeText =
                note.type === 'blocked'
                  ? locale === 'ar'
                    ? 'محظور'
                    : 'Blocked'
                  : note.type === 'stripped'
                  ? locale === 'ar'
                    ? 'تمت إزالته'
                    : 'Stripped'
                  : note.type === 'warning'
                  ? locale === 'ar'
                    ? 'تنبيه'
                    : 'Warning'
                  : locale === 'ar'
                  ? 'تم التحقق'
                  : 'Verified';

              return (
                <li
                  key={note.id}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-raised border border-border/70 text-xs sm:text-sm text-text"
                >
                  <Badge variant={badgeVariant} size="sm" className="shrink-0 mt-0.5">
                    {badgeText}
                  </Badge>
                  <span className="leading-relaxed">{note.message}</span>
                </li>
              );
            })}
          </ul>
        )}

        {review.locations?.contact_phone && (
          <div className="flex items-center gap-2 pt-1 text-xs text-text-muted">
            <Icon icon={Info} size={13} className="text-primary shrink-0" />
            <span>
              {locale === 'ar'
                ? `رقم التواصل الرسمي المسموح به للفرع: ${review.locations.contact_phone}`
                : `Official allowed branch contact: ${review.locations.contact_phone}`}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
};
