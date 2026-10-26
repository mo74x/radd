import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { isDevRouteAllowed } from '@/lib/dev/gate';

export const metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function DevLayout({ children }: { children: ReactNode }) {
  if (!isDevRouteAllowed()) {
    notFound();
  }

  return <>{children}</>;
}
