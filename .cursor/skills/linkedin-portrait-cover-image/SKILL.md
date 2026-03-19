---
name: linkedin-portrait-cover-image
description: Generate 1080x1350 (4:5) portrait cover images for LinkedIn/mobile using AI, matching blog-post-base-cover visual identity. Use when the user wants a native vertical layout (not a crop from 1920x1080). Prefer over ffmpeg crop when landscape composition would lose key content.
---

# LinkedIn Portrait Cover Image

## Overview

Create a **portrait** share image (**1080 × 1350**, 4:5) that keeps the same brand
as **`blog-cover-image`** (reference:
[`assets/images/blog-post-base-cover.png`](/assets/images/blog-post-base-cover.png))
but is **composed for vertical framing**. Cropping a 16:9 blog hero often removes
the code panel or illustration; this skill **regenerates** art so illustration,
snippet, and badge all fit.

Output: `assets/images/<post-slug>-linkedin-portrait.png`.  
Do **not** set blog post `image` / `thumbnail` to this file (those stay 1920×1080).
Optionally update `social_posts/<key>.md` YAML (`linkedin_portrait_image`, etc.).

This is a **layout sibling** of **`blog-cover-image`**: same topic extraction and
`TOPIC_VISUAL` / `CODE_HINT`, different canvas and prompt template.

## Visual Identity (Portrait Layout)

Match the base cover:

- Dark charcoal / slate-blue background
- **Geometric / low-poly / origami** topic illustration
- **Monospace** code or `.http`-style snippet (readable, not tiny)
- **Bottom area:** rounded author badge - "Mino Martiniak" and ".NET Insights"

**Vertical composition** (top → bottom):

1. **Upper ~45-55%** - topic illustration (full width of frame, balanced).
2. **Middle** - code snippet block (syntax-style colors like the reference: muted
   comment, green/yellow accents, no neon).
3. **Lower** - author badge; keep clear margin from bottom edge.

Avoid cramming: if the snippet is long, shorten `CODE_HINT` to 2-3 lines.

## Workflow

1. Read the target post in `_drafts/` or `_posts/` and extract:
   - title
   - tags
   - description
   - main article theme
2. Derive (same as **blog-cover-image**):
   - `TOPIC_VISUAL`
   - `CODE_HINT` (2-4 short lines; must stay legible in a **narrow** column)
3. Build a prompt from the template below.
4. Generate with **`GenerateImage`**:
   - `filename`: `<post-slug>-linkedin-portrait.png`
   - `reference_image_paths`: include `assets/images/blog-post-base-cover.png`
5. Save under `assets/images/` (move from tool output path if needed).
6. **Exact 1080 × 1350:** image models often return a **wide** bitmap (e.g. 1376×768)
   even when the **content** is stacked vertically. **Do not** stretch with
   `sips -z` - that warps the art. Instead **letterbox** to 4:5:
   - Scale to **width 1080**, keep aspect ratio.
   - **Pad** top/bottom to height **1350** with background **`#2C343F`** (matches
     the cover palette).

   ```bash
   ffmpeg -y -i "assets/images/<post-slug>-linkedin-portrait.png" \
     -vf "scale=1080:-1,pad=1080:1350:(ow-iw)/2:(oh-ih)/2:color=0x2C343F" \
     -frames:v 1 "assets/images/<post-slug>-linkedin-portrait.png"
   ```

   If the tool already outputs **1080 × 1350**, skip this step. Verify with
   `sips -g pixelWidth -g pixelHeight`.
7. If `social_posts/<social_post_key>.md` exists for the post, set:
   - `linkedin_portrait_image`: `https://blog.burgyn.online/assets/images/<slug>-linkedin-portrait.png`
   - `linkedin_portrait_image_size`: `1080x1350 (4:5, AI vertical layout + pad if needed)`

## Prompt Template

Tailor to the post; **require portrait dimensions** in the first sentence:

```text
A tall portrait image exactly 1080 pixels wide by 1350 pixels tall (4:5 aspect
ratio), dark charcoal-blue background, mobile-first LinkedIn graphic.

Vertical layout, top to bottom:
1) Upper half-ish: a geometric, low-poly, origami-style illustration representing:
[TOPIC_VISUAL].
2) Middle: a short technical code or .http-style snippet in clean monospace,
syntax-colored like a dark IDE (muted comment tone, subtle green and gold for
strings/keywords, no neon):
[CODE_HINT]
3) Bottom: a rounded author badge with "Mino Martiniak" and subtitle ".NET Insights".

Style: same family as the reference blog cover - modern developer aesthetic, muted
palette, clean vertical composition, nothing cropped awkwardly. Avoid cluttered
borders and avoid horizontal "wide banner" layout; this must read well on a phone.
```

## Naming Convention

- Post: `_posts/2026-03-18-teapie-real-world-api-testing.md`
- Portrait: `assets/images/teapie-real-world-api-testing-linkedin-portrait.png`

## Triggers

Use this skill when:

- The user wants a **LinkedIn portrait** / **vertical** / **mobile** cover and
  **cropping the blog cover** would hurt composition.
- The user asks for a **regenerated** or **native** portrait layout (not ffmpeg crop).

## Related

- **`blog-cover-image`** - landscape 1920×1080 blog hero (`*-cover.png`).
- **`social-portrait-image`** - optional **ffmpeg crop** from landscape; use only for
  quick drafts when center crop is acceptable.
- **`social-post-creator`** - post copy; reference portrait URL in YAML if present.
