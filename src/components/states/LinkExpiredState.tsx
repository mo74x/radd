'use client';

import React from 'react';
import Link from 'next/link';
import { Clock, RotateCw } from 'lucide-react';
import { Button, Card, CardContent, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

export interface LinkExpiredStateProps {
  type?: 'expired' | 'used';
  onRenewClick?: () => Promise<void> | void;
  loading?: boolean;
  className?: string;
}

export const LinkExpiredState: React.FC<LinkExpiredStateProps> = ({
  type = 'expired',
  onRenewClick,
  loading = false,
  className,
}) => {
  const { t } = useI18n();

  const title =
    type === 'used'
      ? t('approval.usedLinkTitle')
      : t('approval.expiredTitle');

  const desc =
    type === 'used'
      ? t('approval.usedLinkDesc')
      : t('approval.expiredDesc');

  return (
    <Card elevated className={`max-w-md mx-auto text-center p-6 sm:p-8 ${className || ''}`}>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
          <Icon icon={Clock} size={28} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-text">
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
            {desc}
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-2.5 w-full">
          {onRenewClick && (
            <Button
              variant="primary"
              size="md"
              loading={loading}
              onClick={onRenewClick}
              startIcon={<Icon icon={RotateCw} size={16} />}
              className="w-full"
            >
              {t('approval.sendNewLink')}
            </Button>
          )}

          <Link
            href="/dashboard"
            className="w-full min-h-[44px] rounded-xl border border-border bg-surface text-text font-semibold text-xs sm:text-sm flex items-center justify-center hover:bg-surface-raised transition-colors"
          >
            {t('approval.goToDashboard')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
