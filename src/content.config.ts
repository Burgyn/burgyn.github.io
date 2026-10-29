import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const posts = defineCollection({
  loader: glob({
    // `npm run dev:drafts` also loads _drafts/
    pattern: process.env.BLOG_DRAFTS ? ['_posts/*.md', '_drafts/*.md'] : '_posts/*.md',
    generateId: ({ entry }) => entry.replace(/^_(posts|drafts)\//, '').replace(/\.md$/, ''),
  }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date().optional(),
    tags: z.array(z.string()).nullish().transform((tags) => tags ?? []),
    description: z.string().nullish(),
    keywords: z.array(z.string()).nullish(),
    image: z.string().nullish(),
    thumbnail: z.string().nullish(),
    carousel_images: z.array(z.object({ path: z.string(), alt: z.string().nullish() })).nullish(),
  }),
});

export const collections = { posts };
