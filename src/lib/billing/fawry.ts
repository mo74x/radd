/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import crypto from 'node:crypto';
import { CheckoutParams, CheckoutResult, PLAN_PRICING } from './types';

/**
 * Creates Fawry payment reference / checkout URL for Egyptian kiosk & Fawry wallet payments.
 */
export async function createFawryCheckout(
  params: CheckoutParams
): Promise<CheckoutResult> {
  const pricing = PLAN_PRICING[params.plan];
  const amountCents = pricing.egpPriceCents;
  const priceFormatted = (amountCents / 100).toFixed(2);
  const currency = 'EGP';

  const merchantCode = process.env.FAWRY_MERCHANT_CODE || '10101010';
  const merchantSecKey = process.env.FAWRY_SECURITY_KEY || 'fawry_test_security_key';
  const merchantRefNum = `fawry_${params.businessId}_${params.plan}_${Date.now()}`;

  // Fawry signature formula: SHA-256(merchantCode + merchantRefNum + customerProfileId + itemId + quantity + price + securityKey)
  const customerProfileId = params.customerPhone?.replace(/\D/g, '') || '01000000000';
  const itemId = `plan_${params.plan}`;
  const quantity = '1';

  const rawHashString = `${merchantCode}${merchantRefNum}${customerProfileId}${itemId}${quantity}${priceFormatted}${merchantSecKey}`;
  const signature = crypto.createHash('sha256').update(rawHashString, 'utf8').digest('hex');

  const checkoutUrl = `https://atfawry.fawrystaging.com/ECommerceWeb/Fawry/payments/charge?merchantCode=${merchantCode}&merchantRefNum=${merchantRefNum}&signature=${signature}&price=${priceFormatted}`;

  return {
    checkoutUrl,
    referenceId: merchantRefNum,
    gateway: 'fawry',
    currency,
    amountCents,
  };
}

/**
 * Verifies Fawry webhook callback signature.
 * Formula: SHA-256(fawryRefNumber + merchantRefNum + paymentAmount + orderAmount + orderStatus + paymentMethod + securityKey)
 */
export function verifyFawrySignature(
  body: Record<string, any>,
  securityKey = process.env.FAWRY_SECURITY_KEY || 'fawry_test_security_key'
): boolean {
  const {
    fawryRefNumber,
    merchantRefNumber,
    paymentAmount,
    orderAmount,
    orderStatus,
    paymentMethod,
    messageSignature,
  } = body;

  if (!messageSignature) return false;

  const raw = `${fawryRefNumber || ''}${merchantRefNumber || ''}${
    typeof paymentAmount === 'number' ? paymentAmount.toFixed(2) : paymentAmount || ''
  }${
    typeof orderAmount === 'number' ? orderAmount.toFixed(2) : orderAmount || ''
  }${orderStatus || ''}${paymentMethod || ''}${securityKey}`;

  const computed = crypto.createHash('sha256').update(raw, 'utf8').digest('hex');

  const computedBuf = Buffer.from(computed.toLowerCase());
  const providedBuf = Buffer.from(String(messageSignature).toLowerCase());
  if (computedBuf.length !== providedBuf.length) return false;

  return crypto.timingSafeEqual(computedBuf, providedBuf);
}
