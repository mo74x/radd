'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { RotateCw, Home } from 'lucide-react';
import { Button, Logo, Icon } from '@/components/ui';
import { ServerErrorIllustration } from '@/components/states/BrandIllustrations';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error securely
    console.error('[Application Error]:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-primary/20">
      <header className="p-6 max-w-5xl mx-auto w-full flex items-center justify-start">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <Logo variant="lockup" size="sm" />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <ServerErrorIllustration className="w-48 h-48 mx-auto" />

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-text">
              حدث خطأ في النظام (500)
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              نواجه مشكلة مؤقتة في معالجة طلبك، تم تسجيل هذا الخطأ وجاري العمل على حله.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => reset()}
              startIcon={<Icon icon={RotateCw} size={16} />}
              className="w-full sm:w-auto"
            >
              إعادة المحاولة (Try Again)
            </Button>

            <Link
              href="/"
              className="w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:bg-surface-raised flex items-center justify-center gap-2 transition-colors"
            >
              <Icon icon={Home} size={16} />
              <span>الرئيسية</span>
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
