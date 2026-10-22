/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Building2,
  BellRing,
  LayoutDashboard,
} from 'lucide-react';
import {
  Button,
  Icon,
  Logo,
  LanguageToggle,
  ThemeToggle,
  InlineBanner,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import { Step1Google, LocationItem } from './Step1Google';
import {
  Step2BrandVoice,
  BrandVoiceData,
  createBrandVoiceSchema,
} from './Step2BrandVoice';
import {
  Step3Notifications,
  NotificationChannel,
} from './Step3Notifications';

const STORAGE_KEY = 'radd_onboarding_draft_v1';
const STEP_STORAGE_KEY = 'radd_onboarding_step_v1';

export interface OnboardingWizardProps {
  initialBusiness: {
    id: string;
    name: string;
    notification_channel?: NotificationChannel | null;
    notification_target?: string | null;
  };
  initialGoogleConnection: {
    status?: 'active' | 'revoked' | 'none';
    google_email?: string | null;
    last_error?: string | null;
  } | null;
  initialLocations: LocationItem[];
  initialBrandProfile?: {
    tone?: string | null;
    arabic_dialect?: string | null;
    signature?: string | null;
    do_list?: string[] | null;
    dont_list?: string[] | null;
    example_replies?: string[] | null;
  } | null;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialBusiness,
  initialGoogleConnection,
  initialLocations,
  initialBrandProfile,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl } = useI18n();

  // 1. Wizard Step State (1, 2, or 3)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);
  const [statusBanner, setStatusBanner] = useState<{
    variant: 'success' | 'warning' | 'danger' | 'info';
    message: string;
  } | null>(null);

  // 2. Data State
  const [businessId] = useState(initialBusiness.id);
  const [googleStatus, setGoogleStatus] = useState<'active' | 'revoked' | 'none'>(
    initialGoogleConnection?.status ?? 'none'
  );
  const [googleEmail, setGoogleEmail] = useState<string | null>(
    initialGoogleConnection?.google_email ?? null
  );
  const [googleLastError, setGoogleLastError] = useState<string | null>(
    initialGoogleConnection?.last_error ?? null
  );
  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);

  // Step 2 Data
  const [brandData, setBrandData] = useState<BrandVoiceData>({
    businessName: initialBusiness.name || '',
    tone: initialBrandProfile?.tone || 'ودود، محترف، هادئ ويرحب بالعملاء',
    dialect: (initialBrandProfile?.arabic_dialect as BrandVoiceData['dialect']) || 'egyptian',
    signature: initialBrandProfile?.signature || `فريق ${initialBusiness.name || 'العمل'}`,
    contactPhone: initialLocations[0]?.contact_phone || '',
    doList: initialBrandProfile?.do_list || [
      'الترحيب باسم العميل بلطف',
      'شكراً لزيارتك وثقتك بنا',
      'دعوة العميل للتجربة مجدداً',
    ],
    dontList: initialBrandProfile?.dont_list || [
      'عدم الوعد بخصومات أو استرداد مالي علناً',
      'عدم الجدال مع العميل الغاضب',
      'عدم ذكر أرقام هواتف غير الرقم الرسمي المعتمد',
    ],
    exampleReplies: (initialBrandProfile?.example_replies || []).join('\n'),
  });

  // Step 3 Data
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>(
    (initialBusiness.notification_channel as NotificationChannel) || 'telegram'
  );
  const [notificationTarget, setNotificationTarget] = useState<string>(
    initialBusiness.notification_target || ''
  );

  // Errors state
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [step3Error, setStep3Error] = useState<string | undefined>(undefined);

  const refreshServerSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/dashboard/settings?businessId=${businessId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.googleConnection) {
          setGoogleStatus(data.googleConnection.status || 'none');
          setGoogleEmail(data.googleConnection.google_email || null);
          setGoogleLastError(data.googleConnection.last_error || null);
        }
        if (data.locations) {
          setLocations(data.locations);
        }
      }
    } catch (err) {
      console.error('Failed to reload settings', err);
    }
  }, [businessId]);

  // Initialize and handle URL params / localStorage persistence
  useEffect(() => {
    // Check if returning from Google OAuth callback
    const oauthConnected = searchParams.get('connected');
    const oauthError = searchParams.get('error');

    if (oauthConnected === 'true') {
      setGoogleStatus('active');
      setStatusBanner({
        variant: 'success',
        message: t('onboarding.saved'),
      });
      // Refresh locations from server
      refreshServerSettings();
    } else if (oauthError) {
      setGoogleStatus('revoked');
      setGoogleLastError(oauthError);
      setStatusBanner({
        variant: 'danger',
        message: oauthError,
      });
    }

    // Try restoring saved draft step from localStorage
    try {
      const savedStep = localStorage.getItem(STEP_STORAGE_KEY);
      if (savedStep) {
        const parsed = parseInt(savedStep, 10);
        if (parsed >= 1 && parsed <= 3) {
          setCurrentStep(parsed);
        }
      }

      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.brandData) setBrandData((prev) => ({ ...prev, ...draft.brandData }));
        if (draft.notificationChannel) setNotificationChannel(draft.notificationChannel);
        if (draft.notificationTarget) setNotificationTarget(draft.notificationTarget);
      }
    } catch {
      // Storage unavailable or invalid JSON, ignore safely
    }
  }, [searchParams, t, refreshServerSettings]);

  // Persist draft to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          brandData,
          notificationChannel,
          notificationTarget,
        })
      );
    } catch {
      // Ignore localStorage errors
    }
  }, [currentStep, brandData, notificationChannel, notificationTarget]);

  // Save current settings to backend
  const persistSettingsToBackend = async (): Promise<boolean> => {
    setSaving(true);
    setStatusBanner(null);

    const splitLines = (txt: string) =>
      txt
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      const payload = {
        businessId,
        businessName: brandData.businessName.trim(),
        notificationChannel,
        notificationTarget: notificationTarget.trim() || 'default',
        contactPhone: brandData.contactPhone.trim() || null,
        tone: brandData.tone.trim(),
        arabicDialect: brandData.dialect,
        signature: brandData.signature.trim(),
        doList: brandData.doList,
        dontList: brandData.dontList,
        exampleReplies: splitLines(brandData.exampleReplies),
      };

      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to save settings');
      }

      return true;
    } catch (err: unknown) {
      setStatusBanner({
        variant: 'danger',
        message: err instanceof Error ? err.message : String(err),
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Step 1 -> Step 2 transition
  const handleProceedFromStep1 = async () => {
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Step 2 -> Step 3 transition with Zod validation
  const handleProceedFromStep2 = async () => {
    setStep2Errors({});
    const schema = createBrandVoiceSchema(isRtl);
    const parsed = schema.safeParse({
      businessName: brandData.businessName,
      tone: brandData.tone,
      signature: brandData.signature,
      contactPhone: brandData.contactPhone,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setStep2Errors(fieldErrors);
      return;
    }

    const saved = await persistSettingsToBackend();
    if (saved) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Final Step 3 submission & redirect to dashboard
  const handleFinishWizard = async () => {
    setStep3Error(undefined);

    // Validate notification target
    const trimmedTarget = notificationTarget.trim();
    if (!trimmedTarget) {
      setStep3Error(
        isRtl
          ? 'يرجى كتابة البريد الإلكتروني أو معرف تيليجرام'
          : 'Please provide an email address or Telegram chat ID'
      );
      return;
    }

    if (notificationChannel === 'email' && !trimmedTarget.includes('@')) {
      setStep3Error(
        isRtl
          ? 'يرجى إدخال عنوان بريد إلكتروني صحيح'
          : 'Please enter a valid email address'
      );
      return;
    }

    const saved = await persistSettingsToBackend();
    if (saved) {
      // Clear wizard persistence
      try {
        localStorage.removeItem(STEP_STORAGE_KEY);
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      // Navigate to dashboard
      router.push('/dashboard');
    }
  };

  const stepsMeta = [
    {
      num: 1,
      title: t('onboarding.step1Title'),
      desc: t('onboarding.step1Desc'),
      icon: Building2,
    },
    {
      num: 2,
      title: t('onboarding.step2Title'),
      desc: t('onboarding.step2Desc'),
      icon: Sparkles,
    },
    {
      num: 3,
      title: t('onboarding.step3Title'),
      desc: t('onboarding.step3Desc'),
      icon: BellRing,
    },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo variant="lockup" size="sm" />
          </Link>

          <div className="flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-text-muted hover:text-text hover:bg-surface-raised transition-colors"
            >
              <Icon icon={LayoutDashboard} size={14} />
              <span>{t('onboarding.backToDashboard')}</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
        {/* Wizard Header & Progress Steps */}
        <div className="space-y-6">
          <div className="text-center sm:text-start space-y-1">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('onboarding.stepOf')
                .replace('{current}', String(currentStep))
                .replace('{total}', '3')}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              {t('onboarding.wizardTitle')}
            </h1>
            <p className="text-sm text-text-muted">
              {t('onboarding.wizardSubtitle')}
            </p>
          </div>

          {/* Progress Indicator Pills */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 select-none">
            {stepsMeta.map((s) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;

              return (
                <div
                  key={s.num}
                  className={`flex items-center gap-2 sm:gap-3 p-3 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'border-primary bg-primary/10 shadow-xs'
                      : isPast
                      ? 'border-border bg-surface-raised text-text'
                      : 'border-border/60 bg-surface/50 opacity-60'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isPast
                        ? 'bg-success text-success-foreground'
                        : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-neutral-200 dark:bg-neutral-800 text-text-muted'
                    }`}
                  >
                    {isPast ? <Icon icon={Check} size={14} /> : s.num}
                  </div>

                  <div className="min-w-0 flex-1 hidden sm:block">
                    <p className="text-xs font-bold truncate text-text">
                      {s.title}
                    </p>
                    <p className="text-[11px] truncate text-text-muted">
                      {s.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Alerts */}
        {statusBanner && (
          <InlineBanner
            variant={statusBanner.variant}
            onDismiss={() => setStatusBanner(null)}
          >
            {statusBanner.message}
          </InlineBanner>
        )}

        {/* Step Views */}
        <div className="transition-all duration-200">
          {currentStep === 1 && (
            <Step1Google
              businessId={businessId}
              businessName={brandData.businessName}
              googleStatus={googleStatus}
              googleLastError={googleLastError}
              googleEmail={googleEmail}
              locations={locations}
              onLocationsChange={(updated) => setLocations(updated)}
              onRefreshSettings={refreshServerSettings}
            />
          )}

          {currentStep === 2 && (
            <Step2BrandVoice
              data={brandData}
              onChange={(updated) =>
                setBrandData((prev) => ({ ...prev, ...updated }))
              }
              errors={step2Errors}
            />
          )}

          {currentStep === 3 && (
            <Step3Notifications
              channel={notificationChannel}
              target={notificationTarget}
              onChannelChange={(ch) => setNotificationChannel(ch)}
              onTargetChange={(tg) => setNotificationTarget(tg)}
              targetError={step3Error}
              summary={{
                businessName: brandData.businessName,
                googleConnected: googleStatus === 'active',
                googleEmail,
                activeLocationsCount: locations.filter((l) => l.is_polling_enabled)
                  .length,
                dialect: brandData.dialect,
                tone: brandData.tone,
              }}
            />
          )}
        </div>

        {/* Wizard Controls Footer */}
        <div className="pt-6 border-t border-border flex items-center justify-between gap-3">
          {currentStep > 1 ? (
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setCurrentStep((prev) => Math.max(1, prev - 1));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              startIcon={
                <Icon
                  icon={isRtl ? ChevronRight : ChevronLeft}
                  size={18}
                />
              }
            >
              {t('onboarding.prevStep')}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {currentStep === 1 && (
              <Button
                variant="primary"
                size="md"
                onClick={handleProceedFromStep1}
                endIcon={
                  <Icon
                    icon={isRtl ? ArrowLeft : ArrowRight}
                    size={18}
                  />
                }
              >
                {t('onboarding.saveAndContinue')}
              </Button>
            )}

            {currentStep === 2 && (
              <Button
                variant="primary"
                size="md"
                loading={saving}
                onClick={handleProceedFromStep2}
                endIcon={
                  <Icon
                    icon={isRtl ? ArrowLeft : ArrowRight}
                    size={18}
                  />
                }
              >
                {t('onboarding.saveAndContinue')}
              </Button>
            )}

            {currentStep === 3 && (
              <Button
                variant="primary"
                size="lg"
                loading={saving}
                onClick={handleFinishWizard}
                endIcon={
                  <Icon
                    icon={isRtl ? ArrowLeft : ArrowRight}
                    size={20}
                  />
                }
              >
                {t('onboarding.goToDashboard')}
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-6 border-t border-border/60 text-center text-xs text-text-muted">
        <p>© 2026 Radd (ردّ) • {t('common.tagline')}</p>
      </footer>
    </div>
  );
};
