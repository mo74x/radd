'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
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

export default function SignUpPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
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
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) {
        setErrorMsg(error.message || t('auth.genericAuthError'));
        return;
      }

      router.push(`/auth/confirm-email?email=${encodeURIComponent(email.trim())}`);
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
          {t('auth.signUpTitle')}
        </CardTitle>
        <CardDescription>
          {t('auth.signUpSubtitle')}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSignUp}>
        <CardContent className="space-y-4">
          {errorMsg && (
            <InlineBanner variant="danger" onDismiss={() => setErrorMsg(null)}>
              {errorMsg}
            </InlineBanner>
          )}

          <Input
            label={t('auth.fullNameLabel')}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={t('auth.fullNamePlaceholder')}
            startIcon={<Icon icon={User} size={16} />}
            dir="auto"
            required
            autoComplete="name"
          />

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

          <div className="space-y-1.5">
            <label
              htmlFor="password-input"
              className="text-sm font-semibold text-text select-none text-start block"
            >
              {t('auth.passwordLabel')}
            </label>

            <div className="relative flex items-center">
              <div className="absolute start-3.5 flex items-center pointer-events-none text-text-muted">
                <Icon icon={Lock} size={16} />
              </div>

              <input
                id="password-input"
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
              htmlFor="confirm-password-input"
              className="text-sm font-semibold text-text select-none text-start block"
            >
              {t('auth.confirmPasswordLabel')}
            </label>

            <div className="relative flex items-center">
              <div className="absolute start-3.5 flex items-center pointer-events-none text-text-muted">
                <Icon icon={Lock} size={16} />
              </div>

              <input
                id="confirm-password-input"
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

          <p className="text-[11px] text-text-muted leading-relaxed">
            {t('auth.termsAgreement')}{' '}
            <span className="inline-flex items-center gap-1.5 ms-1">
              <Link
                href="/terms"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                {t('landing.terms')}
              </Link>
              <span>•</span>
              <Link
                href="/privacy"
                target="_blank"
                className="text-primary hover:underline font-medium"
              >
                {t('landing.privacy')}
              </Link>
            </span>
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            startIcon={<Icon icon={UserPlus} size={18} />}
            className="w-full shadow-xs"
          >
            {loading ? t('auth.signingUp') : t('auth.signUpButton')}
          </Button>

          <p className="text-xs text-center text-text-muted">
            {t('auth.hasAccountPrompt')}{' '}
            <Link
              href="/auth/login"
              className="font-bold text-primary hover:underline"
            >
              {t('auth.signInButton')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
