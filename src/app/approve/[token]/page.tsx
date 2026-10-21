import type { Metadata } from 'next';
import { getApprovalContextByToken } from '@/lib/approvals/service';
import ApprovalScreenView, {
  type ApprovalScreenData,
  InvalidApprovalLinkView,
} from './ApprovalScreenView';

export const metadata: Metadata = {
  title: 'Radd – Review Approval',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
  referrer: 'no-referrer',
};

function getDevPreviewData(token: string): ApprovalScreenData | null {
  if (process.env.NODE_ENV === 'production') return null;

  const base: ApprovalScreenData = {
    token,
    businessName: 'كافيه ومحمصة النيل · Nile Roastery',
    locationName: 'فرع الزمالك – شارع البرازيل',
    reviewerName: 'سارة محمود (Sara M.)',
    rating: 5,
    reviewText:
      'القهوة المختصة عندكم تحفة بجد والسبانش لاتيه مضبوط جداً! المكان هادي والخدمة سريعة وممتازة.',
    requiresCarefulReview: false,
    flags: [],
    draftBody:
      'أهلاً بكِ يا أستاذة سارة! سعدنا جداً بزيارتك لفرع الزمالك وبأن القهوة المختصة والسبانش لاتيه نالوا إعجابك. في انتظارك دائماً!',
    draftStatus: 'pending',
    finalBody: null,
    attempts: 1,
    isExpired: false,
    isAlreadyDecided: false,
    initialEditing: false,
  };

  switch (token) {
    case 'preview-normal':
      return base;
    case 'preview-careful':
      return {
        ...base,
        reviewerName: 'أحمد حسن (Ahmed H.)',
        rating: 1,
        reviewText:
          'للأسف الأوردر اتأخر ساعة كاملة والمشروب وصل بارد جداً، دفعت 250 جنيه وعايز استرداد للمبلغ فوراً وإلا هقدم شكوى لحماية المستهلك.',
        requiresCarefulReview: true,
        flags: ['refund', 'legal'],
        draftBody:
          'نعتذر لك بشدة يا أستاذ أحمد عن تأخر الطلب وعدم وصول المشروب بالشكل اللائق. نقدر ملاحظتك جداً ونرجو التواصل مع إدارة الفرع مباشرة لمتابعة الأمر فوراً.',
      };
    case 'preview-editing':
      return {
        ...base,
        initialEditing: true,
      };
    case 'preview-success':
      return {
        ...base,
        draftStatus: 'posted',
        isAlreadyDecided: true,
        finalBody: base.draftBody,
      };
    case 'preview-skipped':
      return {
        ...base,
        draftStatus: 'skipped',
        isAlreadyDecided: true,
      };
    case 'preview-used':
      return {
        ...base,
        draftStatus: 'approved',
        isAlreadyDecided: true,
        finalBody: base.draftBody,
      };
    case 'preview-failed':
      return {
        ...base,
        draftStatus: 'failed',
        isAlreadyDecided: true,
        attempts: 2,
        finalBody: base.draftBody,
      };
    case 'preview-expired':
      return {
        ...base,
        draftStatus: 'expired',
        isExpired: true,
      };
    default:
      return null;
  }
}

export default async function ApproveDraftPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  if (process.env.NODE_ENV !== 'production') {
    if (token === 'preview-invalid') {
      return <InvalidApprovalLinkView />;
    }
    const previewData = getDevPreviewData(token);
    if (previewData) {
      return <ApprovalScreenView data={previewData} />;
    }
  }

  const ctx = await getApprovalContextByToken(token);

  if (!ctx) {
    return <InvalidApprovalLinkView />;
  }

  const { draft, review, location, business, isExpired, isAlreadyDecided } = ctx;

  return (
    <ApprovalScreenView
      data={{
        token,
        businessName: business.name,
        locationName: location.display_name,
        reviewerName: review.reviewer_name,
        rating: review.rating,
        reviewText: review.text,
        requiresCarefulReview: review.requires_careful_review,
        flags: review.flags ?? [],
        draftBody: draft.body,
        draftStatus: draft.status,
        finalBody: draft.final_body,
        attempts: draft.attempts || 1,
        isExpired,
        isAlreadyDecided,
      }}
    />
  );
}
