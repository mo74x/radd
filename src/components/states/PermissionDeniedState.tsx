'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Card, CardContent, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { PermissionDeniedIllustration } from './BrandIllustrations';

export interface PermissionDeniedStateProps {
  className?: string;
  action?: React.ReactNode;
}

export const PermissionDeniedState: React.FC<PermissionDeniedStateProps> = ({
  className,
  action,
}) => {
  const { t, isRtl } = useI18n();
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  return (
    <Card elevated className={`max-w-lg mx-auto text-center p-6 sm:p-10 ${className || ''}`}>
      <CardContent className="flex flex-col items-center space-y-5">
        <PermissionDeniedIllustration className="w-36 h-36" />

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-text">
            {t('globalStates.permissionDeniedTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md">
            {t('globalStates.permissionDeniedDesc')}
          </p>
        </div>

        {action ? (
          action
        ) : (
          <Link
            href="/dashboard"
            className="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors"
          >
            <span>{t('globalStates.backToHome')}</span>
            <Icon icon={ArrowIcon} size={16} />
          </Link>
        )}
      </CardContent>
    </Card>
  );
};
