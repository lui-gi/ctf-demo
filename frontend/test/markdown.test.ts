import { describe, expect, it } from 'vitest';
import { sanitizeMarkdownSource } from '@/lib/markdown';

describe('markdown sanitization', () => {
  it('strips <script> tags entirely', () => {
    const src = 'before <script>alert("pwn")</script> after';
    const safe = sanitizeMarkdownSource(src);
    expect(safe).not.toMatch(/<script/i);
    expect(safe).not.toContain('alert');
    expect(safe).toContain('before');
    expect(safe).toContain('after');
  });

  it('strips dangerous inline event handlers like onerror on <img>', () => {
    const src = '<img src=x onerror="alert(1)" alt="x">';
    const safe = sanitizeMarkdownSource(src);
    expect(safe).not.toMatch(/onerror/i);
    expect(safe).not.toMatch(/alert\(1\)/);
  });

  it('blocks javascript: URIs in links', () => {
    const src = '<a href="javascript:alert(1)">click</a>';
    const safe = sanitizeMarkdownSource(src);
    expect(safe).not.toMatch(/javascript:/i);
  });

  it('preserves ordinary markdown source content', () => {
    const src = '# Hello\n\nA paragraph with **bold** and a [link](https://example.com).';
    const safe = sanitizeMarkdownSource(src);
    expect(safe).toContain('# Hello');
    expect(safe).toContain('**bold**');
    expect(safe).toContain('https://example.com');
  });

  it('preserves safe images', () => {
    const src = '<img src="https://example.com/x.png" alt="ok">';
    const safe = sanitizeMarkdownSource(src);
    expect(safe).toMatch(/<img[^>]+src="https:\/\/example\.com\/x\.png"/);
  });

  it('strips iframe and embed tags', () => {
    const src = '<iframe src="evil"></iframe><embed src="evil2">';
    const safe = sanitizeMarkdownSource(src);
    expect(safe).not.toMatch(/<iframe/i);
    expect(safe).not.toMatch(/<embed/i);
  });
});
