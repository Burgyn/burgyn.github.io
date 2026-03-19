---
name: jekyll-liquid-markdown
description: >
  Explains that this site is Jekyll and that Liquid processes Markdown
  before HTML; curly-brace and percent-brace sequences must be wrapped in raw
  blocks when they should appear literally. Use when editing _posts, _drafts,
  pages, layouts, includes, or any file Jekyll renders, especially when
  showing Angular, Vue, Handlebars, Mustache, Liquid itself, or JSON with
  braces.
---

# Jekyll and Liquid in Markdown

## What processes what

- **Jekyll** - Static site generator: reads `_posts/`, `_drafts/`, pages,
  layouts, includes, `assets`, `_config.yml`.
- **Liquid** - Template engine Jekyll runs **before** the page is final HTML.
  It interprets `{{ … }}` (output) and `{% … %}` (logic/tags) in the **source**
  of each rendered file.
- **Markdown** - Converted after Liquid runs on the file (order matters:
  Liquid first, then Markdown in typical page flow).

So: the `.md` files are **not** plain Markdown only - they are **Liquid +
Markdown** unless the layout pipeline differs for a specific collection
(still assume Liquid runs on post/page bodies).

## Punctuation in prose

When editing Jekyll content for this site (`_posts`, `_drafts`, pages): use a
normal hyphen `-` for asides and breaks (often with spaces: `like - this`).
Do **not** use the em dash character `—` (U+2014).

## When to use `{% raw %}`

Wrap any stretch of text that must appear **verbatim** in the built site but
would otherwise be parsed as Liquid:

- Placeholders like `{{ variable }}`, `{{NewProductId}}`, `{{ user.name }}`
- JSON or pseudo-JSON with `{` / `}` in inline examples (if you also use
  `{{` inside, raw is required)
- Vue, Angular, Handlebars, Mustache, or Liquid **documentation** snippets
- Showing the characters `{%` or `%}` to readers

**Syntax:**

```liquid
{% raw %}{{NewProductId}}{% endraw %}
```

**Common mistake:** closing `{% endraw %}` too early or omitting closing braces.
The content between `raw` and `endraw` is copied literally - include the full
intended string (e.g. both `{{` and `}}`).

## Fenced code blocks

Inside a **fenced Markdown code block** (triple backticks), Jekyll/Liquid
often still processes Liquid **outside** the fence boundary; **inside** the
fence, behavior can still bite you if the highlighter or includes inject Liquid.
Rule of thumb:

- Prefer putting fragile template-like snippets **inside** a fenced block with
  an appropriate language tag.
- If the build still mangles `{{` / `{%` inside the block, wrap **that
  segment** with `{% raw %}` … `{% endraw %}` around the fence or split so the
  problematic lines sit in a raw block per Jekyll docs for your version.

If unsure after a local build, wrap the smallest span that breaks the build.

## Quick checklist

- [ ] Any literal `{{` … `}}` in prose or examples → `{% raw %}…{% endraw %}`
  (or safe code-fence + raw if needed).
- [ ] Any literal `{%` … `%}` shown to readers → same.
- [ ] After editing, run `bundle exec jekyll build` (or `serve`) and open the
  page if the topic is sensitive to Liquid.

## Relation to other project skills

- **blog-post-creator**: content and frontmatter; load this skill when examples
  include template syntax from other frameworks.
- **markdown-rules** (blog-post-creator reference): keep markdownlint
  compliance; raw tags are valid Liquid and should not break MD rules if
  fenced/surrounded by blank lines like other blocks.

## Additional resources

- Jekyll: [Liquid](https://jekyllrb.com/docs/liquid/)
- Escaping: [Raw](https://shopify.github.io/liquid/tags/raw/)
