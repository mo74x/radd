/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { pollAllActiveLocations } from '@/lib/google/ingestor';
import { processFailedAndStuckDrafts } from '@/lib/approvals';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}