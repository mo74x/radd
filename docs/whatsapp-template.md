# WhatsApp Template Specification & Setup Guide

This document provides the exact specification for the Meta Cloud API WhatsApp message template expected by Radd (`src/lib/notifications/whatsapp.ts`).

---

## 1. Overview & Environment Variables

When a new Google review is ingested, Radd drafts a reply and sends a WhatsApp message template to the business owner containing the review details and a one-tap approval button.

| Environment Variable | Default Value | Description |
| :--- | :--- | :--- |
| `WHATSAPP_TEMPLATE_NAME` | `review_reply_approval` | The template name configured in Meta WhatsApp Manager. |
| `WHATSAPP_TEMPLATE_LANG` | `ar` | Template language code (`ar` for Arabic, `en` for English). |
| `META_WHATSAPP_TOKEN` | *None* | Meta System User access token with `whatsapp_business_messaging` permission. (`WHATSAPP_ACCESS_TOKEN` also accepted). |
| `WHATSAPP_PHONE_NUMBER_ID` | *None* | 15-digit Phone Number ID from Meta WhatsApp Business Platform. |

---

## 2. Meta Graph API Version

- **Configured Endpoint**: `https://graph.facebook.com/v21.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`
- **Graph API Version**: `v21.0`
- **Important Note**: Meta periodically retires older Graph API versions (typically after 2 years). Verify on [Meta Graph API Versioning](https://developers.facebook.com/docs/graph-api/versions/) that `v21.0` remains active before launching in production.

---

## 3. Template Component Architecture

The template configured in Meta Business Manager must have three components: **Header**, **Body**, and **Quick Action Button (Dynamic URL)**.

### A. Header Component (Text)
- **Format**: Text
- **Parameters sent by code**:
  - `{{1}}`: **Location Display Name** (e.g. `Roastery & Co. - فرع المعادي` or `Downtown Dental Clinic`)

### B. Body Component (Text with 4 Variables)
The code in `src/lib/notifications/whatsapp.ts` passes exactly **4 parameters** to the body component in the following strict order:

| Variable | Payload Source | Example Content | Notes |
| :---: | :--- | :--- | :--- |
| **`{{1}}`** | `reviewerName` | `أحمد محمود` / `Sarah Jenkins` | Falls back to `عميل` if reviewer display name is empty. |
| **`{{2}}`** | `rating` + visual stars | `5★ (★★★★★)` / `1★ (★☆☆☆☆)` | Formatted as `${rating}★ (${stars})`. |
| **`{{3}}`** | `cleanSnippet` | `القهوة ممتازة جداً والمكان هادي` | Review text, truncated to 140 chars. Falls back to `(تقييم بدون تعليق)` if review had no text. |
| **`{{4}}`** | `cleanDraft` | `نورتنا يا أحمد! شكراً لزيارتك.` | AI-generated draft reply, truncated to 280 chars. |

### C. Button Component (Dynamic URL)
- **Type**: Quick Action / Call-to-Action -> **Visit Website (URL)**
- **URL Type**: **Dynamic**
- **Website Base URL**: `https://<your-domain>/` (e.g. `https://radd.app/` with a trailing slash)
- **Dynamic Suffix Parameter**: `{{1}}`
- **Value sent by code**: `relativeTokenPath` (e.g. `approve/3df08257e3f1...`)
- **Resulting Customer Link**: `https://radd.app/approve/3df08257e3f1...`

> ⚠️ **Critical Meta Configuration Note:**  
> In Meta WhatsApp Manager, configure the button URL as `https://<your-domain>/{{1}}` (where `{{1}}` represents the dynamic suffix). The code passes `approve/<token>` as the dynamic parameter value. Do **not** enter `https://<your-domain>/approve/{{1}}` in Meta, otherwise the resulting link will become `https://<your-domain>/approve/approve/<token>`!

---

## 4. Ready-to-Paste Template Copy

### Arabic Template (`WHATSAPP_TEMPLATE_LANG=ar`)
- **Template Name**: `review_reply_approval`
- **Category**: `UTILITY` (Transactional customer alert)
- **Language**: Arabic (`ar`)

**Header (Text):**
```text
📍 {{1}}
```

**Body:**
```text
وصلك تقييم جديد على Google Business Profile:

👤 العميل: {{1}}
⭐ التقييم: {{2}}
💬 نص التقييم: "{{3}}"

🤖 الرد المقترح من الذكاء الاصطناعي:
"{{4}}"

اضغط على الزر أدناه لمراجعة الرد واعتماده بنقرة واحدة للنشر الفوري على Google.
```

**Button:**
- **Button Type**: Visit Website
- **Button Text**: `اعتماد الرد بنقرة واحدة`
- **URL Type**: Dynamic
- **Website URL**: `https://<your-domain>/{{1}}`
- **Sample URL**: `https://<your-domain>/approve/sample_token_hash`

---

### English Template (`WHATSAPP_TEMPLATE_LANG=en`)
- **Template Name**: `review_reply_approval_en` (or set `WHATSAPP_TEMPLATE_NAME` accordingly)
- **Category**: `UTILITY`
- **Language**: English (`en`)

**Header (Text):**
```text
📍 {{1}}
```

**Body:**
```text
New Google review received for your business:

👤 Customer: {{1}}
⭐ Rating: {{2}}
💬 Review: "{{3}}"

🤖 AI Draft Reply:
"{{4}}"

Tap the button below to review, edit, or approve this reply for immediate publishing to Google.
```

**Button:**
- **Button Type**: Visit Website
- **Button Text**: `Approve Reply`
- **URL Type**: Dynamic
- **Website URL**: `https://<your-domain>/{{1}}`
- **Sample URL**: `https://<your-domain>/approve/sample_token_hash`

---

## 5. Testing with the Local Console Mock

When testing locally or before your Meta WhatsApp template is approved, Radd automatically runs in **mock console mode**:

1. Leave `META_WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` empty in `.env` (or let them contain placeholder dots `...`).
2. Trigger review ingestion (e.g. via `/api/cron/poll-reviews` or the **Poll now** button on the dashboard).
3. Check your terminal output. You will see a mock delivery log with full formatted text and a direct clickable approval link:

```text
[MOCK WHATSAPP -> +201001234567]
📍 الفرع: *Roastery & Co. - Maadi*
👤 العميل: *Tamer* (★★★★★)
💬 التقييم: "القهوة ممتازة"

🤖 *الرد المقترح من الذكاء الاصطناعي:*
"نورتنا يا تامر! شكراً لزيارتك."

👉 *رابط الاعتماد بنقرة واحدة:* http://localhost:3000/approve/3df08257e3f1cf...
```

---

## 6. Going Live Checklist

1. [ ] Create a Meta WhatsApp Business Account (WABA) in Meta Business Manager.
2. [ ] Submit the `review_reply_approval` template under **Utility** category with sample values for all 4 body parameters and the header.
3. [ ] Wait for Meta automated approval (typically approved in minutes for Utility templates).
4. [ ] Create a permanent System User in Meta Business Suite, generate a 60-day or permanent token with `whatsapp_business_messaging` permission, and assign the WhatsApp account asset to the system user.
5. [ ] Add `META_WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME`, and `WHATSAPP_TEMPLATE_LANG` to your production environment variables (e.g., in Vercel).
6. [ ] Confirm that your destination phone numbers in Egyptian businesses use standard format (e.g., `01001234567` or `+201001234567`); Radd automatically normalizes them to `201001234567`.
