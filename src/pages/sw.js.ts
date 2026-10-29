import type { APIRoute } from 'astro';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import template from '../sw.js?raw';
import { getPosts } from '../lib/posts';

// The cache name changes only when content or styles change, so unchanged builds produce an identical sw.js.
export const GET: APIRoute = async () => {
  const hash = createHash('sha256');
  for (const post of await getPosts()) hash.update(post.id).update(post.body ?? '');
  for (const css of ['public/assets/css/main.css', 'public/assets/main.css']) hash.update(readFileSync(css));
  hash.update(template);
  const body = template.replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 12));
  return new Response(body, { headers: { 'Content-Type': 'text/javascript' } });
};
