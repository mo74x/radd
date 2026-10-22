import React, { Suspense } from 'react';
import Link from 'next/link';
import { Logo, LanguageToggle, ThemeToggle, Spinner } from '@/components/ui';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-primary/20">
      {/* Header with Logo and Toggles */}
      <header className="w-full max-w-5xl mx-auto p-4 sm:p-6 flex items-center justify-between">
        <Link href="/" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg">
          <Logo variant="lockup" size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Centered Form Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Suspense
            fallback={
              <div className="min-h-[300px] flex items-center justify-center">
                <Spinner size="lg" className="text-primary" />
              </div>
            }
          >
            {children}
          </Suspense>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-text-muted">
        <p>© 2026 Radd (ردّ) • All rights reserved</p>
      </footer>
    </div>
  );
}
