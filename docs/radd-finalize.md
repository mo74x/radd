# Radd: Claude Code Prompts (launch prep)

Each prompt below is **separate** and written as **one single line** (no line breaks), so you can paste it into the terminal without it being submitted line by line. Run them **one at a time, in order**, and commit after each.

**How to use**
1. Open Claude Code in the repo (`cd ~/radd && claude`).
2. Paste one prompt. Let it finish, review the diff, run the app or tests, then commit.
3. Start the next prompt in the same or a fresh session.
4. If a prompt says "show me a plan first", read it and answer "OK" or adjust before it writes code.

**Order**
0. Pre-launch audit (read-only)
1. CI workflow
2. Update the Claude model default
3. Gate the dev-only pages
4. Deployment readiness
5. WhatsApp template documentation
6. Privacy policy and terms pages
7. Real screenshots
8. Lighthouse pass
9. Google OAuth verification pack
10. Slim down the README
11. Optional: manual publishing fallback for the pilot

---

## Prompt 0: Pre-launch audit (read-only)

```
Do a read-only pre-launch audit of this repository and do NOT change any files: first read AGENTS.md and package.json, then (1) search the working tree and the full git history for committed secrets, tokens or keys (check .env files, the .agents/ folder and skills-lock.json too), (2) run npm audit and list high and critical issues with proposed fixes, (3) review every route under src/app/api for missing authentication, rate limiting or input validation, (4) check that the Supabase migrations enable RLS and policies on every table and that the service-role client is only used in server-only code, (5) list unused dependencies and dead code, (6) check that logs and error messages never include approval tokens, OAuth tokens, API keys or full review text, (7) list anything the README claims that the code does not actually support. Output one prioritized report (critical, high, medium, low) with file paths, line references and a suggested fix for each item.
```

---

## Prompt 1: CI workflow

```
Read AGENTS.md and package.json, then add a GitHub Actions workflow at .github/workflows/ci.yml that runs on push and pull_request to main using Node 20 with npm caching: a job that runs npm ci, npm run lint, npx tsc --noEmit, npm test and npm run build with harmless dummy values for the required environment variables set in the workflow env (never real secrets), and a second job that installs the Playwright chromium browser and runs npm run test:e2e; add a CI status badge to the top badge row of README.md, run lint, type-check and the unit tests locally to confirm they pass, do not change application code, and tell me what to check in the GitHub Actions tab after I push.
```

---

## Prompt 2: Update the Claude model default

```
Read AGENTS.md and search the whole repo for CLAUDE_MODEL and claude-3-5-haiku-latest, then replace that outdated default with claude-haiku-5-5 while keeping CLAUDE_MODEL as an environment override, put the default model ID in a single constant in one file, make the app log which model is in use at startup without printing any secret, update .env.example, the README tech stack and configuration table and any tests, check the installed Anthropic SDK version and tell me before upgrading it, run the unit tests, and then tell me the exact commands and environment variables I should use on my own machine to run npm run eval:prompts and npm run eval:real with a real ANTHROPIC_API_KEY; do not put any API key in the repo and do not change the eval pass rates in the README until I report the new results.
```

---

## Prompt 3: Gate the dev-only pages

```
Read AGENTS.md, then protect the developer-only pages so that /dev/design-system and /dev/email-preview return notFound() when NODE_ENV is production (enforce it on the server in the page or a shared dev layout, not just by hiding links), keep them working in development, make sure they are excluded from any sitemap or robots output, confirm the preview-* approval tokens stay disabled in production, add a test that proves the production behavior where feasible, update the Routes and Limitations sections of README.md to say these pages are development-only, and run lint, type-check and the tests.
```

---

## Prompt 4: Deployment readiness

```
Read AGENTS.md and make the app deployment-ready for Vercel and hosted Supabase: (1) add a Zod-based environment validation module that runs on server start and during next build, where in production the required variables (NEXT_PUBLIC_APP_URL, APP_URL, the three Supabase keys, TOKEN_ENCRYPTION_KEY which must be 64 hex characters, and CRON_SECRET) must be present and optional provider keys may be empty, failing with a clear message that lists the missing variable names without ever printing values, and in production refusing GOOGLE_API_MODE=mock unless an explicit ALLOW_MOCK_IN_PRODUCTION=true is set, (2) add /api/health that returns ok plus a version and does a cheap database check without exposing secrets, (3) add a vercel.json cron entry that calls /api/cron/poll-reviews every 5 minutes and confirm the route authenticates with CRON_SECRET, (4) add security headers in next.config.ts (X-Content-Type-Options, Referrer-Policy, a frame-ancestors none policy, Permissions-Policy and a Content-Security-Policy in report-only mode) while keeping the approval page noindex and no-referrer, (5) rewrite the Deployment section of README.md with the exact steps and any new variables, and then run lint, type-check, the tests and a production build and report any problems.
```

---

## Prompt 5: WhatsApp template documentation

```
Open src/lib/notifications/whatsapp.ts and its tests, then rewrite the WhatsApp template setup section of README.md and create docs/whatsapp-template.md with the exact template the code expects: the template name and language environment variables, the exact ordered list of body variables the code sends and what each one represents, the button definition (URL type with a dynamic suffix) matching the component payload in the code, a ready-to-paste sample body text in both Arabic and English, the Graph API version the code uses with a note that I must verify it is still supported, and how to test with the console mock; do not change any code unless you find a bug, and if you do, list it first and ask me before fixing it.
```

---

## Prompt 6: Privacy policy and terms pages

```
Read AGENTS.md and the design system in src/components/ui, then add bilingual (Arabic default, English) Privacy Policy and Terms of Service pages at /privacy and /terms using the existing components and i18n dictionaries, linked from the landing footer, the auth screens, the onboarding Google connect step and the settings page; the privacy policy must describe only what the code really does, so verify each statement by searching the code for what is stored, encrypted and sent: reading Google reviews and location data through the Business Profile API with the owner's consent, storing review text and reviewer display names, sending review text to the AI provider to draft replies, encrypted storage of OAuth tokens, the notification channels (WhatsApp, Telegram, Resend), the payment gateways, data retention, how to disconnect and request deletion from Settings, and that replies are posted only after owner approval; include a statement about the Google API Services User Data Policy and Limited Use only if it applies and flag it for my review, use clearly marked placeholders for company name, address and contact email (never invent them), put a comment at the top of each page and a note in your summary that these are drafts needing legal review, list every statement you could not verify against the code, and run lint, type-check and the tests.
```

---

## Prompt 7: Real screenshots

```
Read AGENTS.md, scripts/screenshot-approval-states.ts and playwright.config.ts, install the Playwright chromium browser if it is missing, run the app in mock mode with seeded fake data (no real customer data), and write scripts/screenshots.ts that saves PNG screenshots into docs/screenshots/ with stable names like dashboard-ar-desktop.png for the landing page, sign in, onboarding steps 1 to 3, dashboard, reviews list, review detail, settings and every approval page state, each in Arabic (RTL) and English (LTR) at mobile 390px and desktop 1280px; then update the User interface section of README.md to show the real screenshots in a compact table or two-image row, keep the SVG mockups only in docs/ and remove the wording that says the README images are mockups, run npm run test:e2e and write the real pass counts into the README test table, and list anything that failed to capture.
```

---

## Prompt 8: Lighthouse pass

```
Read AGENTS.md, build the app for production and run Lighthouse in mobile emulation for the landing page, /auth/login, the dashboard (use the mock session or test mode and tell me exactly how you did it) and an approval page state (tell me how you got around the preview tokens being disabled in production), in both Arabic and English, saving the reports to docs/lighthouse/; then fix the highest-impact problems in performance, accessibility, best practices and SEO (font loading, layout shift, SVG and image sizes, color contrast, labels, meta tags and similar) without changing the design or behavior, re-run the audits, and write a before and after score table in docs/lighthouse/README.md; do not add scores to the main README until I confirm them, and run lint, type-check and the tests at the end.
```

---

## Prompt 9: Google OAuth verification pack

```
Read AGENTS.md and src/lib/google, then create docs/google-oauth-verification.md to prepare for Google's Business Profile API access request and OAuth verification using only what the code actually does: list the exact OAuth scopes requested and give a plain-language justification for each, describe the data flow (what is read, what is stored, what is sent to the AI provider, retention and deletion), list the public URLs I must have ready (home page, privacy policy, terms, authorized domain and redirect URI), write a step-by-step script for a 2 to 3 minute demo video showing the consent screen, connecting a location, receiving a draft, approving it and the reply appearing on Google, add a checklist of OAuth consent screen fields, and add the questions Google is likely to ask with draft answers; flag anything the code does that could be hard to justify (extra scopes, unneeded data), never invent claims, and mark anything unknown as a TODO for me.
```

---

## Prompt 10: Slim down the README

```
Read README.md and the docs folder, then slim README.md down to a focused repo landing page of under 250 lines (banner, badges, one-paragraph pitch, honest status, real screenshots, the how-it-works diagram, short key feature bullets, quick start, configuration pointer, documentation links, limitations and license) and move the detailed sections into separate files: docs/architecture.md (architecture, RTL rendering, safety and security), docs/data-model.md, docs/api.md (pages and endpoints), docs/evaluation.md (test and eval results with their caveats), docs/billing.md and docs/deployment.md (deployment, cron and a pointer to the WhatsApp doc); keep every Mermaid diagram rendering correctly, fix all anchors and relative links, change no claims, confirm that no information was lost by comparing the old and new content, and show me the final line count.
```

---

## Prompt 11 (optional): Manual publishing fallback for the pilot

Use this only if Google access is still pending when you start the trial with real businesses.

```
Read AGENTS.md and the approval state machine in src/lib/approvals and show me a short plan and the proposed migration before writing any code: for the pilot, add a manual-publish mode that applies when GOOGLE_API_MODE is not live or when a per-business setting is turned on, where approving a draft sets a new status approved_manual (add migration 0007 that extends the status check safely and update the TypeScript types), skips the Google API call, and shows on the success screen the final reply text with a large Copy button and a link to open the owner's Google listing so they can paste it manually, while the dashboard shows these drafts as Waiting for manual post with a Mark as posted action; keep the single-use token logic, RLS policies and all existing state machine tests passing, add tests for the new path, support Arabic RTL and English LTR, and wait for my OK on the plan before implementing.
```

---

## Do these yourself (not Claude Code)

**Fix the GitHub repo About box** (requires the GitHub CLI `gh` logged in; otherwise use the gear icon on the repo page):

```
gh repo edit mo74x/radd --description "AI-drafted replies to Google reviews for local businesses in MENA, approved in one tap via WhatsApp, Telegram, or Email. Built with Next.js 16, React 19, Supabase, and Claude." --remove-topic gemini --remove-topic typescript-library --remove-topic tekegram-bot --add-topic telegram-bot --add-topic whatsapp
```

After you deploy, add the live URL with `gh repo edit mo74x/radd --homepage "https://your-domain"`.

**Other manual steps**
- Upload a social preview image (1280×640) in the repo's Settings.
- Deploy to Vercel and hosted Supabase, then apply the migrations.
- Submit the Google Business Profile API access request and OAuth verification (after Prompts 6 and 9).
- Submit the WhatsApp template to Meta (after Prompt 5).
- Record the demo video, and run the free trial with 3 to 5 real businesses.
- Have a native Arabic speaker review all UI copy and the privacy and terms pages, and have a lawyer glance at the legal pages.
- Run the evals with a real Anthropic API key after Prompt 2 and tell me the results so I can help update the README honestly.
