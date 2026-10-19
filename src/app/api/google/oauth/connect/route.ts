import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');
  if (!businessId) {
    return NextResponse.json({ error: 'Missing businessId query parameter' }, { status: 400 });
  }

  // In mock mode, redirect straight to callback with a simulated code
  if (process.env.GOOGLE_API_MODE !== 'live') {
    const mockCallbackUrl = new URL('/api/google/oauth/callback', process.env.NEXT_PUBLIC_APP_URL);
    mockCallbackUrl.searchParams.set('code', 'mock_auth_code');
    mockCallbackUrl.searchParams.set('state', businessId);
    return NextResponse.redirect(mockCallbackUrl);
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID!);
  authUrl.searchParams.set('redirect_uri', process.env.GOOGLE_REDIRECT_URI!);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/business.manage email');
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', businessId);

  return NextResponse.redirect(authUrl);
}