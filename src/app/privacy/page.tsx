// DRAFT: Requires formal legal review prior to commercial launch
import { Metadata } from 'next';
import { PrivacyClientView } from './PrivacyClientView';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية | رَدّ (Radd)',
  description:
    'سياسة الخصوصية وحماية البيانات لمنصة رَدّ (Radd) - الالتزام بسياسة بيانات مستخدمي خدمات Google API ومتطلبات الاستخدام المحدود.',
};

export default function PrivacyPage() {
  return <PrivacyClientView />;
}
