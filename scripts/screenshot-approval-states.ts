/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Playwright screenshot script for /approve/[token] states:
 *   normal, careful-review, editing, success, skipped, used-link, invalid-link
 *
 * Usage:
 *   1. Start dev server: npm run dev
 *   2. Run script:       npx tsx scripts/screenshot-approval-states.ts
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
const OUT_DIR = path.resolve(process.cwd(), 'docs', 'screenshots', 'approval');

const STATES: Array<{ name: string; slug: string }> = [
  { name: 'normal', slug: 'preview-normal' },
  { name: 'careful-review', slug: 'preview-careful' },
  { name: 'editing', slug: 'preview-editing' },
  { name: 'success', slug: 'preview-success' },
  { name: 'skipped', slug: 'preview-skipped' },
  { name: 'used-link', slug: 'preview-used' },
  { name: 'invalid-link', slug: 'preview-invalid' },
];

async function loadPlaywright(): Promise<any | null> {
  const candidates = ['playwright', '@playwright/test', 'playwright-core'];
  for (const mod of candidates) {
    try {
      const imported = await import(mod);
      if (imported?.chromium) {
        return imported;
      }
    } catch {
      // Try next candidate
    }
  }
  return null;
}

async function main() {
  const pw = await loadPlaywright();
  if (!pw) {
    console.log(
      '[screenshot-approval-states] Playwright is not installed in this environment.\n' +
        'To capture screenshots, install Playwright and run again:\n' +
        '  npm i -D playwright && npx playwright install chromium\n' +
        '  npx tsx scripts/screenshot-approval-states.ts'
    );
    process.exit(0);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();

  try {
    for (const state of STATES) {
      const url = `${BASE_URL}/approve/${state.slug}`;
      console.log(`Capturing [${state.name}] -> ${url}`);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      const filePath = path.join(OUT_DIR, `${state.name}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      console.log(`  Saved: ${filePath}`);
    }
  } finally {
    await browser.close();
  }

  console.log(`Done! All ${STATES.length} state screenshots saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error('[screenshot-approval-states] Failed:', err?.message || err);
  process.exit(1);
});
