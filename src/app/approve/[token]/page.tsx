/* eslint-disable react-hooks/purity */
import type { Metadata } from 'next';
import { getApprovalContextByToken } from '@/lib/approvals/service';
import ApprovalActions from './ApprovalActions';
import ExpiredApprovalCard from './ExpiredApprovalCard';

export const metadata: Metadata = {
  title: 'Approval Review',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: 'no-referrer',
};

export default async function ApproveDraftPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const ctx = await getApprovalContextByToken(token);

  if (!ctx) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">Link Not Found</h1>
          <p className="mt-2 text-sm text-gray-600">
            This approval link is invalid or does not exist.
          </p>
        </div>
      </main>
    );
  }

  const { draft, review, location, business, isExpired, isAlreadyDecided } = ctx;
  const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="border-b border-gray-100 pb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {business.name}
          </p>
          <h1 className="text-lg font-bold text-gray-900">
            {location.display_name}
          </h1>
        </div>

        <div className="rounded-xl bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-900">
              {review.reviewer_name || 'Customer'}
            </span>
            <span className="text-lg tracking-tight text-amber-500">{stars}</span>
          </div>
          <p dir="auto" className="mt-2 text-base text-gray-800">
            {review.text || (
              <span className="italic text-gray-500">
                (تقييم بالنجوم فقط بدون تعليق / Star rating only)
              </span>
            )}
          </p>
        </div>

        {draft.status === 'posting' ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-center">
            <div className="flex items-center justify-center gap-2 text-base font-bold text-sky-900">
              <span className="inline-block h-2.5 w-2.5 animate-ping rounded-full bg-sky-500" />
              <span>جاري النشر على جوجل... (Posting to Google...)</span>
            </div>
            <p className="mt-2 text-xs text-sky-700">
              Started at{' '}
              {new Date(
                draft.posting_started_at || draft.decided_at || Date.now()
              ).toLocaleTimeString()}{' '}
              (Attempt {draft.attempts || 1})
            </p>
            {draft.final_body && (
              <p
                dir="auto"
                className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-800 shadow-sm"
              >
                {draft.final_body}
              </p>
            )}
          </div>
        ) : draft.status === 'failed' ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <div className="text-base font-bold text-red-900">
              {(draft.attempts || 0) < 5
                ? '⚠️ فشل النشر مؤقتاً — مجدول لإعادة المحاولة (Posting failed, retrying)'
                : '❌ تعذر نشر الرد على جوجل (Failed to post reply — needs attention)'}
            </div>
            {draft.last_error && (
              <p className="mt-2 rounded bg-white/80 p-2.5 text-xs font-mono text-red-800">
                {draft.last_error}
              </p>
            )}
            {draft.next_retry_at && (draft.attempts || 0) < 5 && (
              <p className="mt-2 text-xs font-medium text-red-700">
                Next retry: {new Date(draft.next_retry_at).toLocaleTimeString()}{' '}
                (Attempt {draft.attempts || 1}/5)
              </p>
            )}
            {draft.final_body && (
              <div className="mt-3 text-left">
                <span className="text-xs font-semibold uppercase text-gray-500">
                  Approved reply:
                </span>
                <p
                  dir="auto"
                  className="mt-1 rounded-lg bg-white p-3 text-sm text-gray-800 shadow-sm"
                >
                  {draft.final_body}
                </p>
              </div>
            )}
          </div>
        ) : draft.status === 'posted' ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
            <p className="font-bold text-emerald-900">
              ✅ تم نشر الرد على جوجل بنجاح (Reply posted to Google)
            </p>
            {draft.final_body && (
              <p
                dir="auto"
                className="mt-3 rounded-lg bg-white p-3 text-sm text-gray-800 shadow-sm"
              >
                {draft.final_body}
              </p>
            )}
          </div>
        ) : draft.status === 'skipped' ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center text-gray-700">
            ⏭️ تم تخطي هذا التقييم (Review skipped)
          </div>
        ) : isAlreadyDecided ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
            <p className="font-semibold text-blue-900">
              This review has already been handled (Status: {draft.status}).
            </p>
            {draft.final_body && (
              <p dir="auto" className="mt-2 text-sm text-blue-800">
                {draft.final_body}
              </p>
            )}
          </div>
        ) : isExpired ? (
          <ExpiredApprovalCard token={token} />
        ) : (
          <ApprovalActions
            token={token}
            initialDraftBody={draft.body}
            requiresCarefulReview={review.requires_careful_review}
            flags={review.flags}
          />
        )}
      </div>
    </main>
  );
}