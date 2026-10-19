<p align="center">
  <img src="docs/radd-github-banner.png" alt="Radd (رد) – AI review reply engine" width="100%">
</p>

<p align="center">
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase&logoColor=white">
  <img alt="Zod" src="https://img.shields.io/badge/validation-Zod-3E67B1">
  <img alt="Eval suite" src="https://img.shields.io/badge/prompt%20eval-30%2F30-F5A623">
</p>

# Radd (رد)

**AI-drafted replies to every Google review, approved by the owner in one tap.**

Radd is a multi-tenant SaaS for local businesses (cafés, restaurants, clinics, retail) in Egypt and the wider MENA region. It watches a business's Google Business Profile for new reviews, classifies them, drafts a reply in the brand's voice (including natural **Egyptian Arabic**), checks that draft against deterministic safety rules, and sends the owner a one-tap approval link by email or Telegram. When the owner approves or edits the reply, Radd publishes it to Google.

> **Status:** feature-complete MVP, developed and tested locally against a built-in mock of the Google Business Profile API. Live Google access depends on Google's API access and OAuth verification process. See [Roadmap](#roadmap).

---

## Table of contents

- [Why Radd](#why-radd)
- [How it works](#how-it-works)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Safety and security](#safety-and-security)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Verification and evaluation](#verification-and-evaluation)
- [Project structure](#project-structure)
- [Data model](#data-model)
- [Roadmap](#roadmap)
- [Notes on Google branding](#notes-on-google-branding)
- [Author](#author)

---

## Why Radd

Replying to reviews improves how a business looks on Google, but owners rarely have time to write replies, and generic AI tools tend to sound robotic, mishandle dialect, or promise things the business never offered.

Radd focuses on three things:

1. **Local language quality:** replies in natural Egyptian Arabic, English, or a mix, matching the reviewer.
2. **A human always decides:** nothing is posted without the owner's approval, and risky reviews are clearly flagged.
3. **Safety by construction:** a deterministic validator sits *after* the model, so refund promises, discount codes and stray phone numbers are blocked no matter what the model produces.

---

## How it works

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Google reviewer
    participant GBP as Google Business Profile API
    participant Cron as Polling ingestor
    participant DB as Supabase PostgreSQL
    participant AI as Classifier and drafter
    participant Guard as Deterministic validator
    participant Notify as Email / Telegram
    actor Owner as Business owner
    participant App as /approve/[token]

    Customer->>GBP: Posts a review
    Cron->>GBP: Polls for unanswered reviews
    GBP-->>Cron: Review objects
    Cron->>DB: Idempotent upsert
    Cron->>AI: Classify and draft
    AI->>Guard: Validate draft
    Guard-->>AI: Approved or blocked
    AI->>DB: Store draft + SHA-256 token hash
    AI->>Notify: Send one-tap link
    Notify-->>Owner: New review + suggested reply
    Owner->>App: Approve, Edit or Skip
    App->>DB: Single-use status transition
    App->>GBP: Publish reply
```

---

## Features

**Review handling**
- Polls Google Business Profile for unanswered reviews, with a protected cron endpoint and a manual **Poll now** button.
- Idempotent ingestion keyed on the Google review ID, so a review is never processed twice.
- Skips reviews that already have an owner reply.

**AI classification and drafting**
- Detects language: Egyptian Arabic, English, mixed, or no text (star-only).
- Detects sentiment, urgency and category (food, service, ambiance, delivery, billing).
- Flags sensitive cases: `medical`, `legal`, `refund`, and `injection_suspected`. Negative or flagged reviews are marked for careful review.
- Drafts replies using the brand profile: tone, dialect, signature, do/don't lists and example replies.
- Handles star-only reviews without inventing details the reviewer never wrote.

**Owner experience**
- **One-tap approval page**, mobile-first and login-free, secured by a signed single-use token.
- Three actions: **Approve**, **Edit reply** (in place), **Skip**.
- Warning banner when a review needs careful handling.
- Notifications by **email (Resend)** and **Telegram** (inline action button).
- 3-step onboarding: connect Google, set brand voice, choose notification channel.

**Dashboard**
- Reviews answered %, approved-without-edit %, pending count, active notification channel.
- Full review and reply timeline with ratings, languages, flags and model versions.

---

## Tech stack

| Layer | Technology |
| :--- | :--- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS |
| Database and auth | Supabase (PostgreSQL 15), `@supabase/supabase-js`, Row Level Security |
| AI | Pluggable LLM layer (Anthropic Claude, OpenAI, Google Gemini) with structured JSON output and a local simulator fallback |
| Google | Business Profile APIs through `googleapis`, OAuth 2.0 |
| Notifications | Resend (email), Telegram Bot API |
| Security | Node.js `crypto` (256-bit random tokens, SHA-256 hashing) |
| Validation | Zod |
| Scripts | `tsx` |

---

## Architecture

```
Google Business Profile
        │  poll (cron / manual)
        ▼
 Ingestor ──▶ Classifier ──▶ Drafter ──▶ Validator ──▶ Draft + token hash (DB)
                                                           │
                                                           ▼
                                              Dispatcher (Email / Telegram)
                                                           │ magic link
                                                           ▼
                                              /approve/[token]  (Approve · Edit · Skip)
                                                           │
                                                           ▼
                                              Publish reply to Google
```

Everything is stored in Supabase. Each business is a tenant: locations, brand profiles, reviews and drafts all belong to a `business_id`.

---

## Safety and security

1. **Prompt-injection defense.** Review text is wrapped in isolated data tags (`<untrusted_review_data>`) and treated as content, never as instructions. Suspicious reviews are flagged `injection_suspected`.
2. **Deterministic output validator.** Pure TypeScript checks run on every generated reply before it reaches the owner:
   - blocks refund and compensation promises (English and Arabic phrasing),
   - blocks unauthorized discounts, vouchers and codes,
   - strips phone numbers other than the location's official contact number,
   - enforces length bounds (10 to 1,000 characters).
3. **Single-use magic links.** Approval tokens are 256-bit random values. Only the SHA-256 hash is stored, so a database leak does not expose usable links. A decision is applied through an atomic `status = 'pending'` check, which blocks double taps and replays.
4. **Human in the loop.** The model never publishes on its own. Every reply needs an explicit owner decision.
5. **Tenant isolation.** All business data is scoped by `business_id`, with RLS policies on the database tables.

---

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (or local Supabase)
- Optional for live mode: Google Cloud OAuth credentials, a Resend API key, a Telegram bot token, and an LLM API key

Without the optional keys, Radd falls back to the built-in mock Google client, a console notification mock, and a local LLM simulator, so you can run the whole flow offline.

### Install

```bash
git clone https://github.com/mo74x/review-reply-bot.git
cd review-reply-bot
npm install
```

### Set up the database

Apply the schema in `supabase/migrations/0001_init.sql` to your Supabase project (SQL editor or the Supabase CLI).

### Configure environment

Copy your environment file and fill in the values (see [Configuration](#configuration)):

```bash
cp .env.example .env
```

### Run

```bash
npm run dev
```

- Dashboard: <http://localhost:3000/dashboard>
- Onboarding and brand voice: <http://localhost:3000/onboarding>

---

## Configuration

| Variable | Purpose |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key for background jobs (server only, never expose) |
| `CRON_SECRET` | Bearer token protecting `/api/cron/poll-reviews` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth credentials (omit to use the mock client) |
| `RESEND_API_KEY` | Email notifications (omit for console mock) |
| `TELEGRAM_BOT_TOKEN` | Telegram notifications (omit for console mock) |
| LLM provider key(s) | Anthropic / OpenAI / Gemini key (omit for local simulator) |
| App base URL | Used to build `/approve/{token}` links |

Check `.env.example` for the exact variable names used in the code.

### Scheduling the poller

Call the cron endpoint on a schedule (Vercel Cron, GitHub Actions or Supabase `pg_cron`):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/poll-reviews
```

---

## Verification and evaluation

Each build phase has a runnable verification script, plus a prompt evaluation suite:

```bash
npx tsx --env-file=.env scripts/verify-foundation.ts   # database and token crypto
npx tsx --env-file=.env scripts/verify-part2.ts        # Google ingestion
npx tsx --env-file=.env scripts/verify-part3.ts        # classifier, drafter, validator
npx tsx --env-file=.env scripts/verify-part4.ts        # notifications and one-tap approval
npx tsx --env-file=.env scripts/eval-prompts.ts        # 30-case prompt evaluation
```

**Evaluation suite (30 cases):**

| Category | Cases |
| :--- | :-: |
| Egyptian Arabic, positive | 6 |
| Egyptian Arabic, complaints | 6 |
| Mixed Arabic and English | 6 |
| English (expat / tourist) | 5 |
| Adversarial: prompt injection, refund and legal traps | 4 |
| Star-only reviews with empty text | 3 |

Current result: **30/30 passing.** These cases were written by the project author, so treat the pass rate as a regression check. Real-world review samples are on the [roadmap](#roadmap).

---

## Project structure

```text
review-reply-bot/
├── scripts/                     # verification + eval runners
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── cron/poll-reviews/     # scheduled polling endpoint
│   │   │   ├── dashboard/settings/    # settings API (Zod-validated)
│   │   │   ├── drafts/[token]/        # single-use approval decision
│   │   │   └── google/oauth/          # OAuth connect + callback
│   │   ├── approve/[token]/           # one-tap mobile approval page
│   │   ├── dashboard/                 # analytics + review timeline
│   │   └── onboarding/                # 3-step setup + brand voice
│   ├── lib/
│   │   ├── ai/                        # classifier, drafter, validator, pipeline, prompts
│   │   ├── approvals/                 # approval decisions + publishing
│   │   ├── crypto/                    # token generation + hashing
│   │   ├── google/                    # client (real + mock), ingestor, onboarding
│   │   ├── notifications/             # email + Telegram dispatcher
│   │   └── supabase/                  # admin + server clients
│   └── types/database.ts
└── supabase/migrations/0001_init.sql
```

---

## Data model

| Table | Purpose |
| :--- | :--- |
| `businesses` | Tenant root: name, slug, plan, notification settings |
| `google_connections` | OAuth tokens and connection status |
| `locations` | Store branches: Google account/location IDs, contact phone, polling toggle |
| `brand_profiles` | Tone, dialect, signature, do/don't rules, example replies |
| `reviews` | Raw review text, rating, reviewer, detected language, safety flags |
| `drafts` | Generated replies, status (`pending`, `approved`, `edited`, `skipped`, `posted`, `failed`), token hash |

---

## Roadmap

Done:
- [x] Multi-tenant schema and token cryptography
- [x] Google OAuth, location discovery and review ingestion (with mock client)
- [x] Classifier, drafter and deterministic validator
- [x] Email and Telegram notifications with one-tap approval
- [x] Dashboard, onboarding and 30-case prompt evaluation

Next:
- [ ] Live Google Business Profile access (API access request and OAuth verification)
- [ ] Safer publishing state machine: `approved → posting → posted | failed`, with retries
- [ ] Approval-link expiry
- [ ] Locking so overlapping cron runs cannot process the same review twice
- [ ] Evaluation set built from real reviews, and more Arabic spelling variants in the validator
- [ ] Tenant-isolation tests (RLS) and encrypted-at-rest refresh tokens review
- [ ] Billing, trials, and handling for revoked Google access
- [ ] WhatsApp approval channel
- [ ] Multi-location management

---

## Notes on Google branding

Radd is an independent product. It is not affiliated with, endorsed by, or sponsored by Google. "Google" and "Google Business Profile" are trademarks of Google LLC and are used here only to describe compatibility.

---

## Author

**Mohamed Arafa Shabaan**: Backend and systems integration engineer.
[GitHub](https://github.com/mo74x) · [LinkedIn](https://www.linkedin.com/in/mohamed-arafa-6628211b8/)

---

## License

Add a `LICENSE` file before publishing and reference it here.