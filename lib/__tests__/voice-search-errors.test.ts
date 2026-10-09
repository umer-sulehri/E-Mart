import { describe, it, expect } from 'vitest';
import { getErrorText, getMicPermissionErrorCode } from '../voice-search';

/**
 * These strings are shown to a user whose microphone failed, in a situation
 * where they may have no way to work out what went wrong. Every code the
 * Web Speech API can report, plus the codes `diagnoseMicError` synthesises,
 * must resolve to a specific, actionable message rather than the generic
 * fallback.
 */
describe('getErrorText', () => {
  it('tells the user how to unblock a permission failure', () => {
    // Three distinct codes reach the same diagnosis, so all three must resolve.
    for (const code of ['not-allowed', 'service-not-allowed', 'permission-denied']) {
      expect(getErrorText(code)).toContain('Allow the microphone');
    }
  });

  it('distinguishes a site policy block from a user permission problem', () => {
    // A permissions-policy block is the site owner's misconfiguration. Telling
    // the user to change their browser settings would send them down the wrong
    // path entirely, so this message must name the administrator.
    const text = getErrorText('policy-blocked');
    expect(text).toContain('security policy');
    expect(text).toContain('administrator');
    expect(text).not.toContain('Allow the microphone');
  });

  it('reports a missing microphone for both audio failure codes', () => {
    for (const code of ['audio-capture', 'no-mic']) {
      expect(getErrorText(code)).toContain('No microphone found');
    }
  });

  it('explains that another application is holding the microphone', () => {
    expect(getErrorText('device-busy')).toContain('in use by another app');
  });

  it('distinguishes silence from a hardware failure', () => {
    // "No speech detected" must not be reported as a missing microphone, or the
    // user will go looking for hardware that is working fine.
    expect(getErrorText('no-speech')).toContain('No speech detected');
    expect(getErrorText('no-speech')).not.toContain('No microphone found');
  });

  it('reports a speech service network failure as a connectivity problem', () => {
    expect(getErrorText('network')).toContain('Check your connection');
  });

  it('handles an unsupported recognition language', () => {
    expect(getErrorText('language-not-supported')).toContain('not available in this language');
  });

  it('falls back to a generic message for an unknown code', () => {
    // An unrecognised code must still produce something safe to display rather
    // than leaking the raw code or rendering nothing.
    const text = getErrorText('some-future-error-code');
    expect(text).toBe('Voice recognition stopped unexpectedly. Please try again.');
  });

  it('treats a transient failure like the fallback', () => {
    expect(getErrorText('transient')).toBe(
      'Voice recognition stopped unexpectedly. Please try again.'
    );
  });

  it('never returns an empty message', () => {
    for (const code of [
      'not-allowed',
      'policy-blocked',
      'no-speech',
      'network',
      'audio-capture',
      'device-busy',
      'language-not-supported',
      'transient',
      '',
      'unknown',
    ]) {
      expect(getErrorText(code).length).toBeGreaterThan(0);
    }
  });

  it('gives distinct guidance for distinct failure modes', () => {
    // A generic message for everything is the failure mode this guards against:
    // the user cannot act on "something went wrong".
    const messages = new Set(
      [
        'not-allowed',
        'policy-blocked',
        'no-speech',
        'network',
        'audio-capture',
        'device-busy',
        'language-not-supported',
      ].map(getErrorText)
    );
    expect(messages.size).toBe(7);
  });
});

describe('getMicPermissionErrorCode', () => {
  it('maps the permission-related DOMException names to not-allowed', () => {
    for (const name of ['NotAllowedError', 'SecurityError', 'PermissionDeniedError']) {
      const err = new Error('denied');
      err.name = name;
      expect(getMicPermissionErrorCode(err)).toBe('not-allowed');
    }
  });

  it('treats any other error as a capture failure', () => {
    // A missing or busy device is not a permission problem, and must not be
    // reported as one or the user will hunt through browser settings.
    for (const name of ['NotFoundError', 'NotReadableError', 'AbortError']) {
      const err = new Error('nope');
      err.name = name;
      expect(getMicPermissionErrorCode(err)).toBe('audio-capture');
    }
  });

  it('handles a non-error value without throwing', () => {
    expect(getMicPermissionErrorCode(null)).toBe('audio-capture');
    expect(getMicPermissionErrorCode(undefined)).toBe('audio-capture');
    expect(getMicPermissionErrorCode('a string')).toBe('audio-capture');
  });
});
