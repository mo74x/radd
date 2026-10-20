import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ReviewFlag, ReviewLanguage } from '@/types/database';
import {
  CLASSIFIER_SYSTEM_PROMPT,
  DEFAULT_CLAUDE_MODEL,
  buildUserReviewPrompt,
} from '@/lib/ai/prompts/v1';

export interface ClassificationResult {
  language: ReviewLanguage;
  topic: string;
  flags: ReviewFlag[];
  requiresCarefulReview: boolean;
}

const ClassificationSchema = z.object({
  language: z.enum(['ar', 'en', 'mixed', 'none']),
  topic: z.string().default('general feedback'),
  flags: z
    .array(z.enum(['refund', 'legal', 'medical', 'threat', 'abuse', 'injection_suspected']))
    .default([]),
  requires_careful_review: z.boolean().default(false),
});

// Deterministic pre-screening patterns
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /system\s+(prompt|command|override)/i,
  /you\s+are\s+now/i,
  /voucher\s+code/i,
  /<\/?untrusted_review_data>/i,
  /تجاهل\s+(كل\s+)?(التعليمات|الأوامر|الاوامر)/,
  /كود\s+خصم/,
];

const REFUND_PATTERNS = [
  /\b(refund|money\s+back|compensation|reimburse|free\s+voucher|cash\s*back|double\s+charge)\b/i,
  /(استرجاع|فلوس|تعويض|خصم\s+مجان|رد\s+المبلغ|رجعولي|مرجعتش)/,
  /\b(hatraga3|hatraga3o|neraga3lek|raga3o|flous|floos)\b/i,
];

const LEGAL_PATTERNS = [
  /\b(lawyer|lawsuit|sue|police|fraud|scam|court)\b/i,
  /(حماية\s+المستهلك|محامي|محضر|الشرطة|نصب|نصاب|سرق|حرامية|قضية|النيابة|الرقابة)/,
  /\b(ma7dar|2esm)\b/i,
];

const MEDICAL_PATTERNS = [
  /\b(food\s+poisoning|hospital|allergic|allergy|vomit|sick|emergency\s+room)\b/i,
  /(تسمم|مستشفى|تعبنا|حساسية|تعبت|مغص|إسهال|اسهال)/,
];

const THREAT_PATTERNS = [
  /\b(threat|extortion|blackmail|destroy\s+your\s+reputation)\b/i,
  /(هفضحكم|هقفلكم|هعملكم\s+فضيحة)/,
];

// Franco-Arabic (Arabizi) markers: Latin text containing Arabizi numeral substitutions
// (e.g., to7fa, 5ateer, m3lesh, 2ahwa, 7elw, et2akhar) or common Franco Egyptian words.
const FRANCO_ARABIC_PATTERNS = [
  /\b(mesh|msh|mkan|feen|keda|delwa2ty|gdn|gamed|gamda|to7fa|zft|2ahwa|ahwa|kwayes|tamam|shokran|7elw|7elwa|awl|7aga|3la|3ashan|3shan|m3lesh|ma3lesh|fabor|bbalash|bbash|akeed|so5n|5ateer|tegnen|henak|leeko|shabab|hanigi|tany|talabt|mafehosh|mayenfa3sh|batee2|awy|shaghal|ma3rafnash|foroo3|khasm|5asm)\b/i,
  /\b[a-zA-Z]+[23578][a-zA-Z0-9]*\b|\b[a-zA-Z0-9]*[23578][a-zA-Z]+\b/,
];

export function isFrancoArabic(text: string): boolean {
  return FRANCO_ARABIC_PATTERNS.some((rx) => rx.test(text));
}

export function detectLanguageHeuristic(text: string | null): ReviewLanguage {
  if (!text || !text.trim()) return 'none';
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);
  if (hasArabic && hasLatin) return 'mixed';
  if (hasArabic) return 'ar';
  if (hasLatin && isFrancoArabic(text)) return 'mixed';
  return 'en';
}

function runDeterministicPreScreen(text: string | null): ReviewFlag[] {
  if (!text) return [];
  const flags = new Set<ReviewFlag>();

  if (INJECTION_PATTERNS.some((rx) => rx.test(text))) flags.add('injection_suspected');
  if (REFUND_PATTERNS.some((rx) => rx.test(text))) flags.add('refund');
  if (LEGAL_PATTERNS.some((rx) => rx.test(text))) flags.add('legal');
  if (MEDICAL_PATTERNS.some((rx) => rx.test(text))) flags.add('medical');
  if (THREAT_PATTERNS.some((rx) => rx.test(text))) flags.add('threat');

  return Array.from(flags);
}

function hasLiveAnthropicKey(): boolean {
  const key = process.env.ANTHROPIC_API_KEY;
  return Boolean(key && key.startsWith('sk-ant-') && !key.includes('...'));
}

export async function classifyReview(params: {
  rating: number;
  reviewerName: string | null;
  text: string | null;
}): Promise<ClassificationResult> {
  const { rating, reviewerName, text } = params;

  // Fast path for star-only reviews (no text)
  if (!text || !text.trim()) {
    return {
      language: 'none',
      topic: 'star-only rating',
      flags: [],
      requiresCarefulReview: rating <= 3,
    };
  }

  const heuristicFlags = runDeterministicPreScreen(text);
  const heuristicLang = detectLanguageHeuristic(text);

  // If no live Anthropic API key is configured yet, use deterministic classification
  if (!hasLiveAnthropicKey()) {
    return {
      language: heuristicLang,
      topic: rating >= 4 ? 'positive experience' : 'service complaint',
      flags: heuristicFlags,
      requiresCarefulReview: rating <= 3 || heuristicFlags.length > 0,
    };
  }

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await anthropic.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 256,
      temperature: 0,
      system: CLASSIFIER_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildUserReviewPrompt({ rating, reviewerName, text }),
        },
      ],
    });

    const rawText =
      response.content[0]?.type === 'text' ? response.content[0].text.trim() : '{}';
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsed = ClassificationSchema.safeParse(
      JSON.parse(jsonMatch ? jsonMatch[0] : rawText)
    );

    if (parsed.success) {
      const mergedFlags = Array.from(new Set([...heuristicFlags, ...parsed.data.flags]));
      return {
        language: parsed.data.language === 'none' ? heuristicLang : parsed.data.language,
        topic: parsed.data.topic,
        flags: mergedFlags,
        requiresCarefulReview:
          rating <= 3 || mergedFlags.length > 0 || parsed.data.requires_careful_review,
      };
    }
  } catch (err) {
    console.warn('[Classifier Fallback]: Claude classification failed, using heuristics:', err);
  }

  return {
    language: heuristicLang,
    topic: rating >= 4 ? 'positive feedback' : 'customer issue',
    flags: heuristicFlags,
    requiresCarefulReview: rating <= 3 || heuristicFlags.length > 0,
  };
}