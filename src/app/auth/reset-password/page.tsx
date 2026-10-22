'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock } from 'lucide-react';
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

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(t('auth.passwordLengthError'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwordMismatchError'));
      return;
    }

    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setErrorMsg(error.message || t('auth.genericAuthError'));
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/auth/login');
      }, 2500);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : t('auth.genericAuthError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevated className="border-border shadow-md">
      <CardHeader className="text-center sm:text-start space-y-1 pb-4">
        <CardTitle className="text-xl sm:text-2xl font-black text-text">
          {t('auth.resetPasswordTitle')}
        </CardTitle>
        <CardDescription>
          {t('auth.resetPasswordSubtitle')}
        </CardDescription>
      </CardHeader>

      {success ? (
        <CardContent className="space-y-6 pt-2">
          <InlineBanner variant="success">
            {t('auth.passwordUpdated')}
          </InlineBanner>

          <Link
            href="/auth/login"
            className="w-full min-h-[44px] rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center transition-colors hover:bg-primary/90"
          >
            {t('auth.signInButton')}
          </Link>
        </CardContent>
      ) : (
        <form onSubmit={handleUpdatePassword}>
          <CardContent className="space-y-4">
            {errorMsg && (
              <InlineBanner variant="danger" onDismiss={() => setErrorMsg(null)}>
                {errorMsg}
              </InlineBanner>
            )}

            <div className="space-y-1.5">
              <label
                htmlFor="new-password"
                className="text-sm font-semibold text-text select-none text-start block"
              >
                {t('auth.newPasswordLabel')}
              </label>

              <div className="relative flex items-center">
                <div className="absolute start-3.5 flex items-center pointer-events-none text-text-muted">
                  <Icon icon={Lock} size={16} />
                </div>

                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full min-h-[44px] ps-10 pe-11 py-2.5 rounded-xl text-base text-text bg-surface border border-border placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-colors"
                  dir="ltr"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute end-2 min-h-[36px] min-w-[36px] flex items-center justify-center text-text-muted hover:text-text rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <Icon icon={showPassword ? EyeOff : Eye} size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="confirm-password"
                className="text-sm font-semibold text-text select-none text-start block"
              >
                {t('auth.confirmPasswordLabel')}
              </label>

              <div className="relative flex items-center">
                <div className="absolute start-3.5 flex items-center pointer-events-none text-text-muted">
                  <Icon icon={Lock} size={16} />
                </div>

                <input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('auth.passwordPlaceholder')}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full min-h-[44px] ps-10 pe-3.5 py-2.5 rounded-xl text-base text-text bg-surface border border-border placeholder:text-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-colors"
                  dir="ltr"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full shadow-xs"
            >
              {loading ? t('auth.savingNewPassword') : t('auth.saveNewPassword')}
            </Button>
          </CardFooter>
        </form>
      )}
    </Card>
  );
}
