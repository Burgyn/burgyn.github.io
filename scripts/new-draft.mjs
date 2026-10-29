// Creates _drafts/<name>.md with the default front matter (formerly `jekyll draft`).
import { existsSync, writeFileSync } from 'node:fs';

const name = process.argv.slice(2).join(' ').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
if (!name) {
  console.error('Usage: npm run draft -- <post-name>');
  process.exit(1);
}

const file = `_drafts/${name}.md`;
if (existsSync(file)) {
  console.error(`${file} already exists`);
  process.exit(1);
}

writeFileSync(file, `---
layout: post
title: ${name.replace(/-/g, ' ')}
tags: []
comments: true
description: ""
linkedin_post_text: ""
social_post_key: ""
date: 2055-02-18 18:00:00 +01:00
image: /assets/images/blog-post-base-cover.png
thumbnail: /assets/images/blog-post-base-cover.png
keywords:
  - NetArchTest .NET
---

`);
console.log(`Created ${file}`);
