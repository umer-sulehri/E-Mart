import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Absolute URLs reach three different audiences, and each one fails differently:
 *
 *  - search engines and social scrapers, via canonical/OG/sitemap/robots
 *  - users, via emailed links (password reset, receipts, wishlist shares)
 *  - the server itself, when a page fetches its own API
 *
 * The first two must always be the canonical public origin. This used to be
 * four independent `process.env.NEXT_PUBLIC_SITE_URL || '<literal>'` fallbacks
 * spread across nine files, and they had drifted to three different literals
 * (localhost, the `emart.pk` placeholder, and the live host). With
 * NEXT_PUBLIC_SITE_URL unset in production that shipped unusable absolute URLs.
 *
 * The third case legitimately reads the request Host and belongs to
 * `getSiteUrl()` in `@/lib/absolute-url`, which is asserted separately below.
 *
 * Note this only rejects *scheme-prefixed* occurrences: `emart.pk` is also the
 * support email domain and the sidebar's display domain, which are branding
 * copy and must stay editable.
 */
const PRODUCTION_ORIGIN = 'https://e-mart-sand-pi.vercel.app';

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      return entry === 'node_modules' || entry === '.next' ? [] : filesUnder(full);
    }
    return /\.tsx?$/.test(entry) ? [full] : [];
  });
}

/** Drops `//` and block-comment text so prose about the old pattern is not
 *  mistaken for code that still uses it. */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const sources = [
  ...filesUnder(join(process.cwd(), 'app')),
  ...filesUnder(join(process.cwd(), 'lib')).filter((f) => !f.includes('__tests__')),
  ...filesUnder(join(process.cwd(), 'components')),
].map((file) => {
  const raw = readFileSync(file, 'utf8');
  return { file, source: raw, code: stripComments(raw) };
});

function relative(file: string): string {
  return file.slice(process.cwd().length + 1);
}

describe('absolute site URL', () => {
  it('has no inline absolute-URL fallback outside the shared modules', () => {
    // A bare literal fallback is the bug this guards: it silently diverges from
    // the canonical origin the moment the real host changes.
    const offenders: string[] = [];

    for (const { file, code } of sources) {
      code.split(/\r?\n/).forEach((line, index) => {
        // Scheme-prefixed only. `emart.pk` also appears as support-email copy
        // and as the sidebar's display domain, and those are branding text
        // rather than absolute URLs.
        if (/https?:\/\/(localhost:\d+|emart\.pk)/.test(line) === false) return;
        offenders.push(`${relative(file)}:${index + 1}  ${line.trim()}`);
      });
    }

    expect(offenders).toEqual([]);
  });

  it('routes SEO and emailed URLs through the shared SITE_URL', () => {
    // Each of these emits a URL consumed by something other than this server.
    const mustUseShared: string[] = [
      'app/layout.tsx',
      'app/robots.ts',
      'app/sitemap.ts',
      'app/api/v1/wishlist/share/route.ts',
      'app/api/v1/payments/[id]/receipt/route.ts',
      'app/api/v1/auth/forgot-password/route.ts',
      'app/api/v1/auth/reset-password/route.ts',
    ];

    for (const path of mustUseShared) {
      const entry = sources.find((s) => relative(s.file).replace(/\\/g, '/') === path);
      expect(entry, `${path} not found`).toBeDefined();
      expect(entry!.code, `${path} must import SITE_URL`).toMatch(
        /import\s*\{[^}]*\bSITE_URL\b[^}]*\}\s*from\s*['"][@./]*lib\/seo['"]/
      );
    }
  });

  it('defines the canonical origin once, in lib/seo', () => {
    const seo = sources.find((s) => relative(s.file).replace(/\\/g, '/') === 'lib/seo.ts')!;
    expect(seo.code).toContain(PRODUCTION_ORIGIN);

    // Exactly one definition site: a second copy is how the drift started.
    const definitions = sources
      .filter((s) => /NEXT_PUBLIC_SITE_URL\s*\|\|\s*['"]https?:/.test(s.code))
      .map((s) => relative(s.file));
    expect(definitions).toEqual(['lib\\seo.ts']);
  });

  it('keeps the Host-header helper separate from the canonical origin', () => {
    const helper = sources.find((s) => relative(s.file) === join('lib', 'absolute-url.ts'))!;
    expect(helper.code).toContain('x-forwarded-host');
    // Same-origin self-fetch only; it must never be the SEO source of truth.
    expect(helper.code).toContain('SITE_URL');
  });
});