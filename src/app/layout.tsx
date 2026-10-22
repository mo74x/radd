import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { DEFAULT_LOCALE, getDirection } from '@/lib/i18n';
import { I18nProvider } from '@/lib/i18n/context';
import { ToastProvider } from '@/components/ui/Toast';
import { OfflineNotice } from '@/components/states/OfflineNotice';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['400', '600', '800'],
  variable: '--font-cairo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'رَدّ (Radd) – الرد الذكي على تقييمات جوجل',
  description: 'منصة ذكية تصيغ ردوداً احترافية على تقييمات جوجل للأعمال المحلية مع اعتماد فوري بنقرة واحدة.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang={DEFAULT_LOCALE}
      dir={getDirection(DEFAULT_LOCALE)}
      className={`${cairo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-text">
        <I18nProvider initialLocale={DEFAULT_LOCALE}>
          <ToastProvider>
            {children}
            <OfflineNotice />
          </ToastProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
