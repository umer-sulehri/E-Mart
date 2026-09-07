import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitize-html';

describe('sanitizeHtml', () => {
  it('strips script tags and inline event handlers', () => {
    const html = '<p onclick="alert(1)">Hello <script>alert(2)</script><img src=x onerror=alert(3)></p>';
    const out = sanitizeHtml(html);
    expect(out).not.toContain('<script');
    expect(out).not.toContain('onclick');
    expect(out).not.toContain('onerror');
    expect(out).toContain('Hello');
  });

  it('removes javascript: URLs in anchors', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">link</a>');
    expect(out).not.toContain('javascript:');
    expect(out).toContain('link');
  });

  it('strips iframes, objects and embeds', () => {
    const out = sanitizeHtml('<iframe src="https://evil.com"></iframe><object data="x"></object><embed src="y">');
    expect(out).not.toContain('iframe');
    expect(out).not.toContain('object');
    expect(out).not.toContain('embed');
  });

  it('removes inline style attributes', () => {
    const out = sanitizeHtml('<p style="position:absolute">hi</p>');
    expect(out).not.toContain('style');
    expect(out).toContain('hi');
  });

  it('keeps safe rich-text formatting', () => {
    const html = '<h2>Title</h2><p><strong>Bold</strong> and <em>italic</em> with <a href="https://emart.pk">link</a></p><ul><li>one</li></ul>';
    const out = sanitizeHtml(html);
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<strong>Bold</strong>');
    expect(out).toContain('<em>italic</em>');
    expect(out).toContain('<li>one</li>');
    expect(out).toContain('https://emart.pk');
  });

  it('removes data attributes', () => {
    const out = sanitizeHtml('<p data-x="1">hi</p>');
    expect(out).not.toContain('data-x');
  });
});