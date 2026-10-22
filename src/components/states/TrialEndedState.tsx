'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button, Card, CardContent, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { TrialEndedIllustration } from './BrandIllustrations';

export interface TrialEndedStateProps {
  className?: string;
  onUpgradeClick?: () => void;
}

export const TrialEndedState: React.FC<TrialEndedStateProps> = ({
  className,
  onUpgradeClick,
}) => {
  const { t, isRtl } = useI18n();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <Card elevated className={`max-w-lg mx-auto text-center p-6 sm:p-10 ${className || ''}`}>
      <CardContent className="flex flex-col items-center space-y-5">
        <TrialEndedIllustration className="w-36 h-36" />

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-text">
            {t('globalStates.trialEndedTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md">
            {t('globalStates.trialEndedDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto">
          {onUpgradeClick ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onUpgradeClick}
              startIcon={<Icon icon={CreditCard} size={18} />}
              className="w-full sm:w-auto"
            >
              {t('globalStates.upgradeNow')}
            </Button>
          ) : (
            <Link
              href="/dashboard/settings?tab=billing"
              className="w-full sm:w-auto min-h-[48px] px-6 py-2.5 rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent-hover flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              <span>{t('globalStates.upgradeNow')}</span>
              <Icon icon={ArrowIcon} size={16} />
            </Link>
          )}

          <Link
            href="/dashboard"
            className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:bg-surface-raised flex items-center justify-center transition-colors"
          >
            {t('globalStates.backToHome')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};
