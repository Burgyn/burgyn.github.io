---
layout: post
title: Approval test for your public API
tags: [csharp, dotnet, unit tests]
comments: true
description: "Find out how to ensure the public API of your .NET library remains consistent and properly versioned."
linkedin_post_text: "Ensure the consistency and proper versioning of the public API of your .NET library with the PublicApiGenerator and Verify tools. 🧰😊 Learn more in our new blog post. 🔗[link]"
date: 2024-04-07 18:00:00.000000000 +01:00 2055-02-18 18:00:00.000000000 +01:00
image: "/assets/images/code_images/public-api-generator/cover.png"
thumbnail: "/assets/images/code_images/public-api-generator/cover.png"
keywords:
- .NET library
- Public API
- API versioning
- PublicApiGenerator
- Verify
- API changes
- API documentation
- coding
- code testing
- unit testing
- Calculator
---

Are you developing a .NET library and want to make sure that the public API of your library is always consistent and versioned correctly? How do you check that changes have not caused a change in the public API of your library?

I've tried a combination of the [PublicApiGenerator](https://github.com/PublicApiGenerator/PublicApiGenerator) library and approval tests *(in my case [Verify](https://github.com/VerifyTests/Verify))* to do this. This combination ensures that if my library's public API changes, I know about it and am forced to think about it:

- whether the change is in line with the library's vision 
- whether the new `public' thing means I'll have to take care of it *(I will anyway 😊)*
- whether the change is properly documented
- whether the right version of the library is chosen *(hasn't there been a breaking change?)*
- ...

Let's have a simple library that contains one class `Calculator` with one method `Add`:

```csharp
public class Calculator
{
    public int Add(int a, int b) => a + b;
}
```

In the test project we add `PublicApiGenerator` and `Verify` *(for me it is `Verify.XUnit`)*:

```bash
dotnet add package PublicApiGenerator
dotnet add package Verify.Xunit
```

And let's write a test to check if the library's public API has changed:

```csharp
public class ApiVersionChangeTest
{
    [Fact]
    public Task ApproveApiVersion()
    {
        var publicApi = typeof(Calculator)
            .Assembly
            .GeneratePublicApi(); // 👈 Generate Public API string

        return Verify(publicApi); // 👈 Verify public API
    }
}
```

When we add a new method `Subtract` to the `Calculator` class:

```csharp
public class Calculator
{
    public int Add(int a, int b) => a + b;
    public int Subtract(int a, int b) => a - b;
}
```

The test fails and we see that the public API has changed:

```diff
 ········public·Calculator()·{·}
 ········public·int·Add(int·a,·int·b)
+········public·int·Subtract(int·a,·int·b)·{·}
```
