'use client';

import React, { useMemo } from 'react';
import { Sparkles, MessageSquare, Phone, Info } from 'lucide-react';
import { z } from 'zod';
import {
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  StarRating,
  Icon,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { TagInput } from './TagInput';

import { ArabicDialect } from '@/types/database';

export interface BrandVoiceData {
  businessName: string;
  tone: string;
  dialect: ArabicDialect;
  signature: string;
  contactPhone: string;
  doList: string[];
  dontList: string[];
  exampleReplies: string;
}

export interface Step2BrandVoiceProps {
  data: BrandVoiceData;
  onChange: (updated: Partial<BrandVoiceData>) => void;
  errors?: Record<string, string>;
}

export const createBrandVoiceSchema = (isArabic: boolean) =>
  z.object({
    businessName: z
      .string()
      .min(2, isArabic ? 'اسم النشاط التجاري يجب أن يتكون من حرفين على الأقل' : 'Business name must be at least 2 characters'),
    tone: z
      .string()
      .min(3, isArabic ? 'يرجى كتابة وصف لنبرة الصوت (٣ أحرف على الأقل)' : 'Please specify a tone description (min 3 characters)'),
    signature: z
      .string()
      .min(1, isArabic ? 'يرجى كتابة التوقيع الذي يختم به الرد' : 'Signature is required'),
    contactPhone: z
      .string()
      .optional()
      .refine(
        (val) => !val || /^[+0-9\s-]{6,20}$/.test(val.trim()),
        isArabic ? 'صيغة رقم الهاتف غير صحيحة (مثال: +201001234567)' : 'Invalid phone format (e.g. +201001234567)'
      ),
  });

export const Step2BrandVoice: React.FC<Step2BrandVoiceProps> = ({
  data,
  onChange,
  errors = {},
}) => {
  const { t, locale, isRtl } = useI18n();

  // Generate dynamic live preview reply based on current state
  const livePreviewReply = useMemo(() => {
    const isEn = locale === 'en';
    const signature = data.signature.trim() || (isEn ? 'The Team' : 'فريق العمل');
    const phone = data.contactPhone.trim();

    let baseText = '';
    let phonePhrase = '';

    switch (data.dialect) {
      case 'egyptian':
        baseText =
          'أهلاً بك يا أحمد يا فندم! نورتنا وسعداء جداً بزيارتك ورأيك الجميل في القهوة والخدمة عندنا. نتمنى دايماً نكون عند حسن ظنك ونشوفك منورنا قريب جداً!';
        if (phone) {
          phonePhrase = `\nلأي ملاحظات أو اقتراحات يسعدنا تواصلك مباشرة معنا على: ${phone}`;
        }
        break;
      case 'msa':
        baseText =
          'أهلاً بك أستاذ أحمد! نسعد دائماً بزيارتك الكريمة ويسرنا أن نالت القهوة وحسن الاستقبال استحسانك ورضاك. نتطلع للترحيب بك مجدداً في أقرب وقت.';
        if (phone) {
          phonePhrase = `\nل للتواصل المباشر مع إدارة الفرع: ${phone}`;
        }
        break;
      case 'gulf':
        baseText =
          'يا هلا والله بأحمد، نورتنا وسعدنا حيل بزيارتك وكلامك الطيب عن القهوة والخدمة. حياك الله دوم ونتشرف بجيتك مرة ثانية!';
        if (phone) {
          phonePhrase = `\nلأي استفسار يشرفنا تواصلك معنا: ${phone}`;
        }
        break;
      case 'levantine':
        baseText =
          'أهلاً وسهلاً فيك يا أحمد، مية هلا! كتير فرحنا بزيارتك وبرأيك اللطيف بالقهوة والخدمة. منشوفك دايماً على خير ومنورنا بأي وقت!';
        if (phone) {
          phonePhrase = `\nللتواصل المباشر معنا: ${phone}`;
        }
        break;
      default:
        baseText =
          'أهلاً بك يا فندم! سعداء جداً بزيارتك الكريمة وتقييمك الإيجابي.';
        break;
    }

    return `${baseText}${phonePhrase}\n\n— ${signature}`;
  }, [data.dialect, data.signature, data.contactPhone, locale]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-start">
      {/* Form Controls Column */}
      <div className="space-y-5 lg:col-span-7">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('onboarding.businessNameLabel')}
            value={data.businessName}
            onChange={(e) => onChange({ businessName: e.target.value })}
            error={errors.businessName}
            required
          />

          <Input
            label={t('onboarding.signatureLabel')}
            value={data.signature}
            onChange={(e) => onChange({ signature: e.target.value })}
            placeholder={t('onboarding.signaturePlaceholder')}
            error={errors.signature}
            dir="auto"
            required
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('onboarding.dialectLabel')}
            value={data.dialect}
            onChange={(e) =>
              onChange({ dialect: e.target.value as BrandVoiceData['dialect'] })
            }
            options={[
              { value: 'egyptian', label: t('onboarding.dialectEgyptian') },
              { value: 'msa', label: t('onboarding.dialectMsa') },
              { value: 'gulf', label: t('onboarding.dialectGulf') },
              { value: 'levantine', label: t('onboarding.dialectLevantine') },
            ]}
          />

          <div className="flex flex-col gap-1.5">
            <Input
              label={t('onboarding.officialPhoneLabel')}
              value={data.contactPhone}
              onChange={(e) => onChange({ contactPhone: e.target.value })}
              placeholder="+201001234567"
              error={errors.contactPhone}
              helperText={t('onboarding.officialPhoneHint')}
              startIcon={<Icon icon={Phone} size={16} />}
              dir="ltr"
            />
          </div>
        </div>

        <Input
          label={t('onboarding.toneLabel')}
          value={data.tone}
          onChange={(e) => onChange({ tone: e.target.value })}
          placeholder={t('onboarding.tonePlaceholder')}
          error={errors.tone}
          dir="auto"
          required
        />

        {/* DO list (Tag-style input) */}
        <TagInput
          label={t('onboarding.doListLabel')}
          helperText={t('onboarding.doListHint')}
          tags={data.doList}
          onChange={(tags) => onChange({ doList: tags })}
          placeholder={t('onboarding.addTagPlaceholder')}
          addLabel={t('onboarding.addTagButton')}
          variant="teal"
        />

        {/* DON'T list (Tag-style input) */}
        <TagInput
          label={t('onboarding.dontListLabel')}
          helperText={t('onboarding.dontListHint')}
          tags={data.dontList}
          onChange={(tags) => onChange({ dontList: tags })}
          placeholder={t('onboarding.addTagPlaceholder')}
          addLabel={t('onboarding.addTagButton')}
          variant="danger"
        />

        {/* Example replies textarea */}
        <Textarea
          label={t('onboarding.examplesLabel')}
          value={data.exampleReplies}
          onChange={(e) => onChange({ exampleReplies: e.target.value })}
          placeholder={t('onboarding.examplesPlaceholder')}
          rows={3}
          dir="auto"
        />
      </div>

      {/* Live Preview Column */}
      <div className="lg:col-span-5 sticky top-6">
        <Card elevated className="border-primary/20 shadow-sm overflow-hidden">
          <CardHeader className="bg-primary/5 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon
                  icon={Sparkles}
                  size={18}
                  className="text-accent shrink-0 animate-pulse"
                />
                <CardTitle className="text-sm font-bold text-text">
                  {t('onboarding.livePreviewTitle')}
                </CardTitle>
              </div>
              <Badge variant="warning" size="sm">
                {t('onboarding.livePreviewBadge')}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Customer Review Card (Mock) */}
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-neutral-300 dark:bg-neutral-700 text-xs font-bold flex items-center justify-center text-text">
                    {locale === 'en' ? 'AM' : 'أم'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text">
                      {locale === 'en' ? 'Ahmed Mahmoud' : t('onboarding.sampleReviewAuthor')}
                    </p>
                    <p className="text-[10px] text-text-muted">Google Review • 5 stars</p>
                  </div>
                </div>
                <StarRating value={5} size="sm" />
              </div>
              <p
                className="text-xs text-text leading-relaxed font-normal"
                dir={locale === 'en' ? 'ltr' : 'rtl'}
              >
                {locale === 'en'
                  ? 'Fantastic place, delicious specialty coffee and very fast courteous service. Thank you team!'
                  : t('onboarding.sampleReviewText')}
              </p>
            </div>

            {/* Generated AI Draft (Mock with live props) */}
            <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
                  <Icon icon={MessageSquare} size={14} />
                  <span>
                    {isRtl ? 'الرد المقترح بالذكاء الاصطناعي' : 'AI Suggested Reply'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-primary font-semibold">
                  {data.dialect}
                </span>
              </div>

              <div
                className="text-xs text-text leading-relaxed whitespace-pre-wrap font-sans bg-surface/70 p-3 rounded-lg border border-border"
                dir="auto"
              >
                {livePreviewReply}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
              <Icon icon={Info} size={13} className="shrink-0" />
              <span>
                {isRtl
                  ? 'يتغير هذا النموذج تلقائياً كلما عدلت اللهجة أو التوقيع أو رقم التواصل.'
                  : 'This sample updates in real-time as you tweak dialect, signature, or phone.'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
