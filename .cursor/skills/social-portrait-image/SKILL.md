---
name: social-portrait-image
description: Optional ffmpeg center-crop from an existing 1920x1080 blog cover to 1080x1350 for LinkedIn. Use only for quick drafts; prefer linkedin-portrait-cover-image when crop would remove important content.
---

# Social Portrait Image (Crop Fallback)

## Overview

Prefer **`linkedin-portrait-cover-image`** for LinkedIn/mobile portraits: it
**regenerates** art in a **native 1080×1350** vertical layout so code, illustration,
and badge stay readable.

This skill is a **fast fallback**: center-crop the existing
`assets/images/<post-slug>-cover.png` to 4:5. Use only when a quick asset is enough
and the landscape composition still works when trimmed left/right.

Do **not** replace blog `image` / `thumbnail` with this output.

## Specs

| Property     | Value              |
|--------------|--------------------|
| Dimensions   | **1080 × 1350** px |
| Aspect ratio | **4:5**            |

## Workflow (ffmpeg)

1. Confirm `assets/images/<post-slug>-cover.png` exists.
2. Run from repo root:

   ```bash
   ffmpeg -y -i "assets/images/<post-slug>-cover.png" \
     -vf "scale=-1:1350,crop=1080:1350:(iw-ow)/2:(ih-oh)/2" \
     -frames:v 1 "assets/images/<post-slug>-linkedin-portrait.png"
   ```

3. Verify **1080×1350** (`sips -g pixelWidth -g pixelHeight` on macOS).
4. Update `social_posts/*.md` YAML if needed (same keys as **linkedin-portrait-cover-image**).

## Naming

| Artifact      | Path pattern                                      |
|---------------|---------------------------------------------------|
| Source (blog) | `assets/images/<post-slug>-cover.png`             |
| Output        | `assets/images/<post-slug>-linkedin-portrait.png` |

## Triggers

- User explicitly wants a **quick crop** only, or composition is known-safe.

## Related

- **`linkedin-portrait-cover-image`** - primary path: **AI portrait layout**.
- **`blog-cover-image`** - landscape blog hero.
- **`social-post-creator`** - copy and YAML URLs.
