import type { APIRoute } from 'astro';
import { site } from '../lib/site';

export const GET: APIRoute = () =>
  new Response(`User-agent: *\nDisallow:\nAllow: /assets/images/\nSitemap: ${site.url}/sitemap.xml`);
