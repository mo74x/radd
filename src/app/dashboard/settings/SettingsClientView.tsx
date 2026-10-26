/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Sparkles,
  BellRing,
  MapPin,
  Building2,
  User,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Shield,
  Trash2,
  Phone,
  Save,
  LucideIcon,
  ExternalLink,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Input,
  Switch,
  Icon,
  InlineBanner,
  LanguageToggle,
  ThemeToggle,
  Spinner,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';
import {
  Step2BrandVoice,
  BrandVoiceData,
  createBrandVoiceSchema,
} from '@/app/onboarding/Step2BrandVoice';
import { LocationItem } from '@/app/onboarding/Step1Google';
import { NotificationChannel } from '@/app/onboarding/Step3Notifications';

export interface SettingsClientViewProps {
  business: {
    id: string;
    name: string;
    plan: string;
    status: string;
    trial_ends_at?: string;
    notification_channel: NotificationChannel;
    notification_target?: string | null;
  };
  googleConnection: {
    status?: 'active' | 'revoked' | 'none';
    google_email?: string | null;
    last_error?: string | null;
    updated_at?: string;
  } | null;
  locations: LocationItem[];
  brand: {
    tone?: string | null;
    arabic_dialect?: string | null;
    signature?: string | null;
    do_list?: string[] | null;
    dont_list?: string[] | null;
    example_replies?: string[] | null;
  } | null;
}

type SettingsTab =
  | 'brand'
  | 'notifications'
  | 'locations'
  | 'google'
  | 'account'
  | 'billing';

export const SettingsClientView: React.FC<SettingsClientViewProps> = ({
  business,
  googleConnection,
  locations: initialLocations,
  brand,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isRtl, locale } = useI18n();

  // Active Tab State (can be driven by ?tab= param)
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'brand';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  // Form states
  const [businessName, setBusinessName] = useState(business.name || '');
  const [notificationChannel, setNotificationChannel] = useState<NotificationChannel>(
    business.notification_channel || 'telegram'
  );
  const [notificationTarget, setNotificationTarget] = useState(
    business.notification_target || ''
  );

  const [brandData, setBrandData] = useState<BrandVoiceData>({
    businessName: business.name || '',
    tone: brand?.tone || 'ودود، محترف، هادئ ويرحب بالعملاء',
    dialect: (brand?.arabic_dialect as BrandVoiceData['dialect']) || 'egyptian',
    signature: brand?.signature || `فريق ${business.name || 'العمل'}`,
    contactPhone: initialLocations[0]?.contact_phone || '',
    doList: brand?.do_list || ['الترحيب باسم العميل بلطف', 'شكراً لزيارتك'],
    dontList: brand?.dont_list || ['عدم الوعد بخصومات علناً'],
    exampleReplies: (brand?.example_replies || []).join('\n'),
  });

  const [locations, setLocations] = useState<LocationItem[]>(initialLocations);
  const [updatingLocationId, setUpdatingLocationId] = useState<string | null>(null);

  // Save & Feedback states
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveToast, setSaveToast] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [brandErrors, setBrandErrors] = useState<Record<string, string>>({});
  const [privacyLoading, setPrivacyLoading] = useState(false);

  // Sync tab with URL if changed
  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as SettingsTab;
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams, activeTab]);

  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    router.replace(`/dashboard/settings?tab=${tab}`);
  };

  // Track unsaved changes
  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
  };

  // Location polling toggle
  const handleTogglePolling = async (locationId: string, currentVal: boolean) => {
    setUpdatingLocationId(locationId);
    try {
      const res = await fetch('/api/dashboard/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          isPollingEnabled: !currentVal,
        }),
      });

      if (!res.ok) throw new Error('Failed to update polling');

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === locationId ? { ...loc, is_polling_enabled: !currentVal } : loc
        )
      );

      setSaveToast({
        type: 'success',
        text: t('settings.savedToast'),
      });
      setTimeout(() => setSaveToast(null), 3000);
    } catch {
      setSaveToast({
        type: 'error',
        text: t('settings.saveFailedToast'),
      });
      setTimeout(() => setSaveToast(null), 3000);
    } finally {
      setUpdatingLocationId(null);
    }
  };

  // Disconnect Google Account
  const handleDisconnectGoogle = async () => {
    if (!window.confirm(t('settings.disconnectConfirm'))) return;
    setPrivacyLoading(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect_google',
          businessId: business.id,
        }),
      });
      if (res.ok) {
        setSaveToast({
          type: 'success',
          text: t('settings.savedToast'),
        });
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch {
      setSaveToast({
        type: 'error',
        text: t('settings.saveFailedToast'),
      });
    } finally {
      setPrivacyLoading(false);
    }
  };

  // Disconnect and permanently delete all data
  const handlePurgeData = async () => {
    if (!window.confirm(t('onboarding.confirmPurge'))) return;
    setPrivacyLoading(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'disconnect_and_delete_data',
          businessId: business.id,
        }),
      });
      if (res.ok) {
        router.push('/onboarding');
      }
    } catch {
      setSaveToast({
        type: 'error',
        text: t('settings.saveFailedToast'),
      });
    } finally {
      setPrivacyLoading(false);
    }
  };

  // Save all settings to /api/dashboard/settings
  const handleSave = async () => {
    setSaving(true);
    setBrandErrors({});

    // Validate Brand Voice schema
    const schema = createBrandVoiceSchema(isRtl);
    const parsed = schema.safeParse({
      businessName,
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
      setBrandErrors(fieldErrors);
      setSaving(false);
      setActiveTab('brand');
      return;
    }

    const splitLines = (txt: string) =>
      txt
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

    try {
      const payload = {
        businessId: business.id,
        businessName: businessName.trim(),
        notificationChannel,
        notificationTarget: notificationTarget.trim(),
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

      if (!res.ok) throw new Error('Save failed');

      setIsDirty(false);
      setSaveToast({
        type: 'success',
        text: t('settings.savedToast'),
      });
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      setSaveToast({
        type: 'error',
        text: t('settings.saveFailedToast'),
      });
      setTimeout(() => setSaveToast(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const isGoogleConnected = googleConnection?.status === 'active';
  const isGoogleNeedsAttention = googleConnection?.status === 'revoked';

  const tabsMeta: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
    { id: 'brand', label: t('settings.tabBrand'), icon: Sparkles },
    { id: 'notifications', label: t('settings.tabNotifications'), icon: BellRing },
    { id: 'locations', label: t('settings.tabLocations'), icon: MapPin },
    { id: 'google', label: t('settings.tabGoogle'), icon: Building2 },
    { id: 'account', label: t('settings.tabAccount'), icon: User },
    { id: 'billing', label: t('settings.tabBilling'), icon: CreditCard },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {saveToast && (
        <div
          role="status"
          className={`fixed bottom-20 sm:bottom-6 end-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold transition-all animate-in fade-in slide-in-from-bottom-2 ${
            saveToast.type === 'success'
              ? 'bg-success text-success-foreground border-success/40'
              : 'bg-danger text-danger-foreground border-danger/40'
          }`}
        >
          <Icon
            icon={saveToast.type === 'success' ? CheckCircle2 : AlertTriangle}
            size={18}
          />
          <span>{saveToast.text}</span>
        </div>
      )}

      {/* Header with Save Button & Unsaved Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
            {t('settings.pageTitle')}
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            {t('settings.pageSubtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={saving}
          onClick={handleSave}
          startIcon={<Icon icon={Save} size={18} />}
          className="self-start sm:self-center shrink-0 shadow-sm"
        >
          {saving ? t('settings.saving') : t('settings.saveChanges')}
        </Button>
      </div>

      {/* Unsaved Changes Banner */}
      {isDirty && (
        <InlineBanner variant="warning">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span>{t('settings.unsavedWarning')}</span>
            <button
              type="button"
              onClick={handleSave}
              className="font-bold underline hover:opacity-80 text-start text-xs sm:text-sm shrink-0"
            >
              {t('settings.saveChanges')}
            </button>
          </div>
        </InlineBanner>
      )}

      {/* Tabs Navigation (Desktop & Mobile) */}
      <div className="border-b border-border overflow-x-auto scrollbar-none">
        <nav
          aria-label="Settings navigation tabs"
          className="flex items-center gap-1 min-w-max pb-px"
        >
          {tabsMeta.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;

            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id)}
                className={`min-h-[44px] px-4 py-2.5 rounded-t-xl font-semibold text-sm inline-flex items-center gap-2 border-b-2 transition-all ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-transparent text-text-muted hover:text-text hover:bg-surface-raised'
                }`}
              >
                <Icon
                  icon={TabIcon}
                  size={16}
                  className={isActive ? 'text-primary' : 'text-text-muted'}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {/* TAB 1: Brand Voice */}
        {activeTab === 'brand' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.tabBrand')}</CardTitle>
                <CardDescription>
                  {t('onboarding.brandVoiceSubtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Step2BrandVoice
                  data={{ ...brandData, businessName }}
                  onChange={(updated) => {
                    markDirty();
                    if (updated.businessName !== undefined) {
                      setBusinessName(updated.businessName);
                    }
                    setBrandData((prev) => ({ ...prev, ...updated }));
                  }}
                  errors={brandErrors}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('settings.tabNotifications')}</CardTitle>
                    <CardDescription>
                      {t('onboarding.notificationsSubtitle')}
                    </CardDescription>
                  </div>
                  <Badge variant="success" size="sm" dot>
                    {notificationChannel.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Email option */}
                  <button
                    type="button"
                    onClick={() => {
                      markDirty();
                      setNotificationChannel('email');
                    }}
                    className={`min-h-[90px] p-4 rounded-2xl border text-start transition-all relative flex flex-col justify-between ${
                      notificationChannel === 'email'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            notificationChannel === 'email'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-raised text-text-muted'
                          }`}
                        >
                          <Icon icon={BellRing} size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text">
                            {t('onboarding.emailChannelTitle')}
                          </h4>
                          <p className="text-xs text-text-muted mt-0.5">
                            {t('onboarding.emailChannelDesc')}
                          </p>
                        </div>
                      </div>
                      {notificationChannel === 'email' && (
                        <div className="text-primary">
                          <Icon icon={CheckCircle2} size={18} />
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Telegram option */}
                  <button
                    type="button"
                    onClick={() => {
                      markDirty();
                      setNotificationChannel('telegram');
                    }}
                    className={`min-h-[90px] p-4 rounded-2xl border text-start transition-all relative flex flex-col justify-between ${
                      notificationChannel === 'telegram'
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border bg-surface hover:bg-surface-raised'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            notificationChannel === 'telegram'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-surface-raised text-text-muted'
                          }`}
                        >
                          <Icon icon={BellRing} size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-text">
                            {t('onboarding.telegramChannelTitle')}
                          </h4>
                          <p className="text-xs text-text-muted mt-0.5">
                            {t('onboarding.telegramChannelDesc')}
                          </p>
                        </div>
                      </div>
                      {notificationChannel === 'telegram' && (
                        <div className="text-primary">
                          <Icon icon={CheckCircle2} size={18} />
                        </div>
                      )}
                    </div>
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <Input
                    label={
                      notificationChannel === 'email'
                        ? t('onboarding.emailInputLabel')
                        : t('onboarding.telegramInputLabel')
                    }
                    value={notificationTarget}
                    onChange={(e) => {
                      markDirty();
                      setNotificationTarget(e.target.value);
                    }}
                    placeholder={
                      notificationChannel === 'email'
                        ? 'owner@business.com'
                        : '123456789'
                    }
                    dir="ltr"
                    required
                  />

                  {notificationChannel === 'telegram' && (
                    <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs text-text-muted space-y-1.5">
                      <p className="font-bold text-text">
                        {t('onboarding.telegramHelpTitle')}
                      </p>
                      <p>{t('onboarding.telegramHelpStep1')}</p>
                      <p>{t('onboarding.telegramHelpStep2')}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: Locations */}
        {activeTab === 'locations' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.locationsTitle')}</CardTitle>
                <CardDescription>
                  {t('settings.locationsSubtitle')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {locations.length === 0 ? (
                  <div className="p-6 text-center text-sm text-text-muted border border-dashed border-border rounded-xl">
                    No locations discovered yet. Connect Google Business Profile first.
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-surface">
                    {locations.map((loc) => (
                      <div
                        key={loc.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:bg-surface-raised/50 transition-colors"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Icon
                              icon={MapPin}
                              size={16}
                              className="text-primary shrink-0"
                            />
                            <h4 className="text-sm font-bold text-text truncate">
                              {loc.display_name}
                            </h4>
                          </div>

                          {loc.address_lines && loc.address_lines.length > 0 && (
                            <p className="text-xs text-text-muted truncate">
                              {loc.address_lines.join(', ')}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-text-muted pt-1">
                            <span className="flex items-center gap-1 font-mono">
                              <Icon icon={Phone} size={12} />
                              {loc.contact_phone || '—'}
                            </span>
                            <span>•</span>
                            <span>
                              {loc.last_synced_at
                                ? `${t('settings.lastSynced')}: ${new Date(
                                    loc.last_synced_at
                                  ).toLocaleDateString()}`
                                : t('settings.neverSynced')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                          {updatingLocationId === loc.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Switch
                              checked={loc.is_polling_enabled}
                              onChange={() =>
                                handleTogglePolling(loc.id, loc.is_polling_enabled)
                              }
                              label={
                                loc.is_polling_enabled
                                  ? t('onboarding.pollingEnabled')
                                  : t('onboarding.pollingDisabled')
                              }
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: Google Connection */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('settings.googleTitle')}</CardTitle>
                    <CardDescription>
                      {t('settings.googleSubtitle')}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      isGoogleConnected
                        ? 'success'
                        : isGoogleNeedsAttention
                        ? 'danger'
                        : 'neutral'
                    }
                    size="sm"
                  >
                    {isGoogleConnected
                      ? t('settings.connectedBadge')
                      : isGoogleNeedsAttention
                      ? t('settings.needsAttentionBadge')
                      : t('onboarding.notConnectedStatus')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="p-4 rounded-xl border border-border bg-surface-raised flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-xs text-text-muted font-medium">
                      {t('settings.googleAccountEmail')}
                    </p>
                    <p className="text-sm font-bold text-text mt-0.5">
                      {googleConnection?.google_email || '—'}
                    </p>
                  </div>

                  <a
                    href={`/api/google/oauth/connect?businessId=${encodeURIComponent(
                      business.id
                    )}`}
                    className="min-h-[44px] px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-text hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors inline-flex items-center justify-center gap-2 shrink-0"
                  >
                    <Icon icon={RotateCw} size={16} />
                    <span>{t('settings.reconnectButton')}</span>
                  </a>
                </div>

                {/* Danger Zone */}
                <div className="p-5 rounded-2xl border border-danger/30 bg-danger/5 space-y-4">
                  <div className="flex items-start gap-3">
                    <Icon
                      icon={AlertTriangle}
                      size={20}
                      className="text-danger shrink-0 mt-0.5"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-danger">
                        {t('settings.dangerZoneTitle')}
                      </h4>
                      <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                        {t('settings.dangerZoneDesc')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      loading={privacyLoading}
                      onClick={handleDisconnectGoogle}
                      startIcon={<Icon icon={Shield} size={15} />}
                    >
                      {t('settings.disconnectButton')}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      disabled={privacyLoading}
                      onClick={handlePurgeData}
                      startIcon={<Icon icon={Trash2} size={15} />}
                      className="text-danger border-danger/40 hover:bg-danger/10"
                    >
                      {t('onboarding.purgeDataButton')}
                    </Button>
                  </div>

                  <div className="pt-3 border-t border-danger/20 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
                    <span>
                      {locale === 'ar'
                        ? 'الالتزام بسياسة بيانات مستخدمي خدمات Google API والخصوصية'
                        : 'Adherence to Google API User Data Policy & Privacy Standards'}
                    </span>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>{t('landing.privacy')}</span>
                        <Icon icon={ExternalLink} size={12} />
                      </Link>
                      <Link
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-muted hover:text-text hover:underline font-medium inline-flex items-center gap-1"
                      >
                        <span>{t('landing.terms')}</span>
                        <Icon icon={ExternalLink} size={12} />
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5: Account */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.accountTitle')}</CardTitle>
                <CardDescription>
                  {t('settings.accountSubtitle')}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                <Input
                  label={t('settings.businessName')}
                  value={businessName}
                  onChange={(e) => {
                    markDirty();
                    setBusinessName(e.target.value);
                  }}
                  required
                />

                <div className="grid gap-4 sm:grid-cols-2 pt-2">
                  <div className="p-4 rounded-xl border border-border bg-surface-raised flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text">
                        {t('settings.languagePreference')}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        العربية / English
                      </p>
                    </div>
                    <LanguageToggle />
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-surface-raised flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-text">
                        {t('settings.themePreference')}
                      </p>
                      <p className="text-[11px] text-text-muted">
                        Light / Dark mode
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 6: Billing */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t('settings.billingTitle')}</CardTitle>
                    <CardDescription>
                      {t('settings.billingSubtitle')}
                    </CardDescription>
                  </div>
                  <Badge variant="accent" size="sm">
                    {business.plan.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="p-5 rounded-2xl border border-border bg-surface-raised space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary uppercase">
                        {t('settings.trialStatus')}
                      </span>
                      <h4 className="text-base font-bold text-text mt-0.5">
                        {business.plan === 'trial' ? '14-Day Free Trial' : 'Active Plan'}
                      </h4>
                    </div>
                    <Badge variant="success" size="sm" dot>
                      Active
                    </Badge>
                  </div>

                  <p className="text-xs text-text-muted leading-relaxed">
                    Full access to automated review polling, AI Egyptian/Standard Arabic drafting, and one-tap approval notifications.
                  </p>

                  <div className="pt-2 flex items-center gap-3">
                    <Button variant="secondary" size="sm" disabled>
                      {t('settings.upgradeButton')}
                    </Button>
                    <span className="text-xs text-text-muted italic">
                      ({t('settings.comingSoonNote')})
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-dashed border-border text-xs text-text-muted space-y-1">
                  <p className="font-semibold text-text">Payment Integration Status</p>
                  <p>{t('settings.comingSoonNote')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Global Settings Legal Links Footer */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <p>© 2026 Radd (ردّ) • All rights reserved</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{t('landing.privacy')}</span>
              <Icon icon={ExternalLink} size={12} />
            </Link>
            <span>•</span>
            <Link
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text hover:underline inline-flex items-center gap-1 transition-colors"
            >
              <span>{t('landing.terms')}</span>
              <Icon icon={ExternalLink} size={12} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
