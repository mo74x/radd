'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw } from 'lucide-react';
import { Button, Card, CardContent, Icon, InlineBanner } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { GoogleRevokedIllustration } from './BrandIllustrations';

export interface GoogleRevokedStateProps {
  businessId?: string;
  variant?: 'banner' | 'fullpage';
  errorMessage?: string | null;
  onReconnectClick?: () => void;
  className?: string;
}

export const GoogleRevokedState: React.FC<GoogleRevokedStateProps> = ({
  businessId,
  variant = 'banner',
  errorMessage,
  onReconnectClick,
  className,
}) => {
  const router = useRouter();
  const { t } = useI18n();

  const handleReconnect = () => {
    if (onReconnectClick) {
      onReconnectClick();
      return;
    }
    if (businessId) {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(`/api/google/oauth/connect?businessId=${encodeURIComponent(businessId)}`);
    } else {
      router.push('/dashboard/settings?tab=google');
    }
  };

  if (variant === 'banner') {
    return (
      <InlineBanner
        variant="danger"
        title={t('globalStates.googleRevokedTitle')}
        className={className}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
          <p className="text-xs text-text-muted leading-relaxed">
            {errorMessage || t('globalStates.googleRevokedDesc')}
          </p>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReconnect}
            startIcon={<Icon icon={RotateCw} size={14} />}
            className="shrink-0 self-start sm:self-center"
          >
            {t('globalStates.reconnectNow')}
          </Button>
        </div>
      </InlineBanner>
    );
  }

  return (
    <Card elevated className={`max-w-lg mx-auto text-center p-6 sm:p-10 ${className || ''}`}>
      <CardContent className="flex flex-col items-center space-y-5">
        <GoogleRevokedIllustration className="w-36 h-36" />

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold text-text">
            {t('globalStates.googleRevokedTitle')}
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-md">
            {errorMessage || t('globalStates.googleRevokedDesc')}
          </p>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleReconnect}
          startIcon={<Icon icon={RotateCw} size={18} />}
          className="shadow-sm"
        >
          {t('globalStates.reconnectNow')}
        </Button>
      </CardContent>
    </Card>
  );
};
