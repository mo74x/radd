// DRAFT: Requires formal legal review prior to commercial launch
import { Metadata } from 'next';
import { TermsClientView } from './TermsClientView';

export const metadata: Metadata = {
  title: 'شروط الاستخدام والخدمة | رَدّ (Radd)',
  description:
    'شروط الاستخدام والخدمة لمنصة رَدّ (Radd) - الالتزام باعتماد المالك البشري الإلزامي قبل نشر أي رد على تقييمات Google.',
};

export default function TermsPage() {
  return <TermsClientView />;
}
