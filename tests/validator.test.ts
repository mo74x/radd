import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeText,
  normalizePhoneNumber,
  extractPhoneNumbers,
  validateDraftReply,
} from '../src/lib/ai/validator';
import { LocationRow } from '../src/types/database';

const mockLocation: LocationRow = {
  id: 'loc-001',
  business_id: 'biz-001',
  google_account_id: 'accounts/1',
  google_location_id: 'locations/1',
  display_name: 'Roastery & Co. Café - Maadi',
  contact_phone: '+201001234567',
  contact_email: 'care@roastery.com',
  is_polling_enabled: true,
  last_polled_at: null,
  last_review_update_time: null,
  poll_lock_until: null,
  poll_lock_token: null,
  created_at: new Date().toISOString(),
};

describe('Arabic Normalization Pipeline', () => {
  it('strips diacritics (tashkeel)', () => {
    const input = 'اِستِرجَاع المَبلَغ وَكُود خَصْم';
    const output = normalizeText(input);
    assert.equal(output, 'استرجاع المبلغ وكود خصم');
  });

  it('strips tatweel (ـ / kashida)', () => {
    const input = 'اسـتـرجـاع الـمـبـلـغ ونـرجـعـلـك';
    const output = normalizeText(input);
    assert.equal(output, 'استرجاع المبلغ ونرجعلك');
  });

  it('normalizes Alef variants (أ, إ, آ, ٱ -> ا)', () => {
    const input = 'إسترجاع أوردر آيس كوفي ٱسترداد';
    const output = normalizeText(input);
    assert.equal(output, 'استرجاع اوردر ايس كوفي استرداد');
  });

  it('normalizes Ya / Alef Maqsura (ى -> ي)', () => {
    const input = 'مشروب مجانى على حسابنا المره دى';
    const output = normalizeText(input);
    assert.equal(output, 'مشروب مجاني علي حسابنا المره دي');
  });

  it('normalizes Ta Marbuta (ة -> ه)', () => {
    const input = 'وجبة مجانية وقسيمة شراء خاصة';
    const output = normalizeText(input);
    assert.equal(output, 'وجبه مجانيه وقسيمه شراء خاصه');
  });

  it('converts Arabic-Indic numerals (٠-٩) to ASCII (0-9)', () => {
    const input = 'كلمنا على ٠١٠١٢٣٤٥٦٧٨ او خصم ٥٠%';
    const output = normalizeText(input);
    assert.equal(output, 'كلمنا علي 01012345678 او خصم 50%');
  });

  it('strips zero-width characters and collapses whitespace', () => {
    const input = 'است\u200Bرجاع \uFEFF  الم\u200Cبلغ \u200D  وفلوسك';
    const output = normalizeText(input);
    assert.equal(output, 'استرجاع المبلغ وفلوسك');
  });
});

describe('Phone Number Normalization & Extraction', () => {
  it('normalizes international Egyptian phone numbers to local 0-prefix format', () => {
    assert.equal(normalizePhoneNumber('+201001234567'), '01001234567');
    assert.equal(normalizePhoneNumber('00201001234567'), '01001234567');
    assert.equal(normalizePhoneNumber('201001234567'), '01001234567');
    assert.equal(normalizePhoneNumber('010-0123-4567'), '01001234567');
    assert.equal(normalizePhoneNumber('010 0123 4567'), '01001234567');
  });

  it('extracts phone numbers with Arabic-Indic numerals and formatting', () => {
    const text1 = normalizeText('كلمنا على ٠١٠٠١٢٣٤٥٦٧');
    const phones1 = extractPhoneNumbers(text1);
    assert.equal(phones1.length, 1);
    assert.equal(normalizePhoneNumber(phones1[0]), '01001234567');

    const text2 = normalizeText('تواصل معنا على 010-0123-4567 فورا');
    const phones2 = extractPhoneNumbers(text2);
    assert.equal(phones2.length, 1);
    assert.equal(normalizePhoneNumber(phones2[0]), '01001234567');
  });
});

describe('Table of Mutated Bypass Inputs (Diacritics, Tatweel, Swaps, Zero-Width)', () => {
  interface BypassTestCase {
    name: string;
    mutatedInput: string;
    expectedViolations: string[];
  }

  const MUTATED_BYPASS_CASES: BypassTestCase[] = [
    // 1. Diacritics insertion on Arabic refund/discount phrases
    {
      name: 'Diacritics on refund promise (اِستِرجَاع المَبلَغ)',
      mutatedInput: 'أهلاً بحضرتك يا فندم، بنعتذر وهنعملك اِستِرجَاع المَبلَغ فوراً ونتمنى زيارتك مجدداً.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
    {
      name: 'Diacritics on Egyptian refund phrase (نُرَجِّعْلَك فُلُوسَك)',
      mutatedInput: 'حقك علينا يا فندم ولا يهمك نُرَجِّعْلَك فُلُوسَك بالكامل ونتمنى تشرفنا.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
    {
      name: 'Diacritics on discount and freebie (كُود خَصْم خَاص ومَشْرُوب مَجَّانِي)',
      mutatedInput: 'نعتذر عن التأخير وهنبعتلك كُود خَصْم خَاص ومَشْرُوب مَجَّانِي في زيارتك القادمة.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },
    {
      name: 'Diacritics on financial compensation (تَعْوِيض مَالِي)',
      mutatedInput: 'بنعتذر لحضرتك ومستعدين نقدم تَعْوِيض مَالِي عن أي إزعاج حصل.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },

    // 2. Tatweel (kashida ـ) bypass insertion
    {
      name: 'Tatweel bypass on refund (اسـتـرجـاع الـمـبـلـغ)',
      mutatedInput: 'أهلاً بك يا فندم، تقدر تتفضل ويكون فيه اسـتـرجـاع الـمـبـلـغ كاملاً.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
    {
      name: 'Tatweel bypass on discount code (كـود خـصـم)',
      mutatedInput: 'بنعتذر جداً وهنبعتلك كـود خـصـم 20% تقديراً لحضرتك في الفرع.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },
    {
      name: 'Tatweel bypass on free drink (مـشـروب مـجـانـي)',
      mutatedInput: 'حقك علينا يا فندم، المرة الجاية ليك مـشـروب مـجـانـي من عندنا.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },

    // 3. Alef variant swaps (أ, إ, آ, ٱ -> ا)
    {
      name: 'Alef Hamza Below on refund (إسترجاع المبلغ)',
      mutatedInput: 'بنعتذر عن التجربة السيئة وهيتم إسترجاع المبلغ لحسابك في أقرب وقت.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
    {
      name: 'Alef Hamza Above on free order (أوردر مجاني)',
      mutatedInput: 'حقك علينا وتشرفنا المرة الجاية وليك أوردر مجاني بالكامل.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },
    {
      name: 'Alef Maddah on refund (آسفين وهنرجعلك فلوسك)',
      mutatedInput: 'آسفين وهنرجعلك فلوسك كاملة في أقرب وقت يا فندم.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },

    // 4. Ya / Alef Maqsura & Ta Marbuta swaps
    {
      name: 'Alef Maqsura on free drink (مشروب مجانى)',
      mutatedInput: 'أهلاً بحضرتك يا فندم، المرة الجاية لحضرتك مشروب مجانى ترحيباً بيك.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },
    {
      name: 'Ta Marbuta on free meal (وجبة مجانية)',
      mutatedInput: 'بنعتذر عن اللي حصل، زيارتك القادمة تشمل وجبة مجانية مع كل طلب.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },
    {
      name: 'Ta Marbuta on gift coupon (قسيمة شراء هدية)',
      mutatedInput: 'حقك علينا يا فندم، تواصل معنا لاستلام قسيمة شراء هدية للمحل.',
      expectedViolations: ['Promises a discount, voucher, or free item in Arabic'],
    },

    // 5. Zero-width character obfuscation (\u200B, \u200C, \u200D, \uFEFF)
    {
      name: 'Zero-width space in refund keyword (است\\u200Bرجاع الم\\uFEFFبلغ)',
      mutatedInput: 'أهلاً بك، تم التنسيق لـ است\u200Bرجاع الم\uFEFFبلغ لحضرتك فوراً.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
    {
      name: 'Zero-width non-joiner & joiner in (نرج\\u200Cعلك فل\\u200Dوسك)',
      mutatedInput: 'حقك علينا يا فندم نرج\u200Cعلك فل\u200Dوسك على طول بدون أي تأخير.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
    {
      name: 'Zero-width characters in English refund (r\\u200Be\\u200Bf\\u200Bu\\u200Bn\\u200Bd)',
      mutatedInput: 'We apologize for the inconvenience and will issue a full r\u200Be\u200Bf\u200Bu\u200Bn\u200Bd.',
      expectedViolations: ['Promises a refund or money back in English'],
    },

    // 6. Arabic-Indic numerals in phone numbers and currency
    {
      name: 'Unauthorized phone with Arabic-Indic numerals (٠١١٩٩٩٩٨٨٨٨)',
      mutatedInput: 'بنعتذر لحضرتك جداً، ياريت تكلمنا على الرقم ده ٠١١٩٩٩٩٨٨٨٨ فوراً.',
      expectedViolations: ['Contains unauthorized phone number: 01199998888'],
    },
    {
      name: 'Currency amount in Arabic-Indic numerals (١٠٠ جنيه)',
      mutatedInput: 'نعتذر عن التجربة وهنبعت لحضرتك رصيد ١٠٠ جنيه تعويضاً لحضرتك.',
      expectedViolations: ['Mentions a specific currency amount in the reply'],
    },

    // 7. Combined multi-layered bypass
    {
      name: 'Combined diacritics + tatweel + zero-width + Alef variant',
      mutatedInput: 'إِسْـ\u200Bتِـرْ\u200Cجَـاع المَـ\uFEFFبْـلَـغ لحضرتك يا فندم فور التواصل معنا.',
      expectedViolations: ['Promises a refund or financial compensation in Arabic'],
    },
  ];

  for (const tc of MUTATED_BYPASS_CASES) {
    it(`neutralizes bypass: ${tc.name}`, () => {
      // 1. Strict validation (AI mode) -> MUST be invalid (hard-blocked)
      const aiResult = validateDraftReply({
        draftText: tc.mutatedInput,
        location: mockLocation,
        isOwnerEdit: false,
      });

      assert.equal(aiResult.valid, false, `Expected bypass to be blocked in AI mode: ${tc.name}`);
      for (const expectedViolation of tc.expectedViolations) {
        const found = aiResult.reasons.some((r) => r.includes(expectedViolation));
        assert.ok(found, `Expected reason containing "${expectedViolation}", got: ${JSON.stringify(aiResult.reasons)}`);
      }

      // 2. Owner edit mode -> MUST be warning mode (valid = true, but warnings non-empty)
      const ownerResult = validateDraftReply({
        draftText: tc.mutatedInput,
        location: mockLocation,
        isOwnerEdit: true,
      });

      assert.equal(ownerResult.valid, true, `Owner edit should not be hard-blocked: ${tc.name}`);
      assert.equal(ownerResult.reasons.length, 0);
      assert.ok(ownerResult.warnings.length > 0, `Expected confirmation warnings for owner edit: ${tc.name}`);
    });
  }
});

describe('Franco-Arabic (Arabizi) and Dialectal Dictionaries', () => {
  const FRANCO_CASES = [
    {
      text: 'm3lesh ya fndm hanraga3lek el flous kolaha fl foroo3',
      expectedViolation: 'Promises a refund or compensation in Franco-Arabic',
    },
    {
      text: 'Alf salama w 5od code 5asm 20% off 3la ay order gded',
      expectedViolation: 'Promises a discount or free item in Franco-Arabic',
    },
    {
      text: 'Haneba3tlek khasm khas 3ashanak ya basha nawartana',
      expectedViolation: 'Promises a discount or free item in Franco-Arabic',
    },
    {
      text: 'Mtshelsh ham el order 3leina el mara de w tsharrafna',
      expectedViolation: 'Promises a discount or free item in Franco-Arabic',
    },
    {
      text: 'lik mashroob free aw bbalash el mara el gaya',
      expectedViolation: 'Promises a discount or free item in Franco-Arabic',
    },
  ];

  for (const tc of FRANCO_CASES) {
    it(`detects Franco-Arabic phrasing: "${tc.text}"`, () => {
      const result = validateDraftReply({
        draftText: tc.text,
        location: mockLocation,
        isOwnerEdit: false,
      });

      assert.equal(result.valid, false);
      const found = result.reasons.some((r) => r.includes(tc.expectedViolation));
      assert.ok(found, `Expected violation "${tc.expectedViolation}", got: ${JSON.stringify(result.reasons)}`);
    });
  }
});

describe('Contact Leak Checks (URLs, Emails, Handles, WhatsApp Phrases)', () => {
  it('flags external website URLs', () => {
    const text = 'نعتذر لحضرتك، ياريت تزور موقعنا https://my-restaurant.com/offers للاطلاع على العروض.';
    const result = validateDraftReply({ draftText: text, location: mockLocation, isOwnerEdit: false });
    assert.equal(result.valid, false);
    assert.ok(result.reasons.some((r) => r.includes('Contains external URL')));
  });

  it('flags short/domain links (bit.ly, t.me)', () => {
    const text = 'تقدر تسجل شكوتك من هنا bit.ly/cafe-feedback ونهتم بيها فوراً.';
    const result = validateDraftReply({ draftText: text, location: mockLocation, isOwnerEdit: false });
    assert.equal(result.valid, false);
    assert.ok(result.reasons.some((r) => r.includes('Contains external URL')));
  });

  it('flags unauthorized email addresses', () => {
    const text = 'ياريت تبعتلنا المشكلة بالتفصيل على support@otherdomain.com للحل.';
    const result = validateDraftReply({ draftText: text, location: mockLocation, isOwnerEdit: false });
    assert.equal(result.valid, false);
    assert.ok(result.reasons.some((r) => r.includes('Contains unauthorized email address')));
  });

  it('allows authorized location email address', () => {
    const text = 'نعتذر لحضرتك، تقدر تراسلنا على care@roastery.com ومسؤول الفرع هيتواصل معاك.';
    const result = validateDraftReply({ draftText: text, location: mockLocation, isOwnerEdit: false });
    // Location email is care@roastery.com, so it should not flag unauthorized email
    assert.ok(!result.reasons.some((r) => r.includes('Contains unauthorized email address')));
  });

  it('flags social media handles (@usernames)', () => {
    const text = 'تقدر تتابع كل جديد وتكلمنا على حسابنا في إنستجرام @roastery_maadi شكراً ليك.';
    const result = validateDraftReply({ draftText: text, location: mockLocation, isOwnerEdit: false });
    assert.equal(result.valid, false);
    assert.ok(result.reasons.some((r) => r.includes('Contains social media handle: @roastery_maadi')));
  });

  it('flags WhatsApp links (wa.me)', () => {
    const text = 'أهلاً بحضرتك، تواصل معنا على wa.me/201001234567 لخدمة أسرع.';
    const result = validateDraftReply({ draftText: text, location: mockLocation, isOwnerEdit: false });
    assert.equal(result.valid, false);
    assert.ok(result.reasons.some((r) => r.includes('Contains WhatsApp link')));
  });

  it('flags Arabic WhatsApp invitation phrases', () => {
    const phrases = [
      'بنعتذر جداً، ياريت تكلمنا على الواتس عشان نهتم بالموضوع فوراً.',
      'حقك علينا يا فندم، ابعتلنا على الواتساب وهنحل المشكلة فوراً.',
      'تواصل معنا عبر الواتس لتفاصيل أكثر حول طلبك ونعتذر عن أي تقصير.',
      'تقدر تراسلنا على رقم الواتساب الخاص بالفرع لحل المشكلة.',
    ];

    for (const phrase of phrases) {
      const res = validateDraftReply({ draftText: phrase, location: mockLocation, isOwnerEdit: false });
      assert.equal(res.valid, false, `Expected phrase to be flagged: ${phrase}`);
      assert.ok(
        res.reasons.some((r) => r.includes('Contains unauthorized WhatsApp invitation phrase')),
        `Expected WhatsApp phrase reason for "${phrase}"`
      );
    }
  });

  it('flags unauthorized phone numbers while allowing authorized location phone', () => {
    // Authorized phone: +201001234567 (01001234567)
    const validReply =
      'أهلاً بحضرتك يا أستاذة، بنعتذر عن التأخير. ياريت تكلمينا على 01001234567 للاهتمام بالموضوع فوراً.';
    const validRes = validateDraftReply({ draftText: validReply, location: mockLocation, isOwnerEdit: false });
    assert.equal(validRes.valid, true, `Valid reply with authorized phone should pass: ${validRes.reasons.join(', ')}`);

    // Formatted authorized phone: 010-0123-4567
    const formattedValid =
      'أهلاً بحضرتك، بنعتذر عن أي تأخير. ياريت تتواصل معانا على 010-0123-4567 ونهتم بالموضوع فوراً.';
    const formattedRes = validateDraftReply({ draftText: formattedValid, location: mockLocation, isOwnerEdit: false });
    assert.equal(formattedRes.valid, true);

    // Authorized phone in Arabic-Indic numerals: ٠١٠٠١٢٣٤٥٦٧
    const arabicIndicValid =
      'أهلاً بحضرتك، بنعتذر عن أي تأخير. ياريت تتواصل معانا على ٠١٠٠١٢٣٤٥٦٧ ونهتم فوراً.';
    const arabicIndicRes = validateDraftReply({ draftText: arabicIndicValid, location: mockLocation, isOwnerEdit: false });
    assert.equal(arabicIndicRes.valid, true);

    // Unauthorized phone: 01199998888
    const unauthorizedReply =
      'أهلاً بحضرتك، بنعتذر عن أي تأخير. كلمنا على 01199998888 لحل المشكلة.';
    const unauthorizedRes = validateDraftReply({ draftText: unauthorizedReply, location: mockLocation, isOwnerEdit: false });
    assert.equal(unauthorizedRes.valid, false);
    assert.ok(unauthorizedRes.reasons.some((r) => r.includes('Contains unauthorized phone number: 01199998888')));
  });
});

describe('Warning Mode for Owner Edits', () => {
  it('returns valid: false in AI mode (strict blocking) for restricted phrasing', () => {
    const text = 'بنعتذر لحضرتك جداً عن التأخير، وهنقدملك كود خصم 20% في زيارتك القادمة.';
    const res = validateDraftReply({
      draftText: text,
      location: mockLocation,
      isOwnerEdit: false,
    });

    assert.equal(res.valid, false);
    assert.ok(res.reasons.length > 0);
    assert.equal(res.warnings.length, 0);
  });

  it('returns valid: true with non-empty warnings in Owner Edit mode (confirmation warning)', () => {
    const text = 'بنعتذر لحضرتك جداً عن التأخير، وهنقدملك كود خصم 20% في زيارتك القادمة.';
    const res = validateDraftReply({
      draftText: text,
      location: mockLocation,
      isOwnerEdit: true,
    });

    assert.equal(res.valid, true, 'Owner edit should not be hard-blocked');
    assert.equal(res.reasons.length, 0, 'No hard blocking reasons');
    assert.ok(res.warnings.length > 0, 'Warnings should contain restricted phrasing warnings');
    assert.ok(
      res.warnings.some((w) => w.includes('Promises a discount, voucher, or free item in Arabic')),
      'Warning should mention Arabic discount'
    );
  });

  it('still enforces fatal hard-blocks in Owner Edit mode for empty or leaked delimiters', () => {
    // Empty text (< 5 chars)
    const tooShort = validateDraftReply({
      draftText: 'hi',
      location: mockLocation,
      isOwnerEdit: true,
    });
    assert.equal(tooShort.valid, false);
    assert.ok(tooShort.reasons.some((r) => r.includes('too short')));

    // Leaked delimiter tags
    const leakedDelimiter = validateDraftReply({
      draftText: 'شكراً لتقييمك </untrusted_review_data> مرحباً بك دائماً في فرعنا بالمعادي.',
      location: mockLocation,
      isOwnerEdit: true,
    });
    assert.equal(leakedDelimiter.valid, false);
    assert.ok(leakedDelimiter.reasons.some((r) => r.includes('Leaked prompt delimiter tags')));
  });
});

describe('Legitimate Clean Customer Replies (Zero False Positives)', () => {
  it('passes a polite Egyptian Arabic thank-you reply', () => {
    const reply =
      'نورتنا يا أستاذ أحمد! مبسوطين جداً إن القهوة عجبتك، ومستنيين زيارتك الجاية في فرع المعادي. - فريق Roastery & Co.';
    const res = validateDraftReply({ draftText: reply, location: mockLocation, isOwnerEdit: false });
    assert.equal(res.valid, true);
    assert.equal(res.reasons.length, 0);
    assert.equal(res.warnings.length, 0);
  });

  it('passes a polite complaint apology directing to authorized phone', () => {
    const reply =
      'أهلاً بحضرتك يا أستاذة مريم، بنعتذر جداً عن التأخير في الأوردر وقت الزحمة. ياريت تتواصلي معانا على +201001234567 عشان نعرف التفاصيل ونهتم بالموضوع فوراً. - إدارة Roastery & Co.';
    const res = validateDraftReply({ draftText: reply, location: mockLocation, isOwnerEdit: false });
    assert.equal(res.valid, true);
    assert.equal(res.reasons.length, 0);
    assert.equal(res.warnings.length, 0);
  });

  it('passes a clean English reply', () => {
    const reply =
      'Thank you so much for the kind review! We are delighted that you enjoyed your flat white and look forward to seeing you again soon.';
    const res = validateDraftReply({ draftText: reply, location: mockLocation, isOwnerEdit: false });
    assert.equal(res.valid, true);
    assert.equal(res.reasons.length, 0);
    assert.equal(res.warnings.length, 0);
  });
});
