import Anthropic from '@anthropic-ai/sdk';
import { BrandProfileRow, LocationRow, ReviewLanguage, ReviewRow } from '@/types/database';
import {
  getClaudeModel,
  PROMPT_VERSION,
  buildDrafterSystemPrompt,
  buildUserReviewPrompt,
} from '@/lib/ai/prompts/v1';

export interface GeneratedDraft {
  body: string;
  model: string;
  promptVersion: string;
}

function hasLiveAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key.startsWith('sk-ant-') && !key.includes('...'));
}

function isSuspiciousReviewerName(name: string | null): boolean {
  if (!name) return true;
  return /(system|tester|admin|ignore|bot|user|عميل)/i.test(name);
}

export async function generateReviewDraft(params: {
  businessName: string;
  location: LocationRow;
  brand: BrandProfileRow;
  review: ReviewRow;
  detectedLanguage: ReviewLanguage;
  isFlagged: boolean;
  retryFeedback?: string[];
}): Promise<GeneratedDraft> {
  const {
    businessName,
    location,
    brand,
    review,
    detectedLanguage,
    isFlagged,
    retryFeedback,
  } = params;

  const signature =
    location.signature_override || brand.signature || `فريق ${businessName}`;
  const cleanName = !isSuspiciousReviewerName(review.reviewer_name)
    ? review.reviewer_name!.split(' ')[0]
    : null;

  // 1. Fast, varied template for 4-5 star reviews with NO text
  if (detectedLanguage === 'none' && review.rating >= 4) {
    const body = cleanName
      ? `نورتنا يا ${cleanName}! شكراً جداً على تقييمك الجميل، ومستنيينك تنورنا تاني قريب. - ${signature}`
      : `نورتنا! شكراً جداً على تقييمك الجميل ودعمك لينا، ومستنيينك تنورنا تاني قريب. - ${signature}`;

    return {
      body,
      model: 'template-star-only',
      promptVersion: PROMPT_VERSION,
    };
  }

  // 2. Live Claude API call when ANTHROPIC_API_KEY is configured
  if (hasLiveAnthropicKey()) {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    let systemPrompt = buildDrafterSystemPrompt({
      businessName,
      location,
      brand,
      detectedLanguage,
      rating: review.rating,
      isFlagged,
    });

    if (retryFeedback && retryFeedback.length > 0) {
      systemPrompt += `\n\nCRITICAL CORRECTION: Your previous draft was rejected for: ${retryFeedback.join(
        '; '
      )}. Fix this immediately.`;
    }

    const response = await anthropic.messages.create({
      model: getClaudeModel(),
      max_tokens: 350,
      temperature: 0.4,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: buildUserReviewPrompt({
            rating: review.rating,
            reviewerName: review.reviewer_name,
            text: review.text,
          }),
        },
      ],
    });

    const body =
      response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';

    return {
      body,
      model: getClaudeModel(),
      promptVersion: PROMPT_VERSION,
    };
  }

  // 3. Deterministic simulator fallback (when testing locally before adding Anthropic credits)
  const phoneSuffix = location.contact_phone
    ? ` على رقم ${location.contact_phone}`
    : '';

  let simulatedBody: string;

  if (review.rating <= 3 || isFlagged) {
    if (detectedLanguage === 'en') {
      simulatedBody = `Thank you for sharing your feedback${
        cleanName ? `, ${cleanName}` : ''
      }. We sincerely apologize that your experience did not meet expectations. Please reach out to us directly${
        location.contact_phone ? ` at ${location.contact_phone}` : ''
      } so our management team can look into this right away. - ${signature}`;
    } else {
      simulatedBody = `أهلاً بحضرتك${
        cleanName ? ` يا ${cleanName}` : ''
      }، حقك علينا وبنعتذر جداً عن أي تقصير أو تأخير حصل معاك. ياريت تتواصل معانا مباشرة${phoneSuffix} عشان نعرف التفاصيل ونهتم بالموضوع فوراً. - ${signature}`;
    }
  } else {
    if (detectedLanguage === 'en') {
      simulatedBody = `Thank you so much${
        cleanName ? `, ${cleanName}` : ''
      }! We are thrilled you enjoyed your visit and look forward to welcoming you back soon. - ${signature}`;
    } else {
      simulatedBody = `نورتنا${
        cleanName ? ` يا ${cleanName}` : ''
      }! مبسوطين جداً إن القهوة والخدمة عجبوك، وكلامك الجميل ده بيسعد كل الفريق. مستنيينك تنورنا تاني قريب! - ${signature}`;
    }
  }

  return {
    body: simulatedBody,
    model: 'mock-claude-simulator',
    promptVersion: PROMPT_VERSION,
  };
}