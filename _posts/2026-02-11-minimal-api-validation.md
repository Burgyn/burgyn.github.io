---
layout: post
title: Built-in validation for Minimal APIs in .NET 10
tags: [C#, .NET, ASP.NET CORE, Minimal API]
comments: true
description: "Built-in validation for Minimal APIs in .NET 10: AddValidation(), DataAnnotations, and what to watch for."
linkedin_post_text: ''
social_post_key: minimal-api-validation
date: 2026-02-11 18:00:00.000000000 +01:00
image: "/assets/images/blog-post-base-cover.png"
thumbnail: "/assets/images/blog-post-base-cover.png"
keywords:
- Minimal API
- validation
- DataAnnotations
- .NET 10
- ASP.NET Core
---

Minimal APIs have been around since .NET 6 and have evolved a lot, but one thing was missing: first-class validation support. With .NET 10 *(since November 2025)*, that gap is finally closed thanks to revived `System.ComponentModel.DataAnnotations` support for Minimal APIs.

## How it works

You need three things:

1. **Register validation in DI** - call `builder.Services.AddValidation();` in `Program.cs`.
2. **Decorate your request types** with DataAnnotation attributes: `[Required]`, `[MinLength]`, `[EmailAddress]`, `[Range]`, `[Compare]`, and so on.
3. **Do nothing else** - a source generator emits the validation logic; your endpoint signature stays the same.

If validation fails, the framework returns 400 Bad Request with a `ProblemDetails` - style payload before your handler runs.

## Where you can use it

This validation works for:

- **Request body** - e.g. JSON bound to a record or class.
- **Query parameters** - e.g. `[FromQuery]` with attributes.
- **Headers** - when bound from headers with the right attributes.

So you get the same declarative style you know from MVC, but without the controller layer.

## Important: the request type must be public

If your request class or record is not **public**, validation will not run. The generated code only sees public types. Keep that in mind when you define DTOs in the same file as your endpoints or in a separate assembly.

## Example

Let's put it together. First, add the validation services and define a minimal endpoint:

```csharp
using System.ComponentModel.DataAnnotations;

var builder = WebApplication.CreateBuilder(args);

// 👇 Add validation support
builder.Services.AddValidation();

var app = builder.Build();

// 👇 Nothing changed here in your endpoint
app.MapPost("/users", (CreateUserRequest request) =>
{
    return Results.Ok(new { id = 1, request.Name, request.Email });
});

app.Run();
```

Your handler still receives a `CreateUserRequest`; the framework validates it before the lambda runs. The request type is a **public** record with DataAnnotations:

```csharp
// 👇 Your model class with validation attributes
public record CreateUserRequest(
    [Required, MinLength(2), MaxLength(100)]
    string Name,
    [Required, EmailAddress]
    string Email,
    [Required, MinLength(8), MaxLength(100)]
    string Password,
    [property: Required, Compare(nameof(CreateUserRequest.Password))]
    string ConfirmPassword,
    [Range(18, 120)] int Age);
```

For records, note the `property:` prefix on `[Compare]` so the attribute is applied to the generated property. Once that's in place, invalid requests (e.g. short name, bad email, mismatched passwords, or age out of range) get a 400 response automatically.

## When you need more than DataAnnotations

DataAnnotations are great for straightforward rules. If you need more complex, FluentValidation-style logic *(cross-field rules, async validators, or heavy reuse)*, you can still use custom endpoint filters - I wrote about that approach in an earlier post *(in Slovak)*: [ASP.NET Core Minimal API – Filters & Validation](/2023/01/16/asp-net-core-minimal-api-filters/). The built-in validation in .NET 10 simply gives you a zero-friction option when attributes are enough.
