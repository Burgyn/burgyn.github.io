# Markdown Lint Rules

Follow [markdownlint](https://github.com/DavidAnson/markdownlint/tree/v0.40.0/doc) rules when writing or editing blog posts.

## Rules to Apply

| Rule | Description |
|------|-------------|
| MD001 | Heading levels should only increment by one level at a time (e.g. H2 then H3, not H2 then H4). |
| MD003 | Use consistent heading style (ATX: `## Heading`). |
| MD009 | No trailing spaces at end of line. |
| MD012 | No multiple consecutive blank lines (at most one blank line). |
| MD013 | Line length: avoid very long lines; code blocks and URLs may exceed. |
| MD022 | Headings should be surrounded by blank lines (one above, one below). |
| MD023 | Headings must start at the beginning of the line (no leading spaces). |
| MD031 | Fenced code blocks should be surrounded by blank lines. |
| MD032 | Lists should be surrounded by blank lines. |
| MD033 | No inline HTML (except when necessary for the theme). |
| MD047 | Files should end with a single newline character. |

## Quick Checks

- One blank line before and after each heading.
- One blank line before and after each fenced code block (triple backticks).
- One blank line before and after lists.
- No trailing spaces; file ends with exactly one newline.
- No H1 in body (post title is in frontmatter); start sections with H2.
