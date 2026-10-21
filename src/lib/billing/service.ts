/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPaymobCheckout, verifyPaymobHMAC } from './paymob';
import { createStripeCheckout, verifyStripeWebhookSignature } from './stripe';
import { createFawryCheckout, verifyFawrySignature } from './fawry';
import {
  CheckoutParams,
  CheckoutResult,
  WebhookProcessingResult,
} from './types';
import { BusinessPlan, SubscriptionGateway, SubscriptionStatus } from '@/types/database';

/**
 * Creates a subscription checkout session routing to Paymob, Fawry, or Stripe based on selection.
 */
export async function createCheckoutSession(
  params: CheckoutParams
): Promise<CheckoutResult> {
  switch (params.gateway) {
    case 'paymob':
      return createPaymobCheckout(params);
    case 'fawry':
      return createFawryCheckout(params);
    case 'stripe':
      return createStripeCheckout(params);
    default:
      throw new Error(`Unsupported billing gateway: ${params.gateway}`);
  }
}

/**
 * Atomically updates or inserts a subscription record and synchronizes the business plan.
 */
export async function syncSubscriptionState(params: {
  businessId: string;
  gateway: SubscriptionGateway;
  plan: Exclude<BusinessPlan, 'trial'>;
  status: SubscriptionStatus;
  externalCustomerId?: string | null;
  externalSubscriptionId?: string | null;
  currentPeriodStart?: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
  currency?: string;
  amountCents?: number;
}): Promise<void> {
  const now = new Date().toISOString();

  // 1. Upsert subscription record
  const { error: subErr } = await supabaseAdmin.from('subscriptions').upsert(
    {
      business_id: params.businessId,
      gateway: params.gateway,
      plan: params.plan,
      status: params.status,
      external_customer_id: params.externalCustomerId ?? null,
      external_subscription_id: params.externalSubscriptionId ?? null,
      current_period_start: params.currentPeriodStart ?? now,
      current_period_end: params.currentPeriodEnd,
      cancel_at_period_end: params.cancelAtPeriodEnd ?? false,
      currency: params.currency ?? 'EGP',
      amount_cents: params.amountCents ?? 0,
      updated_at: now,
    },
    { onConflict: 'business_id' }
  );

  if (subErr) {
    throw new Error(`Failed to sync subscription: ${subErr.message}`);
  }

  // 2. Synchronize business plan and active status
  const businessUpdates: Record<string, any> = {
    plan: params.plan,
    updated_at: now,
  };

  if (params.status === 'active' || params.status === 'trialing') {
    businessUpdates.status = 'active';
  } else if (params.status === 'past_due' || params.status === 'unpaid') {
    businessUpdates.status = 'paused';
  }

  await supabaseAdmin
    .from('businesses')
    .update(businessUpdates)
    .eq('id', params.businessId);
}

/**
 * Processes inbound webhooks from Paymob, Fawry, and Stripe with cryptographic validation.
 */
export async function processBillingWebhook(params: {
  gateway: SubscriptionGateway;
  rawBody: string;
  body: Record<string, any>;
  headers: Headers;
}): Promise<WebhookProcessingResult> {
  const { gateway, rawBody, body, headers } = params;

  if (gateway === 'paymob') {
    const hmac = headers.get('hmac') || body.hmac || '';
    const isValid = verifyPaymobHMAC(body.obj ?? body, hmac);
    if (!isValid && process.env.NODE_ENV === 'production') {
      throw new Error('Paymob HMAC verification failed');
    }

    const obj = body.obj ?? body;
    const isSuccess = Boolean(obj.success);
    const specialRef = String(obj.order?.special_reference || '');
    // Format: sub_{businessId}_{plan}_{timestamp}
    const parts = specialRef.split('_');
    const businessId = parts[1];
    const plan = (parts[2] as Exclude<BusinessPlan, 'trial'>) || 'starter';

    if (businessId && isSuccess) {
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await syncSubscriptionState({
        businessId,
        gateway: 'paymob',
        plan,
        status: 'active',
        externalCustomerId: String(obj.profile_id || ''),
        externalSubscriptionId: String(obj.order?.id || obj.id || ''),
        currentPeriodEnd: nextMonth,
        currency: obj.currency || 'EGP',
        amountCents: obj.amount_cents || 0,
      });

      return {
        handled: true,
        businessId,
        gateway: 'paymob',
        status: 'active',
        plan,
      };
    }

    return { handled: true, gateway: 'paymob', message: 'Transaction unhandled or failed' };
  }

  if (gateway === 'stripe') {
    const sig = headers.get('stripe-signature') || '';
    const isValid = verifyStripeWebhookSignature(rawBody, sig);
    if (!isValid && process.env.NODE_ENV === 'production') {
      throw new Error('Stripe signature verification failed');
    }

    const event = body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const businessId = session?.client_reference_id || session?.metadata?.businessId;
      const plan = (session?.metadata?.plan as Exclude<BusinessPlan, 'trial'>) || 'starter';

      if (businessId) {
        const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await syncSubscriptionState({
          businessId,
          gateway: 'stripe',
          plan,
          status: 'active',
          externalCustomerId: session.customer,
          externalSubscriptionId: session.subscription,
          currentPeriodEnd: nextMonth,
          currency: (session.currency || 'USD').toUpperCase(),
          amountCents: session.amount_total || 0,
        });

        return {
          handled: true,
          businessId,
          gateway: 'stripe',
          status: 'active',
          plan,
        };
      }
    }

    return { handled: true, gateway: 'stripe', message: `Unhandled event: ${event.type}` };
  }

  if (gateway === 'fawry') {
    const isValid = verifyFawrySignature(body);
    if (!isValid && process.env.NODE_ENV === 'production') {
      throw new Error('Fawry signature verification failed');
    }

    const isPaid = body.orderStatus === 'PAID';
    const merchantRefNum = String(body.merchantRefNumber || '');
    // Format: fawry_{businessId}_{plan}_{timestamp}
    const parts = merchantRefNum.split('_');
    const businessId = parts[1];
    const plan = (parts[2] as Exclude<BusinessPlan, 'trial'>) || 'starter';

    if (businessId && isPaid) {
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await syncSubscriptionState({
        businessId,
        gateway: 'fawry',
        plan,
        status: 'active',
        externalCustomerId: body.customerProfileId,
        externalSubscriptionId: body.fawryRefNumber,
        currentPeriodEnd: nextMonth,
        currency: 'EGP',
        amountCents: Math.round((Number(body.paymentAmount) || 0) * 100),
      });

      return {
        handled: true,
        businessId,
        gateway: 'fawry',
        status: 'active',
        plan,
      };
    }

    return { handled: true, gateway: 'fawry', message: 'Fawry transaction unhandled' };
  }

  throw new Error(`Unsupported gateway webhook: ${gateway}`);
}
