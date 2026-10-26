import { z } from 'zod';

const HEX_64_REGEX = /^[0-9a-fA-F]{64}$/;

export const productionEnvSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),
    APP_URL: z.string().url('APP_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z
      .string()
      .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY must not be empty'),
    SUPABASE_SERVICE_ROLE_KEY: z
      .string()
      .min(1, 'SUPABASE_SERVICE_ROLE_KEY must not be empty'),
    TOKEN_ENCRYPTION_KEY: z
      .string()
      .regex(HEX_64_REGEX, 'TOKEN_ENCRYPTION_KEY must be exactly 64 hexadecimal characters'),
    CRON_SECRET: z.string().min(1, 'CRON_SECRET must not be empty'),
    GOOGLE_API_MODE: z.string().optional(),
    GOOGLE_MODE: z.string().optional(),
    ALLOW_MOCK_IN_PRODUCTION: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const isMock = data.GOOGLE_API_MODE === 'mock' || data.GOOGLE_MODE === 'mock';
    const allowMock = data.ALLOW_MOCK_IN_PRODUCTION === 'true';

    if (isMock && !allowMock) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['GOOGLE_API_MODE'],
        message:
          'GOOGLE_API_MODE=mock is not allowed in production unless ALLOW_MOCK_IN_PRODUCTION=true is explicitly set',
      });
    }
  });

export const developmentEnvSchema = z.object({
  NODE_ENV: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  APP_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  TOKEN_ENCRYPTION_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  GOOGLE_API_MODE: z.string().optional(),
  ALLOW_MOCK_IN_PRODUCTION: z.string().optional(),
});

/**
 * Validates environment variables.
 * In production, throws an Error listing missing/invalid variable names
 * without ever exposing or printing their values.
 */
export function validateEnv(
  env: Record<string, string | undefined> = process.env
): { valid: boolean; errors: string[] } {
  const isProduction = env.NODE_ENV === 'production';
  const schema = isProduction ? productionEnvSchema : developmentEnvSchema;
  const result = schema.safeParse(env);

  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      const field = issue.path.join('.') || 'unknown';
      return `${field}: ${issue.message}`;
    });

    const errorMsg = `[Radd Environment Error] Configuration validation failed in production:\n  - ${errors.join('\n  - ')}`;

    if (isProduction) {
      throw new Error(errorMsg);
    }

    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}
