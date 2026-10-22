'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Input,
  Icon,
  InlineBanner,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const { t, isRtl } = useI18n();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${origin}/auth/reset-password`,
      });

      if (error) {
        setErrorMsg(error.message || t('auth.genericAuthError'));
        return;
      }

      setSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('auth.genericAuthError'));
    } finally {
      setLoading(false);
    }
  };

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <Card elevated className="border-border shadow-md">
      <CardHeader className="text-center sm:text-start space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-black text-text">
          {t('auth.forgotPasswordTitle')}
        </CardTitle>
        <CardDescription>
          {t('auth.forgotPasswordSubtitle')}
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent className="space-y-6 pt-2">
          <InlineBanner variant="success">
            {t('auth.resetLinkSent')}
          </InlineBanner>

          <Link
            href="/auth/login"
            className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-colors hover:bg-primary/90"
          >
            <Icon icon={BackIcon} size={16} />
            <span>{t('auth.backToSignIn')}</span>
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleReset}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <InlineBanner variant="danger" onDismiss={() => setErrorMsg(null)}>
                {errorMsg}
              </InlineBanner>
            )}

            <Input
              label={t('auth.emailLabel')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              startIcon={<Icon icon={Mail} size={16} />}
              dir="ltr"
              required
              autoComplete="email"
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full shadow-xs"
            >
              {loading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
            </Button>

            <Link
              href="/auth/login"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1.5 self-center"
            >
              <Icon icon={BackIcon} size={14} />
              <span>{t('auth.backToSignIn')}</span>
            </Link>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
