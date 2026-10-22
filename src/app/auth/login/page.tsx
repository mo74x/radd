'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, Mail, LogIn } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg(t('auth.invalidCredentialsError'));
        } else {
          setErrorMsg(error.message || t('auth.genericAuthError'));
        }
        return;
      }

      router.push('/dashboard');
      router.refresh();
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
          {t('auth.signInTitle')}
        </CardTitle>
        <CardDescription>
          {t('auth.signInSubtitle')}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSignIn}>
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password-input"
                className="text-sm font-semibold text-text select-none text-start"
              >
                {t('auth.passwordLabel')}
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              >
                {t('auth.forgotPasswordLink')}
              </Link>
            </div>

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
                autoComplete="current-password"
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
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            startIcon={<Icon icon={LogIn} size={18} />}
            className="w-full shadow-xs"
          >
            {loading ? t('auth.signingIn') : t('auth.signInButton')}
          </Button>

          <p className="text-xs text-center text-text-muted">
            {t('auth.noAccountPrompt')}{' '}
            <Link
              href="/auth/signup"
              className="font-bold text-primary hover:underline"
            >
              {t('auth.signUpLink')}
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
