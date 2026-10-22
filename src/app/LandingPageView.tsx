'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Send,
  HeartHandshake,
  UserCheck,
  Check,
  ChevronDown,
  Lock,
  BellRing,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardContent,
  Badge,
  StarRating,
  Icon,
  Logo,
  LanguageToggle,
  ThemeToggle,
} from '@/components/ui';
import { useI18n } from '@/lib/i18n/context';

export const LandingPageView: React.FC = () => {
  const { t, isRtl } = useI18n();

  // Interactive Demo Tab
  const [demoTab, setDemoTab] = useState<'arabic' | 'english' | 'mixed'>('arabic');
  const [demoApproved, setDemoApproved] = useState(false);

  // FAQ Accordion Open State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const demoContent = {
    arabic: {
      reviewer: 'مريم عادل',
      time: 'منذ ساعتين',
      rating: 5,
      review:
        'بصراحة من أحلى وأجمل الأماكن اللي زرتها في المعادي! القهوة ممتازة وموزونة، والموظفين قمة في الذوق والاحترام. أكيد هكون زبونة دائمة.',
      reply:
        'أهلاً بك يا مريم يا فندم! نورتينا وسعداء جداً بزيارتك ورأيك الجميل في القهوة والخدمة عندنا. نتمنى دايماً نكون عند حسن ظنك ونشوفك منورانا قريب جداً!\n\n— فريق مقهى ومحمص المعادي',
    },
    english: {
      reviewer: 'David Miller',
      time: 'Yesterday',
      rating: 5,
      review:
        'Phenomenal specialty roast and superb flat white! The atmosphere is calm, clean, and ideal for work. Service was exceptionally prompt and friendly.',
      reply:
        'Hello David! Thank you so much for the glowing 5-star review! We are delighted that you enjoyed the flat white roast and the work-friendly atmosphere. Looking forward to welcoming you back soon!\n\n— The Roastery Team',
    },
    mixed: {
      reviewer: 'كريم حسن',
      time: 'منذ ٤ ساعات',
      rating: 3,
      review:
        'الأكل كان حلو جداً بس الأوردر اتأخر حوالي نصف ساعة عن الميعاد، ياريت تهتموا بسرعة التسليم وقت الزحمة.',
      reply:
        'أهلاً بك يا أستاذ كريم، ونعتذر جداً عن التأخير غير المقصود في وصول طلبك وقت الذروة. ملاحظتك مهمة جداً لإدارتنا وتم نقلها لفريق التشغيل لتفادي تكرارها. يسعدنا جداً تواصلك المباشر معنا على: +201001234567 لخدمتك بالشكل الذي يليق بك.\n\n— فريق إدارة الفرع',
    },
  };

  const currentDemo = demoContent[demoTab];

  const faqs = [
    { q: t('landing.q1'), a: t('landing.a1') },
    { q: t('landing.q2'), a: t('landing.a2') },
    { q: t('landing.q3'), a: t('landing.a3') },
    { q: t('landing.q4'), a: t('landing.a4') },
    { q: t('landing.q5'), a: t('landing.a5') },
    { q: t('landing.q6'), a: t('landing.a6') },
  ];

  return (
    <div className="min-h-screen bg-background text-text flex flex-col justify-between selection:bg-primary/20 scroll-smooth">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-surface/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <Logo variant="lockup" size="md" />
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Landing Navigation" className="hidden md:flex items-center gap-6 text-sm font-semibold text-text-muted">
            <a href="#how-it-works" className="hover:text-primary transition-colors">
              {t('landing.navHowItWorks')}
            </a>
            <a href="#why-radd" className="hover:text-primary transition-colors">
              {t('landing.navFeatures')}
            </a>
            <a href="#safety" className="hover:text-primary transition-colors">
              {t('landing.navSafety')}
            </a>
            <a href="#pricing" className="hover:text-primary transition-colors">
              {t('landing.navPricing')}
            </a>
            <a href="#faq" className="hover:text-primary transition-colors">
              {t('landing.navFaq')}
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <LanguageToggle />
            <ThemeToggle />
            <Link
              href="/onboarding"
              className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent-hover active:bg-accent-active transition-all shadow-xs"
            >
              {t('landing.startTrial')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-20 sm:space-y-28 py-10 sm:py-16">
        {/* 2. Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid gap-12 lg:grid-cols-12 items-center">
            {/* Left Column (Text & CTAs) */}
            <div className="lg:col-span-7 space-y-6 text-start">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold text-primary">
                <Icon icon={Sparkles} size={14} className="text-accent" />
                <span>{t('landing.heroBadge')}</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-text tracking-tight leading-[1.15]">
                {t('landing.heroHeadline')}{' '}
                <span className="text-primary block mt-1">
                  {t('landing.heroHeadlineAccent')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-text-muted leading-relaxed max-w-2xl">
                {t('landing.heroSubheadline')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/onboarding"
                  className="min-h-[52px] px-7 py-3 rounded-xl bg-accent text-accent-foreground font-bold text-base hover:bg-accent-hover active:bg-accent-active shadow-sm flex items-center justify-center gap-2.5 transition-all"
                >
                  <span>{t('landing.startTrial')}</span>
                  <Icon icon={ArrowIcon} size={18} />
                </Link>

                <a
                  href="#how-it-works"
                  className="min-h-[52px] px-6 py-3 rounded-xl border border-border bg-surface text-text font-semibold text-base hover:bg-surface-raised flex items-center justify-center gap-2 transition-all"
                >
                  <span>{t('landing.seeHowItWorks')}</span>
                </a>
              </div>

              <p className="text-xs text-text-muted pt-1 flex items-center gap-2">
                <Icon icon={CheckCircle2} size={14} className="text-success shrink-0" />
                <span>{t('landing.noCardRequired')}</span>
              </p>
            </div>

            {/* Right Column (Pure CSS/SVG Product Illustration) */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm rounded-[36px] p-4 bg-surface-raised border-4 border-border shadow-2xl relative">
                {/* Phone Speaker & Camera Notch */}
                <div className="w-24 h-4 bg-border/80 rounded-full mx-auto mb-4" />

                {/* Simulated Review Card */}
                <div className="space-y-3.5 bg-surface p-4 rounded-2xl border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                        أح
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text">أحمد مصطفى</p>
                        <p className="text-[10px] text-text-muted">Google Review • 5 نجوم</p>
                      </div>
                    </div>
                    <StarRating value={5} size="sm" />
                  </div>

                  <p className="text-xs text-text leading-relaxed font-normal" dir="rtl">
                    «المكان تحفة والخدمة ممتازة، القهوة مظبوطة جداً والويترز محترمين وبشوشين. تجربة ممتازة وتستاهل 5 نجوم.»
                  </p>

                  {/* AI Reply Card inside mockup */}
                  <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-primary flex items-center gap-1">
                        <Icon icon={Sparkles} size={12} className="text-accent" />
                        الرد المقترح بالعامية المصرية
                      </span>
                      <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono font-bold">
                        رَدّ AI
                      </span>
                    </div>

                    <p className="text-xs text-text leading-relaxed" dir="rtl">
                      أهلاً بك يا أحمد يا فندم! نورتنا والله وبنبسط جداً برأيك الجميل في القهوة والخدمة عندنا. نتمنى دايماً نكون عند حسن ظنك ونشوفك منورنا قريب جداً!
                      <br /><br />
                      — فريق مقهى ومحمص السعادة
                    </p>
                  </div>

                  {/* Amber One-Tap Button inside mockup */}
                  <button
                    type="button"
                    onClick={() => setDemoApproved(!demoApproved)}
                    className={`w-full min-h-[44px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      demoApproved
                        ? 'bg-success text-success-foreground'
                        : 'bg-accent text-accent-foreground hover:bg-accent-hover'
                    }`}
                  >
                    <Icon icon={demoApproved ? Check : Sparkles} size={16} />
                    <span>
                      {demoApproved ? 'تم النشر بنجاح على جوجل!' : 'وافق وانشر الرد الآن'}
                    </span>
                  </button>
                </div>

                <div className="w-28 h-1 bg-border/60 rounded-full mx-auto mt-4" />
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works Section */}
        <section id="how-it-works" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('landing.howItWorksTitle')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
              {t('landing.howItWorksSubtitle')}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card elevated className="border-border p-6 text-start space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon={BellRing} size={24} />
              </div>
              <h3 className="text-lg font-bold text-text">
                {t('landing.step1Title')}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t('landing.step1Desc')}
              </p>
            </Card>

            <Card elevated className="border-border p-6 text-start space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-accent/20 text-accent-foreground flex items-center justify-center">
                <Icon icon={Sparkles} size={24} />
              </div>
              <h3 className="text-lg font-bold text-text">
                {t('landing.step2Title')}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t('landing.step2Desc')}
              </p>
            </Card>

            <Card elevated className="border-border p-6 text-start space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-success/15 text-success flex items-center justify-center">
                <Icon icon={CheckCircle2} size={24} />
              </div>
              <h3 className="text-lg font-bold text-text">
                {t('landing.step3Title')}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {t('landing.step3Desc')}
              </p>
            </Card>
          </div>
        </section>

        {/* 4. Why Radd Section */}
        <section id="why-radd" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('landing.whyRaddTitle')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
              {t('landing.whyRaddSubtitle')}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-5 rounded-2xl border border-border bg-surface text-start space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon={HeartHandshake} size={20} />
              </div>
              <h3 className="text-base font-bold text-text">
                {t('landing.feature1Title')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('landing.feature1Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-surface text-start space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon={UserCheck} size={20} />
              </div>
              <h3 className="text-base font-bold text-text">
                {t('landing.feature2Title')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('landing.feature2Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-surface text-start space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon={ShieldCheck} size={20} />
              </div>
              <h3 className="text-base font-bold text-text">
                {t('landing.feature3Title')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('landing.feature3Desc')}
              </p>
            </div>

            <div className="p-5 rounded-2xl border border-border bg-surface text-start space-y-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Icon icon={Send} size={20} />
              </div>
              <h3 className="text-base font-bold text-text">
                {t('landing.feature4Title')}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                {t('landing.feature4Desc')}
              </p>
            </div>
          </div>
        </section>

        {/* 5. Safety & Trust Section */}
        <section id="safety" className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-12 rounded-3xl border border-primary/20 bg-primary/5 text-start space-y-8">
            <div className="max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-primary uppercase">
                <Icon icon={Lock} size={14} />
                <span>{t('landing.safetyTitle')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
                {t('landing.safetySubtitle')}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                <h4 className="text-sm font-bold text-text">
                  {t('landing.safety1Title')}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('landing.safety1Desc')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                <h4 className="text-sm font-bold text-text">
                  {t('landing.safety2Title')}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('landing.safety2Desc')}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-surface border border-border space-y-2">
                <h4 className="text-sm font-bold text-text">
                  {t('landing.safety3Title')}
                </h4>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('landing.safety3Desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Interactive Demo Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('landing.demoTitle')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
              {t('landing.demoSubtitle')}
            </h2>
          </div>

          {/* Demo Tabs */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setDemoTab('arabic');
                setDemoApproved(false);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                demoTab === 'arabic'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface border border-border text-text hover:bg-surface-raised'
              }`}
            >
              {t('landing.demoTabArabic')}
            </button>

            <button
              type="button"
              onClick={() => {
                setDemoTab('english');
                setDemoApproved(false);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                demoTab === 'english'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface border border-border text-text hover:bg-surface-raised'
              }`}
            >
              {t('landing.demoTabEnglish')}
            </button>

            <button
              type="button"
              onClick={() => {
                setDemoTab('mixed');
                setDemoApproved(false);
              }}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                demoTab === 'mixed'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface border border-border text-text hover:bg-surface-raised'
              }`}
            >
              {t('landing.demoTabMixed')}
            </button>
          </div>

          {/* Interactive Card */}
          <Card elevated className="border-border overflow-hidden">
            <CardHeader className="border-b border-border bg-surface-raised/40 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    {currentDemo.reviewer.slice(0, 2)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">
                      {currentDemo.reviewer}
                    </h4>
                    <p className="text-[10px] text-text-muted">
                      Google Review • {currentDemo.time}
                    </p>
                  </div>
                </div>
                <StarRating value={currentDemo.rating} size="sm" />
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6 space-y-5">
              <div className="p-4 rounded-xl bg-surface-raised text-sm text-text leading-relaxed text-start" dir="auto">
                <p className="text-xs font-semibold text-text-muted mb-1">
                  {t('landing.customerReview')}:
                </p>
                {currentDemo.review}
              </div>

              <div className="p-4 rounded-xl border border-primary/25 bg-primary/5 text-sm text-text leading-relaxed text-start space-y-2" dir="auto">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Icon icon={Sparkles} size={14} className="text-accent" />
                    {t('landing.raddDraft')}
                  </span>
                  <Badge variant="accent" size="sm">
                    {demoTab === 'english' ? 'English' : 'عامية مصرية'}
                  </Badge>
                </div>
                <p className="whitespace-pre-wrap">{currentDemo.reply}</p>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  variant={demoApproved ? 'secondary' : 'primary'}
                  size="md"
                  onClick={() => setDemoApproved(!demoApproved)}
                  startIcon={
                    <Icon icon={demoApproved ? Check : Sparkles} size={18} />
                  }
                >
                  {demoApproved
                    ? t('reviews.approved')
                    : t('landing.tapToApprove')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 7. Pricing Section */}
        <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('landing.pricingTitle')}
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-text tracking-tight">
              {t('landing.pricingSubtitle')}
            </h2>
            <p className="text-xs text-text-muted italic">
              {t('landing.placeholderNotice')}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 items-stretch">
            {/* Free Trial Card */}
            <Card elevated className="border-border p-6 flex flex-col justify-between text-start">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text">
                  {t('landing.planFreeTitle')}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-text font-mono">
                    {t('landing.planFreePrice')}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('landing.planFreePeriod')}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('landing.planFreeDesc')}
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/onboarding"
                  className="w-full min-h-[44px] rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:bg-surface-raised flex items-center justify-center transition-colors"
                >
                  {t('landing.startTrial')}
                </Link>
              </div>
            </Card>

            {/* Single Location (Popular) Card */}
            <Card elevated className="border-2 border-primary bg-primary/5 p-6 flex flex-col justify-between text-start relative shadow-md">
              <Badge
                variant="accent"
                size="sm"
                className="absolute -top-3 start-6 uppercase"
              >
                {t('landing.popularBadge')}
              </Badge>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text">
                  {t('landing.planProTitle')}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-primary font-mono">
                    {t('landing.planProPrice')}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('landing.planProPeriod')}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('landing.planProDesc')}
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/onboarding"
                  className="w-full min-h-[44px] rounded-xl bg-accent text-accent-foreground font-bold text-sm hover:bg-accent-hover flex items-center justify-center transition-colors shadow-xs"
                >
                  {t('landing.startTrial')}
                </Link>
              </div>
            </Card>

            {/* Multi Location Card */}
            <Card elevated className="border-border p-6 flex flex-col justify-between text-start">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text">
                  {t('landing.planAgencyTitle')}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-text font-mono">
                    {t('landing.planAgencyPrice')}
                  </span>
                  <span className="text-xs text-text-muted">
                    {t('landing.planAgencyPeriod')}
                  </span>
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {t('landing.planAgencyDesc')}
                </p>
              </div>

              <div className="pt-6">
                <Link
                  href="/onboarding"
                  className="w-full min-h-[44px] rounded-xl border border-border bg-surface text-text font-semibold text-sm hover:bg-surface-raised flex items-center justify-center transition-colors"
                >
                  {t('landing.startTrial')}
                </Link>
              </div>
            </Card>
          </div>
        </section>

        {/* 8. FAQ Accordion Section */}
        <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              {t('landing.faqTitle')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
              {t('landing.faqSubtitle')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;

              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-surface overflow-hidden transition-all text-start"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    className="w-full min-h-[52px] p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-text hover:bg-surface-raised transition-colors text-start"
                  >
                    <span>{faq.q}</span>
                    <Icon
                      icon={ChevronDown}
                      size={18}
                      className={`text-text-muted shrink-0 transition-transform duration-200 ${
                        isOpen ? 'rotate-180 text-primary' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-text-muted leading-relaxed border-t border-border/60">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 9. Final CTA Banner */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="p-8 sm:p-14 rounded-3xl bg-primary text-primary-foreground text-center space-y-6 shadow-xl relative overflow-hidden">
            <div className="max-w-2xl mx-auto space-y-3">
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                {t('landing.finalCtaTitle')}
              </h2>
              <p className="text-sm sm:text-base text-primary-foreground/80 leading-relaxed">
                {t('landing.finalCtaSubtitle')}
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Link
                href="/onboarding"
                className="min-h-[52px] px-8 py-3.5 rounded-xl bg-accent text-accent-foreground font-bold text-base hover:bg-accent-hover active:bg-accent-active shadow-md transition-all inline-flex items-center gap-2"
              >
                <span>{t('landing.startTrial')}</span>
                <Icon icon={ArrowIcon} size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* 10. Footer */}
      <footer className="border-t border-border bg-surface py-12 text-xs text-text-muted">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo variant="lockup" size="sm" />
            </Link>

            <div className="flex items-center gap-6 font-medium">
              <a href="#how-it-works" className="hover:text-text transition-colors">
                {t('landing.navHowItWorks')}
              </a>
              <a href="#safety" className="hover:text-text transition-colors">
                {t('landing.navSafety')}
              </a>
              <a href="#pricing" className="hover:text-text transition-colors">
                {t('landing.navPricing')}
              </a>
              <a href="#faq" className="hover:text-text transition-colors">
                {t('landing.navFaq')}
              </a>
            </div>

            <div className="flex items-center gap-2">
              <LanguageToggle />
              <ThemeToggle />
            </div>
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <p>© 2026 {t('landing.copyright')}</p>
            <p className="text-[11px] max-w-xl text-text-muted/70">
              {t('landing.disclaimer')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
