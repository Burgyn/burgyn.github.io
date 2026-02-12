# Social Post Formats

Concrete examples and anti-patterns for LinkedIn and Bluesky posts. Blog URL base: `https://blog.burgyn.online`. Permalink: `/:year/:month/:day/:title`.

## LinkedIn Examples

### Example 1 (author's real post – Minimal API validation)

```
🚀 Built-in validation for Minimal APIs is finally here in .NET 10 (since November 2025)

Minimal APIs were introduced in .NET 6 and have evolved a lot, but one big thing was missing: first-class validation support.

🙏 With .NET 10, that gap is finally closed thanks to the revived System.ComponentModel.DataAnnotations support for Minimal APIs.

🛠️ How it works:
 → Add validation to DI: builder.Services.AddValidation();
 → Decorate your request models with DataAnnotation attributes like [Requires], ...
 → The source generator takes care of the rest ✅

⚠️ Important: your request class must be public, otherwise validation won't work.

You can use this validation for:
 → Query parameters
 → Headers
 → Request body

If you need more complex, FluentValidation-style rules, check my older article on custom validation for Minimal APIs (in Slovak):
https://lnkd.in/dUu4DqDS

#dotnet #minimalapi #aspnetcore
```

### Example 2 (Own mediator – from blog frontmatter)

```
Interested in the Mediator design pattern for .NET? Check out how you can create your own implementation without third-party libraries. 🎯💻 {link to blogpost}
```

Adapted with structure and URL:

```
🎯 Own Mediator implementation in .NET – no third-party library

Sometimes you can't or don't want to add MediatR. I wrote how we built a minimal event publisher that fits our needs.

→ IDomainEvent, IDomainEventHandler, IEventPublisher
→ Registration and usage with DI
→ Sample project linked in the post

https://blog.burgyn.online/2024/06/09/own-mediator

#dotnet #csharp #architecture
```

### Example 3 (Throw vs throw ex – from blog frontmatter)

```
🔍 Get back to basics with C#! Learn how to use 'throw' & 'throw ex' and their impact on stack traces during exceptions. Understand how they aid in problem identification. Don't miss the details! 🚀 👨‍💻 [Link to blog post]
```

Adapted with structure and URL:

```
🔍 Throw vs throw ex – back to the basics

In C# the difference is whether the stack trace is preserved. Short post on why it matters when debugging.

→ throw ex – stack trace from rethrow point
→ throw – original stack trace kept ✅

https://blog.burgyn.online/2024/04/14/throw-vs-throw-ex-back-to-the-basics

#csharp #dotnet #basics
```

## Bluesky Examples

Bluesky: max 300 characters. One short sentence + link + optional hashtags.

### Example 1

```
Built-in validation for Minimal APIs in .NET 10 — wrote about how it works and what to watch out for.

https://blog.burgyn.online/2025/03/15/minimal-api-validation

#dotnet #aspnetcore
```

### Example 2

```
Own Mediator-style event publisher in .NET without MediatR. Code and sample inside.

https://blog.burgyn.online/2024/06/09/own-mediator

#dotnet
```

### Example 3

```
Throw vs throw ex in C# — why the stack trace changes and why it matters for debugging.

https://blog.burgyn.online/2024/04/14/throw-vs-throw-ex-back-to-the-basics

#csharp
```

## Anti-patterns (What NOT to Write)

- **Marketing speak**: "You MUST read this!", "Game-changing!", "Don't miss out!"
- **Clickbait**: "This one trick will change how you code forever."
- **Hype**: "Incredible", "Amazing", "Revolutionary" without substance.
- **Forced CTA**: "Like and share if you agree!" (only use natural questions or related links when they fit).
- **Long Bluesky posts**: Keep under 300 characters; no paragraphs.
- **Bold/italic in LinkedIn**: LinkedIn doesn't support it; use emojis as section markers instead.
