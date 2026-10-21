import 'server-only';
import crypto from 'node:crypto';
import { CheckoutParams, CheckoutResult, PLAN_PRICING } from './types';

function hasLiveStripeKey(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && key.startsWith('sk_') && !key.includes('...'));
}

/**
 * Creates a Stripe Checkout session for international credit/debit card subscriptions.
 */
export async function createStripeCheckout(
  params: CheckoutParams
): Promise<CheckoutResult> {
  const pricing = PLAN_PRICING[params.plan];
  const currency = (params.currency || 'USD').toUpperCase();
  const amountCents = currency === 'USD' ? pricing.usdPriceCents : pricing.egpPriceCents;

  if (!hasLiveStripeKey()) {
    // Deterministic mock checkout session for tests & local development
    const mockSessionId = `cs_test_${params.businessId}_${params.plan}_${Date.now()}`;
    const checkoutUrl = `https://checkout.stripe.com/c/pay/${mockSessionId}`;

    return {
      checkoutUrl,
      referenceId: mockSessionId,
      gateway: 'stripe',
      currency,
      amountCents,
    };
  }

  const apiKey = process.env.STRIPE_SECRET_KEY!;
  const returnUrl = params.returnUrl || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`;

  const body = new URLSearchParams({
    mode: 'subscription',
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${returnUrl}?canceled=true`,
    'client_reference_id': params.businessId,
    'metadata[businessId]': params.businessId,
    'metadata[plan]': params.plan,
    'line_items[0][price_data][currency]': currency.toLowerCase(),
    'line_items[0][price_data][product_data][name]': `ReviewReplyBot ${pricing.name}`,
    'line_items[0][price_data][unit_amount]': String(amountCents),
    'line_items[0][price_data][recurring][interval]': 'month',
    'line_items[0][quantity]': '1',
  });

  if (params.customerEmail) {
    body.set('customer_email', params.customerEmail);
  }

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Stripe Checkout Session creation failed (${res.status}): ${errText}`);
  }

  const session = await res.json();
  return {
    checkoutUrl: session.url,
    referenceId: session.id,
    gateway: 'stripe',
    currency,
    amountCents,
  };
}

/**
 * Validates Stripe webhook signature (t=timestamp,v1=signature) using HMAC-SHA256.
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  sigHeader: string,
  secret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret',
  toleranceSeconds = 300
): boolean {
  if (!sigHeader) return false;

  const parts = sigHeader.split(',');
  let timestamp = '';
  const signatures: string[] = [];

  for (const part of parts) {
    const [key, val] = part.split('=');
    if (key === 't') timestamp = val;
    if (key === 'v1') signatures.push(val);
  }

  if (!timestamp || signatures.length === 0) return false;

  // Check timestamp drift
  const timeDiff = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (timeDiff > toleranceSeconds) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const computed = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  return signatures.some((sig) => {
    try {
      return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(sig));
    } catch {
      return false;
    }
  });
}
