import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BusinessPlan, BusinessRow, SubscriptionRow, SubscriptionStatus } from '@/types/database';

export class SubscriptionRequiredError extends Error {
  constructor(public businessId: string, message: string) {
    super(message);
    this.name = 'SubscriptionRequiredError';
  }
}

export interface EntitlementCheckResult {
  entitled: boolean;
  reason?: string;
  plan: BusinessPlan;
  status: SubscriptionStatus | 'active_trial' | 'expired_trial' | 'none';
  currentPeriodEnd?: string;
}

/**
 * Enforces subscription and free trial entitlement checks before generating AI drafts or sending alerts.
 */
export async function checkDraftingEntitlement(
  businessId: string
): Promise<EntitlementCheckResult> {
  // 1. Fetch business details
  const { data: business, error: bizErr } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .single<BusinessRow>();

  if (bizErr || !business) {
    throw new Error(`Business not found: ${businessId}`);
  }

  // Revocation or manual pause check
  if (business.status === 'revoked') {
    return {
      entitled: false,
      reason: 'Google OAuth connection is revoked. Reconnection required.',
      plan: business.plan,
      status: 'none',
    };
  }

  if (business.status === 'paused') {
    return {
      entitled: false,
      reason: 'Business account is paused.',
      plan: business.plan,
      status: 'none',
    };
  }

  // 2. Check for active subscription record in public.subscriptions
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('*')
    .eq('business_id', businessId)
    .maybeSingle<SubscriptionRow>();

  if (subscription) {
    const isPeriodValid =
      new Date(subscription.current_period_end).getTime() >= Date.now();

    if (
      (subscription.status === 'active' || subscription.status === 'trialing') &&
      isPeriodValid
    ) {
      return {
        entitled: true,
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end,
      };
    }

    if (subscription.status === 'past_due') {
      return {
        entitled: false,
        reason: 'Subscription payment failed (past due). Please update payment method.',
        plan: subscription.plan,
        status: 'past_due',
        currentPeriodEnd: subscription.current_period_end,
      };
    }

    if (subscription.status === 'canceled' || !isPeriodValid) {
      return {
        entitled: false,
        reason: 'Subscription period has ended. Please renew to resume AI drafting.',
        plan: subscription.plan,
        status: 'canceled',
        currentPeriodEnd: subscription.current_period_end,
      };
    }

    return {
      entitled: false,
      reason: `Subscription is inactive (${subscription.status}).`,
      plan: subscription.plan,
      status: subscription.status,
    };
  }

  // 3. Fallback to free trial period on business row
  if (business.plan === 'trial') {
    const isTrialValid =
      business.trial_ends_at &&
      new Date(business.trial_ends_at).getTime() >= Date.now();

    if (isTrialValid) {
      return {
        entitled: true,
        plan: 'trial',
        status: 'active_trial',
        currentPeriodEnd: business.trial_ends_at,
      };
    }

    return {
      entitled: false,
      reason: 'Free trial has expired. Subscribe to Starter or Pro to continue.',
      plan: 'trial',
      status: 'expired_trial',
      currentPeriodEnd: business.trial_ends_at,
    };
  }

  // Default: no subscription and not on trial
  return {
    entitled: false,
    reason: 'Active subscription required.',
    plan: business.plan,
    status: 'none',
  };
}
