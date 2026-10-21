/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';

interface ExpiredApprovalCardProps {
  token: string;
}

export default function ExpiredApprovalCard({ token }: ExpiredApprovalCardProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    channel: string;
    targetMasked: string;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleRenew() {
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/drafts/${token}/renew`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429 && data.retryAfterSeconds) {
          setCountdown(data.retryAfterSeconds);
        }
        throw new Error(data.error || 'Failed to renew approval link');
      }

      setResult({
        channel: data.channel,
        targetMasked: data.targetMasked,
        message: data.message,
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl">
          ✉️
        </div>
        <h2 className="text-lg font-bold text-emerald-950">
          تم إرسال الرابط الجديد بنجاح!
        </h2>
        <p className="mt-1 text-sm font-medium text-emerald-800">
          Fresh Approval Link Dispatched
        </p>

        <div className="mt-4 rounded-xl bg-white p-4 text-xs text-gray-700 shadow-sm sm:text-sm">
          <p className="font-semibold text-gray-900">
            تم إرسال رابط الموافقة الجديد إلى{' '}
            {result.channel === 'whatsapp'
              ? 'واتساب (WhatsApp)'
              : result.channel === 'telegram'
              ? 'حساب تيليجرام'
              : 'البريد الإلكتروني'}
            :
          </p>
          <p className="mt-1 font-mono font-medium text-emerald-700">
            {result.targetMasked}
          </p>
          <p className="mt-3 text-gray-500">
            لأسباب أمنية، لا يتم عرض الرابط هنا. يرجى مراجعة رسائلك للوصول إلى الرابط الجديد.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl">
        ⏳
      </div>
      <h2 className="text-lg font-bold text-amber-950">
        انتهت صلاحية هذا الرابط
      </h2>
      <p className="text-xs font-semibold uppercase tracking-wider text-amber-700">
        Approval Link Expired
      </p>

      <p className="mt-3 text-sm text-amber-900" dir="auto">
        لحماية حسابك التجاري وضمان الأمان ضد الروابط المعاد توجيهها، تنتهي صلاحية الروابط تلقائياً بعد 72 ساعة.
      </p>
      <p className="mt-1 text-xs text-amber-800">
        To protect your Google Business Profile against forwarded or stale links, approval links expire after 72 hours.
      </p>

      {errorMsg && (
        <div className="mt-4 rounded-xl bg-red-100/90 p-3 text-xs font-medium text-red-900 sm:text-sm">
          {errorMsg}
        </div>
      )}

      <div className="mt-5">
        <button
          type="button"
          disabled={loading || countdown !== null}
          onClick={handleRenew}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>جاري إرسال الرابط الجديد...</span>
            </>
          ) : countdown !== null ? (
            `يرجى الانتظار (${countdown}s) قبل إعادة المحاولة`
          ) : (
            'Send me a new link (أرسل لي رابطاً جديداً) 🔄'
          )}
        </button>
      </div>
    </div>
  );
}
