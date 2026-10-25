/**
 * Next.js Instrumentation hook executed once on server startup.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logModelStartup } = await import('@/lib/ai/config');
    logModelStartup();
  }
}
