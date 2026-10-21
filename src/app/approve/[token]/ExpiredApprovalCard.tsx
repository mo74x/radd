'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock, MailCheck, RefreshCw, ArrowUpRight } from 'lucide-react';
import { Button, Card, InlineBanner, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

interface ExpiredApprovalCardProps {
  token: string;
}

export default function ExpiredApprovalCard({ token }: ExpiredApprovalCardProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    channel: string;
    targetMasked: string;
  } | null>(null);
  const [hasError, setHasError] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleRenew() {
    setLoading(true);
    setHasError(false);

    try {
      const res = await fetch(`/api/drafts/${token}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 && typeof data?.retryAfterSeconds === 'number') {
          setCountdown(data.retryAfterSeconds);
        } else {
          setHasError(true);
        }
        return;
      }

      setResult({
        channel: data.channel || 'email',
        targetMasked: data.targetMasked || '***',
      });
    } catch {
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <Card
        data-testid="approval-state-renewed"
        className="border-success/30 bg-success-surface/60 dark:bg-success-surface/25 p-5 sm:p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
          <Icon icon={MailCheck} size={24} />
        </div>
        <h2 className="text-lg font-extrabold text-text">
          {t('approval.newLinkSentTitle')}
        </h2>
        <p className="mt-1.5 text-sm text-text-muted leading-relaxed">
          {t('approval.newLinkSentDesc')}
        </p>

        <div className="mt-3 rounded-xl border border-border bg-surface p-3.5 shadow-2xs">
          <p className="font-mono text-sm font-bold text-primary [direction:ltr]">
            {result.targetMasked}
          </p>
          <p className="mt-2 text-xs text-text-muted">
            {t('approval.newLinkSecurityNote')}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      data-testid="approval-state-expired"
      className="border-warning/40 bg-warning-surface/70 dark:bg-warning-surface/25 p-5 sm:p-6 text-center space-y-4"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning">
        <Icon icon={Clock} size={24} />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-lg font-extrabold text-text">
          {t('approval.expiredTitle')}
        </h2>
        <p className="text-sm text-text-muted leading-relaxed">
          {t('approval.expiredDesc')}
        </p>
      </div>

      {hasError && (
        <InlineBanner variant="danger" onDismiss={() => setHasError(false)}>
          {t('approval.renewErrorGeneric')}
        </InlineBanner>
      )}

      <div className="space-y-2.5 pt-1">
        <Button
          variant="primary"
          size="lg"
          loading={loading}
          disabled={loading || countdown !== null}
          onClick={handleRenew}
          startIcon={<Icon icon={RefreshCw} size={18} />}
          className="w-full font-extrabold"
        >
          {loading
            ? t('approval.sendingNewLink')
            : countdown !== null
            ? `${t('approval.waitCooldown')} (${countdown}s)`
            : t('approval.sendNewLink')}
        </Button>

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
