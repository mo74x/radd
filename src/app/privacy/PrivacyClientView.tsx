// DRAFT: Requires formal legal review prior to commercial launch
'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Cpu,
  Database,
  Bell,
  Trash2,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Mail,
  HelpCircle,
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

export function PrivacyClientView() {
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
              <Icon icon={Shield} size={12} className="me-1" />
              {isAr ? 'مسودة للمراجعة القانونية' : 'Draft for Legal Review'}
            </Badge>
            <span className="text-xs text-text-muted">
              {isAr
                ? 'آخر تحديث: [تاريخ السريان: مارس 2026]'
                : 'Last updated: [Effective Date: March 2026]'}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-text tracking-tight">
            {isAr ? 'سياسة الخصوصية وحماية البيانات' : 'Privacy & Data Protection Policy'}
          </h1>

          <p className="text-sm sm:text-base text-text-muted leading-relaxed max-w-3xl">
            {isAr
              ? 'توضح هذه السياسة بشفافية تامة ومطابقة كاملة للواقع البرمجي كيف تقوم منصة رَدّ (Radd) بجمع، واستخدام، وتشفير، وحماية بيانات حسابك وتقييمات متجرك على Google Business Profile.'
              : 'This policy describes with complete technical transparency how Radd collects, uses, encrypts, and protects your account data and Google Business Profile store reviews.'}
          </p>
        </div>

        {/* Legal Entities Notice */}
        <div className="p-4 rounded-2xl border border-border bg-surface-raised/70 text-xs text-text-muted space-y-2">
          <p className="font-semibold text-text flex items-center gap-1.5">
            <Icon icon={Building2} size={15} className="text-primary" />
            <span>{isAr ? 'بيانات الكيان القانوني للمنصة' : 'Legal Entity Details'}</span>
          </p>
          <p>
            <strong>{isAr ? 'اسم الشركة المشغلة: ' : 'Operating Company: '}</strong>
            <span className="font-mono">[Company Name / اسم الشركة المسجلة]</span>
          </p>
          <p>
            <strong>{isAr ? 'العنوان المسجل: ' : 'Registered Address: '}</strong>
            <span className="font-mono">[Physical Address / العنوان المسجل، القاهرة، جمهورية مصر العربية]</span>
          </p>
          <p>
            <strong>{isAr ? 'مسؤول حماية البيانات والبريد القانوني: ' : 'Data Protection Officer & Legal Contact: '}</strong>
            <span className="font-mono">[Support/Legal Email / legal@radd.app]</span>
          </p>
        </div>

        {/* Google User Data Policy & Limited Use Disclosure Callout */}
        <div className="p-6 rounded-2xl border-2 border-primary/40 bg-primary/5 space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <Icon icon={CheckCircle2} size={20} className="shrink-0" />
            <h2>
              {isAr
                ? 'إقرار الامتثال لسياسة بيانات مستخدمي خدمات Google API والرمز المحدود'
                : 'Google API Services User Data Policy & Limited Use Disclosure'}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-text leading-relaxed font-medium">
            {isAr ? (
              <>
                يخضع استخدام منصة رَدّ (Radd) ونقلها لأي معلومات يتم تلقيها من واجهات برمجة تطبيقات Google
                (Google APIs) إلى أي تطبيق آخر لسياسة{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline font-bold inline-flex items-center gap-0.5"
                >
                  بيانات مستخدمي خدمات Google API (Google API Services User Data Policy)
                  <Icon icon={ExternalLink} size={12} className="ms-0.5" />
                </a>
                ، بما في ذلك <strong>متطلبات الاستخدام المحدود (Limited Use requirements)</strong>.
              </>
            ) : (
              <>
                Radd’s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
                <a
                  href="https://developers.google.com/terms/api-services-user-data-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline font-bold inline-flex items-center gap-0.5"
                >
                  Google API Services User Data Policy
                  <Icon icon={ExternalLink} size={12} className="ms-0.5" />
                </a>
                , including the <strong>Limited Use requirements</strong>.
              </>
            )}
          </p>
          <p className="text-xs text-text-muted leading-relaxed">
            {isAr
              ? 'نحن لا نبيع بياناتك المستلمة من Google لأي طرف ثالث، ولا نستخدمها لأغراض الإعلانات الموجهة، ولا نستخدم تقييمات العملاء لتدريب نماذج الذكاء الاصطناعي العامة.'
              : 'We do not sell Google user data to any third parties, we do not use it for targeted advertising, and we do not use store reviews to train generalized AI foundation models.'}
          </p>
        </div>

        {/* 3. Detailed Sections */}
        <div className="space-y-8">
          {/* Section 1: Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Shield} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '1. نطاق السياسة وطبيعة الخدمة' : '1. Scope & Nature of the Service'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'منصة "رَدّ" هي منصة برمجية كخدمة (SaaS) موجهة لأصحاب الأنشطة التجارية والمحلات في مصر والشرق الأوسط. تتيح المنصة ربط حساب Google Business Profile لاستيراد التقييمات العامة للنشاط التجاري، وصياغة مسودات ردود مقترحة بالعامية المصرية أو العربية الفصحى عبر الذكاء الاصطناعي، وإرسال تنبيهات بنقرة واحدة للمالك لاعتماد الرد أو تعديله قبل نشره على Google.'
                  : 'Radd is a multi-tenant Software-as-a-Service (SaaS) platform built for local businesses in Egypt and the MENA region. Radd connects to your authorized Google Business Profile to ingest public reviews, draft context-aware proposed replies in Egyptian or Standard Arabic using AI, and deliver one-tap approval alerts to the business owner before anything is published.'}
              </p>
              <div className="p-3 rounded-xl bg-surface-raised border border-border">
                <p className="font-semibold text-text flex items-center gap-1.5">
                  <Icon icon={AlertTriangle} size={15} className="text-accent" />
                  <span>
                    {isAr
                      ? 'مبدأ عدم النشر التلقائي (الاعتماد البشري الإلزامي)'
                      : 'Zero Auto-Publishing Guarantee (Mandatory Human Approval)'}
                  </span>
                </p>
                <p className="mt-1 text-xs">
                  {isAr
                    ? 'تضمن المنصة برمجياً أن أي مسودة رد يتم إنشاؤها عبر الذكاء الاصطناعي لا تُنشر تلقائياً على Google مطلقاً. يُشترط نقر المالك أو المدير المفوض صراحةً على زر "اعتماد" (أو تعديل الرد ثم اعتماده) عبر رابط الاعتماد المؤمّن أو لوحة التحكم ليتم إرسال الرد إلى Google.'
                    : 'Radd technically guarantees that no AI draft is ever published automatically to Google. Every reply strictly requires the business owner to affirmatively tap "Approve" (or edit and approve) via the secure magic link or dashboard before any API call posts to Google.'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Data Collected */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Database} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '2. البيانات التي نقوم بجمعها وتخزينها' : '2. Data We Collect & Store'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'نقوم بجمع الحد الأدنى والضروري فقط من البيانات لتشغيل الخدمة، وتشمل:'
                  : 'We strictly adhere to data minimization, collecting only data essential to operate the service:'}
              </p>

              <ul className="list-disc list-inside space-y-2 ps-2">
                <li>
                  <strong className="text-text">{isAr ? 'بيانات Google Business Profile: ' : 'Google Business Profile Data: '}</strong>
                  {isAr
                    ? 'بموجب موافقتك الصريحة عبر Google OAuth 2.0 (نطاق business.manage)، نصل إلى معرّفات الحساب، والمواقع التابعة له (الاسم، العنوان، الهاتف)، وتقييمات العملاء العامة (اسم صاحب التقييم كما يظهر علناً في Google، التقييم بالنجوم 1-5، نص التعليق، وتاريخ التقييم).'
                    : 'Via your explicit Google OAuth 2.0 consent (scope business.manage), we read location metadata (name, address, contact phone), and public customer reviews (author display name, star rating, comment text, review timestamp).'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'رموز الدخول والتوثيق (Tokens): ' : 'OAuth Tokens & Credentials: '}</strong>
                  {isAr
                    ? 'رمز التحديث (refresh_token) ورمز الوصول (access_token) الخاص بربط Google. يتم تشفيرهما بالكامل عند التخزين في قاعدة البيانات باستخدام خوارزمية AES-256-GCM.'
                    : 'Google refresh and access tokens are encrypted at rest in our database using AES-256-GCM.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'قنوات التنبيه للتواصل: ' : 'Notification Channel Identifiers: '}</strong>
                  {isAr
                    ? 'رقم هاتف المالك لتلقي إشعارات واتساب، أو معرّف المحادثة لتلغرام (Telegram Chat ID)، أو عنوان البريد الإلكتروني لإرسال روابط الاعتماد الفورية.'
                    : 'Your WhatsApp destination phone number, Telegram chat ID, or verified email address used solely to deliver one-tap approval notifications.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'مسودات الردود وسجلات الاعتماد: ' : 'Draft Replies & Approval Logs: '}</strong>
                  {isAr
                    ? 'نص المسودة المقترحة، حالة الاعتماد (قيد الانتظار، معتمد، مرفوض، تم النشر، فشل)، القناة المستخدمة للاعتماد، وتاريخ الإجراء.'
                    : 'Proposed reply draft text, approval status (pending, approved, rejected, posted, failed), approving channel, and audit timestamps.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'بيانات الفوترة والاشتراكات: ' : 'Billing & Payment Metadata: '}</strong>
                  {isAr
                    ? 'حالة الخطة التجريبية أو الاشتراك المدفوع، معرّف العملية لدى بوابات الدفع (Paymob، Fawry، Stripe). لا نقوم إطلاقاً بجمع أو حفظ أرقام البطاقات الائتمانية أو الرموز السرية (CVV) على خوادمنا.'
                    : 'Subscription tier, transaction IDs from PCI-DSS compliant payment gateways (Paymob, Fawry, Stripe). Radd NEVER receives, processes, or stores raw credit card numbers or CVV codes.'}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 3: AI Processing */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Cpu} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '3. معالجة نصوص التقييمات بالذكاء الاصطناعي' : '3. AI Processing & Drafting'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'لصياغة ردود احترافية وذكية تناسب هوية متجرك، يتم إرسال نص التقييم العام وتقييم النجوم وإرشادات علامتك التجارية إلى مزود خدمات الذكاء الاصطناعي (Anthropic Claude API، طراز claude-haiku-5-5).'
                  : 'To formulate polite, context-aware responses matching your brand tone, review text, star ratings, and custom brand guidelines are transmitted to our AI partner (Anthropic Claude API, default claude-haiku-5-5).'}
              </p>
              <ul className="list-disc list-inside space-y-1.5 ps-2">
                <li>
                  {isAr
                    ? 'تتم المعالجة عبر واجهة برمجة التطبيقات التجارية لشركة Anthropic، والتي تنص شروطها على عدم استخدام بيانات العملاء لتدريب نماذج الذكاء الاصطناعي العامة.'
                    : 'Processing occurs under Anthropic’s commercial API terms, which strictly prohibit utilizing customer inputs to train generalized foundation models.'}
                </li>
                <li>
                  {isAr
                    ? 'لا يتم إرسال أي كلمات مرور أو رموز توثيق حساسة إلى مزود الذكاء الاصطناعي.'
                    : 'No OAuth tokens, passwords, or personal credentials are ever exposed to the AI model.'}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 4: Security & Encryption */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Lock} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '4. التشفير وأمن المعلومات' : '4. Information Security & Encryption'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'نطبق معايير أمنية صارمة على كل مستويات المنصة:'
                  : 'We enforce defense-in-depth security practices across our application stack:'}
              </p>
              <ul className="list-disc list-inside space-y-2 ps-2">
                <li>
                  <strong className="text-text">{isAr ? 'تشفير الرموز في السكون (AES-256-GCM): ' : 'At-Rest Token Encryption (AES-256-GCM): '}</strong>
                  {isAr
                    ? 'يتم تشفير رموز Google OAuth باستخدام مفتاح تشفير 256 بت مستودع في بيئة معزولة ولا يمكن قراءتها كنص عادي في قاعدة البيانات.'
                    : 'Google OAuth refresh tokens are encrypted at rest using authenticated AES-256-GCM with a 256-bit encryption key.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'روابط الاعتماد المؤمّنة (Magic Links): ' : 'Secure Single-Use Magic Links: '}</strong>
                  {isAr
                    ? 'تستخدم روابط الاعتماد المرسلة عبر واتساب وتلغرام رموزاً عشوائية بطول 256 بت يتم تجزئتها بخوارزمية SHA-256. تنتهي صلاحية الرمز بعد 72 ساعة وتُبطل فور الاستخدام الأول منعاً لإعادة استخدامها.'
                    : 'One-tap approval tokens are 256-bit high-entropy random secrets hashed with SHA-256, strictly expiring after 72 hours and invalidated immediately upon first use.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'عزل بيانات المستأجرين (Row-Level Security): ' : 'Multi-Tenant Data Isolation (RLS): '}</strong>
                  {isAr
                    ? 'تُعزل بيانات كل متجر في قاعدة البيانات عبر سياسات أمان على مستوى الصفوف (RLS)، بحيث لا يمكن لأي مستخدم آخر الوصول إلى تقييماتك أو مسوداتك.'
                    : 'Database records are isolated using PostgreSQL Row-Level Security (RLS), preventing any cross-tenant data access.'}
                </li>
                <li>
                  <strong className="text-text">{isAr ? 'التشفير أثناء النقل (TLS 1.3): ' : 'In-Transit Encryption (TLS 1.3): '}</strong>
                  {isAr
                    ? 'جميع الاتصالات عبر الإنترنت بين متصفحك، خوادمنا، وواجهات برمجة تطبيقات Google مشفرة بأحدث بروتوكولات HTTPS/TLS.'
                    : 'All traffic between your browser, our servers, and third-party APIs is protected by TLS 1.3 encryption.'}
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 5: Notification Channels & Sub-processors */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Bell} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '5. قنوات التنبيه ومعالجو الطرف الثالث' : '5. Notification Channels & Sub-processors'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'نعتمد على مزودين موثوقين فقط لتقديم خدمات معينة، وتقتصر مشاركة البيانات معهم على الغرض المحدد:'
                  : 'We partner with enterprise sub-processors under strict service agreements limited strictly to their designated functional scope:'}
              </p>
              <div className="grid gap-3 sm:grid-cols-2 pt-1">
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <p className="font-bold text-text text-xs">Google LLC</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isAr
                      ? 'واجهات برمجة التطبيقات الرسمية لـ Google Business Profile لجلب التقييمات ونشر الردود المعتمدة.'
                      : 'Official Google Business Profile APIs for review ingestion and publishing approved replies.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <p className="font-bold text-text text-xs">Anthropic PBC</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isAr
                      ? 'نماذج Claude لصياغة مسودات الردود الذكية وفق النبرة المحددة.'
                      : 'Claude AI models used solely to formulate context-aware draft replies.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <p className="font-bold text-text text-xs">Meta Ireland Ltd (WhatsApp)</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isAr
                      ? 'واجهة Meta Cloud API v21.0 لإرسال قوالب التنبيهات بروابط الاعتماد المباشرة عبر واتساب.'
                      : 'Meta Cloud API v21.0 to send WhatsApp template notifications with dynamic approval buttons.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <p className="font-bold text-text text-xs">Telegram FZ-LLC</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isAr
                      ? 'واجهة Telegram Bot API لإرسال إشعارات التقييمات وأزرار الاعتماد.'
                      : 'Telegram Bot API to deliver instant notifications with inline approval buttons.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <p className="font-bold text-text text-xs">Resend Inc.</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isAr
                      ? 'خدمة تسليم رسائل البريد الإلكتروني الإشعارية للمالكين.'
                      : 'Transactional email provider delivering approval notifications.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-border bg-surface">
                  <p className="font-bold text-text text-xs">Paymob / Fawry / Stripe</p>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    {isAr
                      ? 'معالجة اشتراكات الخدمة والمدفوعات الإلكترونية عبر بوابات معتمدة متوافقة مع معايير PCI-DSS.'
                      : 'PCI-DSS compliant payment processing for local and international payment methods.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Data Retention & User Rights (Self-service deletion) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={Trash2} size={20} className="text-danger" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '6. مدة الاحتفاظ بالبيانات وحقك في الحذف الفوري' : '6. Data Retention & Self-Service Data Deletion'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'نحتفظ بالبيانات فقط طالما أن حسابك نشط ومتصل بالمنصة. يحق لك في أي وقت التحكم في بياناتك وحذفها بالكامل عبر آليات الخدمة الذاتية المتوفرة داخل التطبيق:'
                  : 'We retain data only as long as your account remains active and connected. You have the unconditioned right to audit, disconnect, or permanently delete your data at any time:'}
              </p>
              <div className="space-y-2 pt-1">
                <div className="p-3 rounded-xl bg-surface-raised border border-border">
                  <p className="font-bold text-text text-xs">
                    {isAr ? '1. إلغاء الربط مع Google (Disconnect Google):' : '1. Disconnect Google Connection:'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isAr
                      ? 'من خلال إعدادات التطبيق (/dashboard/settings)، يمكنك فصل الحساب وإلغاء صلاحية الوصول في أي وقت، مما يوقف استيراد التقييمات فوراً ويبطل رموز OAuth.'
                      : 'Via Settings (/dashboard/settings), you can revoke Google access instantly, halting review polling and invalidating stored tokens.'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-danger/5 border border-danger/20">
                  <p className="font-bold text-danger text-xs">
                    {isAr ? '2. حذف ومسح كافة البيانات نهائياً (Purge All Data):' : '2. Permanently Delete All Data (Purge):'}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {isAr
                      ? 'يتيح لك زر "فصل الحساب ومسح كافة البيانات نهائياً" في إعدادات المنصة مسح جميع سجلات التقييمات، ومسودات الردود، وبيانات الفروع، وسجلات الاعتماد، ورموز التوثيق فوراً من قاعدة البيانات دون استرجاع.'
                      : 'The "Disconnect & Permanently Delete All Data" action in Settings triggers an immediate database purge of all your reviews, drafts, locations, audit logs, and connection credentials.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Inquiries & Contact */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Icon icon={HelpCircle} size={20} className="text-primary" />
                <CardTitle className="text-lg font-bold">
                  {isAr ? '7. الأسئلة والتواصل القانوني' : '7. Contact & Privacy Inquiries'}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-xs sm:text-sm text-text-muted leading-relaxed">
              <p>
                {isAr
                  ? 'إذا كانت لديك أي أسئلة أو استفسارات تتعلق بسياسة الخصوصية أو ممارسات حماية البيانات في رَدّ، يسعدنا تواصلك مع فريقنا عبر البريد الإلكتروني:'
                  : 'If you have questions regarding this Privacy Policy or our data protection safeguards, please reach out to our team at:'}
              </p>
              <div className="flex items-center gap-2 pt-1 font-mono text-sm text-primary font-bold">
                <Icon icon={Mail} size={16} />
                <span>[privacy@radd.app / support@radd.app]</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 4. Footer */}
      <footer className="border-t border-border bg-surface py-8 text-xs text-text-muted">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="text-text font-semibold underline">
              {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-text hover:underline transition-colors">
              {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
            </Link>
          </div>
          <p>© 2026 Radd (ردّ) • All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
