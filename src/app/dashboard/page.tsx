/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/dashboard/page.tsx
import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/admin';
import PollNowButton from './PollNowButton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const { data: business } = await supabaseAdmin
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!business) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-gray-900">No Business Found</h1>
          <p className="mt-2 text-sm text-gray-600">
            Run verify-foundation.ts to seed your first business.
          </p>
        </div>
      </main>
    );
  }

  const { data: reviews } = await supabaseAdmin
    .from('reviews')
    .select(`
      *,
      locations ( display_name ),
      drafts (*)
    `)
    .eq('business_id', business.id)
    .order('created_at', { ascending: false });

  const allReviews = reviews ?? [];
  const totalReviews = allReviews.length;

  let postedCount = 0;
  let approvedWithoutEditCount = 0;
  let editedCount = 0;
  let pendingCount = 0;

  for (const r of allReviews) {
    const draft = Array.isArray(r.drafts) ? r.drafts[0] : r.drafts;
    if (!draft) continue;

    if (draft.status === 'posted' || draft.status === 'approved' || draft.status === 'edited') {
      postedCount += 1;
      // Check if final_body matches the AI's initial body
      if (draft.final_body && draft.final_body.trim() !== draft.body.trim()) {
        editedCount += 1;
      } else {
        approvedWithoutEditCount += 1;
      }
    } else if (draft.status === 'pending') {
      pendingCount += 1;
    }
  }

  const shareAnsweredPct =
    totalReviews > 0 ? Math.round((postedCount / totalReviews) * 100) : 0;
  const approvedWithoutEditPct =
    postedCount > 0
      ? Math.round((approvedWithoutEditCount / postedCount) * 100)
      : 100;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {business.plan.toUpperCase()} • {business.status.toUpperCase()}
            </span>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">
              {business.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/onboarding"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              ⚙️ Brand Voice & Settings
            </Link>
            <PollNowButton />
          </div>
        </div>

        {/* Section 10 Headline Metrics */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Reviews Answered
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {shareAnsweredPct}%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {postedCount} of {totalReviews} reviews replied
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Approved Without Edit
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {approvedWithoutEditPct}%
            </p>
            <p className="mt-1 text-xs text-gray-500">
              {approvedWithoutEditCount} zero-edit / {editedCount} edited
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Pending Approval
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {pendingCount}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Awaiting owner one-tap
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Alert Channel
            </p>
            <p className="mt-2 text-lg font-bold capitalize text-gray-900">
              {business.notification_channel}
            </p>
            <p className="mt-1 truncate text-xs text-gray-500">
              {business.notification_target}
            </p>
          </div>
        </div>

        {/* Review & Reply History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">
            Review & Draft History ({totalReviews})
          </h2>

          {allReviews.map((rev: any) => {
            const draft = Array.isArray(rev.drafts) ? rev.drafts[0] : rev.drafts;
            const stars = '★'.repeat(rev.rating) + '☆'.repeat(5 - rev.rating);

            return (
              <div
                key={rev.id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {rev.reviewer_name || 'Customer'}
                    </span>
                    <span className="text-amber-500">{stars}</span>
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      lang: {rev.language || 'auto'}
                    </span>
                    {rev.flags?.map((flag: string) => (
                      <span
                        key={flag}
                        className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800"
                      >
                        ⚠️ {flag}
                      </span>
                    ))}
                  </div>

                  {draft && (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
                        draft.status === 'posted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : draft.status === 'posting'
                          ? 'bg-sky-100 text-sky-800 animate-pulse'
                          : draft.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : draft.status === 'failed'
                          ? 'bg-red-100 text-red-800'
                          : draft.status === 'expired'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {draft.status === 'posting'
                        ? 'Posting...'
                        : draft.status === 'failed'
                        ? (draft.attempts || 0) < 5
                          ? `Failed (Retrying ${draft.attempts || 1}/5)`
                          : 'Failed (Needs Attention)'
                        : draft.status}
                    </span>
                  )}
                </div>

                <p dir="auto" className="mt-3 text-sm text-gray-800">
                  {rev.text || (
                    <span className="italic text-gray-400">
                      (Star rating only — no comment)
                    </span>
                  )}
                </p>

                {draft && (
                  <div
                    className={`mt-4 rounded-xl border p-3.5 ${
                      draft.status === 'failed'
                        ? 'border-red-200 bg-red-50/40'
                        : draft.status === 'posting'
                        ? 'border-sky-200 bg-sky-50/40'
                        : 'border-emerald-100 bg-emerald-50/50'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
                      <span className="font-semibold">
                        {draft.final_body ? 'Final Reply:' : 'AI Drafted Reply:'}
                      </span>
                      <span>
                        {draft.model} ({draft.prompt_version})
                      </span>
                    </div>
                    <p dir="auto" className="text-sm text-gray-900">
                      {draft.final_body || draft.body}
                    </p>

                    {draft.status === 'failed' && (
                      <div className="mt-2.5 rounded-lg bg-red-100/90 p-2.5 text-xs text-red-900">
                        <div className="font-semibold">
                          {(draft.attempts || 0) < 5
                            ? '⚠️ Posting failed — automatic retry scheduled'
                            : '❌ Posting failed permanently — needs attention'}
                        </div>
                        {draft.last_error && (
                          <div className="mt-1 font-mono text-[11px] text-red-800">
                            Error: {draft.last_error}
                          </div>
                        )}
                        {draft.next_retry_at && (draft.attempts || 0) < 5 && (
                          <div className="mt-1 text-red-700">
                            Next retry: {new Date(draft.next_retry_at).toLocaleTimeString()}{' '}
                            (Attempt {draft.attempts || 1}/5)
                          </div>
                        )}
                      </div>
                    )}

                    {draft.status === 'posting' && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-lg bg-sky-100/90 p-2 text-xs text-sky-900">
                        <span className="inline-block h-2 w-2 animate-ping rounded-full bg-sky-600" />
                        <span>
                          Publishing in progress (attempt {draft.attempts || 1})...
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}