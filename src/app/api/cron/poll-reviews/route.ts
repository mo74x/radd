import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { pollAllActiveLocations } from '@/lib/google/ingestor';
import { processFailedAndStuckDrafts } from '@/lib/approvals';


function verifyCronAuth(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.trim().length === 0) {
    return false;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return false;
  }

  const expected = `Bearer ${cronSecret}`;
  const headerBuf = Buffer.from(authHeader);
  const expectedBuf = Buffer.from(expected);

  if (headerBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(headerBuf, expectedBuf);
}

async function handleCronExecution(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [pollSummary, retrySummary] = await Promise.all([
      pollAllActiveLocations(25),
      processFailedAndStuckDrafts(5),
    ]);

    return NextResponse.json({
      polling: pollSummary,
      retries: retrySummary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown cron error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Vercel Crons invoke endpoints via GET with Authorization: Bearer <CRON_SECRET>.
 */
export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

/**
 * Manual or external webhook triggers invoke via POST.
 */
export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}
