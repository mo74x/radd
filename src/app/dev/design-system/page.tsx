/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  MessageSquare,
  Send,
  Star,
  Check,
  AlertCircle,
  Copy,
  Plus,
  Trash2,
  Settings,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DataRow,
  Dialog,
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Drawer,
  EmptyState,
  Icon,
  IconButton,
  InlineBanner,
  Input,
  LanguageToggle,
  Logo,
  RadioGroup,
  Select,
  Skeleton,
  Spinner,
  StarRating,
  StatCard,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  ThemeToggle,
  Tooltip,
  useToast,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n/context';

export default function DesignSystemDemoPage() {
  const { locale, direction, t } = useI18n();
  const toast = useToast();

  // Component test states
  const [btnLoading, setBtnLoading] = useState(false);
  const [rating, setRating] = useState(4);
  const [switchChecked, setSwitchChecked] = useState(true);
  const [checkboxChecked, setCheckboxChecked] = useState(true);
  const [radioVal, setRadioVal] = useState('friendly');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('actions');
  const [sampleText, setSampleText] = useState(
    'أهلاً بك أستاذ أحمد! سعدنا جداً بزيارتك لكافيه الورد ويسعدنا أن القهوة والخدمة نالت رضاك. نتطلع لرؤيتك مجدداً قريباً!'
  );

  return (
    <div className="min-h-screen bg-background text-text flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-surface/90 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <Logo variant="lockup" size="md" />
          <Badge variant="accent" size="sm">
            v1.0 Design System
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <LanguageToggle variant="button" />
          <ThemeToggle variant="icon" />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-12">
        {/* Hero Banner */}
        <section className="rounded-3xl bg-linear-to-br from-teal-500 to-teal-800 dark:from-teal-900 dark:to-neutral-900 text-white p-6 sm:p-10 shadow-lg relative overflow-hidden text-start">
          <div className="relative z-10 max-w-2xl space-y-3">
            <Badge variant="accent" size="md">
              {locale === 'ar' ? 'الواجهة ثنائية الاتجاه' : 'Bi-directional RTL/LTR'}
            </Badge>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              {locale === 'ar'
                ? 'نظام تصميم رَدّ (Radd Design System)'
                : 'Radd Design System Workbench'}
            </h1>
            <p className="text-teal-100 text-sm sm:text-base leading-relaxed">
              {locale === 'ar'
                ? 'مرجع بصري موحد لمكونات واجهة المستخدم، يدعم الخطوط العربية المتخصصة (Cairo)، ومحاذاة RTL/LTR المنطقية، والوضع الليلي/النهاري مع معايير إمكانية الوصول WCAG AA.'
                : 'Unified design tokens and accessible component library for MENA SaaS. Built with Next.js 16, Tailwind CSS v4, and bi-directional RTL support.'}
            </p>
          </div>
        </section>

        {/* System Controls & Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex justify-start mb-6">
            <TabsTrigger value="actions">Buttons & Actions</TabsTrigger>
            <TabsTrigger value="inputs">Form Controls</TabsTrigger>
            <TabsTrigger value="display">Data & Cards</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Modals</TabsTrigger>
            <TabsTrigger value="tokens">Colors & Typography</TabsTrigger>
          </TabsList>

          {/* TAB 1: Buttons & Actions */}
          <TabsContent value="actions" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Action Buttons</CardTitle>
                <CardDescription>
                  Variants including primary Amber CTA, secondary Deep Teal, outline, ghost, and destructive.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variants Showcase */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    startIcon={<Icon icon={Sparkles} size={18} />}
                  >
                    {t('reviews.approveReply')}
                  </Button>
                  <Button
                    variant="secondary"
                    startIcon={<Icon icon={RefreshCw} size={18} />}
                  >
                    {t('reviews.regenerate')}
                  </Button>
                  <Button variant="outline">
                    {t('common.cancel')}
                  </Button>
                  <Button variant="ghost">
                    {t('common.actions')}
                  </Button>
                  <Button
                    variant="destructive"
                    startIcon={<Icon icon={Trash2} size={18} />}
                  >
                    {t('common.delete')}
                  </Button>
                </div>

                {/* Sizes Showcase */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="secondary">
                    Small Button (sm)
                  </Button>
                  <Button size="md" variant="secondary">
                    Default Button (md)
                  </Button>
                  <Button size="lg" variant="primary">
                    Large CTA Button (lg)
                  </Button>
                </div>

                {/* States: Loading & Disabled */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <Button
                    variant="primary"
                    loading={btnLoading}
                    onClick={() => {
                      setBtnLoading(true);
                      setTimeout(() => setBtnLoading(false), 2000);
                    }}
                  >
                    {btnLoading ? 'Publishing...' : 'Click to Test Loading'}
                  </Button>
                  <Button variant="secondary" disabled>
                    Disabled State
                  </Button>
                </div>

                {/* Icon Buttons */}
                <div className="pt-4 border-t border-border flex items-center gap-3">
                  <IconButton
                    aria-label="Settings"
                    variant="outline"
                    onClick={() => toast.info('Settings button clicked')}
                  >
                    <Icon icon={Settings} size={18} />
                  </IconButton>
                  <IconButton
                    aria-label="Add review"
                    variant="secondary"
                    onClick={() => toast.success('New action triggered')}
                  >
                    <Icon icon={Plus} size={18} />
                  </IconButton>
                  <IconButton
                    aria-label="Delete"
                    variant="ghost"
                  >
                    <Icon icon={Trash2} size={18} className="text-danger" />
                  </IconButton>
                  <Tooltip content="Quick copy action">
                    <IconButton aria-label="Copy" variant="outline">
                      <Icon icon={Copy} size={18} />
                    </IconButton>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Form Controls */}
          <TabsContent value="inputs" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Input & Textarea Fields</CardTitle>
                <CardDescription>
                  Supports leading/trailing icons with logical RTL spacing and live character count.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('common.search')}
                    placeholder="Search reviews by customer name..."
                    startIcon={<Icon icon={Search} size={18} />}
                  />
                  <Select
                    label={t('common.status')}
                    options={[
                      { value: 'all', label: 'All Reviews (الكل)' },
                      { value: 'pending', label: 'Pending Approval (بانتظار الموافقة)' },
                      { value: 'approved', label: 'Published (تم النشر)' },
                    ]}
                  />
                </div>

                <Input
                  label="Reviewer Email / Phone"
                  placeholder="ahmed@example.com"
                  helperText="Used for approval notifications via Telegram or Email."
                />

                <Input
                  label="Simulated Error Field"
                  defaultValue="Invalid input test"
                  error={t('validation.required')}
                />

                <Textarea
                  label={t('reviews.draftReply')}
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  maxLength={300}
                  showCount
                  rows={4}
                  helperText="AI drafts follow a friendly, polite tone tailored to Egyptian and Arab hospitality."
                />

                {/* Toggles and Choices */}
                <div className="pt-6 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4 text-start">
                    <h4 className="text-sm font-bold text-text">Switches & Checkboxes</h4>
                    <Switch
                      label="Auto-generate AI Drafts"
                      description="Poll Google reviews every 15 minutes"
                      checked={switchChecked}
                      onChange={setSwitchChecked}
                    />
                    <Checkbox
                      label="Telegram Instant Notification"
                      description="Send approval link directly to owner bot"
                      checked={checkboxChecked}
                      onChange={setCheckboxChecked}
                    />
                  </div>

                  <div className="space-y-4 text-start">
                    <RadioGroup
                      label="AI Voice Tone"
                      value={radioVal}
                      onChange={setRadioVal}
                      options={[
                        {
                          value: 'friendly',
                          label: 'Friendly & Warm (ودود ومرحب)',
                          description: 'Recommended for cafes, salons, and restaurants',
                        },
                        {
                          value: 'formal',
                          label: 'Professional & Formal (رسمي وموجز)',
                          description: 'Recommended for clinics, legal, and B2B services',
                        },
                      ]}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 3: Data & Cards */}
          <TabsContent value="display" className="space-y-8">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t('stats.totalReviews')}
                value="1,429"
                trend={{ value: '+18%', positive: true, label: t('stats.trendUp') }}
                icon={MessageSquare}
              />
              <StatCard
                label={t('stats.approvalRate')}
                value="96.4%"
                trend={{ value: '+4.2%', positive: true, label: t('stats.trendUp') }}
                icon={Check}
              />
              <StatCard
                label={t('stats.avgResponseTime')}
                value="4.5m"
                trend={{ value: '-28%', positive: true, label: 'faster response' }}
                icon={RefreshCw}
              />
              <StatCard
                label={t('stats.ratingAverage')}
                value="4.8"
                trend={{ value: '+0.2', positive: true }}
                icon={Star}
              />
            </div>

            {/* Badges, Avatars, and Star Ratings */}
            <Card>
              <CardHeader>
                <CardTitle>Chips, Avatars & Star Ratings</CardTitle>
                <CardDescription>
                  Star ratings never mirror in RTL; Western numerals used consistently.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="default" dot>Default Teal</Badge>
                  <Badge variant="accent" dot>Amber Accent</Badge>
                  <Badge variant="success" dot>{t('reviews.approved')}</Badge>
                  <Badge variant="warning" dot>{t('reviews.pendingApproval')}</Badge>
                  <Badge variant="danger" dot>{t('reviews.rejected')}</Badge>
                  <Badge variant="neutral">Neutral Info</Badge>
                  <Badge variant="outline">Outline Badge</Badge>
                </div>

                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Avatar name="Karim Hassan" size="sm" />
                    <Avatar name="Sarah Nabil" size="md" />
                    <Avatar name="محمد عمر" size="lg" />
                    <Avatar name="Cairo Coffee" size="xl" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs text-text-muted text-start">Interactive Star Rating (click/hover):</span>
                    <StarRating
                      value={rating}
                      interactive
                      onChange={setRating}
                      showScore
                      size="lg"
                    />
                  </div>
                </div>

                {/* DataRow demo */}
                <div className="pt-4 border-t border-border">
                  <h4 className="text-sm font-bold text-text mb-2 text-start">Data Rows</h4>
                  <div className="rounded-xl border border-border p-3 divide-y divide-border-muted">
                    <DataRow
                      label="Google Business Profile"
                      value={<Badge variant="success">Connected</Badge>}
                      description="Synced with 2 Cairo branch locations"
                      action={<Button variant="outline" size="sm">Manage</Button>}
                    />
                    <DataRow
                      label="Telegram Approval Channel"
                      value={<Badge variant="default">@radd_approval_bot</Badge>}
                      action={<Button variant="ghost" size="sm">Test Link</Button>}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Feedback & Modals */}
          <TabsContent value="feedback" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Feedback, Alerts & Overlays</CardTitle>
                <CardDescription>
                  Accessible banners, interactive modals, drawers, and toast alerts.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <InlineBanner variant="success" title="Reply Published Successfully">
                    Your response has been approved and published to Google Maps in 1.2s.
                  </InlineBanner>
                  <InlineBanner variant="warning" title="Google Token Expiring Soon">
                    Your authorization will expire in 3 days. Re-link your account to avoid interruption.
                  </InlineBanner>
                  <InlineBanner variant="danger" title="Review Reply Failed">
                    Google Maps API returned a temporary error. We will automatically retry.
                  </InlineBanner>
                  <InlineBanner variant="info" title="AI Pro Tip">
                    You can set Telegram push notifications for instantaneous approval anywhere.
                  </InlineBanner>
                </div>

                {/* Modals & Toasts Triggers */}
                <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3">
                  <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                    Open Modal Dialog
                  </Button>
                  <Button variant="outline" onClick={() => setDrawerOpen(true)}>
                    Open Mobile Drawer
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => toast.success('One-tap approval link created and ready!')}
                  >
                    Trigger Success Toast
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => toast.error('Connection timed out, please retry.')}
                  >
                    Trigger Error Toast
                  </Button>
                </div>

                {/* Skeletons & Spinners */}
                <div className="pt-4 border-t border-border space-y-3 text-start">
                  <h4 className="text-sm font-bold text-text">Loading Skeletons</h4>
                  <div className="flex items-center gap-4">
                    <Skeleton variant="circular" className="w-12 h-12" />
                    <div className="space-y-2 flex-1 max-w-sm">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                <div className="pt-4 border-t border-border">
                  <EmptyState
                    title={t('reviews.noReviews')}
                    description={t('reviews.noReviewsDesc')}
                    action={
                      <Button
                        variant="primary"
                        startIcon={<Icon icon={RefreshCw} size={18} />}
                        onClick={() => toast.info('Checking for new reviews...')}
                      >
                        {t('common.retry')}
                      </Button>
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 5: Tokens & Typography */}
          <TabsContent value="tokens" className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Color Palette Tokens</CardTitle>
                <CardDescription>
                  Teal primary (#0F5E63), Amber accent (#F5A623), dark background (#0B1F22), off-white (#F2F7F6).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Teal Palette */}
                <div className="space-y-2 text-start">
                  <h4 className="text-sm font-bold text-text">Teal Brand Scale (50–900)</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-mono text-xs">
                    {[
                      { name: '50', bg: 'bg-teal-50', text: 'text-neutral-900' },
                      { name: '100', bg: 'bg-teal-100', text: 'text-neutral-900' },
                      { name: '200', bg: 'bg-teal-200', text: 'text-neutral-900' },
                      { name: '300', bg: 'bg-teal-300', text: 'text-neutral-900' },
                      { name: '400', bg: 'bg-teal-400', text: 'text-white' },
                      { name: '500', bg: 'bg-teal-500', text: 'text-white' },
                      { name: '600', bg: 'bg-teal-600', text: 'text-white' },
                      { name: '700', bg: 'bg-teal-700', text: 'text-white' },
                      { name: '800', bg: 'bg-teal-800', text: 'text-white' },
                      { name: '900', bg: 'bg-teal-900', text: 'text-white' },
                    ].map((step) => (
                      <div
                        key={step.name}
                        className={cn(
                          'h-16 rounded-xl flex flex-col items-center justify-center p-1 shadow-xs border border-border/40',
                          step.bg,
                          step.text
                        )}
                      >
                        <span className="font-bold">{step.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Amber Palette */}
                <div className="space-y-2 text-start">
                  <h4 className="text-sm font-bold text-text">Amber Accent Scale (50–900)</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 font-mono text-xs">
                    {[
                      { name: '50', bg: 'bg-amber-50', text: 'text-neutral-900' },
                      { name: '100', bg: 'bg-amber-100', text: 'text-neutral-900' },
                      { name: '200', bg: 'bg-amber-200', text: 'text-neutral-900' },
                      { name: '300', bg: 'bg-amber-300', text: 'text-neutral-900' },
                      { name: '400', bg: 'bg-amber-400', text: 'text-neutral-900' },
                      { name: '500', bg: 'bg-amber-500', text: 'text-neutral-900' },
                      { name: '600', bg: 'bg-amber-600', text: 'text-white' },
                      { name: '700', bg: 'bg-amber-700', text: 'text-white' },
                      { name: '800', bg: 'bg-amber-800', text: 'text-white' },
                      { name: '900', bg: 'bg-amber-900', text: 'text-white' },
                    ].map((step) => (
                      <div
                        key={step.name}
                        className={cn(
                          'h-16 rounded-xl flex flex-col items-center justify-center p-1 shadow-xs border border-border/40',
                          step.bg,
                          step.text
                        )}
                      >
                        <span className="font-bold">{step.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Typography Demonstration */}
                <div className="pt-6 border-t border-border space-y-4 text-start">
                  <h4 className="text-sm font-bold text-text">Cairo Typography Demonstration</h4>
                  <div className="space-y-3 p-4 rounded-2xl bg-surface-raised border border-border">
                    <p className="text-3xl font-extrabold text-text">
                      العنوان الرئيسي: رَدّ الذكي لتقييمات المتاجر (Bold 800)
                    </p>
                    <p className="text-xl font-semibold text-text">
                      عنوان ثانوي: صياغة فورية باحترافية وسرعة فائقة (SemiBold 600)
                    </p>
                    <p className="text-base text-text-muted leading-relaxed">
                      النص العادي: نقوم بتحليل تقييمات العملاء الإيجابية والسلبية وكتابة ردود مهذبة ومخصصة تعزز من ثقة العملاء وتحسن ظهور نشاطك التجاري على خرائط جوجل. (Regular 400)
                    </p>
                    <p className="text-xs font-mono text-text-muted">
                      Caption / Monospace: Numeric Digits 0123456789 | Date 2026-10-21
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Interactive Modal Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogHeader onClose={() => setDialogOpen(false)}>
          <DialogTitle>Approve AI Reply to Google Review</DialogTitle>
          <DialogDescription>
            This response will be published immediately to Google Maps under your official business account.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="p-4 rounded-xl bg-surface-raised border border-border text-start space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text text-sm">Karim Mahmoud</span>
              <StarRating value={5} size="sm" />
            </div>
            <p className="text-xs text-text-muted">
              &quot;أفضل تجربة قهوة في المعادي، والخدمة كانت سريعة جداً.&quot;
            </p>
          </div>

          <Textarea
            label="Approved Reply Text"
            defaultValue="شكراً جزيلاً أستاذ كريم! نسعد دائماً بخدمتك ونتمنى أن نراك مجدداً قريباً في المعادي."
            rows={3}
          />
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setDialogOpen(false);
              toast.success('Reply published to Google Maps!');
            }}
          >
            {t('reviews.approveReply')}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Interactive Mobile Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Filter & Search Reviews"
      >
        <div className="space-y-4 text-start">
          <Input label="Search Keyword" placeholder="Filter by keyword..." />
          <Select
            label="Rating Stars"
            options={[
              { value: 'all', label: 'All Ratings' },
              { value: '5', label: '5 Stars Only' },
              { value: '1-3', label: 'Negative Reviews (1-3)' },
            ]}
          />
          <Switch label="Show only pending approval" checked={true} onChange={() => {}} />
          <Button
            variant="primary"
            className="w-full mt-2"
            onClick={() => {
              setDrawerOpen(false);
              toast.info('Filters applied');
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Drawer>
    </div>
  );
}
