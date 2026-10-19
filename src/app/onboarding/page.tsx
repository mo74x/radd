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
  const [locationsCount, setLocationsCount] = useState(0);

  const [notificationChannel, setNotificationChannel] = useState<'email' | 'telegram'>('email');
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
        setNotificationChannel(
          data.business.notification_channel === 'telegram' ? 'telegram' : 'email'
        );
        setNotificationTarget(data.business.notification_target || '');
        setGoogleConnected(data.googleConnection?.status === 'active');
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
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Step 1
              </span>
              <h2 className="text-lg font-bold text-gray-900">
                Google Business Profile Connection
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {googleConnected
                  ? `✅ Connected (${locationsCount} location synced)`
                  : 'Connect your Google account so we can fetch new reviews and post approved replies.'}
              </p>
            </div>
            <a
              href={`/api/google/oauth/connect?businessId=${businessId}`}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              {googleConnected ? 'Reconnect Google' : 'Connect Google Account'}
            </a>
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
                    setNotificationChannel(e.target.value as 'email' | 'telegram')
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                >
                  <option value="email">Email (Signed Magic Link)</option>
                  <option value="telegram">Telegram Bot (Instant Push)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-700">
                  {notificationChannel === 'telegram'
                    ? 'Telegram Chat ID'
                    : 'Owner Email Address'}
                </label>
                <input
                  type="text"
                  value={notificationTarget}
                  onChange={(e) => setNotificationTarget(e.target.value)}
                  placeholder={
                    notificationChannel === 'telegram'
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
      </div>
    </main>
  );
}