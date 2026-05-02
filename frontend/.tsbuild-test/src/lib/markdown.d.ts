/**
 * Pure helper exported for testing — sanitize raw markdown source string.
 * Strips all HTML tags that DOMPurify considers unsafe; markdown syntax is
 * preserved because DOMPurify only touches HTML.
 */
export declare function sanitizeMarkdownSource(input: string): string;
export interface MarkdownProps {
    source: string;
    className?: string;
}
export declare function Markdown({ source, className }: MarkdownProps): JSX.Element;
