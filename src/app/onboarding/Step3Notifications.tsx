'use client';

import React from 'react';
import {
  Mail,
  Send,
  MessageCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  Building2,
  Sparkles,
  BellRing,
} from 'lucide-react';
import {
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Icon,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

export type NotificationChannel = 'email' | 'telegram' | 'whatsapp';

export interface Step3NotificationsProps {
  channel: NotificationChannel;
  target: string;
  onChannelChange: (ch: NotificationChannel) => void;
  onTargetChange: (target: string) => void;
  targetError?: string;
  summary: {
    businessName: string;
    googleConnected: boolean;
    googleEmail?: string | null;
    activeLocationsCount: number;
    dialect: string;
    tone: string;
  };
}

export const Step3Notifications: React.FC<Step3NotificationsProps> = ({
  channel,
  target,
  onChannelChange,
  onTargetChange,
  targetError,
  summary,
}) => {
  const { t, isRtl } = useI18n();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-text">
          {t('onboarding.notificationsTitle')}
        </h3>
        <p className="text-xs text-text-muted mt-1">
          {t('onboarding.notificationsSubtitle')}
        </p>
      </div>

      {/* Channel Selection Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Email Option Card */}
        <button
          type="button"
          onClick={() => onChannelChange('email')}
          className={`min-h-[110px] p-4 rounded-2xl border text-start transition-all relative flex flex-col justify-between ${
            channel === 'email'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
              : 'border-border bg-surface hover:bg-surface-raised'
          }`}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  channel === 'email'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-raised text-text-muted'
                }`}
              >
                <Icon icon={Mail} size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text">
                  {t('onboarding.emailChannelTitle')}
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                  {t('onboarding.emailChannelDesc')}
                </p>
              </div>
            </div>
            {channel === 'email' && (
              <div className="text-primary shrink-0">
                <Icon icon={CheckCircle2} size={18} />
              </div>
            )}
          </div>
        </button>

        {/* Telegram Option Card */}
        <button
          type="button"
          onClick={() => onChannelChange('telegram')}
          className={`min-h-[110px] p-4 rounded-2xl border text-start transition-all relative flex flex-col justify-between ${
            channel === 'telegram'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
              : 'border-border bg-surface hover:bg-surface-raised'
          }`}
        >
          <div className="flex items-start justify-between w-full">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  channel === 'telegram'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-surface-raised text-text-muted'
                }`}
              >
                <Icon icon={Send} size={20} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-text">
                  {t('onboarding.telegramChannelTitle')}
                </h4>
                <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                  {t('onboarding.telegramChannelDesc')}
                </p>
              </div>
            </div>
            {channel === 'telegram' && (
              <div className="text-primary shrink-0">
                <Icon icon={CheckCircle2} size={18} />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Target Input and helper box */}
      <div className="p-5 rounded-2xl border border-border bg-surface space-y-4">
        {channel === 'email' && (
          <Input
            label={t('onboarding.emailInputLabel')}
            type="email"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="owner@mybusiness.com"
            error={targetError}
            startIcon={<Icon icon={Mail} size={16} />}
            dir="ltr"
            required
          />
        )}

        {channel === 'telegram' && (
          <div className="space-y-4">
            <Input
              label={t('onboarding.telegramInputLabel')}
              type="text"
              value={target}
              onChange={(e) => onTargetChange(e.target.value)}
              placeholder="123456789"
              error={targetError}
              startIcon={<Icon icon={Send} size={16} />}
              dir="ltr"
              required
            />

            {/* Telegram Instruction Box */}
            <div className="p-3.5 rounded-xl bg-surface-raised border border-border text-xs text-text-muted space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-text">
                <Icon icon={HelpCircle} size={14} className="text-primary shrink-0" />
                <span>{t('onboarding.telegramHelpTitle')}</span>
              </div>
              <ul className="space-y-1.5 ps-2">
                <li className="leading-relaxed flex items-center gap-1.5">
                  <span>{t('onboarding.telegramHelpStep1')}</span>
                  <a
                    href="https://t.me/userinfobot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    @userinfobot
                    <Icon icon={ExternalLink} size={11} />
                  </a>
                </li>
                <li className="leading-relaxed">
                  {t('onboarding.telegramHelpStep2')}
                </li>
              </ul>
            </div>
          </div>
        )}

        {channel === 'whatsapp' && (
          <Input
            label={t('onboarding.whatsappInputLabel')}
            type="tel"
            value={target}
            onChange={(e) => onTargetChange(e.target.value)}
            placeholder="+201001234567"
            error={targetError}
            startIcon={<Icon icon={MessageCircle} size={16} />}
            dir="ltr"
            required
          />
        )}
      </div>

      {/* Summary Card */}
      <Card elevated className="border-border">
        <CardHeader className="pb-3 border-b border-border bg-surface-raised/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon icon={CheckCircle2} size={18} className="text-success" />
              <CardTitle className="text-sm font-bold text-text">
                {t('onboarding.summaryTitle')}
              </CardTitle>
            </div>
            <Badge variant="success" size="sm">
              {isRtl ? 'جاهز للتفعيل' : 'Ready'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-3.5 text-xs text-text">
          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-text-muted flex items-center gap-1.5">
              <Icon icon={Building2} size={14} className="text-primary" />
              {t('onboarding.summaryGoogleConnected')}
            </span>
            <span className="font-semibold">
              {summary.googleConnected
                ? summary.googleEmail || t('onboarding.connectedStatus')
                : t('onboarding.notConnectedStatus')}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-text-muted flex items-center gap-1.5">
              <Icon icon={Building2} size={14} className="text-primary" />
              {t('onboarding.summaryLocationsActive')}
            </span>
            <span className="font-semibold font-mono">
              {summary.activeLocationsCount} {isRtl ? 'فروع مفعّلة' : 'active locations'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/50">
            <span className="text-text-muted flex items-center gap-1.5">
              <Icon icon={Sparkles} size={14} className="text-accent" />
              {t('onboarding.summaryBrandTone')}
            </span>
            <span className="font-semibold">
              {summary.dialect} • {summary.tone}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-text-muted flex items-center gap-1.5">
              <Icon icon={BellRing} size={14} className="text-primary" />
              {t('onboarding.summaryNotificationTarget')}
            </span>
            <span className="font-semibold font-mono text-primary">
              {channel.toUpperCase()}: {target || '—'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
