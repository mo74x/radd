// DRAFT: Requires formal legal review prior to commercial launch
'use client';

import React from 'react';
import Link from 'next/link';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Building2,
  Mail,
  HelpCircle,
  ShieldAlert,
  CreditCard,
  Ban,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Icon,
  Logo,
  LanguageToggle,
  ThemeToggle,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

export function TermsClientView() {
  const { locale, isRtl } = useI18n();
  const BackArrowIcon = isRtl ? ArrowRight : ArrowLeft;
  const isAr = locale === 'ar';

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-primary/20">
      {/* 1. Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
              aria-label="Radd Home"
            >
              <Logo variant="lockup" size="sm" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs sm:text-sm font-semibold text-text-muted hover:text-text transition-colors inline-flex items-center gap-1.5 min-h-[44px] px-3 py-2 rounded-xl hover:bg-surface"
            >
              <Icon icon={BackArrowIcon} size={16} />
              <span>{isAr ? 'العودة للرئيسية' : 'Back to Home'}</span>
            </Link>
            <div className="h-5 w-px bg-border hidden sm:block" />
            <LanguageToggle />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-10 sm:py-16 space-y-10">
        {/* Header Hero */}
        <div className="text-start space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent" size="sm">
              <Icon icon={Scale} size={12} className="me-1" />
              {isAr ? 'مسودة للمراجعة القانونية' : 'Draft for Legal Review'}
            </Badge>
            <span className="text-xs text-text-muted">
              {isAr
                ? 'آخر تحديث: [تاريخ السريان: مارس 2026]'
                : 'Last updated: [Effective Date: March 2026]'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
            {isAr ? 'شروط الخدمة والاستخدام' : 'Terms of Service & Usage'}
          </h1>

          <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-3xl">
            {isAr
              ? 'تحدد هذه الاتفاقية الشروط والأحكام الحاكمة لاستخدام منصة رَدّ (Radd). يُرجى قراءة هذه الشروط بعناية قبل إنشاء حسابك أو ربط صفحة متجرك على Google.'
              : 'These Terms of Service govern your access to and use of Radd. Please review these terms carefully before creating an account or connecting your Google Business Profile.'}
          </p>
        </div>

        {/* Legal Entities Notice */}
        <div className="p-4 rounded-2xl border border-border bg-surface-raised/70 text-xs text-text-muted space-y-2">
          <p className="font-semibold text-text flex items-center gap-1.5">
            <Icon icon={Building2} size={15} className="text-primary" />
            <span>{isAr ? 'بيانات الكيان القانوني للمنصة' : 'Legal Entity Details'}</span>
          </p>
          <p>
            <strong>{isAr ? 'الشركة المالكة والمشغلة: ' : 'Operating Company: '}</strong>
            <span className="font-mono">[Company Name / اسم الشركة المسجلة]</span>
          </p>
          <p>
            <strong>{isAr ? 'العنوان المسجل: ' : 'Registered Address: '}</strong>
            <span className="font-mono">[Physical Address / العنوان المسجل، القاهرة، جمهورية مصر العربية]</span>
          </p>
          <p>
            <strong>{isAr ? 'البريد القانوني للإخطارات: ' : 'Legal Inquiries Email: '}</strong>
            <span className="font-mono">[Legal Email / legal@radd.app]</span>
          </p>
        </div>

        {/* Crucial Human Review Callout */}
        <div className="p-6 rounded-2xl border-2 border-accent/50 bg-accent/5 space-y-3">
          <div className="flex items-center gap-2 text-text font-bold text-base">
            <Icon icon={AlertTriangle} size={20} className="text-accent shrink-0" />
            <h2>
              {isAr
                ? 'البند الجوهري: الاعتماد البشري الإلزامي والمسؤولية التحريرية الكاملة للمالك'
                : 'Crucial Clause: Mandatory Human Review & Sole Editorial Responsibility'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text leading-relaxed font-medium">
            {isAr
              ? 'تعمل منصة رَدّ كمساعد تقني يقترح مسودات ردود عبر الذكاء الاصطناعي، ولا تقوم إطلاقاً بنشر أي رد على تقييمات Google دون موافقة صريحة ومباشرة من صاحب العمل أو المفوض عنه عبر زر الاعتماد. يقر المستخدم بأنه المسؤول الأول والأخير قانونياً وتحريرياً عن محتوى أي رد يتم اعتماده ونشره على صفحته التجارية.'
              : 'Radd operates exclusively as an AI-powered drafting assistant and never posts replies automatically without affirmative human action. The business owner retains sole, ultimate editorial authority and legal liability for all approved replies published to their public Google listing.'}
          </p>
        </div>

        {/* 3. Detailed Sections */}
        <div className="space-y-8">
          {/* Section 1: Acceptance & Eligibility */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={CheckCircle2} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '1. قبول الشروط والأهلية القانونية' : '1. Acceptance & Eligibility'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'بإنشاء حساب على منصة رَدّ، أو ربط حساب Google Business Profile، فإنك تقر بأنك تبلغ السن القانونية لإبرام العقود وتملك الصلاحية القانونية الكاملة لتمثيل النشاط التجاري وإدارة حضوره الرقمي على Google.'
                  : 'By registering for Radd or connecting a Google Business Profile, you represent and warrant that you possess full legal capacity to enter into binding agreements and possess the verified authority to manage the business listing on Google.'}
              </p>
              <p>
                {isAr
                  ? 'إذا كنت لا توافق على هذه الشروط، فيجب عليك التوقف فوراً عن استخدام المنصة وإلغاء ربط حسابك.'
                  : 'If you disagree with any provision in these Terms, you must immediately refrain from using the platform and disconnect your accounts.'}
              </p>
            </CardContent>
          </Card>

          {/* Section 2: Services & Approval Flow */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={FileText} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '2. وصف الخدمة ومسار الاعتماد' : '2. Service Description & Approval Flow'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'تقدم رَدّ خدمة برمجية بنظام الاشتراك السحابي، تتضمن:'
                  : 'Radd delivers cloud SaaS capabilities including:'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 ps-2">
                <li>
                  {isAr
                    ? 'فحص ومزامنة تقييمات العملاء الجديدة من حساب Google Business Profile المتصل.'
                    : 'Scheduled automated polling and synchronization of new Google Business Profile reviews.'}
                </li>
                <li>
                  {isAr
                    ? 'صياغة مسودات ردود ذكية مقترحة بالعامية المصرية أو الفصحى حسب الهوية المضبوطة.'
                    : 'Generating context-specific suggested drafts according to configured brand tone and dialect.'}
                </li>
                <li>
                  {isAr
                    ? 'إرسال روابط اعتماد سريعة وآمنة عبر واتساب، أو تلغرام، أو البريد الإلكتروني.'
                    : 'Dispatching one-tap secure magic approval links via WhatsApp, Telegram, or Email.'}
                </li>
                <li>
                  {isAr
                    ? 'نشر الرد على صفحة Google فور اعتماد المالك أو تعديله للنص واعتماده.'
                    : 'Executing publishing to Google Business Profile solely upon explicit affirmative owner approval.'}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: Google Integration & Third-Party APIs */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Scale} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '3. التكامل مع Google والخدمات الخارجية' : '3. Google Integration & Third-Party Services'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'يعتمد عمل المنصة على واجهات برمجة تطبيقات مقدمة من أطراف ثالثة مستقلة (Google LLC، Anthropic PBC، Meta، Telegram، Resend). تقر وتدرك بأن منصة رَدّ غير تابعة لشركة Google LLC أو تحت رعايتها الرسمية.'
                  : 'Platform functionality relies on APIs from independent vendors (Google LLC, Anthropic PBC, Meta Platforms, Telegram, Resend). You acknowledge that Radd is independent and not endorsed, sponsored, or affiliated with Google LLC.'}
              </p>
              <p>
                {isAr
                  ? 'لا تتحمل رَدّ المسؤولية عن أي انقطاع أو تغيير في سياسات أو خدمات تلك الأطراف الثالثة قد يؤثر مؤقتاً على إرسال الإشعارات أو استيراد التقييمات أو النشر.'
                  : 'Radd is not liable for disruptions, rate limits, or unilateral policy modifications imposed by third-party upstream API providers.'}
              </p>
            </CardContent>
          </Card>

          {/* Section 4: Acceptable Use & Prohibited Acts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Ban} size={20} className="text-danger" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '4. الاستخدام المقبول والمحظورات' : '4. Acceptable Use & Prohibitions'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'يلتزم المستخدم بعدم استخدام المنصة لأي من الأغراض المحظورة التالية:'
                  : 'Users agree strictly not to use the platform for any prohibited purposes:'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 ps-2">
                <li>
                  {isAr
                    ? 'نشر أي ردود مضللة، احتيالية، تشهيرية، مسيئة، تحض على الكراهية، أو تنتهك سياسات محتوى Google.'
                    : 'Publishing defamatory, deceptive, discriminatory, abusive, fraudulent, or illegal responses.'}
                </li>
                <li>
                  {isAr
                    ? 'محاولة اختراق أو تفكيك أو التحايل على التدابير الأمنية ورموز التشفير للمنصة.'
                    : 'Reverse engineering, exploiting vulnerabilities, or circumventing cryptographic token security.'}
                </li>
                <li>
                  {isAr
                    ? 'إساءة استخدام واجهات المنصة لتوليد ردود مزيفة أو التلاعب المصطنع بتقييمات العملاء.'
                    : 'Manipulating reviews artificially or abusing automated APIs beyond normal business usage.'}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 5: Subscription, Pricing & Trials */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={CreditCard} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '5. الاشتراكات، الفوترة، والتجربة المجانية' : '5. Subscriptions, Billing & Free Trial'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <ul className="list-disc list-inside space-y-2 ps-2">
                <li>
                  <strong className="text-text">{isAr ? 'التجربة المجانية: ' : 'Free Trial: '}</strong>
                  {isAr
                    ? 'يحصل كل حساب جديد على تجربة مجانية لمدة 14 يوماً بكامل المزايا، دون أي اشتراط لإدخال بيانات بطاقة دفع بنكية مسبقاً.'
                    : 'Every new business receives a 14-day full-featured free trial with no payment card required upfront.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'رسوم الاشتراك والدفع: ' : 'Subscription Fees & Billing: '}</strong>
                  {isAr
                    ? 'يتم تحصيل رسوم الخطط المدفوعة مقدماً وفقاً لدورة الاشتراك المختارة (شهرية أو سنوية) عبر بوابات الدفع المعتمدة (Paymob، Fawry، Stripe). الأسعار معلنة بوضوح بالجنيه المصري والدولار.'
                    : 'Subscriptions are billed in advance per the selected billing cycle (monthly/annual) via PCI-DSS payment gateways (Paymob, Fawry, Stripe).'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'الإلغاء: ' : 'Cancellation: '}</strong>
                  {isAr
                    ? 'يمكنك إلغاء الاشتراك في أي وقت، وسيظل حسابك نشطاً حتى نهاية الفترة المدفوعة الحالية دون تجديد تلقائي إضافي.'
                    : 'You may cancel your subscription at any time. Your access remains active until the end of the current billing cycle.'}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 6: Limitation of Liability */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={ShieldAlert} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '6. إخلاء الضمانات وتحديد المسؤولية' : '6. Warranty Disclaimer & Limitation of Liability'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'يتم تقديم خدمات رَدّ على أساس "كما هي" (AS IS) و"كما هي متاحة" (AS AVAILABLE). لا تقدم المنصة أي ضمانات صريحة أو ضمنية بأن الخدمة ستكون خالية من الأخطاء العارضة أو الانقطاع غير المجدول.'
                  : 'Radd is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, statutory, or implied.'}
              </p>
              <p>
                {isAr
                  ? 'إلى الحد الأقصى الذي يسمح به القانون، لا تتحمل المنصة أو مسؤولوها أي مسؤولية عن أي أضرار غير مباشرة، أو تبعية، أو خسارة في الأرباح أو السمعة الناتجة عن الردود المنشورة بعد اعتمادها من قبلك. ويكون الحد الأقصى لإجمالي مسؤولية رَدّ هو المبلغ الفعلي الذي دفعه المستخدم خلال الثلاثة (3) أشهر السابقة للمطالبة.'
                  : 'To the fullest extent permitted by applicable law, in no event shall Radd or its operators be liable for indirect, incidental, or consequential damages resulting from user-approved replies. In all cases, Radd’s total aggregate liability shall not exceed the fees paid by you in the preceding three (3) months.'}
              </p>
            </CardContent>
          </Card>

          {/* Section 7: Termination & Account Purge */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Scale} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '7. إنهاء الخدمة ومسح البيانات' : '7. Termination & Data Deletion'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'يحق لك إنهاء هذا الاتفاق في أي وقت من خلال التوقف عن استخدام المنصة وتفعيل خيار "فصل الحساب ومسح كافة البيانات نهائياً" من صفحة الإعدادات، والذي يمسح فوراً كافة سجلات التقييمات والمسودات وبيانات الفروع.'
                  : 'You may terminate this agreement at any time by halting usage and selecting the "Disconnect & Permanently Delete All Data" option in Settings, purging all your records immediately.'}
              </p>
            </CardContent>
          </Card>

          {/* Section 8: Governing Law */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Building2} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '8. القانون الواجب التطبيق وفض النزاعات' : '8. Governing Law & Dispute Resolution'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'تخضع هذه الشروط وتُفسر وفقاً لقوانين [Jurisdiction: جمهورية مصر العربية / Arab Republic of Egypt]. وتختص محاكم [Jurisdiction: محاكم القاهرة الاقتصادية / Cairo Commercial Courts] بالفصل في أي نزاع ينشأ عن هذا الاتفاق.'
                  : 'These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction: Arab Republic of Egypt]. Any legal disputes shall be submitted to the exclusive jurisdiction of the competent courts of [Jurisdiction: Cairo, Egypt].'}
              </p>
            </CardContent>
          </Card>

          {/* Section 9: Inquiries */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={HelpCircle} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '9. الاستفسارات والإخطارات' : '9. Inquiries & Legal Notices'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'لأي استفسارات قانونية بخصوص هذه الشروط، يرجى التواصل معنا عبر:'
                  : 'For legal questions or formal notices regarding these terms, reach us at:'}
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-sm text-primary font-bold">
                <Icon icon={Mail} size={16} />
                <span>[legal@radd.app / support@radd.app]</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-border bg-surface py-8 text-xs text-text-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-text hover:underline transition-colors">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <span>•</span>
            <Link href="/terms" className="text-text font-semibold underline">
              {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
            </Link>
          </div>
          <p>© 2026 Radd (ردّ) • All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
