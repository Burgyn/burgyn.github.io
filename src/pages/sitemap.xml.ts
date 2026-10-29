import type { APIRoute } from 'astro';
import { getPosts, isoDate } from '../lib/posts';
import { paginate } from '../lib/pagination';
import { site } from '../lib/site';

export const GET: APIRoute = async () => {
  const posts = await getPosts();
  const { pages } = paginate(posts, 1);
  const urls = [
    ...[...posts].reverse().map((post) => ({ loc: post.url, lastmod: isoDate(post.date) })),
    { loc: '/about/' },
    { loc: '/' },
    ...Array.from({ length: pages - 1 }, (_, i) => ({ loc: `/page${i + 2}/` })),
    { loc: '/assets/values.html' },
  ];

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map(({ loc, lastmod }) => `<url>\n<loc>${encodeURI(site.url + loc)}</loc>\n${lastmod ? `<lastmod>${lastmod}</lastmod>\n` : ''}</url>`),
    '</urlset>',
  ].join('\n');

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
