import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'> & { date: Date; url: string };

const FILENAME = /^(\d{2,4})-(\d{1,2})-(\d{1,2})-(.+)$/;

// Same URL as Jekyll's /:year/:month/:day/:title - date from front matter (UTC), title from file name.
// Drafts have no date in the file name; they are shown as published now.
function withUrl(entry: CollectionEntry<'posts'>): Post {
  const [, y, m, d, slug] = entry.id.match(FILENAME) ?? [, , , , entry.id];
  const date = y
    ? (entry.data.date ?? new Date(Date.UTC(Number(y), Number(m) - 1, Number(d))))
    : new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const url = `/${date.getUTCFullYear()}/${pad(date.getUTCMonth() + 1)}/${pad(date.getUTCDate())}/${slug.replace(/ /g, '-')}`;
  return Object.assign(entry, { date, url });
}

// Published posts, newest first. Future-dated posts appear once a scheduled build runs after their date
// (`npm run dev:drafts` shows them right away).
export async function getPosts(): Promise<Post[]> {
  const now = new Date();
  return (await getCollection('posts'))
    .map(withUrl)
    .filter((post) => process.env.BLOG_DRAFTS || post.date <= now)
    // Same order as Jekyll: by date, then by file path (byte order).
    .sort((a, b) => b.date.getTime() - a.date.getTime() || byteCompare(b.filePath!, a.filePath!));
}

function byteCompare(a: string, b: string): number {
  return Buffer.compare(Buffer.from(a), Buffer.from(b));
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: '\u00a0' };

// Plain text of rendered HTML; the result is escaped again when Astro outputs it.
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]*>/g, '')
    .replace(/&(#x[\da-f]+|#\d+|\w+);/gi, (match, code: string) =>
      code[0] !== '#' ? ENTITIES[code] ?? match
        : String.fromCodePoint(code[1] === 'x' || code[1] === 'X' ? parseInt(code.slice(2), 16) : Number(code.slice(1))));
}

// Liquid truncatewords
export function truncateWords(text: string, count: number): string {
  const words = text.split(/\s+/).filter(Boolean);
  return words.length <= count ? text : words.slice(0, count).join(' ') + '...';
}

// Jekyll excerpt: first block of the rendered post.
export function excerpt(post: Post): string {
  const html = (post.rendered?.html ?? '').trim();
  const first = html.match(/^<(\w+)[^>]*>[\s\S]*?<\/\1>/)?.[0] ?? html;
  return stripHtml(first).replace(/\s+/g, ' ').trim();
}

// long: "May 05, 2024" (Liquid %B %d, %Y), short: "May 5, 2024" (%b %-d, %Y)
export function formatDate(date: Date, style: 'long' | 'short'): string {
  return date.toLocaleDateString('en-US', { timeZone: 'UTC', month: style, day: style === 'long' ? '2-digit' : 'numeric', year: 'numeric' });
}

export function isoDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

// Titles may contain inline markdown (~~strike~~, `code`), rendered like kramdown's markdownify.
export function titleHtml(title: string): string {
  const escaped = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return smartify(escaped).replace(/~~(.+?)~~/g, '<del>$1</del>').replace(/`(.+?)`/g, '<code>$1</code>');
}

export function titleText(title: string): string {
  return smartify(title.replace(/~~(.+?)~~/g, '$1').replace(/`(.+?)`/g, '$1'));
}

// Straight quotes to typographic ones, as kramdown and jekyll-seo-tag render titles.
export function smartify(text: string): string {
  return text
    .replace(/(^|[\s(\[])"/g, '$1“')
    .replace(/"/g, '”')
    .replace(/(^|[\s(\[])'/g, '$1‘')
    .replace(/'/g, '’');
}
