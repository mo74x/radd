import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';


/**
 * Health check endpoint for deployment uptime and cheap database ping.
 * Never exposes credentials, tokens, or internal error traces.
 */
export async function GET() {
  const startTime = Date.now();
  let dbStatus: 'connected' | 'error' = 'connected';

  try {
    const { error } = await supabaseAdmin.from('businesses').select('id').limit(1);
    if (error) {
      dbStatus = 'error';
    }
  } catch {
    dbStatus = 'error';
  }

  const isHealthy = dbStatus === 'connected';

  return NextResponse.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      latencyMs: Date.now() - startTime,
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    }
  );
}
