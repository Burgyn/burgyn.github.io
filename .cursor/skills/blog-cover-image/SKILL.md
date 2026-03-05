---
name: blog-cover-image
description: Generate consistent 1920x1080 cover images for Burgyn blog posts and update post frontmatter image paths. Use when creating a new article with blog-post-creator or when the user asks to create a cover image for a specific post.
---

# Blog Cover Image

## Overview

Create a blog cover image that keeps the visual identity of the blog while
reflecting the specific article topic. Save the image to `assets/images/` and
update the post frontmatter `image` and `thumbnail`.

## Visual Identity

Use the base style from
[`/assets/images/blog-post-base-cover.png`](/assets/images/blog-post-base-cover.png):

- 1920x1080 canvas
- dark charcoal/slate-blue background
- left side: geometric/origami/low-poly topic illustration
- right side: short code snippet or technical phrase in monospace style
- bottom-right: rounded author badge with "Mino Martiniak" and ".NET Insights"

Keep the style consistent across posts, but change topic-specific visuals and
text.

## Workflow

1. Read the target post in `_drafts/` or `_posts/` and extract:
   - title
   - tags
   - description
   - main article theme
2. Derive:
   - `TOPIC_VISUAL` (one short phrase for the left-side illustration)
   - `CODE_HINT` (2-3 line snippet/phrase for the right side)
3. Build a prompt from the template below and improve wording for clarity.
4. Generate the image using `GenerateImage`:
   - `filename`: `<post-slug>-cover.png`
   - `reference_image_paths`: include
     `assets/images/blog-post-base-cover.png`
5. Ensure the generated file is saved in `assets/images/`.
6. Update the article frontmatter:
   - `image: "/assets/images/<post-slug>-cover.png"`
   - `thumbnail: "/assets/images/<post-slug>-cover.png"`

## Prompt Template

Use this as a base and tailor it to the post topic:

```text
A wide 1920x1080 blog cover image with a dark charcoal-blue background.

Left half: a geometric, low-poly, origami-style illustration representing:
[TOPIC_VISUAL].

Right half: a short technical code snippet or phrase in a clean monospace look
that represents:
[CODE_HINT].

Bottom-right corner: a small rounded author badge with text "Mino Martiniak"
and subtitle ".NET Insights".

Style: modern developer blog cover, clean composition, muted palette, subtle
accents, consistent with the provided reference image. Avoid neon colors and
avoid clutter.
```

## Naming Convention

- Use article slug for the filename:
  - post: `_posts/2026-03-04-mmlib-dummyapi.md`
  - image: `assets/images/mmlib-dummyapi-cover.png`

## Triggers

Use this skill when:

- the user explicitly asks for a cover image for an article
- `blog-post-creator` flow is used and the user confirms cover generation
