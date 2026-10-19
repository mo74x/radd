import { getApprovalContextByToken } from '@/lib/approvals/service';
import ApprovalActions from './ApprovalActions';

export const dynamic = 'force-dynamic';

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

        {isAlreadyDecided ? (
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
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-900">
            This approval link has expired.
          </div>
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