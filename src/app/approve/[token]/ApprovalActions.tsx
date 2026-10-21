'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Sparkles,
  Pencil,
  SkipForward,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button, Card, InlineBanner, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { cn } from '@/lib/utils';

export interface ApprovalActionsProps {
  token: string;
  initialDraftBody: string;
  requiresCarefulReview: boolean;
  flags: string[];
  initialEditing?: boolean;
  onDecisionComplete?: () => void;
}

const MIN_CHARS = 10;
const MAX_CHARS = 1000;

export function ApprovalOutcomeCard({
  status,
  finalBody,
  attempts = 1,
}: {
  status: 'posted' | 'posting' | 'skipped' | 'used' | 'failed';
  finalBody?: string | null;
  attempts?: number;
}) {
  const { t } = useI18n();

  if (status === 'posted') {
    return (
      <Card
        data-testid="approval-state-success"
        className="border-success/30 bg-success-surface/60 dark:bg-success-surface/25 p-5 sm:p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success text-success-foreground shadow-xs motion-safe: transition-transform motion-safe:duration-300 motion-safe:scale-100">
          <Icon icon={Check} size={24} strokeWidth={2.75} />
        </div>
        <h2 className="text-lg font-extrabold text-text">
          {t('approval.successTitle')}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t('approval.successDesc')}
        </p>

        {finalBody && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-3.5 text-start shadow-2xs">
            <span className="block text-xs font-semibold text-text-muted mb-1">
              {t('approval.publishedReplyLabel')}
            </span>
            <p
              dir="auto"
              className="whitespace-pre-wrap text-sm sm:text-base text-text leading-relaxed"
            >
              {finalBody}
            </p>
          </div>
        )}

        <div className="mt-5">
          <Link
            href="/dashboard"
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-raised transition-colors shadow-2xs"
          >
            <span>{t('approval.goToDashboard')}</span>
            <Icon icon={ArrowUpRight} size={16} directional />
          </Link>
        </div>
      </Card>
    );
  }

  if (status === 'skipped') {
    return (
      <Card
        data-testid="approval-state-skipped"
        className="border-border bg-surface-raised p-5 sm:p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-border-muted text-text-muted">
          <Icon icon={SkipForward} size={20} directional />
        </div>
        <h2 className="text-lg font-extrabold text-text">
          {t('approval.skippedTitle')}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t('approval.skippedDesc')}
        </p>
        <div className="mt-5">
          <Link
            href="/dashboard"
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-raised transition-colors"
          >
            <span>{t('approval.goToDashboard')}</span>
            <Icon icon={ArrowUpRight} size={16} directional />
          </Link>
        </div>
      </Card>
    );
  }

  if (status === 'posting') {
    return (
      <Card
        data-testid="approval-state-posting"
        className="border-info/30 bg-info-surface/60 dark:bg-info-surface/25 p-5 sm:p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-info/15 text-info">
          <Icon icon={Clock} size={22} className="motion-safe:animate-pulse" />
        </div>
        <h2 className="text-lg font-extrabold text-text">
          {t('approval.postingTitle')}
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          {t('approval.postingDesc')}
        </p>
        {finalBody && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-3.5 text-start">
            <span className="block text-xs font-semibold text-text-muted mb-1">
              {t('approval.approvedReplyLabel')}
            </span>
            <p
              dir="auto"
              className="whitespace-pre-wrap text-sm sm:text-base text-text leading-relaxed"
            >
              {finalBody}
            </p>
          </div>
        )}
      </Card>
    );
  }

  if (status === 'used') {
    return (
      <Card
        data-testid="approval-state-used"
        className="border-border bg-surface-raised p-5 sm:p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-teal-100 text-primary dark:bg-teal-900/50 dark:text-teal-200">
          <Icon icon={CheckCircle2} size={22} />
        </div>
        <h2 className="text-lg font-extrabold text-text">
          {t('approval.usedLinkTitle')}
        </h2>
        <p className="mt-1 text-sm text-text-muted leading-relaxed">
          {t('approval.usedLinkDesc')}
        </p>
        {finalBody && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-3.5 text-start">
            <span className="block text-xs font-semibold text-text-muted mb-1">
              {t('approval.approvedReplyLabel')}
            </span>
            <p
              dir="auto"
              className="whitespace-pre-wrap text-sm sm:text-base text-text leading-relaxed"
            >
              {finalBody}
            </p>
          </div>
        )}
        <div className="mt-5">
          <Link
            href="/dashboard"
            className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-raised transition-colors"
          >
            <span>{t('approval.goToDashboard')}</span>
            <Icon icon={ArrowUpRight} size={16} directional />
          </Link>
        </div>
      </Card>
    );
  }

  // status === 'failed'
  const isExhausted = attempts >= 5;
  return (
    <Card
      data-testid="approval-state-failed"
      className="border-danger/30 bg-danger-surface/60 dark:bg-danger-surface/25 p-5 sm:p-6 text-center"
    >
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-danger/15 text-danger">
        <Icon icon={XCircle} size={22} />
      </div>
      <h2 className="text-lg font-extrabold text-text">
        {t('approval.failedTitle')}
      </h2>
      <p className="mt-1 text-sm text-text-muted leading-relaxed">
        {isExhausted
          ? t('approval.failedExhaustedDesc')
          : t('approval.failedRetryingDesc')}
      </p>
      {finalBody && (
        <div className="mt-4 rounded-xl border border-border bg-surface p-3.5 text-start">
          <span className="block text-xs font-semibold text-text-muted mb-1">
            {t('approval.approvedReplyLabel')}
          </span>
          <p
            dir="auto"
            className="whitespace-pre-wrap text-sm sm:text-base text-text leading-relaxed"
          >
            {finalBody}
          </p>
        </div>
      )}
      <div className="mt-5">
        <Link
          href="/dashboard"
          className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-text hover:bg-surface-raised transition-colors"
        >
          <span>{t('approval.goToDashboard')}</span>
          <Icon icon={ArrowUpRight} size={16} directional />
        </Link>
      </div>
    </Card>
  );
}

export default function ApprovalActions({
  token,
  initialDraftBody,
  requiresCarefulReview,
  flags,
  initialEditing = false,
  onDecisionComplete,
}: ApprovalActionsProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(initialEditing);
  const [editedText, setEditedText] = useState(initialDraftBody);
  const [loadingAction, setLoadingAction] = useState<'approve' | 'edit' | 'skip' | null>(null);
  const [pendingWarnings, setPendingWarnings] = useState<string[]>([]);
  const [resultState, setResultState] = useState<{
    status: 'posted' | 'posting' | 'skipped' | 'used' | 'failed';
    finalBody: string | null;
  } | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const needsCarefulHandling = requiresCarefulReview || flags.length > 0;
  const trimmedLength = editedText.trim().length;
  const charCount = editedText.length;
  const isCharValid = trimmedLength >= MIN_CHARS && charCount <= MAX_CHARS;

  const getFlagDescription = (flag: string): string => {
    switch (flag) {
      case 'medical':
        return t('approval.flagMedical');
      case 'legal':
        return t('approval.flagLegal');
      case 'refund':
        return t('approval.flagRefund');
      case 'threat':
        return t('approval.flagThreat');
      case 'abuse':
        return t('approval.flagAbuse');
      case 'injection_suspected':
        return t('approval.flagInjection');
      default:
        return t('approval.flagGeneric');
    }
  };

  async function handleAction(
    action: 'approve' | 'edit' | 'skip',
    confirmWarnings = false
  ) {
    if (action === 'edit') {
      if (trimmedLength < MIN_CHARS) {
        setErrorKey('approval.charTooShort');
        return;
      }
      if (charCount > MAX_CHARS) {
        setErrorKey('approval.charTooLong');
        return;
      }
    }

    setLoadingAction(action);
    setErrorKey(null);

    try {
      const res = await fetch(`/api/drafts/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          editedBody: action === 'edit' ? editedText : undefined,
          confirmWarnings: action === 'edit' ? confirmWarnings : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data?.requiresConfirmation && Array.isArray(data.warnings)) {
          setPendingWarnings(data.warnings);
          return;
        }

        const errText = typeof data?.error === 'string' ? data.error.toLowerCase() : '';
        if (errText.includes('already been processed') || errText.includes('already processed')) {
          setResultState({
            status: 'used',
            finalBody: null,
          });
          return;
        }

        if (
          errText.includes('failed posting') ||
          errText.includes('rate limit') ||
          errText.includes('deleted on google')
        ) {
          setResultState({
            status: 'failed',
            finalBody: action === 'edit' ? editedText.trim() : initialDraftBody.trim(),
          });
          return;
        }

        setErrorKey('approval.actionErrorGeneric');
        return;
      }

      setPendingWarnings([]);
      const returnedStatus = data.status;
      setResultState({
        status:
          returnedStatus === 'posted'
            ? 'posted'
            : returnedStatus === 'posting'
            ? 'posting'
            : returnedStatus === 'skipped'
            ? 'skipped'
            : 'posted',
        finalBody: data.finalBody ?? null,
      });
      onDecisionComplete?.();
    } catch {
      setErrorKey('approval.actionErrorGeneric');
    } finally {
      setLoadingAction(null);
    }
  }

  if (resultState) {
    return (
      <ApprovalOutcomeCard
        status={resultState.status}
        finalBody={resultState.finalBody}
      />
    );
  }

  const uniqueFlags = flags.length > 0 ? Array.from(new Set(flags)) : ['generic'];

  return (
    <div className="space-y-4">
      {/* Careful Handling Banner */}
      {needsCarefulHandling && (
        <div
          data-testid="careful-review-banner"
          role="region"
          aria-label={t('approval.carefulReviewTitle')}
          className="rounded-2xl border border-warning/40 bg-warning-surface/90 dark:bg-warning-surface/25 p-4 text-start shadow-2xs"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
              <Icon icon={ShieldAlert} size={18} />
            </div>
            <div className="flex-1 space-y-1.5">
              <h2 className="text-sm font-extrabold text-text leading-snug">
                {t('approval.carefulReviewTitle')}
              </h2>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('approval.carefulReviewDesc')}
              </p>
              <ul className="mt-2 space-y-1.5">
                {uniqueFlags.map((flag) => (
                  <li
                    key={flag}
                    className="flex items-start gap-2 text-xs font-semibold text-text leading-relaxed"
                  >
                    <span
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning"
                      aria-hidden="true"
                    />
                    <span>{getFlagDescription(flag)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Reply / In-Place Edit Card */}
      <Card
        data-testid={isEditing ? 'approval-card-editing' : 'approval-card-suggested'}
        className={cn(
          'p-4 sm:p-5 transition-colors',
          isEditing
            ? 'border-primary bg-surface ring-1 ring-primary/20'
            : 'border-teal-200/80 dark:border-teal-800/70 bg-teal-50/40 dark:bg-surface'
        )}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-primary">
            <Icon icon={Sparkles} size={15} />
            <span>
              {isEditing
                ? t('approval.editReplyTitle')
                : t('approval.suggestedReply')}
            </span>
          </div>

          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setEditedText(initialDraftBody);
                setPendingWarnings([]);
                setErrorKey(null);
              }}
              disabled={editedText === initialDraftBody || loadingAction !== null}
              className="min-h-[36px] px-2.5 py-1 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-teal-100/60 dark:hover:bg-surface-raised disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <Icon icon={RotateCcw} size={13} />
              <span>{t('approval.resetToSuggestion')}</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <textarea
              dir="auto"
              rows={5}
              maxLength={MAX_CHARS}
              value={editedText}
              disabled={loadingAction !== null}
              aria-label={t('approval.editReplyTitle')}
              onChange={(e) => {
                setEditedText(e.target.value);
                if (pendingWarnings.length > 0) setPendingWarnings([]);
                if (errorKey) setErrorKey(null);
              }}
              className="w-full min-h-[128px] rounded-xl border border-border bg-surface p-3.5 text-base text-text leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="text-text-muted">
                {t('approval.charCountHint')}
              </span>
              <span
                className={cn(
                  'font-mono font-semibold [direction:ltr]',
                  trimmedLength < MIN_CHARS || charCount > MAX_CHARS
                    ? 'text-danger'
                    : 'text-text-muted'
                )}
              >
                {charCount} / {MAX_CHARS}
              </span>
            </div>
          </div>
        ) : (
          <p
            dir="auto"
            className="whitespace-pre-wrap text-base text-text leading-relaxed"
          >
            {editedText}
          </p>
        )}
      </Card>

      {/* Owner Edit Safety Confirmation Banner */}
      {pendingWarnings.length > 0 && (
        <div
          role="alert"
          className="rounded-2xl border border-warning/40 bg-warning-surface/90 dark:bg-warning-surface/25 p-4 text-start space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <Icon
              icon={AlertTriangle}
              size={18}
              className="text-warning shrink-0 mt-0.5"
            />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-text">
                {t('approval.warningTitle')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('approval.warningDesc')}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={loadingAction === 'edit'}
              disabled={loadingAction !== null}
              onClick={() => handleAction('edit', true)}
              className="w-full sm:w-auto"
            >
              {t('approval.confirmAndPostAnyway')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loadingAction !== null}
              onClick={() => setPendingWarnings([])}
              className="w-full sm:w-auto"
            >
              {t('approval.backToEdit')}
            </Button>
          </div>
        </div>
      )}

      {/* Safe Localized Action Error */}
      {errorKey && (
        <InlineBanner
          variant="danger"
          onDismiss={() => setErrorKey(null)}
        >
          {t(errorKey)}
        </InlineBanner>
      )}

      {/* Pinned Mobile Action Bar */}
      <div
        data-testid="approval-action-bar"
        className="sticky bottom-0 z-20 -mx-4 px-4 pt-3 pb-4 bg-background/95 backdrop-blur-md border-t border-border sm:static sm:mx-0 sm:px-0 sm:pt-1 sm:pb-0 sm:bg-transparent sm:border-0"
      >
        <div className="space-y-2.5">
          {isEditing ? (
            <Button
              variant="primary"
              size="lg"
              loading={loadingAction === 'edit'}
              disabled={loadingAction !== null || !isCharValid}
              onClick={() => handleAction('edit')}
              startIcon={<Icon icon={Check} size={20} strokeWidth={2.5} />}
              className="w-full text-base font-extrabold shadow-sm"
            >
              {loadingAction === 'edit'
                ? t('approval.publishing')
                : t('approval.postMyEdit')}
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              loading={loadingAction === 'approve'}
              disabled={loadingAction !== null}
              onClick={() => handleAction('approve')}
              startIcon={<Icon icon={Check} size={20} strokeWidth={2.5} />}
              className="w-full text-base font-extrabold shadow-sm"
            >
              {loadingAction === 'approve'
                ? t('approval.publishing')
                : needsCarefulHandling
                ? t('approval.carefulApproveAndPost')
                : t('approval.approveAndPost')}
            </Button>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <Button
              variant="outline"
              size="md"
              disabled={loadingAction !== null}
              onClick={() => {
                if (isEditing) {
                  setIsEditing(false);
                  setEditedText(initialDraftBody);
                  setPendingWarnings([]);
                  setErrorKey(null);
                } else {
                  setIsEditing(true);
                }
              }}
              startIcon={!isEditing ? <Icon icon={Pencil} size={16} /> : undefined}
              className="w-full font-semibold"
            >
              {isEditing ? t('approval.cancelEdit') : t('approval.edit')}
            </Button>

            <Button
              variant="ghost"
              size="md"
              loading={loadingAction === 'skip'}
              disabled={loadingAction !== null}
              onClick={() => handleAction('skip')}
              startIcon={<Icon icon={SkipForward} size={16} directional />}
              className="w-full border border-border bg-surface/60 font-semibold text-text-muted hover:text-text"
            >
              {loadingAction === 'skip'
                ? t('approval.skipping')
                : t('approval.skip')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
