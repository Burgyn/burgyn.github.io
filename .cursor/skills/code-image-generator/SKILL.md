---
name: code-image-generator
description: Generate styled code images for blog posts using carbon-now-cli. Use when the user asks for a code image, code screenshot, or to generate an image from a code snippet. Saves to assets/images/code_images/<post-slug>/.
---

# Code Image Generator

## Overview

Generate styled code images for the Burgyn blog using `carbon-now-cli`. Images use the built-in Material theme (bright syntax highlighting), background `#263238`, macOS window controls, no padding, no line numbers, no shadow.

## Workflow

1. **Identify post slug** from the currently open file in `_drafts/` or `_posts/`. Extract slug from filename (e.g. `2026-03-04-mmlib-dummyapi.md` → `mmlib-dummyapi`). If no post is open, use `general` as slug.
2. **Create output directory**: `assets/images/code_images/<slug>/`
3. **Write the code snippet** to a temp file with the correct extension for language detection (`.cs` for C#, `.js` for JavaScript, `.json` for JSON, `.bash` for shell, etc.)
4. **Run the script**:

   ```bash
   .cursor/skills/code-image-generator/scripts/generate.sh <temp_code_file> <output_dir> <output_name>
   ```

5. **Return the image path** for the user to insert in the article, e.g. `/assets/images/code_images/mmlib-dummyapi/1.png`

## Script Usage

```bash
scripts/generate.sh <code_file> <output_dir> <output_name>
```

- `code_file`: Path to temp file with code. Use correct extension (`.cs`, `.js`, `.json`, etc.) for syntax highlighting.
- `output_dir`: Full path to `assets/images/code_images/<slug>/` (relative to repo root or absolute).
- `output_name`: Filename without `.png` (e.g. `1`, `validation-example`).

The script uses `npx carbon-now-cli`; no global install required.

## Config

Preset `burgyn-blog` in [carbon-now.json](carbon-now.json): Material theme, background `#263238`, JetBrains Mono, macOS window controls (no title text), no line numbers, no shadow, no watermark, zero padding.

## Naming Convention

- Directory: `assets/images/code_images/<post-slug>/`
- Files: `1.png`, `2.png`, or descriptive names like `validation-example.png`
