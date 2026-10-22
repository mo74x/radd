'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, RotateCw } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Icon,
  InlineBanner,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ConfirmEmailPage() {
  const searchParams = useSearchParams();
  const { t } = useI18n();

  const emailParam = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const handleResend = async () => {
    if (!emailParam) return;
    setResending(true);
    setResendStatus(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: emailParam,
      });

      if (error) {
        setResendStatus(error.message);
      } else {
        setResendStatus('Verification email resent successfully.');
      }
    } catch {
      setResendStatus('Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card elevated className="border-border shadow-md text-center">
      <CardHeader className="space-y-3 pb-3">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center">
          <Icon icon={Mail} size={28} />
        </div>
        <CardTitle className="text-xl sm:text-2xl font-black text-text">
          {t('auth.confirmEmailTitle')}
        </CardTitle>
        <CardDescription>
          {t('auth.confirmEmailSubtitle')}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {emailParam && (
          <div className="p-3 rounded-xl bg-surface-raised border border-border text-sm font-bold text-text font-mono" dir="ltr">
            {emailParam}
          </div>
        )}

        <p className="text-xs text-text-muted leading-relaxed">
          {t('auth.checkInboxMessage')}
        </p>

        {resendStatus && (
          <InlineBanner variant="info" onDismiss={() => setResendStatus(null)}>
            {resendStatus}
          </InlineBanner>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-2">
        {emailParam && (
          <Button
            variant="outline"
            size="md"
            loading={resending}
            onClick={handleResend}
            startIcon={<Icon icon={RotateCw} size={16} />}
            className="w-full"
          >
            {t('auth.resendEmailButton')}
          </Button>
        )}

        <Link
          href="/auth/login"
          className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center transition-colors hover:bg-primary/90"
        >
          {t('auth.signInButton')}
        </Link>
      </CardFooter>
    </Card>
  );
}
