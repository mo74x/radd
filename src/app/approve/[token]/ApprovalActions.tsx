/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';

interface ApprovalActionsProps {
  token: string;
  initialDraftBody: string;
  requiresCarefulReview: boolean;
  flags: string[];
}

export default function ApprovalActions({
  token,
  initialDraftBody,
  requiresCarefulReview,
  flags,
}: ApprovalActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(initialDraftBody);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [resultState, setResultState] = useState<{
    status: string;
    finalBody: string | null;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAction(action: 'approve' | 'edit' | 'skip') {
    setLoadingAction(action);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/drafts/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          editedBody: action === 'edit' ? editedText : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process action');
      }

      setResultState({
        status: data.status,
        finalBody: data.finalBody,
      });
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoadingAction(null);
    }
  }

  if (resultState) {
    const isPosted = resultState.status === 'posted';
    const isPosting = resultState.status === 'posting';
    const isSkipped = resultState.status === 'skipped';

    return (
      <div
        className={`rounded-xl border p-5 text-center ${
          isPosted
            ? 'border-emerald-200 bg-emerald-50'
            : isPosting
            ? 'border-sky-200 bg-sky-50'
            : isSkipped
            ? 'border-gray-200 bg-gray-50'
            : 'border-amber-200 bg-amber-50'
        }`}
      >
        <div
          className={`text-lg font-bold ${
            isPosted
              ? 'text-emerald-900'
              : isPosting
              ? 'text-sky-900'
              : isSkipped
              ? 'text-gray-900'
              : 'text-amber-900'
          }`}
        >
          {isPosted
            ? '✅ تم نشر الرد على جوجل بنجاح! (Reply Posted to Google)'
            : isPosting
            ? '⏳ جاري إرسال الرد إلى جوجل... (Posting in Progress)'
            : isSkipped
            ? '⏭️ تم تخطي هذا التقييم (Review Skipped)'
            : `الحالة: ${resultState.status}`}
        </div>
        {resultState.finalBody && (
          <p
            dir="auto"
            className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-800 shadow-sm"
          >
            {resultState.finalBody}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requiresCarefulReview && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-900">
          <p className="font-semibold">
            ⚠️ تنبيه: هذا التقييم سلبي أو حساس — يرجى مراجعة الرد بعناية قبل النشر
          </p>
          {flags.length > 0 && (
            <p className="mt-1 text-xs text-red-700">
              Flags detected: {flags.join(', ')}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Suggested Reply / الرد المقترح
          </span>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs font-medium text-emerald-700 underline hover:text-emerald-900"
          >
            {isEditing ? 'Cancel Edit (إلغاء التعديل)' : 'Edit Reply (تعديل النص)'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            dir="auto"
            rows={4}
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white p-3 text-base text-gray-900 focus:border-emerald-600 focus:outline-none"
          />
        ) : (
          <p dir="auto" className="whitespace-pre-wrap text-base text-gray-900">
            {initialDraftBody}
          </p>
        )}
      </div>

      {errorMsg && (
        <div className="rounded-lg bg-red-100 p-3 text-sm font-medium text-red-800">
          {errorMsg}
        </div>
      )}

      <div className="flex flex-col gap-2.5 sm:flex-row">
        {isEditing ? (
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() => handleAction('edit')}
            className="flex-1 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === 'edit'
              ? 'Publishing...'
              : '✅ Save & Post Edited Reply (حفظ ونشر)'}
          </button>
        ) : (
          <button
            type="button"
            disabled={loadingAction !== null}
            onClick={() => handleAction('approve')}
            className="flex-1 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            {loadingAction === 'approve'
              ? 'Posting to Google...'
              : '✅ Approve & Post in One Tap (موافقة ونشر)'}
          </button>
        )}

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() => setIsEditing(true)}
          className="rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          ✏️ Edit (تعديل)
        </button>

        <button
          type="button"
          disabled={loadingAction !== null}
          onClick={() => handleAction('skip')}
          className="rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
        >
          {loadingAction === 'skip' ? 'Skipping...' : 'Skip (تخطي)'}
        </button>
      </div>
    </div>
  );
}