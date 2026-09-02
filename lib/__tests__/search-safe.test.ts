import { describe, it, expect } from 'vitest';
import {
  escapeLikeWildcards,
  sanitizeSearchTerm,
  safeSearchPattern,
  safeOrTerm,
} from '../search-safe';

describe('escapeLikeWildcards', () => {
  it('escapes percent wildcards', () => {
    expect(escapeLikeWildcards('100%')).toBe('100\\%');
  });

  it('escapes underscore wildcards', () => {
    expect(escapeLikeWildcards('a_b')).toBe('a\\_b');
  });

  it('escapes backslash first', () => {
    expect(escapeLikeWildcards('a\\b')).toBe('a\\\\b');
  });

  it('leaves plain text untouched', () => {
    expect(escapeLikeWildcards('organic coffee')).toBe('organic coffee');
  });
});

describe('safeSearchPattern', () => {
  it('wraps in percent wildcards', () => {
    expect(safeSearchPattern('apple')).toBe('%apple%');
  });

  it('escapes wildcards inside the term', () => {
    expect(safeSearchPattern('50% off')).toBe('%50\\% off%');
  });

  it('trims and caps length', () => {
    const long = 'x'.repeat(200);
    expect(safeSearchPattern(long).length).toBeLessThanOrEqual(102);
  });
});

describe('safeOrTerm', () => {
  it('escapes commas used to separate PostgREST or() filters', () => {
    expect(safeOrTerm('foo,bar')).toBe('foo\\,bar');
  });

  it('escapes parentheses', () => {
    expect(safeOrTerm('a(b)')).toBe('a\\(b\\)');
  });

  it('escapes LIKE wildcards', () => {
    expect(safeOrTerm('100%_')).toBe('100\\%\\_');
  });

  it('caps length', () => {
    const long = 'y'.repeat(200);
    expect(safeOrTerm(long).length).toBeLessThanOrEqual(80);
  });
});

describe('sanitizeSearchTerm', () => {
  it('trims whitespace', () => {
    expect(sanitizeSearchTerm('  hello  ')).toBe('hello');
  });

  it('caps length', () => {
    expect(sanitizeSearchTerm('z'.repeat(300)).length).toBe(100);
  });
});
