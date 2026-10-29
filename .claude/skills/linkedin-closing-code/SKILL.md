---
name: linkedin-closing-code
description: Generate 5 humorous, topic-relevant code snippets for LinkedIn post closing images. Use when the user wants closing image code for a blog post, or after creating a social post. Adapts language to the blog topic.
---

# LinkedIn Closing Code Snippet

## Overview

Generate 5 code snippet options for the author's LinkedIn post closing image. The snippets are humorous, capture the post's essence, and subtly encourage engagement (likes, comments, shares). Output is code only; the user creates the image separately.

## Workflow

1. Read the blog post (from `_drafts/` or `_posts/`) and optionally the social post (`social_posts/<key>.md`).
2. Identify the topic, primary technology, and key concepts.
3. Choose the programming language based on the blog post's main tech (C#, TypeScript, Python, etc.).
4. Generate exactly 5 different code snippet variants.
5. Output all 5 snippets in chat with brief labels (e.g., "Option 1: ...", "Option 2: ...").

## Code Snippet Style

### Length and Readability

- 10–20 lines. Readable at a glance on a single image.
- Not too short (avoid 3-line snippets). Not too long (avoid scrolling).

### Structure

- A class or function that "does something" related to the post topic.
- Use real language idioms: DI, async/await, decorators, etc. It should look like actual code, not pseudocode.

### Humor

- Funny class/method names, witty comments.
- Developer-to-developer tone. Occasional emoji in comments (💻, 💪, 🚀, etc.).

### Engagement Hooks

- Weave in methods like `LikePost()`, `SharePost()`, `CommentPost()` or similar.
- Make them feel natural within the logic, not forced.

### Rules

- No snippet should copy code directly from the article. Create creative, humorous takes.
- Each snippet must be self-contained and understandable without the blog context.
- Vary the angle: different class names, different jokes, different engagement patterns.

## Reference Example

This C# snippet is a good closing image for a blog post about reading articles:

```csharp
public class NewArticleReader(IBlogProvider blogProvider, IMe me) : IAppInitializer
{
    public async Task InitializeAsync(CancellationToken cancellationToken)
    {
        // before work I read Burgyn's blog 💻
        var blogPost = await blogProvider.ReadNewBlogPost(me);
        await me.LikePost(blogPost);
        await me.CommentPost(blogPost, "My opinion ...");
        // Doing my stuff better 💪
    }
}

builder.Services.AddAppInitializer<NewArticleReader>();
```

Note: real patterns (DI, async), humor in comments, engagement methods (`LikePost`, `CommentPost`), readable length.

## Output Format

Present each snippet in a fenced code block with a short label:

- **Option 1:** [brief angle, e.g. "Dependency injection joke"] — then the code block
- **Option 2:** [different angle] — then the code block
- Repeat for all 5 options
