import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import DOMPurify from 'dompurify';

/**
 * Markdown renderer for descriptions and Whispers.
 *
 * Two-layer defense:
 *  1. `rehype-sanitize` runs against the AST inside react-markdown — strips
 *     unknown tags, dangerous attributes, javascript: URIs.
 *  2. We additionally hard-pre-sanitize the source text with DOMPurify in
 *     case the markdown source itself contains raw HTML the parser would
 *     pass through (per spec we allow images and links, but never script
 *     or event-handlers).
 *
 * The hard requirement spelled out in helmsman.md is "DOMPurify on ALL
 * markdown" — calling DOMPurify.sanitize on the raw source before it ever
 * reaches the parser strips `<script>` and `<img onerror>` payloads even
 * in the worst case where rehype-sanitize had a regression.
 */

// rehype-sanitize allowlist: defaults + image, plus class names for code highlighting.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
    a: [
      ...(defaultSchema.attributes?.a ?? []),
      ['target', '_blank'],
      ['rel', 'noopener', 'noreferrer'],
    ],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      'src',
      'alt',
      'title',
      ['loading', 'lazy'],
    ],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), 'img'],
};

/**
 * Pure helper exported for testing — sanitize raw markdown source string.
 * Strips all HTML tags that DOMPurify considers unsafe; markdown syntax is
 * preserved because DOMPurify only touches HTML.
 */
export function sanitizeMarkdownSource(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [
      'a',
      'b',
      'blockquote',
      'br',
      'code',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'i',
      'img',
      'li',
      'ol',
      'p',
      'pre',
      'strong',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'rel', 'target', 'loading'],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover', 'onfocus', 'style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style'],
  });
}

export interface MarkdownProps {
  source: string;
  className?: string;
}

export function Markdown({ source, className }: MarkdownProps): JSX.Element {
  const safeSource = useMemo(() => sanitizeMarkdownSource(source), [source]);
  return (
    <div className={className ?? 'pc-md'}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema]]}
        components={{
          a: ({ node: _node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {safeSource}
      </ReactMarkdown>
    </div>
  );
}
