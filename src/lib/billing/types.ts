import { BusinessPlan, SubscriptionGateway, SubscriptionStatus } from '@/types/database';

export interface PlanPricing {
  plan: Exclude<BusinessPlan, 'trial'>;
  name: string;
  egpPriceCents: number; // e.g. 49900 = 499.00 EGP
  usdPriceCents: number; // e.g. 1900 = $19.00 USD
  branchesIncluded: number;
}

export const PLAN_PRICING: Record<Exclude<BusinessPlan, 'trial'>, PlanPricing> = {
  starter: {
    plan: 'starter',
    name: 'Starter Plan',
    egpPriceCents: 49900,
    usdPriceCents: 1900,
    branchesIncluded: 1,
  },
  pro: {
    plan: 'pro',
    name: 'Pro Growth Plan',
    egpPriceCents: 99900,
    usdPriceCents: 3900,
    branchesIncluded: 3,
  },
  agency: {
    plan: 'agency',
    name: 'Agency & Multi-Branch Plan',
    egpPriceCents: 249900,
    usdPriceCents: 9900,
    branchesIncluded: 10,
  },
};

export interface CheckoutParams {
  businessId: string;
  plan: Exclude<BusinessPlan, 'trial'>;
  gateway: SubscriptionGateway;
  currency?: 'EGP' | 'USD' | 'EUR';
  returnUrl?: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
}

export interface CheckoutResult {
  checkoutUrl: string;
  referenceId: string;
  gateway: SubscriptionGateway;
  currency: string;
  amountCents: number;
}

export interface WebhookProcessingResult {
  handled: boolean;
  businessId?: string;
  subscriptionId?: string;
  status?: SubscriptionStatus;
  plan?: BusinessPlan;
  gateway: SubscriptionGateway;
  message?: string;
}
