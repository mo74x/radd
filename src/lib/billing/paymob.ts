/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import crypto from 'node:crypto';
import { CheckoutParams, CheckoutResult, PLAN_PRICING } from './types';

function hasLivePaymobKeys(): boolean {
  const key = process.env.PAYMOB_API_KEY || process.env.PAYMOB_SECRET_KEY;
  return Boolean(key && !key.includes('...') && key.length > 10);
}

/**
 * Creates a Paymob payment intention for card / mobile wallet payment in Egypt.
 */
export async function createPaymobCheckout(
  params: CheckoutParams
): Promise<CheckoutResult> {
  const pricing = PLAN_PRICING[params.plan];
  const amountCents = pricing.egpPriceCents;
  const currency = 'EGP';

  if (!hasLivePaymobKeys()) {
    // Deterministic mock checkout session for testing & development
    const mockToken = `paymob_tok_${params.businessId}_${Date.now()}`;
    const checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${
      process.env.PAYMOB_IFRAME_ID || '123456'
    }?payment_token=${mockToken}`;

    return {
      checkoutUrl,
      referenceId: mockToken,
      gateway: 'paymob',
      currency,
      amountCents,
    };
  }

  // Live Paymob Intention API
  const apiKey = process.env.PAYMOB_API_KEY!;
  const integrationId = process.env.PAYMOB_INTEGRATION_ID || '0';

  const res = await fetch('https://accept.paymob.com/v1/intention/', {
    method: 'POST',
    headers: {
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountCents,
      currency,
      payment_methods: [Number(integrationId)],
      items: [
        {
          name: `ReviewReplyBot - ${pricing.name}`,
          amount: amountCents,
          description: `Monthly subscription for ${pricing.name}`,
          quantity: 1,
        },
      ],
      billing_data: {
        first_name: params.customerName?.split(' ')[0] || 'Customer',
        last_name: params.customerName?.split(' ')[1] || 'Owner',
        email: params.customerEmail || 'owner@business.test',
        phone_number: params.customerPhone || '+201000000000',
      },
      special_reference: `sub_${params.businessId}_${params.plan}_${Date.now()}`,
      notification_url: `${process.env.APP_URL || 'http://localhost:3000'}/api/billing/webhook/paymob`,
      redirection_url: params.returnUrl || `${process.env.APP_URL || 'http://localhost:3000'}/dashboard`,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Paymob Intention creation failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const clientSecret = data.client_secret;
  const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${process.env.PAYMOB_PUBLIC_KEY}&clientSecret=${clientSecret}`;

  return {
    checkoutUrl,
    referenceId: data.id || clientSecret,
    gateway: 'paymob',
    currency,
    amountCents,
  };
}

/**
 * Validates Paymob webhook HMAC-SHA512 signature.
 * Paymob hashes concatenated transaction fields using the merchant HMAC secret.
 */
export function verifyPaymobHMAC(
  obj: Record<string, any>,
  providedHmac: string,
  secretKey = process.env.PAYMOB_HMAC_SECRET || 'test_hmac_secret'
): boolean {
  if (!providedHmac) return false;

  // Paymob concatenated transaction fields specification
  const keys = [
    'amount_cents',
    'created_at',
    'currency',
    'error_occured',
    'has_parent_transaction',
    'id',
    'integration_id',
    'is_3d_secure',
    'is_auth',
    'is_capture',
    'is_refunded',
    'is_standalone_payment',
    'is_voided',
    'order.id',
    'owner',
    'pending',
    'source_data.pan',
    'source_data.sub_type',
    'source_data.type',
    'success',
  ];

  const getVal = (path: string): string => {
    const parts = path.split('.');
    let cur: any = obj;
    for (const p of parts) {
      if (cur === null || cur === undefined) return '';
      cur = cur[p];
    }
    return cur === null || cur === undefined ? '' : String(cur);
  };

  const concatenated = keys.map(getVal).join('');
  const computed = crypto
    .createHmac('sha512', secretKey)
    .update(concatenated)
    .digest('hex');

  const computedBuf = Buffer.from(computed.toLowerCase());
  const providedBuf = Buffer.from(providedHmac.toLowerCase());
  if (computedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(computedBuf, providedBuf);
}
