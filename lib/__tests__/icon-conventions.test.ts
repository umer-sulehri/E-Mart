import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Guards the icon convention documented in docs/DESIGN_SYSTEM.md: icons are
 * sized with `size-*`, never an `h-* w-*` pair.
 *
 * Lucide renders a square SVG, so a pair is two declarations that must agree.
 * Editing one axis yields a stretched glyph at runtime rather than a compile
 * error, which is why it is worth enforcing in a test instead of by review.
 */
describe('icon conventions', () => {
  function tsxFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) return tsxFiles(full);
      return entry.endsWith('.tsx') ? [full] : [];
    });
  }

  const files = [
    ...tsxFiles(join(process.cwd(), 'app')),
    ...tsxFiles(join(process.cwd(), 'components')),
  ];

  function relative(file: string): string {
    return file.slice(process.cwd().length + 1);
  }

  function lucideNames(source: string): Set<string> {
    const names = new Set<string>();
    for (const match of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/g)) {
      for (const raw of match[1].split(',')) {
        const local = raw.trim().split(/\s+as\s+/).pop()?.trim();
        if (local) names.add(local);
      }
    }
    return names;
  }

  // Each self-closing element is matched on its own so a line carrying two
  // icons (`cond ? <EyeOff /> : <Eye />`) reports both. Dotted names cover icon
  // components held in data arrays and rendered as `<link.icon />`.
  const TAG = /<([A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9]*)?)((?:[^<>'"]|'[^']*'|"[^"]*")*?)\/>/g;

  function isIcon(name: string, names: Set<string>): boolean {
    // `.icon` is the repo convention for an icon component stored in a config
    // object, so the import set cannot resolve it.
    return names.has(name) || name.endsWith('.icon');
  }

  it('finds the components under audit', () => {
    // Guards the assertion below from passing vacuously if the walk breaks.
    expect(files.length).toBeGreaterThan(80);
  });

  it('sizes icons with size-* rather than an h-* w-* pair', () => {
    const offenders: string[] = [];
    let iconsSeen = 0;

    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      const names = lucideNames(source);
      if (names.size === 0) continue;

      for (const match of source.matchAll(TAG)) {
        if (!isIcon(match[1], names)) continue;
        iconsSeen++;

        const className = /className=["']([^"']*)["']/.exec(match[2])?.[1];
        if (!className) continue;

        const classes = className.split(/\s+/);
        const heights = classes.filter((c) => /^h-[\d.]+$/.test(c));
        const widths = classes.filter((c) => /^w-[\d.]+$/.test(c));
        if (heights.length !== 1 || widths.length !== 1) continue;

        const line = source.slice(0, match.index).split('\n').length;
        offenders.push(
          `${relative(file)}:${line}  <${match[1]}> ${heights[0]} ${widths[0]}`
        );
      }
    }

    // Also guards against a regex change that silently matches nothing.
    expect(iconsSeen).toBeGreaterThan(400);
    expect(offenders).toEqual([]);
  });
});