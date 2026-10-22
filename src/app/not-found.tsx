'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Logo, Icon } from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { NotFoundIllustration } from '@/components/states/BrandIllustrations';

export default function NotFoundPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-primary/20">
      <header className="p-6 max-w-5xl mx-auto w-full flex items-center justify-start">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <Logo variant="lockup" size="sm" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <NotFoundIllustration className="w-48 h-48 mx-auto" />

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-text">
              {t('globalStates.notFoundTitle')}
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              {t('globalStates.notFoundDesc')}
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <Link
              href="/"
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>{t('globalStates.backToHome')}</span>
              <Icon icon={ArrowLeft} size={16} directional />
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-text-muted">
        <p>© 2026 Radd (ردّ)</p>
      </footer>
    </div>
  );
}
