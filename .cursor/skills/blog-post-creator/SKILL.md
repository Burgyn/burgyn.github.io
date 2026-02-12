---
name: blog-post-creator
description: Create English technical blog posts for the Jekyll blog. Use when the user wants to write a new article, blog post, or draft about programming or technology. Covers drafting, frontmatter, writing style, grammar, and markdown. Defers LinkedIn/Bluesky posts to the social-post-creator skill.
---

# Blog Post Creator

## Overview

Create and edit English technical blog posts for the Burgyn Jekyll blog. Drafts live in `_drafts/`; use the site's Jekyll draft command to create new posts. Match the author's writing style, fill correct frontmatter, and follow markdown lint rules. After a post is ready, offer to create LinkedIn and Bluesky posts via the social-post-creator skill.

## Workflow

1. Gather topic, key points, and target audience from the user.
2. Create a draft: run `bundle exec jekyll draft "<draft-name>"` in the blog repo root (e.g. `burgyn.github.io`). Use a kebab-case slug for the draft name (e.g. `minimal-api-validation`).
3. Open the generated file in `_drafts/` and write the body following the writing style. See [references/writing-style.md](references/writing-style.md) for details.
4. Fill in frontmatter: title, description (max 145 chars for SEO), tags (max 4), keywords, image/thumbnail (default `/assets/images/blog-post-base-cover.png` if none), and optionally `social_post_key` once a social post exists.
5. Proofread for English grammar and technical accuracy. Act as an expert in both.
6. Validate markdown against lint rules. See [references/markdown-rules.md](references/markdown-rules.md).
7. Ask the user: "Should I create LinkedIn and Bluesky posts for this article?" If yes, use the **social-post-creator** skill (do not write social posts in this skill).

## Frontmatter Template

Use this structure. Existing Jekyll compose defaults are in the blog's `_config.yml`; align with them.

```yaml
---
layout: post
title: <Title>
tags: [max 4, e.g. csharp, dotnet, unit tests, architecture, AZURE, asp.net core, multi-tenant, caching, news, tools, or library name]
comments: true
description: "<max 145 chars SEO description>"
linkedin_post_text: ""
social_post_key: "<slug matching the social_posts filename, if social post exists>"
date: <set when moving to _posts; leave as default in draft>
image: /assets/images/blog-post-base-cover.png
thumbnail: /assets/images/blog-post-base-cover.png
keywords:
- <keyword 1>
- <keyword 2>
---
```

The `social_post_key` links the post to `social_posts/<key>.md` when social posts are created by the social-post-creator skill.

## Writing Style (Summary)

- **Voice**: First-person, informal, developer-to-developer. Conversational.
- **Structure**: Intro (optional early-exit for experts) → sections (H2) → conclusion → Links.
- **Code**: Compact snippets, `// 👇` / `// 👈` pointers, explain before and after.
- **Length**: 500–1500 words typical. Concise.
- **Blockquotes**: Tips, notes, caveats. Parenthetical asides in *(italic)*.
- **Links**: Official docs, own repos, related posts. Demo repo at end when relevant.

Load [references/writing-style.md](references/writing-style.md) for the full style guide and examples.

## English Grammar and Technical Accuracy

Act as an expert in English grammar and technical writing. Proofread for correct grammar, natural phrasing, and accurate technical content. The blog targets developers; keep explanations clear and precise.

## Markdown Lint

Follow the rules in [references/markdown-rules.md](references/markdown-rules.md). Ensure headings are surrounded by blank lines, code blocks are fenced and surrounded by blank lines, no trailing spaces, and the file ends with a single newline.

## References

- **Writing style**: [references/writing-style.md](references/writing-style.md) – load when drafting or editing body content.
- **Markdown rules**: [references/markdown-rules.md](references/markdown-rules.md) – load when checking or fixing markdown.
