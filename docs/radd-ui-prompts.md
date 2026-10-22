# Radd UI: Prompt Pack for Claude Code

Copy-paste prompts, in order, to design and build the full Radd UI on top of your existing Next.js app. Each prompt is self-contained and builds on the previous one.

---

## How to use this pack

1. **Run the prompts in order.** Prompt 0 creates the design system that every later prompt reuses.
2. **One prompt per session or per commit.** Review the result, run the app, then commit before moving on.
3. **Start each session by pasting the "Global context" block below**, or save it in `CLAUDE.md` at the repo root so Claude Code always has it.
4. **Ask for a plan first** on the bigger prompts (the prompts already say so). Approve or adjust the plan before it writes code.
5. **Verify visually.** If you have Playwright set up, ask Claude Code to take screenshots at 390px (phone), 768px (tablet) and 1280px (desktop) in both Arabic (RTL) and English (LTR).
6. **Have a native Arabic reader review every Arabic string** (the glossary at the end is a starting point, not final copy).

---

## Global context (paste first, or save in `CLAUDE.md`)

```
PROJECT: Radd (رد) is a multi-tenant SaaS that drafts AI replies to Google reviews for local
businesses in Egypt/MENA. The owner gets a one-tap approval link (email/Telegram), approves or
edits the reply, and it is published to Google.

STACK (already in place): Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Supabase
(Postgres + Auth), Zod. Existing routes: /dashboard, /onboarding, /approve/[token],
/api/google/oauth/*, /api/cron/poll-reviews, /api/drafts/[token], /api/dashboard/settings.
Existing data types: src/types/database.ts. Do not change database schema, API contracts or
business logic unless a prompt explicitly says so. This work is UI only.

BRAND
- Name: Radd, Arabic: رد (with shadda: ردّ). Logo assets are in docs/ (radd-lockup-*.svg, radd-icon.svg).
- Colors: deep teal #0F5E63 (primary), amber #F5A623 (accent, used sparingly: stars, primary CTA),
  dark background #0B1F22, off-white #F2F7F6. Neutrals derived from teal.
- Font: Cairo (supports Arabic + Latin), loaded with next/font. Weights 400, 600, 800.
- Tone: trustworthy, calm, modern, friendly. Not corporate, not playful. Think modern fintech/SaaS for MENA.

LANGUAGE AND DIRECTION
- The UI is bilingual: Arabic (default, RTL) and English (LTR). Everything must work in both.
- Use CSS logical properties and Tailwind logical utilities (ms-*, me-*, ps-*, pe-*, start-*, end-*,
  text-start/text-end), never left/right, so RTL works automatically.
- Mirror directional icons (arrows, chevrons) in RTL. Do not mirror the logo or star ratings.
- Numbers: use Western digits (0-9) by default, consistent across languages.

QUALITY BAR
- Mobile-first. Most owners use phones. Touch targets at least 44px.
- Accessible: WCAG AA contrast, visible focus rings, proper labels, aria attributes, keyboard support,
  prefers-reduced-motion respected. Semantic HTML.
- Light and dark themes via CSS variables, following prefers-color-scheme with a manual toggle.
- No new heavy dependencies. Allowed: lucide-react for icons. Prefer plain Tailwind components.
  Do not add a UI kit unless asked.
- Reuse components from the design system. No one-off styling that duplicates a component.
- Keep server components where possible. Only use "use client" when interactivity needs it.
- Never log or expose approval tokens, OAuth tokens or secrets in the UI or console.

WORKFLOW
- Read the relevant existing code first. Then write a short plan and wait for my OK before large changes.
- After each task, run type-check and lint, fix errors, and summarize what changed and what I should test.
```

---

## Prompt 0: Design system and i18n foundation

```
Task: build the Radd design system and bilingual (Arabic RTL / English LTR) foundation. Do this
first; later tasks depend on it. Read the existing app layout, Tailwind config and globals first,
then give me a short plan and wait for my OK.

1. TOKENS
   - Add CSS variables for light and dark themes (background, surface, surface-raised, border,
     text, text-muted, primary, primary-foreground, accent, accent-foreground, success, warning,
     danger, focus ring) and map them into the Tailwind theme.
   - Palette: teal #0F5E63 primary, amber #F5A623 accent, dark #0B1F22, off-white #F2F7F6. Produce
     a 50-900 teal scale and neutral scale. Check contrast for text on every surface (AA).
   - Radius scale (md 12, lg 16, xl 24), soft shadows, spacing rhythm on a 4px grid.

2. TYPOGRAPHY
   - Load Cairo through next/font (Arabic + Latin subsets, weights 400/600/800).
   - Type scale with slightly larger line-height for Arabic. Define heading, body, caption styles.

3. i18n AND DIRECTION
   - Set <html lang dir> from the active locale (ar default, en). Persist the choice (cookie).
   - Lightweight dictionary-based translations (no heavy i18n library unless my existing code has one):
     a typed messages file per locale, a t() helper for server and client, and a LanguageToggle component.
   - Replace any left/right Tailwind utilities in existing UI with logical ones.
   - Provide an <Icon> wrapper that flips directional icons in RTL.

4. COMPONENT LIBRARY (in src/components/ui/, each with variants, sizes, states, and a short usage comment)
   Button (primary amber CTA, secondary teal, ghost, outline, destructive, loading state),
   IconButton, Card, Badge/Chip (status, flag, language), StarRating (display + optional input),
   Input, Textarea (with character counter), Select, Switch, Checkbox, RadioGroup, Tabs,
   Dialog/Drawer (focus trap, Esc, scroll lock), Tooltip, Toast, Skeleton, Spinner,
   EmptyState, InlineBanner (info/warning/danger/success), StatCard, DataRow, Avatar, Logo (uses the
   SVG assets, light/dark aware), ThemeToggle, LanguageToggle.

5. DEMO PAGE
   - Add /dev/design-system (excluded from production builds or behind NODE_ENV) that renders every
     component in all states, in light/dark and ar/en, so I can review it visually.

Constraints: no backend changes, no new dependencies except lucide-react, all components accessible
and keyboard-friendly. When done, list every file added and how to preview it.
```

---

## Prompt 1: App shell and navigation

```
Task: build the authenticated app shell used by /dashboard and the settings pages. Reuse the design
system components. Plan first, then implement.

- Desktop (≥1024px): collapsible sidebar (logo, nav, business name at the bottom) + top bar.
- Mobile: top bar with logo and menu, and a bottom tab bar with the 4 main destinations.
- Navigation items (icons from lucide-react): Dashboard, Reviews, Brand voice, Notifications,
  Locations, Settings. Active state clearly visible.
- Top bar: location switcher (a dropdown that shows the current location; works with one location
  now and is ready for many), notification-channel status chip, language toggle, theme toggle,
  account menu.
- Persistent InlineBanner slot for system messages (for example "Google connection needs attention").
- Layout must flip correctly in RTL: the sidebar sits on the right in Arabic and on the left in English.
- Add skip-to-content link, landmark roles, and keyboard navigation.
- Page transition: subtle, respects prefers-reduced-motion.

Do not change data fetching or routes beyond what is needed to wrap pages in the shell.
```

---

## Prompt 2: Dashboard

```
Task: redesign /dashboard. Keep all existing data fetching and the Poll Now action working. Read the
current page and PollNowButton first, then plan.

Layout (mobile-first):
1. Header: greeting with the business name, last sync time, and the PollNowButton restyled
   (loading state, success/failed toast).
2. KPI row of StatCards: Reviews answered %, Approved without edit %, Pending approval count,
   Active notification channel. Each with a small icon, label, big number, and a one-line hint
   explaining what the metric means. Pending count is a link to the pending list.
3. "Needs your attention" panel: pending drafts and flagged reviews first, each row shows stars,
   reviewer, snippet, flag badges (medical, legal, refund, injection suspected) and a primary action
   that opens the review detail.
4. Recent activity timeline: reviews with rating, detected language chip (ar/en/mixed/none), status
   badge (pending, approved, edited, skipped, posted, failed), time ago, model/prompt version
   (muted, secondary).
5. Empty states (no reviews yet, nothing pending, Google not connected) with a clear next action.
6. Loading skeletons for every section. Error states with retry.

Visual direction: calm, lots of whitespace, teal surfaces, amber only for stars and the main CTA.
Bilingual and RTL-correct. Charts are not required; if you add a small trend sparkline, build it
with inline SVG, no chart library.
```

---

## Prompt 3: Reviews list and review detail

```
Task: add a Reviews page (list) and a review detail drawer/page, using existing data. Plan first.

REVIEWS LIST
- Filters: status, rating, language, flagged only, date range. Search by reviewer name or text.
- Table on desktop, card list on mobile. Row: stars, reviewer, snippet, language chip, flag badges,
  status badge, created time.
- Pagination or "load more". URL-synced filters. Empty and loading states.

REVIEW DETAIL (drawer on desktop, full page on mobile)
- Full review text (correct direction per language, bidi-safe), rating, reviewer, date, flags with
  plain-language explanations ("Mentions health: reply with care").
- The drafted reply, its status, and who decided (approved as drafted, edited by owner, skipped).
- If edited: show a simple before/after diff of the draft vs final reply.
- Validation notes: show if the validator stripped or blocked something (for example "Phone number
  removed because it is not the official contact").
- Read-only unless the draft is pending, in which case show the same Approve/Edit/Skip controls as
  the approval page, reusing its components.

Do not change any API or database behavior.
```

---

## Prompt 4: One-tap approval page (most important screen)

```
Task: redesign /approve/[token] (and ApprovalActions). This is the most important screen: owners
open it from a phone, from an email or Telegram, without logging in. It must be fast, obvious and
safe. Read the current page and the decision API first, then plan. Do NOT change token handling,
the single-use logic or the API contract.

DESIGN
- Single-column, mobile-first (390px), thumb-friendly, no navigation chrome. Radd logo small at top.
- Order: business and location name; star rating; reviewer name; the review text (bidi-safe,
  correct direction, readable size); a clear "Suggested reply" card; action bar.
- Action bar pinned to the bottom on mobile: big amber "Approve and post" button; secondary
  "Edit" and "Skip". Approve must be one tap, with a short confirm state (loading, then success).
- Edit: reply becomes an editable textarea in place, with character counter (10 to 1000), Reset
  to suggestion, and "Post my edit". Keep the owner's text direction auto-detected.
- When the review needs careful handling: a prominent but calm warning banner explaining why
  (medical, legal, refund, injection suspected) and the primary button label changes to
  "I have checked this reply, post it".
- Success state: "Reply published on Google" with a subtle checkmark animation (reduced-motion safe)
  and a link to the dashboard. Skipped state: "Skipped. Nothing was posted."
- Error states: already used link ("This link was already used"), invalid link, publish failed with
  clear next step. Never show raw error messages or tokens.
- Add meta noindex, no-referrer policy, and make sure nothing sensitive appears in the page title.
- The page is bilingual with a small language toggle. Works at 320px wide, in RTL and LTR, and in
  light and dark.

Include a Playwright screenshot script (if Playwright is available) for: normal, careful-review,
editing, success, skipped, used-link, invalid-link states.
```

---

## Prompt 5: Onboarding wizard

```
Task: redesign /onboarding as a polished 3-step wizard. Keep the existing step logic, Google OAuth
redirect and settings API. Plan first.

Shell: progress indicator (Step 1 of 3 with names), back/next, save-and-continue, resumable.

STEP 1: Connect Google Business Profile
- Explain in two short lines what Radd reads and writes (reads reviews, posts replies you approve).
- Primary button "Connect with Google". States: not connected, connecting, connected (shows
  discovered locations as selectable cards with a polling toggle each), failed (with retry).
- A short privacy note and a link slot for the privacy policy.

STEP 2: Brand voice
- Form with live preview: owner changes tone, dialect (Egyptian Arabic, other Arabic, English),
  signature, DO list and DON'T list (tag-style inputs), and pastes example replies; a preview card
  shows a sample reply updating as settings change (static sample text is fine, no API call needed).
- Official contact number per location (explain it is the only number replies may contain).
- Validation with Zod errors shown inline, bilingual.

STEP 3: Notifications
- Choose Email or Telegram (cards). Email: address input. Telegram: chat ID input plus short
  instructions on how to get it. "Send me a test notification" button if the existing code supports it
  (otherwise omit).
- Final screen: summary and "Go to dashboard".

All steps mobile-first, RTL/LTR correct, accessible form semantics, no data-loss on refresh.
```

---

## Prompt 6: Settings

```
Task: build the Settings area using the app shell and the existing /api/dashboard/settings
endpoint. Plan first. Sections as tabs (desktop) or a stacked list (mobile):

1. Brand voice: same editor as onboarding step 2 (reuse the component), with a live sample reply.
2. Notifications: channel selection and details, with channel status.
3. Locations: list with name, contact number, polling on/off, last synced time.
4. Google connection: status badge (connected, needs attention), reconnect button, and a clearly
   separated "Danger zone" with disconnect (confirmation dialog explaining what stops working).
5. Account: business name, language, theme.
6. Billing: placeholder card "Plan and billing" with the current plan and trial status, disabled
   controls, and a "Coming soon" note. Do not implement payments.

Every form: optimistic save feedback (toast), unsaved-changes warning, inline validation, loading
and error states. Bilingual and RTL-correct.
```

---

## Prompt 7: Marketing landing page

```
Task: build a public landing page at / (move the current root redirect to /dashboard only for
signed-in users). Arabic-first, with an English toggle. Plan first, including section order and copy.

Sections:
1. Hero: headline about replying to every Google review in one tap, subheadline, primary CTA
   ("Start free trial") and secondary CTA ("See how it works"). Show the Radd lockup. Right side
   (left in RTL): a product illustration built with HTML/CSS or inline SVG showing a phone with a
   review, a drafted reply, and an Approve button.
2. How it works: 3 steps (alert, one tap, live on Google) with simple icons.
3. Why Radd: 4 cards (natural Egyptian Arabic, you approve everything, built-in safety checks,
   works with email and Telegram).
4. Safety: short section explaining the human-in-the-loop and the checks (no refund promises, no
   invented discounts, no stray phone numbers) in plain language.
5. Example replies: a switchable before/after demo (review in Arabic, English, mixed).
6. Pricing: 2 or 3 placeholder plan cards clearly marked as placeholders I will fill in.
7. FAQ: accordion (accessible), 6 questions.
8. Final CTA and footer (privacy, terms placeholders, contact, language toggle, the Google
   trademark disclaimer).

Performance and SEO: static where possible, proper metadata, Open Graph image, semantic headings,
Lighthouse performance and accessibility ≥ 95. No stock photos. Use only inline SVG and CSS for
visuals. Do not use Google logos or Google brand colors.
```

---

## Prompt 8: Auth screens and global states

```
Task: design the authentication screens and every global state. Use the existing Supabase auth
setup. If a screen already exists, restyle it; if not, create UI only and wire it to the existing
Supabase client without inventing new backend behavior. Plan first.

AUTH: sign in, sign up, forgot password, reset password, email confirmation notice. Centered card
layout, Radd logo, language toggle, clear inline errors, loading states, accessible forms,
password visibility toggle.

GLOBAL STATES (reusable components):
- 404 and 500 pages, offline notice
- "Google connection revoked or needs attention" banner and full-page state with a Reconnect button
- "Trial ended / subscription inactive" state (UI only, placeholder)
- Link expired or already used (shared with the approval page)
- Permission denied
- Empty states with illustrations built from simple inline SVG shapes using the brand palette

Every state: bilingual, RTL-correct, with a clear primary action.
```

---

## Prompt 9: Email and Telegram message design

```
Task: redesign the notification content. Read src/lib/notifications/dispatcher.ts first and keep its
interface and behavior. Plan first.

EMAIL (Resend, HTML)
- Table-based, inline-styled, email-client-safe HTML (no external CSS, no web fonts required, system
  font fallback). Max width 600px, mobile-friendly.
- Content: Radd logo (hosted PNG/SVG URL placeholder), "New review for {business}", star rating,
  reviewer name, review text, suggested reply in a card, flagged-review warning if applicable,
  one big amber button "Review and approve", and a small footer with a plain-text fallback link.
- Direction: set dir and text alignment per detected language of the review; support Arabic.
- Dark-mode friendly (works with forced dark inversions). Include a plain-text alternative.
- Provide a local preview route or script that renders sample emails in Arabic, English and
  flagged variants so I can check them in a browser.

TELEGRAM
- Message format with clear structure (business, stars, review snippet, suggested reply, flag
  line), using the supported formatting mode safely (escape user-supplied text properly so review
  content cannot break or inject formatting). One inline button "Review and approve".
- Keep messages concise, and handle long reviews by truncating with an ellipsis.

Do not change token generation or links.
```

---

## Prompt 10: Polish, accessibility and QA pass

```
Task: run a full UI quality pass across the whole app. Do not add features. Plan first, then fix.

1. RTL AUDIT: walk every page in Arabic. Find and fix any physical left/right styles, unmirrored
   icons, misaligned bidi text (mixed Arabic/English reviews and replies), and truncation issues.
2. RESPONSIVE: check 320, 390, 768, 1024, 1440 widths. No horizontal scroll, no overlapping, no
   cut-off buttons.
3. ACCESSIBILITY: keyboard-only pass, focus order, focus rings, labels and aria, color contrast AA in
   both themes, reduced-motion, screen-reader names for icon buttons, form error announcements.
4. THEMES: every screen in light and dark.
5. STATES: loading, empty, error and success for every data-driven view.
6. PERFORMANCE: fonts preloaded and subsetted, no layout shift, images/SVG optimized, Lighthouse on
   the landing page, dashboard and approval page. Report scores and fix anything under 90.
7. CONSISTENCY: remove duplicated one-off styles, make sure every screen uses design-system
   components, spacing and typography tokens.
8. TESTS: add Playwright smoke tests for the approval page states and the dashboard in ar and en,
   plus screenshot baselines.

Finish with a checklist of what passed, what was fixed, and any remaining issues.
```

---

## Optional: one-shot prompt (smaller projects or a first draft)

```
Using the Global context, design and implement the full Radd UI in this order: design system and
bilingual RTL/LTR foundation, app shell, dashboard, reviews list and detail, the one-tap approval
page (mobile-first, the most important screen), onboarding wizard, settings, landing page, auth
screens, email and Telegram templates. Reuse one component library throughout. Plan each stage
briefly, implement it, run type-check and lint, and pause for my review after the approval page and
after the dashboard. Do not change backend logic or APIs.
```

---

## Arabic UI glossary (starting point, have a native speaker review)

| English | Arabic |
|---|---|
| Dashboard | لوحة التحكم |
| Reviews | التقييمات |
| Approve | موافقة |
| Approve and post | وافق وانشر الرد |
| Edit | تعديل |
| Skip | تخطي |
| Pending | في الانتظار |
| Posted | تم النشر |
| Failed | فشل |
| Brand voice | أسلوب الرد |
| Notifications | الإشعارات |
| Locations | الفروع |
| Settings | الإعدادات |
| Suggested reply | الرد المقترح |
| Needs careful review | يحتاج مراجعة دقيقة |
| Reviews answered | التقييمات التي تم الرد عليها |
| Approved without edit | تمت الموافقة بدون تعديل |
| Connect with Google | الربط مع جوجل |
| Poll now | تحديث التقييمات الآن |
| Reply published on Google | تم نشر الرد على جوجل |
| This link was already used | تم استخدام هذا الرابط من قبل |
| Link expired | انتهت صلاحية الرابط |

---

## Tips for better results

- **Give visual references.** Paste 2-3 screenshots of apps whose look you like (for example a clean mobile approval flow) and say "match the spacing and density, not the branding".
- **Use the demo page.** Review `/dev/design-system` after Prompt 0 and fix tokens there before building pages. Changes are cheap at this stage and expensive later.
- **Ask for variants only when needed.** For example: "Show me two layout options for the dashboard KPI row", then pick one.
- **Keep prompts small.** If a result is wrong, correct it with a short follow-up ("the stat cards are too tall on mobile; make them 2 per row") instead of re-running the full prompt.
- **Commit after every prompt** so you can roll back a bad direction.
