import { describe, it, expect } from 'vitest';
import { normalizeRecognitionLang } from '../voice-search';

describe('normalizeRecognitionLang', () => {
  it('keeps supported locales as-is', () => {
    expect(normalizeRecognitionLang('en-US')).toBe('en-US');
    expect(normalizeRecognitionLang('ur-PK')).toBe('ur-PK');
    expect(normalizeRecognitionLang('en-IN')).toBe('en-IN');
  });

  it('is case-insensitive for supported locales', () => {
    expect(normalizeRecognitionLang('EN-us')).toBe('en-US');
    expect(normalizeRecognitionLang('ur-pk')).toBe('ur-PK');
  });

  it('maps unsupported regional variants to a supported fallback', () => {
    // en-PK is a real navigator.language in Pakistan but Chrome's speech
    // engine does not recognize it — the old hardcoded pass-through failed.
    expect(normalizeRecognitionLang('en-PK')).toBe('en-US');
    expect(normalizeRecognitionLang('en-UG')).toBe('en-US');
  });

  it('maps a base language code to its curated default', () => {
    expect(normalizeRecognitionLang('ur')).toBe('ur-PK');
    expect(normalizeRecognitionLang('en')).toBe('en-US');
    expect(normalizeRecognitionLang('hi')).toBe('hi-IN');
  });

  it('falls back to the first supported variant when no curated default exists', () => {
    // Bengali has no curated default but does have a supported variant match.
    expect(normalizeRecognitionLang('bn-BD')).toBe('en-US');
  });

  it('defaults to en-US for empty or unknown inputs', () => {
    expect(normalizeRecognitionLang('')).toBe('en-US');
    expect(normalizeRecognitionLang('zz-ZZ')).toBe('en-US');
    expect(normalizeRecognitionLang()).toBe('en-US');
  });
});