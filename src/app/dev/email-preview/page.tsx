'use client';

import React, { useState } from 'react';
import { Mail, AlertTriangle, RotateCw } from 'lucide-react';
import { Button, Icon } from '@/components/ui';
import { renderApprovalEmail } from '@/lib/notifications/email-template';
import { renderTelegramMessage } from '@/lib/notifications/telegram-template';
import { BusinessRow, LocationRow, ReviewRow, DraftRow } from '@/types/database';

export default function EmailPreviewPage() {
  const [variant, setVariant] = useState<'arabic' | 'english' | 'flagged' | 'renewal'>('arabic');
  const [viewMode, setViewMode] = useState<'email' | 'telegram' | 'text'>('email');

  const mockBusiness: BusinessRow = {
    id: 'b1-0000-0000-0000-000000000001',
    owner_id: 'u1-0000-0000-0000-000000000001',
    name: 'محمص ومقهى السعادة (Roastery & Co.)',
    plan: 'pro',
    status: 'active',
    trial_ends_at: '2026-11-01T00:00:00Z',
    notification_channel: 'email',
    notification_target: 'owner@roastery.com',
    created_at: '2026-10-01T00:00:00Z',
    updated_at: '2026-10-01T00:00:00Z',
  };

  const mockLocation: LocationRow = {
    id: 'l1-0000-0000-0000-000000000001',
    business_id: mockBusiness.id,
    google_account_id: 'accounts/123456',
    google_location_id: 'locations/987654',
    display_name: 'محمص ومقهى السعادة - فرع المعادي',
    contact_phone: '+201001234567',
    contact_email: 'maadi@roastery.com',
    is_polling_enabled: true,
    last_polled_at: '2026-10-22T00:00:00Z',
    last_review_update_time: '2026-10-22T00:00:00Z',
    poll_lock_until: null,
    poll_lock_token: null,
    created_at: '2026-10-01T00:00:00Z',
  };

  const createMockReview = (overrides: Partial<ReviewRow> = {}): ReviewRow => ({
    id: 'rev-mock-1',
    business_id: mockBusiness.id,
    location_id: mockLocation.id,
    google_review_id: 'g-rev-1',
    rating: 5,
    reviewer_name: 'أحمد محمود',
    text: 'المكان تحفة والقهوة ممتازة والويترز محترمين جداً وخدمتهم سريعة وبشوشة. شكراً ليكم وإن شاء الله هكرر الزيارة دايماً.',
    language: 'ar',
    flags: [],
    requires_careful_review: false,
    google_created_at: '2026-10-22T00:00:00Z',
    google_updated_at: null,
    created_at: '2026-10-22T00:00:00Z',
    ...overrides,
  });

  const createMockDraft = (reviewId: string, overrides: Partial<DraftRow> = {}): DraftRow => ({
    id: 'draft-mock-1',
    business_id: mockBusiness.id,
    review_id: reviewId,
    body: 'أهلاً بك يا أحمد يا فندم! نورتنا وسعداء جداً بزيارتك ورأيك الجميل في القهوة والخدمة عندنا. نتمنى دايماً نكون عند حسن ظنك ونشوفك منورنا قريب جداً!\n\n— فريق مقهى السعادة',
    status: 'pending',
    final_body: null,
    approval_token_hash: null,
    token_expires_at: null,
    expires_at: '2026-10-25T00:00:00Z',
    last_renewed_at: null,
    renewal_count: 0,
    decided_at: null,
    posted_at: null,
    last_error: null,
    attempts: 0,
    posting_started_at: null,
    next_retry_at: null,
    google_reply_posted_at: null,
    model: 'claude-3-5-sonnet',
    prompt_version: 'v1',
    created_at: '2026-10-22T00:00:00Z',
    ...overrides,
  });

  const getPayload = () => {
    switch (variant) {
      case 'english': {
        const review = createMockReview({
          id: 'rev-en-1',
          rating: 5,
          reviewer_name: 'David Miller',
          text: 'Phenomenal specialty roast! The flat white was silky and perfectly extracted. Super friendly baristas and clean workspace.',
          language: 'en',
          flags: [],
          requires_careful_review: false,
        });
        const draft = createMockDraft(review.id, {
          id: 'draft-en-1',
          body: 'Hello David! Thank you so much for the 5-star review! We take great pride in our bean sourcing and are thrilled you loved the flat white. Hope to see you back soon!\n\n— The Roastery Team',
        });
        return {
          business: mockBusiness,
          location: { ...mockLocation, display_name: 'Roastery & Co. - Maadi Branch' },
          review,
          draft,
          approvalUrl: 'http://localhost:3000/approve/preview-token-123',
        };
      }

      case 'flagged': {
        const review = createMockReview({
          id: 'rev-flagged-1',
          rating: 1,
          reviewer_name: 'كريم عبد العزيز',
          text: 'تجربة سيئة جداً، الأكل كان بارد ومفيش أي استجابة من المدير. بطلب استرداد المبلغ فوراً أو هرفع شكوى رسمية لحماية المستهلك!',
          language: 'ar',
          requires_careful_review: true,
          flags: ['refund', 'legal'],
        });
        const draft = createMockDraft(review.id, {
          id: 'draft-flagged-1',
          body: 'أهلاً بك يا أستاذ كريم، ونأسف جداً لسماع هذه الملاحظة عن تجربتك بالفرع. إرضاؤك وحل مشكلتك أولوية بالنسبة لنا، ويسعدنا جداً تواصلك مع إدارة الفرع مباشرة عبر: +201001234567 لمتابعة الأمر باهتمام.\n\n— إدارة الفرع',
        });
        return {
          business: mockBusiness,
          location: mockLocation,
          review,
          draft,
          approvalUrl: 'http://localhost:3000/approve/preview-token-flagged',
        };
      }

      case 'renewal': {
        const review = createMockReview({
          id: 'rev-renewal-1',
          rating: 5,
          reviewer_name: 'سارة طارق',
          text: 'أفضل كافيه في المنطقة بدون منازع! القهوة والكرواسون في حتة تانية خالص.',
          language: 'ar',
        });
        const draft = createMockDraft(review.id, {
          id: 'draft-renewal-1',
          body: 'أهلاً بك يا سارة يا فندم! نورتينا وسعداء جداً بزيارتك ورأيك الجميل في القهوة والمخبوزات. نتمنى دايماً نكون عند حسن ظنك ونشوفك منورانا قريب جداً!\n\n— فريق مقهى السعادة',
          renewal_count: 1,
        });
        return {
          business: mockBusiness,
          location: mockLocation,
          review,
          draft,
          approvalUrl: 'http://localhost:3000/approve/preview-token-renewed',
          isRenewal: true,
        };
      }

      case 'arabic':
      default: {
        const review = createMockReview();
        const draft = createMockDraft(review.id);
        return {
          business: mockBusiness,
          location: mockLocation,
          review,
          draft,
          approvalUrl: 'http://localhost:3000/approve/preview-token-123',
        };
      }
    }
  };

  const payload = getPayload();
  const emailRendered = renderApprovalEmail(payload);
  const telegramRendered = renderTelegramMessage(payload);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-4 sm:p-8 space-y-6">
      {/* Header and Controls */}
      <div className="max-w-4xl mx-auto bg-surface border border-border p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-text flex items-center gap-2">
              <Icon icon={Mail} size={20} className="text-primary" />
              <span>Email & Telegram Template Preview (معاينة الإشعارات)</span>
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Subject: <span className="font-semibold text-text">{emailRendered.subject}</span>
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-center">
            <button
              type="button"
              onClick={() => setViewMode('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'email'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-raised text-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              HTML Email
            </button>
            <button
              type="button"
              onClick={() => setViewMode('telegram')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'telegram'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-raised text-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              Telegram Message
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'text'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-surface-raised text-text hover:bg-neutral-200 dark:hover:bg-neutral-800'
              }`}
            >
              Plain Text
            </button>
          </div>
        </div>

        {/* Variant Selectors */}
        <div className="flex items-center gap-2 flex-wrap border-t border-border pt-3">
          <span className="text-xs font-bold text-text-muted me-2">Variant:</span>
          <Button
            variant={variant === 'arabic' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setVariant('arabic')}
          >
            Arabic (عامية مصرية)
          </Button>

          <Button
            variant={variant === 'english' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setVariant('english')}
          >
            English 5★
          </Button>

          <Button
            variant={variant === 'flagged' ? 'destructive' : 'outline'}
            size="sm"
            onClick={() => setVariant('flagged')}
            startIcon={<Icon icon={AlertTriangle} size={14} />}
          >
            Flagged Review ⚠️
          </Button>

          <Button
            variant={variant === 'renewal' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setVariant('renewal')}
            startIcon={<Icon icon={RotateCw} size={14} />}
          >
            Renewed Link 🔄
          </Button>
        </div>
      </div>

      {/* Rendered Preview Container */}
      <div className="max-w-4xl mx-auto flex justify-center">
        {viewMode === 'email' && (
          <div className="w-full max-w-[640px] bg-white rounded-2xl shadow-xl overflow-hidden border border-border">
            <iframe
              srcDoc={emailRendered.html}
              title="Email Rendered Preview"
              className="w-full h-[760px] border-0"
            />
          </div>
        )}

        {viewMode === 'telegram' && (
          <div className="w-full max-w-md bg-[#54759e]/15 p-6 rounded-3xl border border-border space-y-4">
            <div
              className="bg-[#242f3d] text-white p-4 rounded-2xl shadow-md text-xs sm:text-sm whitespace-pre-wrap font-sans leading-relaxed text-start"
              dir="auto"
              dangerouslySetInnerHTML={{ __html: telegramRendered.text }}
            />

            {/* Telegram Inline Button */}
            <a
              href={telegramRendered.reply_markup.inline_keyboard[0][0].url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[44px] bg-[#2b5278] hover:bg-[#2b5278]/90 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center transition-colors shadow-sm"
            >
              {telegramRendered.reply_markup.inline_keyboard[0][0].text}
            </a>
          </div>
        )}

        {viewMode === 'text' && (
          <div
            className="w-full max-w-2xl bg-surface p-6 rounded-2xl border border-border font-mono text-xs text-text whitespace-pre-wrap leading-relaxed shadow-sm text-start"
            dir="auto"
          >
            {emailRendered.text}
          </div>
        )}
      </div>
    </div>
  );
}
