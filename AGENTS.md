<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Project Context & UI Design Guidelines: Radd (ردّ)

## Project Overview
**Radd (ردّ)** is a multi-tenant SaaS that drafts AI replies to Google reviews for local businesses in Egypt/MENA. The owner gets a one-tap approval link (email/Telegram), approves or edits the reply, and it is published to Google.

## Stack (Already in Place)
- **Framework**: Next.js 16 App Router, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend & Auth**: Supabase (Postgres + Auth), Zod
- **Existing Routes**:
  - `/dashboard`
  - `/onboarding`
  - `/approve/[token]`
  - `/api/google/oauth/*`
  - `/api/cron/poll-reviews`
  - `/api/drafts/[token]`
  - `/api/dashboard/settings`
- **Data Types**: `src/types/database.ts`
- **Constraint**: Do not change database schema, API contracts, or business logic unless explicitly requested. This work is UI only.

## Brand Guidelines
- **Name**: Radd | Arabic: رد (with shadda: ردّ).
- **Logo Assets**: Located in `docs/` (`radd-lockup-*.svg`, `radd-icon.svg`).
- **Color Palette**:
  - Primary: Deep Teal `#0F5E63`
  - Accent (sparingly used: stars, primary CTA): Amber `#F5A623`
  - Dark Background: `#0B1F22`
  - Off-White: `#F2F7F6`
  - Neutrals: Derived from teal
- **Typography**:
  - Font: `Cairo` (supports Arabic + Latin), loaded via `next/font`.
  - Weights: `400` (Regular), `600` (SemiBold), `800` (Bold/ExtraBold).
- **Tone**: Trustworthy, calm, modern, friendly. Not corporate, not playful. Modern fintech/SaaS feel for MENA.

## Language and Direction (Bi-directional RTL / LTR)
- **Bilingual**: Arabic (default, RTL) and English (LTR). Everything must function smoothly in both.
- **Logical Properties**: Always use CSS logical properties and Tailwind logical utilities:
  - Spacing / Margin / Padding: `ms-*`, `me-*`, `ps-*`, `pe-*`
  - Positioning: `start-*`, `end-*`
  - Text Alignment: `text-start`, `text-end`
  - **Never** use physical `left` / `right` utilities so RTL works automatically.
- **Directional Icons**: Mirror directional icons (arrows, chevrons) in RTL.
- **Exceptions**: Do **not** mirror the logo or star ratings.
- **Digits / Numbers**: Use Western digits (`0-9`) by default, consistent across both languages.

## Quality Bar
- **Mobile-First**: Most owners use phones. Ensure touch targets are at least 44px (`min-h-[44px] min-w-[44px]`).
- **Accessibility**:
  - WCAG AA contrast.
  - Visible focus rings.
  - Proper semantic HTML (`<main>`, `<nav>`, `<button>`, `<section>`).
  - Correct ARIA attributes and labels.
  - Full keyboard navigability.
  - Respect `prefers-reduced-motion`.
- **Theme Support**: Light and dark themes via CSS variables, adhering to `prefers-color-scheme` with a manual toggle.
- **Dependencies**: No heavy dependencies. Allowed: `lucide-react` for icons. Prefer plain Tailwind components without adding unrequested UI kits.
- **Design System Consistency**: Reuse components from the design system. Avoid one-off styling duplicating components.
- **Architecture**: Keep Server Components where possible. Only use `"use client"` when interactivity is required.
- **Security**: Never log or expose approval tokens, OAuth tokens, or secrets in the UI or browser console.

## Workflow Discipline
1. **Read First**: Always read the relevant existing code before proposing changes.
2. **Plan & Confirm**: Draft a concise plan and wait for confirmation before making large changes.
3. **Validate & Report**: After each task, run type-check (`npm run build` or `npx tsc --noEmit`) and lint, fix any errors, and summarize what changed along with testing instructions.

