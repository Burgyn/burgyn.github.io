import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeJekyllCompat from './src/markdown/rehype-jekyll-compat.mjs';
import rougeTheme from './src/markdown/rouge-theme.mjs';

export default defineConfig({
  site: 'https://blog.burgyn.online',
  // Post URLs are /2024/01/29/slug served from slug.html, like the Jekyll site.
  build: { format: 'preserve' },
  trailingSlash: 'ignore',
  // Keep whitespace between inline elements (footer icons, post meta) as the Jekyll templates had it.
  compressHTML: false,
  markdown: {
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid'] },
    shikiConfig: {
      theme: rougeTheme,
      langAlias: { pwsh: 'powershell', yml: 'yaml', jsonc: 'json', plaintext: 'text' },
    },
    processor: unified({
      // kramdown: -- en dash, --- em dash
      smartypants: { dashes: 'oldschool' },
      rehypePlugins: [rehypeJekyllCompat],
    }),
  },
});
