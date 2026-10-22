'use client';

import React, { useState } from 'react';
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  RotateCw,
  Trash2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Switch,
  Icon,
  InlineBanner,
  Spinner,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

export interface LocationItem {
  id: string;
  business_id: string;
  google_location_name?: string | null;
  display_name: string;
  address_lines?: string[] | null;
  contact_phone?: string | null;
  is_polling_enabled: boolean;
  last_synced_at?: string | null;
}

export interface Step1GoogleProps {
  businessId: string;
  businessName: string;
  googleStatus: 'active' | 'revoked' | 'none';
  googleLastError: string | null;
  googleEmail?: string | null;
  locations: LocationItem[];
  onLocationsChange: (updated: LocationItem[]) => void;
  onRefreshSettings: () => Promise<void>;
}

export const Step1Google: React.FC<Step1GoogleProps> = ({
  businessId,
  googleStatus,
  googleLastError,
  googleEmail,
  locations,
  onLocationsChange,
  onRefreshSettings,
}) => {
  const { t } = useI18n();
  const [connecting, setConnecting] = useState(false);
  const [updatingLocationId, setUpdatingLocationId] = useState<string | null>(null);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const isConnected = googleStatus === 'active';
  const isRevoked = googleStatus === 'revoked';

  const handleConnectClick = () => {
    setConnecting(true);
    // Redirect to OAuth connect API route which redirects externally
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/google/oauth/connect?businessId=${encodeURIComponent(businessId)}`;
  };

  const handleTogglePolling = async (locationId: string, currentVal: boolean) => {
    setUpdatingLocationId(locationId);
    setActionError(null);
    try {
      const res = await fetch('/api/dashboard/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationId,
          isPollingEnabled: !currentVal,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update location polling');
      }

      // Update in parent state
      const updated = locations.map((loc) =>
        loc.id === locationId ? { ...loc, is_polling_enabled: !currentVal } : loc
      );
      onLocationsChange(updated);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setUpdatingLocationId(null);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(t('onboarding.confirmDisconnect'))) return;
    setPrivacyLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect_google', businessId }),
      });
      if (!res.ok) throw new Error('Disconnect failed');
      await onRefreshSettings();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setPrivacyLoading(false);
    }
  };

  const handlePurgeData = async () => {
    if (!window.confirm(t('onboarding.confirmPurge'))) return;
    setPrivacyLoading(true);
    setActionError(null);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect_and_delete_data', businessId }),
      });
      if (!res.ok) throw new Error('Data purge failed');
      await onRefreshSettings();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setPrivacyLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 2-line explanation */}
      <div className="p-4 rounded-2xl bg-surface border border-border shadow-xs space-y-2">
        <p className="text-sm font-medium text-text leading-relaxed">
          {t('onboarding.googleExplanation1')}
        </p>
        <p className="text-xs text-text-muted leading-relaxed">
          {t('onboarding.googleExplanation2')}
        </p>
      </div>

      {/* Main Connection Card */}
      <Card elevated={isConnected}>
        <CardContent className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                  isConnected
                    ? 'bg-success/15 text-success'
                    : isRevoked
                    ? 'bg-danger/15 text-danger'
                    : 'bg-primary/15 text-primary'
                }`}
              >
                {isConnected ? (
                  <Icon icon={CheckCircle2} size={26} />
                ) : isRevoked ? (
                  <Icon icon={AlertCircle} size={26} />
                ) : (
                  <Icon icon={Building2} size={26} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-text">
                    Google Business Profile
                  </h3>
                  <Badge
                    variant={
                      isConnected ? 'success' : isRevoked ? 'danger' : 'neutral'
                    }
                    size="sm"
                  >
                    {isConnected
                      ? t('onboarding.connectedStatus')
                      : isRevoked
                      ? t('onboarding.revokedStatus')
                      : t('onboarding.notConnectedStatus')}
                  </Badge>
                </div>

                <p className="text-xs text-text-muted mt-1">
                  {isConnected
                    ? googleEmail
                      ? `${googleEmail} • ${locations.length} ${t('onboarding.discoveredLocations')}`
                      : `${locations.length} ${t('onboarding.discoveredLocations')}`
                    : isRevoked
                    ? t('onboarding.revokedStatus')
                    : t('onboarding.googleExplanation1')}
                </p>
              </div>
            </div>

            {/* CTA Button based on state */}
            <div className="flex items-center gap-2 self-start sm:self-center">
              {!isConnected ? (
                <Button
                  variant="primary"
                  size="md"
                  loading={connecting}
                  onClick={handleConnectClick}
                  startIcon={
                    isRevoked ? (
                      <Icon icon={RotateCw} size={18} />
                    ) : (
                      <Icon icon={ExternalLink} size={18} />
                    )
                  }
                  className="w-full sm:w-auto"
                >
                  {isRevoked
                    ? t('onboarding.retryConnection')
                    : t('onboarding.connectGoogle')}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    loading={connecting}
                    onClick={handleConnectClick}
                    startIcon={<Icon icon={RotateCw} size={16} />}
                  >
                    {t('onboarding.reconnectGoogle')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={privacyLoading}
                    onClick={handleDisconnect}
                    className="text-text-muted hover:text-danger"
                  >
                    {t('onboarding.disconnectGoogle')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Error Banner if connection failed */}
          {(isRevoked || googleLastError || actionError) && (
            <InlineBanner
              variant="danger"
              title={t('onboarding.revokedStatus')}
            >
              <div className="space-y-2">
                <p>
                  {actionError ||
                    googleLastError ||
                    'Google OAuth connection failed or was revoked.'}
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleConnectClick}
                  startIcon={<Icon icon={RotateCw} size={16} />}
                >
                  {t('onboarding.retryConnection')}
                </Button>
              </div>
            </InlineBanner>
          )}

          {/* Discovered Locations Cards */}
          {isConnected && (
            <div className="pt-4 border-t border-border space-y-3">
              <div>
                <h4 className="text-sm font-bold text-text">
                  {t('onboarding.discoveredLocations')}
                </h4>
                <p className="text-xs text-text-muted mt-0.5">
                  {t('onboarding.discoveredLocationsHint')}
                </p>
              </div>

              {locations.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border text-center text-xs text-text-muted">
                  No verified locations found under this Google Business Profile.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {locations.map((loc) => (
                    <div
                      key={loc.id}
                      className="p-4 rounded-xl border border-border bg-surface-raised flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <Icon
                            icon={Building2}
                            size={16}
                            className="text-primary shrink-0"
                          />
                          <p className="text-sm font-semibold text-text truncate">
                            {loc.display_name}
                          </p>
                        </div>
                        {loc.address_lines && loc.address_lines.length > 0 && (
                          <p className="text-xs text-text-muted truncate mt-0.5">
                            {loc.address_lines.join(', ')}
                          </p>
                        )}
                        <p className="text-[11px] text-text-muted mt-1 font-mono">
                          {loc.is_polling_enabled
                            ? t('onboarding.pollingEnabled')
                            : t('onboarding.pollingDisabled')}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {updatingLocationId === loc.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <Switch
                            checked={loc.is_polling_enabled}
                            onChange={() =>
                              handleTogglePolling(loc.id, loc.is_polling_enabled)
                            }
                            aria-label={`Toggle polling for ${loc.display_name}`}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Privacy Note & Data Policy Collapsible */}
      <div className="rounded-2xl border border-border bg-surface p-4 text-xs text-text-muted space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-text">
            <Icon icon={Shield} size={16} className="text-primary shrink-0" />
            <span className="font-semibold text-xs">
              {t('onboarding.privacyNote')}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
            className="text-text-muted hover:text-text inline-flex items-center gap-1 font-medium text-xs transition-colors"
          >
            <span>
              {showPrivacyDetails
                ? t('common.close')
                : t('onboarding.privacyManageTitle')}
            </span>
            <Icon
              icon={showPrivacyDetails ? ChevronUp : ChevronDown}
              size={14}
            />
          </button>
        </div>

        {showPrivacyDetails && (
          <div className="pt-3 border-t border-border space-y-3">
            <p className="leading-relaxed">
              {t('onboarding.privacyManageDesc')}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#privacy-policy"
                onClick={(e) => {
                  e.preventDefault();
                  alert(
                    'Radd adheres strictly to the Google API Services User Data Policy, including the Limited Use requirements.'
                  );
                }}
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                {t('onboarding.privacyPolicyLink')}
                <Icon icon={ExternalLink} size={12} />
              </a>

              {businessId && (
                <Button
                  variant="destructive"
                  size="sm"
                  loading={privacyLoading}
                  onClick={handlePurgeData}
                  startIcon={<Icon icon={Trash2} size={14} />}
                >
                  {t('onboarding.purgeDataButton')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
