---
name: social-post-creator
description: Create LinkedIn and Bluesky posts for blog articles. Use when the user wants to share a blog post on social media, or when the blog-post-creator skill delegates social post creation. Posts are authentic knowledge-sharing, not marketing. Can delegate closing image code to linkedin-closing-code skill.
---

# Social Post Creator

## Overview

Generate LinkedIn and Bluesky posts for a blog article. Write to `social_posts/<key>.md`, link the blog post via `social_post_key` in its frontmatter, and use the author's tone: genuine sharing of what he knows or thinks about, no marketing language.

## Workflow

1. Read the blog post content (from `_drafts/` or `_posts/`). Identify title, main message, and permalink (date + slug).
2. Choose a `social_post_key`: kebab-case slug matching the post (e.g. `minimal-api-validation`, `own-mediator`).
3. Generate LinkedIn and Bluesky post text following the guidelines below.
4. Create `social_posts/<social_post_key>.md` with the file format below. Use the real blog URL: `https://blog.burgyn.online/:year/:month/:day/:title`.
5. Update the blog post frontmatter: set `social_post_key: "<key>"`.
6. Ask the user: "Should I generate closing image code for the LinkedIn post?" If yes, use the **linkedin-closing-code** skill.

## Social Post File Format

Create files in the blog repo under `social_posts/`. Structure:

```markdown
---
key: <slug-matching-blog-post>
blog_post_title: "<Title of the blog post>"
blog_post_path: "<relative path to blog post file, e.g. _drafts/my-draft.md or _posts/2024-06-09-own-mediator.md>"
created_date: <YYYY-MM-DD>
---

## LinkedIn

<LinkedIn post content - plain text, no markdown headings in the post body>

## Bluesky

<Bluesky post content - plain text>
```

## LinkedIn Guidelines

- **Tone**: Genuine, honest knowledge-sharing. NOT marketing. The author shares what he knows or thinks about. No hype, no "you MUST read this", no promotional language.
- **Formatting**: LinkedIn does not support bold/italic. Use emojis as section markers (🚀, 🙏, 🛠️, ⚠️, etc.).
- **Structure**: Emoji + short section title on first line, then content. Use → for bullet/list items.
- **Hashtags**: At the end, space-separated: `#dotnet #minimalapi #aspnetcore` (relevant tech hashtags).
- **Length**: Medium, typically 500-1300 characters.
- **Link**: Include the actual blog post URL: `https://blog.burgyn.online/:year/:month/:day/:title` (Jekyll permalink).
- **Engagement**: Optional question or related link; keep it natural, no forced CTAs.
- **Language**: English.
- **Dashes**: Use a plain hyphen (`-`) in all post copy. Do not use em (`—`) or en (`–`) dashes; use ASCII `-` only.

## Bluesky Guidelines

- **Length**: Much shorter than LinkedIn - max 300 characters (platform limit).
- **Content**: One short context sentence + direct link to the blog post. Essentially "here's what I wrote about" with the URL.
- **URL**: Always include full URL: `https://blog.burgyn.online/:year/:month/:day/:title`.
- **Tone**: Casual, authentic. No marketing fluff.
- **Hashtags**: 1-2 if space permits (e.g. `#dotnet #aspnetcore`).

## Reference

Load [references/post-formats.md](references/post-formats.md) for concrete LinkedIn and Bluesky examples and anti-patterns (what not to write).

For **mobile-first portrait** share art (1080×1350), use **`linkedin-portrait-cover-image`** (AI vertical layout). Optional fast crop: **`social-portrait-image`**. YAML keys `linkedin_portrait_image` / `linkedin_portrait_image_size` in `social_posts/*.md` apply to the portrait asset path.
