/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { RateLimitError, renewApprovalToken } from '@/lib/approvals';

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

/**
 * GET handler: strictly no side-effects (safe against email scanner prefetching).
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to request a renewal link.' },
    {
      status: 405,
      headers: {
        ...SECURITY_HEADERS,
        Allow: 'POST',
      },
    }
  );
}

/**
 * POST handler: Securely generates a fresh 256-bit token, invalidates old token hash,
 * sets fresh 72h expires_at, and dispatches to the owner's registered channel.
 * Never exposes the raw token or magic link in the response.
 */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  try {
    const result = await renewApprovalToken(token);

    return NextResponse.json(
      {
        ok: true,
        message:
          'A fresh approval link has been securely dispatched to your registered notification channel.',
        channel: result.channel,
        targetMasked: result.targetMasked,
        expiresAt: result.expiresAt,
        renewalCount: result.renewalCount,
      },
      {
        status: 200,
        headers: SECURITY_HEADERS,
      }
    );
  } catch (err: any) {
    if (err instanceof RateLimitError) {
      return NextResponse.json(
        {
          error: err.message,
          retryAfterSeconds: err.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            ...SECURITY_HEADERS,
            ...(err.retryAfterSeconds
              ? { 'Retry-After': String(err.retryAfterSeconds) }
              : {}),
          },
        }
      );
    }

    const isNotFound = err.message?.includes('Invalid or non-existent');
    return NextResponse.json(
      { error: err.message || 'Failed to renew approval link' },
      {
        status: isNotFound ? 404 : 400,
        headers: SECURITY_HEADERS,
      }
    );
  }
}
