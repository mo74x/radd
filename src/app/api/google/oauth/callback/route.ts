/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { connectBusinessGoogleAccount } from '@/lib/google/onboarding';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const businessId = req.nextUrl.searchParams.get('state');

  if (!code || !businessId) {
    return NextResponse.json({ error: 'Missing code or state' }, { status: 400 });
  }

  try {
    let refreshToken = 'mock_refresh_token_secret';
    let accessToken = 'mock_access_token';
    let expiresAt = new Date(Date.now() + 3600_000).toISOString();

    if (process.env.GOOGLE_API_MODE === 'live') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.refresh_token) {
        throw new Error(
          tokenData.error_description || 'No refresh_token returned. Re-authorize with prompt=consent.'
        );
      }

      refreshToken = tokenData.refresh_token;
      accessToken = tokenData.access_token;
      expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3599) * 1000).toISOString();
    }

    const discoveredLocations = await connectBusinessGoogleAccount({
      businessId,
      refreshToken,
      accessToken,
      expiresAt,
    });

    return NextResponse.redirect(
      new URL(
        `/onboarding?connected=true&locations=${discoveredLocations.length}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  } catch (err: any) {
    console.error('[Google OAuth Callback Error]:', err);
    return NextResponse.redirect(
      new URL(
        `/onboarding?error=${encodeURIComponent(err.message)}`,
        process.env.NEXT_PUBLIC_APP_URL
      )
    );
  }
}