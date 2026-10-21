/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import { SubscriptionRequiredError } from '../src/lib/billing/entitlements';
import { createPaymobCheckout, verifyPaymobHMAC } from '../src/lib/billing/paymob';
import { createStripeCheckout, verifyStripeWebhookSignature } from '../src/lib/billing/stripe';
import { createFawryCheckout, verifyFawrySignature } from '../src/lib/billing/fawry';
import { createCheckoutSession } from '../src/lib/billing/service';
import {
  normalizeWhatsAppDestination,
  buildWhatsAppTemplatePayload,
  sendWhatsAppNotification,
  sendWhatsAppReconnectionAlert,
} from '../src/lib/notifications/whatsapp';
import { sendOwnerNotification } from '../src/lib/notifications/dispatcher';
import { BusinessRow, LocationRow, ReviewRow, DraftRow } from '../src/types/database';

describe('Billing & Subscriptions (Item 8)', () => {
  describe('Paymob Egyptian Gateway', () => {
    it('creates Paymob checkout intention with correct EGP plan pricing', async () => {
      const res = await createPaymobCheckout({
        businessId: 'biz-test-1',
        plan: 'starter',
        gateway: 'paymob',
      });

      assert.strictEqual(res.gateway, 'paymob');
      assert.strictEqual(res.currency, 'EGP');
      assert.strictEqual(res.amountCents, 49900); // 499 EGP
      assert.ok(res.checkoutUrl.includes('accept.paymob.com'));
      assert.ok(res.referenceId.startsWith('paymob_tok_'));
    });

    it('cryptographically validates authentic Paymob HMAC-SHA512 signatures', () => {
      const hmacSecret = 'sec_paymob_test_hmac_123';
      const sampleObj = {
        amount_cents: 49900,
        created_at: '2026-10-21T01:00:00',
        currency: 'EGP',
        error_occured: false,
        has_parent_transaction: false,
        id: 998877,
        integration_id: 12345,
        is_3d_secure: true,
        is_auth: false,
        is_capture: false,
        is_refunded: false,
        is_standalone_payment: true,
        is_voided: false,
        order: { id: 554433 },
        owner: 101,
        pending: false,
        source_data: {
          pan: '2345',
          sub_type: 'MasterCard',
          type: 'card',
        },
        success: true,
      };

      // Compute expected HMAC-SHA512
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
      const getVal = (pathStr: string): string => {
        const parts = pathStr.split('.');
        let cur: any = sampleObj;
        for (const p of parts) {
          if (cur === null || cur === undefined) return '';
          cur = cur[p];
        }
        return cur === null || cur === undefined ? '' : String(cur);
      };
      const concatenated = keys.map(getVal).join('');
      const validHmac = crypto
        .createHmac('sha512', hmacSecret)
        .update(concatenated)
        .digest('hex');

      // Authentic HMAC passes
      assert.strictEqual(verifyPaymobHMAC(sampleObj, validHmac, hmacSecret), true);

      // Tampered amount or fake HMAC fails
      assert.strictEqual(
        verifyPaymobHMAC(
          { ...sampleObj, amount_cents: 100 },
          validHmac,
          hmacSecret
        ),
        false
      );
      assert.strictEqual(
        verifyPaymobHMAC(sampleObj, 'tampered_fake_hmac', hmacSecret),
        false
      );
    });
  });

  describe('Stripe International Gateway', () => {
    it('creates Stripe checkout session with USD pricing', async () => {
      const res = await createStripeCheckout({
        businessId: 'biz-intl-1',
        plan: 'pro',
        gateway: 'stripe',
        currency: 'USD',
      });

      assert.strictEqual(res.gateway, 'stripe');
      assert.strictEqual(res.currency, 'USD');
      assert.strictEqual(res.amountCents, 3900); // $39.00 USD
      assert.ok(res.checkoutUrl.includes('checkout.stripe.com'));
      assert.ok(res.referenceId.startsWith('cs_test_'));
    });

    it('cryptographically validates authentic Stripe timestamped webhook signatures', () => {
      const secret = 'whsec_test_stripe_secret_456';
      const payload = JSON.stringify({
        type: 'checkout.session.completed',
        id: 'evt_123',
      });
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${payload}`, 'utf8')
        .digest('hex');

      const sigHeader = `t=${timestamp},v1=${signature}`;

      // Valid signature passes
      assert.strictEqual(
        verifyStripeWebhookSignature(payload, sigHeader, secret),
        true
      );

      // Tampered payload fails
      assert.strictEqual(
        verifyStripeWebhookSignature(payload + 'x', sigHeader, secret),
        false
      );

      // Expired timestamp (> 300s) fails
      const expiredHeader = `t=${timestamp - 600},v1=${signature}`;
      assert.strictEqual(
        verifyStripeWebhookSignature(payload, expiredHeader, secret),
        false
      );
    });
  });

  describe('Fawry Egyptian Kiosk Gateway', () => {
    it('creates Fawry payment charge reference and URL', async () => {
      const res = await createFawryCheckout({
        businessId: 'biz-fawry-1',
        plan: 'agency',
        gateway: 'fawry',
      });

      assert.strictEqual(res.gateway, 'fawry');
      assert.strictEqual(res.currency, 'EGP');
      assert.strictEqual(res.amountCents, 249900); // 2,499 EGP
      assert.ok(res.checkoutUrl.includes('fawrystaging.com'));
      assert.ok(res.referenceId.startsWith('fawry_'));
    });

    it('validates authentic Fawry callback signature', () => {
      const secKey = 'fawry_sec_key_789';
      const body = {
        fawryRefNumber: '998811',
        merchantRefNumber: 'fawry_biz_1_starter',
        paymentAmount: 499.0,
        orderAmount: 499.0,
        orderStatus: 'PAID',
        paymentMethod: 'PAYATFAWRY',
      };
      const raw = `998811fawry_biz_1_starter499.00499.00PAIDPAYATFAWRY${secKey}`;
      const validSig = crypto.createHash('sha256').update(raw).digest('hex');

      assert.strictEqual(
        verifyFawrySignature({ ...body, messageSignature: validSig }, secKey),
        true
      );
      assert.strictEqual(
        verifyFawrySignature({ ...body, messageSignature: 'fake' }, secKey),
        false
      );
    });
  });

  describe('Unified Checkout Service Router', () => {
    it('routes checkout requests to appropriate payment provider', async () => {
      const p1 = await createCheckoutSession({
        businessId: 'biz-1',
        plan: 'starter',
        gateway: 'paymob',
      });
      assert.strictEqual(p1.gateway, 'paymob');

      const p2 = await createCheckoutSession({
        businessId: 'biz-2',
        plan: 'pro',
        gateway: 'stripe',
      });
      assert.strictEqual(p2.gateway, 'stripe');

      const p3 = await createCheckoutSession({
        businessId: 'biz-3',
        plan: 'agency',
        gateway: 'fawry',
      });
      assert.strictEqual(p3.gateway, 'fawry');
    });
  });

  describe('Entitlements & Subscriptions', () => {
    it('instantiates SubscriptionRequiredError with businessId and reason', () => {
      const err = new SubscriptionRequiredError(
        'biz-123',
        'Active subscription or trial required for AI drafting'
      );
      assert.strictEqual(err.name, 'SubscriptionRequiredError');
      assert.strictEqual(err.businessId, 'biz-123');
      assert.strictEqual(
        err.message,
        'Active subscription or trial required for AI drafting'
      );
    });
  });
});

describe('WhatsApp Approval Channel (Item 9)', () => {
  it('normalizes international phone numbers to clean Meta WhatsApp destination digits', () => {
    // Egyptian local with 0 -> international 20
    assert.strictEqual(normalizeWhatsAppDestination('01001234567'), '201001234567');
    // Egyptian with +20 prefix -> 20
    assert.strictEqual(normalizeWhatsAppDestination('+201001234567'), '201001234567');
    // Egyptian with 0020 prefix -> 20
    assert.strictEqual(normalizeWhatsAppDestination('00201001234567'), '201001234567');
    // Raw 10 digits without leading 0 -> 20
    assert.strictEqual(normalizeWhatsAppDestination('1001234567'), '201001234567');
  });

  it('builds compliant Meta Cloud API template payload with one-tap approval URL button', () => {
    const payload = buildWhatsAppTemplatePayload({
      toPhone: '+201001234567',
      templateName: 'review_reply_approval',
      languageCode: 'ar',
      businessName: 'Roastery & Co.',
      locationName: 'Roastery & Co. - فرع المعادي',
      reviewerName: 'أحمد محمود',
      rating: 5,
      reviewText: 'القهوة تحفة جداً والسبانيش لاتيه مظبوط بالملي.',
      draftReply: 'نورتنا يا أحمد! مبسوطين إن القهوة عجبتك ومستنيينك تنورنا دايماً.',
      approvalUrl: 'https://reviewbot.app/approve/secret_token_123456',
    });

    assert.strictEqual(payload.messaging_product, 'whatsapp');
    assert.strictEqual(payload.recipient_type, 'individual');
    assert.strictEqual(payload.to, '201001234567');
    assert.strictEqual(payload.type, 'template');
    assert.strictEqual(payload.template.name, 'review_reply_approval');
    assert.strictEqual(payload.template.language.code, 'ar');

    // Header component
    const header = payload.template.components.find((c: any) => c.type === 'header');
    assert.ok(header);
    assert.strictEqual(header.parameters[0].text, 'Roastery & Co. - فرع المعادي');

    // Body component
    const body = payload.template.components.find((c: any) => c.type === 'body');
    assert.ok(body);
    assert.strictEqual(body.parameters[0].text, 'أحمد محمود');
    assert.ok(body.parameters[1].text.includes('5★'));
    assert.ok(body.parameters[2].text.includes('السبانيش لاتيه'));

    // URL button component
    const button = payload.template.components.find((c: any) => c.type === 'button');
    assert.ok(button);
    assert.strictEqual(button.sub_type, 'url');
    assert.strictEqual(button.parameters[0].text, 'approve/secret_token_123456');
  });

  it('delivers WhatsApp notification and reconnection alert via dispatcher in mock mode', async () => {
    const business: BusinessRow = {
      id: 'biz-wa-1',
      owner_id: 'owner-1',
      name: 'Roastery & Co.',
      plan: 'pro',
      status: 'active',
      trial_ends_at: new Date(Date.now() + 86400000).toISOString(),
      notification_channel: 'whatsapp',
      notification_target: '+201001234567',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const location: LocationRow = {
      id: 'loc-1',
      business_id: business.id,
      google_account_id: 'acc-1',
      google_location_id: 'loc-1',
      display_name: 'Roastery & Co. - Maadi',
      contact_phone: '+201001234567',
      contact_email: 'care@roastery.test',
      is_polling_enabled: true,
      last_polled_at: null,
      last_review_update_time: null,
      poll_lock_until: null,
      poll_lock_token: null,
      created_at: new Date().toISOString(),
    };

    const review: ReviewRow = {
      id: 'rev-wa-1',
      business_id: business.id,
      location_id: location.id,
      google_review_id: 'g-rev-1',
      rating: 5,
      reviewer_name: 'Tamer',
      text: 'القهوة ممتازة',
      language: 'ar',
      flags: [],
      requires_careful_review: false,
      google_created_at: null,
      google_updated_at: null,
      created_at: new Date().toISOString(),
    };

    const draft: DraftRow = {
      id: 'draft-wa-1',
      business_id: business.id,
      review_id: review.id,
      body: 'نورتنا يا تامر! شكراً لزيارتك.',
      status: 'pending',
      final_body: null,
      approval_token_hash: 'hash_123',
      token_expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
      expires_at: new Date(Date.now() + 72 * 3600000).toISOString(),
      last_renewed_at: null,
      renewal_count: 0,
      decided_at: null,
      posted_at: null,
      last_error: null,
      attempts: 0,
      posting_started_at: null,
      next_retry_at: null,
      google_reply_posted_at: null,
      model: 'test-model',
      prompt_version: 'v1.0.0',
      created_at: new Date().toISOString(),
    };

    // 1. Send owner WhatsApp review approval notification
    const res = await sendOwnerNotification({
      business,
      location,
      review,
      draft,
      approvalUrl: 'https://reviewbot.app/approve/test_token',
    });

    assert.strictEqual(res.channel, 'whatsapp');
    assert.strictEqual(res.delivered, true);
    assert.strictEqual(res.mode, 'mock-console');

    // 2. Send WhatsApp reconnection alert
    const reconRes = await sendWhatsAppReconnectionAlert({
      business,
      reason: 'OAuth token revoked (invalid_grant)',
      reconnectUrl: 'https://reviewbot.app/api/google/oauth/connect?businessId=biz-wa-1',
    });

    assert.strictEqual(reconRes.channel, 'whatsapp');
    assert.strictEqual(reconRes.delivered, true);
    assert.strictEqual(reconRes.mode, 'mock-console');

    // 3. Send WhatsApp review notification directly
    const directRes = await sendWhatsAppNotification({
      business,
      location,
      review,
      draft,
      approvalUrl: 'https://reviewbot.app/approve/direct_wa_token',
    });

    assert.strictEqual(directRes.channel, 'whatsapp');
    assert.strictEqual(directRes.delivered, true);
    assert.strictEqual(directRes.mode, 'mock-console');
    assert.strictEqual(directRes.detail, 'https://reviewbot.app/approve/direct_wa_token');
  });
});

