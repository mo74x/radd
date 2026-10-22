import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { LandingPageView } from './LandingPageView';

async function AuthCheck() {
  let hasUser = false;
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      hasUser = true;
    }
  } catch {
    // Treat error or lack of auth cookies as unauthenticated guest
  }

  if (hasUser) {
    redirect('/dashboard');
  }

  return null;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <AuthCheck />
      </Suspense>
      <LandingPageView />
    </>
  );
}
