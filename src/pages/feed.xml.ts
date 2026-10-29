import type { APIRoute } from 'astro';
import { excerpt, getPosts, isoDate, smartify, titleText } from '../lib/posts';
import { site } from '../lib/site';

// Atom feed in the jekyll-feed format, so subscribers keep the same entry ids.
const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

export const GET: APIRoute = async () => {
  const posts = (await getPosts()).slice(0, 10);
  const author = `<author><name>${escape(site.author.name)}</name><email>${site.author.email}</email></author>`;

  const entries = posts.map((post) => {
    const url = site.url + post.url;
    const title = escape(titleText(post.data.title));
    const date = isoDate(post.date);
    const image = post.data.image && new URL(post.data.image, site.url).href;
    return [
      `<entry><title type="html">${title}</title>`,
      `<link href="${url}" rel="alternate" type="text/html" title="${title}" />`,
      `<published>${date}</published><updated>${date}</updated><id>${url}</id>`,
      `<content type="html" xml:base="${url}">${cdata(post.rendered?.html ?? '')}</content>`,
      author,
      post.data.tags.map((tag) => `<category term="${escape(tag)}" />`).join(''),
      `<summary type="html">${cdata(post.data.description || excerpt(post))}</summary>`,
      image
        ? `<media:thumbnail xmlns:media="http://search.yahoo.com/mrss/" url="${image}" /><media:content medium="image" url="${image}" xmlns:media="http://search.yahoo.com/mrss/" />`
        : '',
      '</entry>',
    ].join('');
  });

  const xml = [
    '<?xml version="1.0" encoding="utf-8"?><feed xmlns="http://www.w3.org/2005/Atom" >',
    `<link href="${site.url}/feed.xml" rel="self" type="application/atom+xml" />`,
    `<link href="${site.url}/" rel="alternate" type="text/html" />`,
    `<updated>${isoDate(new Date())}</updated><id>${site.url}/feed.xml</id>`,
    `<title type="html">${escape(smartify(site.title))}</title><subtitle>${escape(site.description)}</subtitle>`,
    author,
    ...entries,
    '</feed>',
  ].join('');

  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
