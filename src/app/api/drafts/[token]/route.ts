/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  executeApprovalDecision,
  getApprovalContextByToken,
} from '@/lib/approvals/service';

const DecisionBodySchema = z.object({
  action: z.enum(['approve', 'edit', 'skip']),
  editedBody: z.string().optional(),
});

const SECURITY_HEADERS = {
  'Cache-Control': 'no-store, max-age=0, must-revalidate',
  'Referrer-Policy': 'no-referrer',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const approvalCtx = await getApprovalContextByToken(token);

  if (!approvalCtx) {
    return NextResponse.json(
      { error: 'Approval link not found' },
      { status: 404, headers: SECURITY_HEADERS }
    );
  }

  return NextResponse.json(approvalCtx, { headers: SECURITY_HEADERS });
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;

  try {
    const json = await req.json();
    const parsed = DecisionBodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.flatten() },
        { status: 400, headers: SECURITY_HEADERS }
      );
    }

    const result = await executeApprovalDecision({
      rawToken: token,
      action: parsed.data.action,
      editedBody: parsed.data.editedBody,
    });

    return NextResponse.json({ ok: true, ...result }, { headers: SECURITY_HEADERS });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 400, headers: SECURITY_HEADERS }
    );
  }
}