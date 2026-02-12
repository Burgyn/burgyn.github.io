# Writing Style Reference

Detailed style guide for Burgyn blog posts. Load this when drafting or editing article content.

## Voice and Tone

- **First-person, informal, developer-to-developer.** Use "I", "we", "you". Conversational, like talking to a colleague.
- Assume the reader has a .NET/C# background. Use technical terms directly; explain only where it adds value.
- Sentences: mostly short and clear, with occasional longer ones for context.

## Article Structure

1. **Hook/intro** – Short. Often includes an early-exit note for experts.
2. **Main sections** – Conceptual explanation → code → explanation. Use `##` (H2) for main sections.
3. **Conclusion/summary** – Optional, short.
4. **Links** – Resources, documentation, sample projects. Demo repo link at the end when applicable.

## Headings

- Short, action-oriented. Often questions: "How to do it?", "How to start?", "Implementation", "Registration", "Usage".
- Use H2 (`##`) for main sections. Do not skip heading levels (no H1 in body; title is in frontmatter).

## Code Examples

- Compact C# snippets. Use inline pointer comments: `// 👇`, `// 👈` to highlight important lines.
- Always explain before and after the code block.
- Use realistic names (e.g. `DataProvider`, `ProductCreated`, `PeriodicBackgroundTask`).
- Link to demo repos when relevant.

**Example:**

```csharp
// 👇 throw - rethrow the original exception
throw;
```

## Reader Engagement

- Direct address with "you".
- Early-exit blockquotes for experts, e.g.:

  > 💁 If you know the difference between `throw` and `throw ex` you don't need to read any further, you won't learn anything new.

- Or: "Unless you know what **Boxing and UnBoxing** *(no UnBoxing is not fancy unboxing a new iPhone)* is, don't read this post."

## Length and Conciseness

- Typical: 500–1500 words. Concise, no padding.
- Technical posts: 800–1500 words. Tutorials and conceptual posts can be longer.

## Blockquotes

- Use for tips, notes, caveats. Not for long quoted text.
- Example: `> It's just a pure markup interface. We could do without it, but it's a good way to indicate that it's an event.`

## Parenthetical Asides

- Informal side notes in *(parentheses with italic)*.
- Example: "*(Is there support for VS, but I haven't tested it)*"

## Emojis

- Use sparingly: in blockquotes, inline comments. Not in headings or body text excessively.
- Common: 😃, 💁, ℹ️, ✅

## Links

- Official docs (Microsoft Learn, GitHub).
- Own demo repos (e.g. Burgyn/Sample.DeconstructorsForNonTuple).
- Related posts on the blog.
- Tools and libraries (Ocelot, MediatR, Hangfire).

## Series and Recurring Patterns

- Series branding: "Back to the basics", "Part 1", "Part 2".
- Recurring phrases: "It's simple.", "Let's start with...", "Let's declare...", "However, ..." for contrasts.
- Structural: "First we...", "Then...", "Finally...", "The following example shows..."

## Before/After Examples

**Weak intro (avoid):**

"Today we will learn about exception handling in C#."

**Strong intro (prefer):**

"This is another article in the 'Back to the basics' series. The first part covered [Boxing and UnBoxing](/2024/03/04/boxing-unboxing/), today we'll look at the difference between `throw` and `throw ex`."

**Weak code comment (avoid):**

`// This line throws the exception`

**Strong code comment (prefer):**

`// 👇 throw ex - create and throw new exception based on ex`

**Weak transition (avoid):**

"Now we will show the implementation."

**Strong transition (prefer):**

"Let's start with defining the message interface. In our case it was a domain event, hence the name."
