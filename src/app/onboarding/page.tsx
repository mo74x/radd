/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [businessId, setBusinessId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [googleConnected, setGoogleConnected] = useState(false);
  const [googleStatus, setGoogleStatus] = useState<'active' | 'revoked' | 'none'>('none');
  const [googleLastError, setGoogleLastError] = useState<string | null>(null);
  const [locationsCount, setLocationsCount] = useState(0);
  const [privacyLoading, setPrivacyLoading] = useState(false);

  const [notificationChannel, setNotificationChannel] = useState<'email' | 'telegram' | 'whatsapp'>('whatsapp');
  const [notificationTarget, setNotificationTarget] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const [tone, setTone] = useState('');
  const [arabicDialect, setArabicDialect] = useState<'egyptian' | 'msa' | 'gulf' | 'levantine'>('egyptian');
  const [signature, setSignature] = useState('');
  const [doListText, setDoListText] = useState('');
  const [dontListText, setDontListText] = useState('');
  const [examplesText, setExamplesText] = useState('');

  useEffect(() => {
    async function loadSettings() {
      const res = await fetch('/api/dashboard/settings');
      if (res.ok) {
        const data = await res.json();
        setBusinessId(data.business.id);
        setBusinessName(data.business.name);
        if (data.business.notification_channel) {
          setNotificationChannel(data.business.notification_channel);
        }
        setNotificationTarget(data.business.notification_target || '');
        const connStatus = data.googleConnection?.status ?? 'none';
        setGoogleStatus(connStatus);
        setGoogleConnected(connStatus === 'active');
        setGoogleLastError(data.googleConnection?.last_error ?? null);
        setLocationsCount(data.locations?.length || 0);
        setContactPhone(data.locations?.[0]?.contact_phone || '');

        if (data.brand) {
          setTone(data.brand.tone || '');
          setArabicDialect(data.brand.arabic_dialect || 'egyptian');
          setSignature(data.brand.signature || '');
          setDoListText((data.brand.do_list || []).join('\n'));
          setDontListText((data.brand.dont_list || []).join('\n'));
          setExamplesText((data.brand.example_replies || []).join('\n'));
        }
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  async function handleDisconnectGoogle() {
    if (!businessId) return;
    if (!window.confirm('Are you sure you want to disconnect your Google account? Auto-replying and polling will be paused.')) {
      return;
    }
    setPrivacyLoading(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect_google', businessId }),
      });
      if (res.ok) {
        setGoogleConnected(false);
        setGoogleStatus('revoked');
        setStatusMsg('✅ Google account disconnected. Polling has been safely paused.');
      }
    } finally {
      setPrivacyLoading(false);
    }
  }

  async function handleDisconnectAndDeleteData() {
    if (!businessId) return;
    const confirmed = window.confirm(
      '⚠️ PERMANENT DATA PURGE WARNING:\n\n' +
      'This will permanently disconnect your Google Account and DELETE all synced reviews, drafts, brand profiles, and locations from this database.\n\n' +
      'Are you sure you want to proceed?'
    );
    if (!confirmed) return;

    setPrivacyLoading(true);
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect_and_delete_data', businessId }),
      });
      const data = await res.json();
      if (res.ok) {
        setGoogleConnected(false);
        setGoogleStatus('revoked');
        setLocationsCount(0);
        setStatusMsg('🗑️ All Google data, drafts, locations, and tokens have been permanently deleted.');
      } else {
        setStatusMsg(`❌ Error: ${data.error}`);
      }
    } finally {
      setPrivacyLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    const splitLines = (txt: string) =>
      txt
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

    const res = await fetch('/api/dashboard/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessId,
        businessName,
        notificationChannel,
        notificationTarget,
        contactPhone,
        tone,
        arabicDialect,
        signature,
        doList: splitLines(doListText),
        dontList: splitLines(dontListText),
        exampleReplies: splitLines(examplesText),
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setStatusMsg('✅ تم حفظ إعدادات البراند بنجاح! (Brand Voice & Settings Saved)');
    } else {
      setStatusMsg(`❌ Error: ${data.error}`);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-sm font-medium text-gray-600">Loading onboarding settings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Onboarding & Brand Voice Setup
            </h1>
            <p className="text-sm text-gray-600">
              Connect Google Business Profile and teach the bot your exact tone.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Step 1: Connect Google Business Profile */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Step 1
                </span>
                {googleStatus === 'revoked' && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                    Connection Revoked
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900">
                Google Business Profile Connection
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {googleStatus === 'active'
                  ? `✅ Connected (${locationsCount} location synced)`
                  : googleStatus === 'revoked'
                  ? '⚠️ Access was revoked or expired. Reconnection is required to resume review syncing.'
                  : 'Connect your Google account so we can fetch new reviews and post approved replies.'}
              </p>
              {googleLastError && googleStatus === 'revoked' && (
                <p className="mt-1 font-mono text-xs text-rose-600">
                  Detail: {googleLastError}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/api/google/oauth/connect?businessId=${businessId}`}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm ${
                  googleStatus === 'revoked'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {googleConnected
                  ? 'Reconnect Google'
                  : googleStatus === 'revoked'
                  ? '⚠️ Reconnect Google Now'
                  : 'Connect Google Account'}
              </a>

              {googleConnected && (
                <button
                  type="button"
                  onClick={handleDisconnectGoogle}
                  disabled={privacyLoading}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                >
                  Disconnect
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Step 2 & 3: Brand Voice & Notification Settings */}
        <form
          onSubmit={handleSave}
          className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Step 2
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              Brand Voice & Egyptian Arabic Style
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700">
                Business Name
              </label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700">
                Signature (End of Reply)
              </label>
              <input
                type="text"
                dir="auto"
                value={signature}
                onChange={(e) => setSignature(e.target.value)}
                placeholder="فريق Roastery & Co."
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700">
                Arabic Dialect
              </label>
              <select
                value={arabicDialect}
                onChange={(e) => setArabicDialect(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="egyptian">Egyptian Arabic (عامية مصرية)</option>
                <option value="msa">Modern Standard Arabic (فصحى مبسطة)</option>
                <option value="gulf">Gulf Arabic (خليجي)</option>
                <option value="levantine">Levantine Arabic (شامي)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-gray-700">
                Complaint Contact Phone / WhatsApp
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+201001234567"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700">
              Brand Tone Description
            </label>
            <input
              type="text"
              dir="auto"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700">
              DO List (One rule per line)
            </label>
            <textarea
              dir="auto"
              rows={3}
              value={doListText}
              onChange={(e) => setDoListText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700">
              DO NOT List (One rule per line)
            </label>
            <textarea
              dir="auto"
              rows={3}
              value={dontListText}
              onChange={(e) => setDontListText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-gray-700">
              Example Replies You Like (One per line)
            </label>
            <textarea
              dir="auto"
              rows={3}
              value={examplesText}
              onChange={(e) => setExamplesText(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Step 3
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              One-Tap Approval Channel
            </h2>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700">
                  Channel
                </label>
                <select
                  value={notificationChannel}
                  onChange={(e) =>
                    setNotificationChannel(e.target.value as 'email' | 'telegram' | 'whatsapp')
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="whatsapp">WhatsApp (Meta Cloud API / One-Tap)</option>
                  <option value="telegram">Telegram Bot (Instant Push)</option>
                  <option value="email">Email (Signed Magic Link)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700">
                  {notificationChannel === 'whatsapp'
                    ? 'WhatsApp Phone Number (+201001234567)'
                    : notificationChannel === 'telegram'
                    ? 'Telegram Chat ID'
                    : 'Owner Email Address'}
                </label>
                <input
                  type="text"
                  value={notificationTarget}
                  onChange={(e) => setNotificationTarget(e.target.value)}
                  placeholder={
                    notificationChannel === 'whatsapp'
                      ? '+201001234567'
                      : notificationChannel === 'telegram'
                      ? '123456789'
                      : 'owner@business.com'
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                  required
                />
              </div>
            </div>
          </div>

          {statusMsg && (
            <div className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
              {statusMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving Settings...' : 'Save Brand Voice & Settings'}
          </button>
        </form>

        {/* Step 4: Data Privacy & Google Account Lifecycle */}
        <section
          id="privacy"
          className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
              Data Privacy & Google Lifecycle
            </span>
            <h2 className="text-lg font-bold text-gray-900">
              Manage Connection & Stored Data (إدارة الخصوصية والبيانات)
            </h2>
            <p className="mt-1 text-sm text-gray-600 leading-relaxed">
              In full compliance with <strong>Google API User Data Policy</strong> and data privacy standards, you have full control over your business data. You can disconnect your Google account to pause automation, or permanently delete all synced reviews, drafts, and OAuth credentials.
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Disconnect & Permanently Delete All Data (فصل الحساب وحذف جميع البيانات)
              </p>
              <p className="text-xs text-gray-500">
                Instantly purges all review records, AI drafts, locations, and revokes encrypted OAuth tokens.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDisconnectAndDeleteData}
              disabled={privacyLoading}
              className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
            >
              {privacyLoading ? 'Purging Data...' : '🗑️ Disconnect & Delete Data'}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}