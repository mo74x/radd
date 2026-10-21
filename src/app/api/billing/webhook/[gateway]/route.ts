/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { processBillingWebhook } from '@/lib/billing/service';
import { SubscriptionGateway } from '@/types/database';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ gateway: string }> | { gateway: string } }
) {
  try {
    const resolvedParams = await props.params;
    const gateway = resolvedParams.gateway as SubscriptionGateway;

    if (!['paymob', 'fawry', 'stripe'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid gateway' }, { status: 400 });
    }

    const rawBody = await req.text();
    let body: any = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      // Body may be form urlencoded in some test configurations
    }

    const result = await processBillingWebhook({
      gateway,
      rawBody,
      body,
      headers: req.headers,
    });

    return NextResponse.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Billing Webhook Error]:', message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
