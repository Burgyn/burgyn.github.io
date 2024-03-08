---
layout: post
title: C# 12 news that didn't make it into separate posts
tags: [csharp, dotnet, news, architecture]
comments: true
date: 2024-03-17 18:00:00.000000000 +01:00 2021-05-10 00:00:00 +0200
description: "Discover new features of C#12 such as primary constructors, collection expressions, and experimental attributes. Unleash the potential of modern C#."
linkedin_post_text: ""
image: "/assets/images/code_images/2024-03-17-csharp-12-news-that-did-not-make-it-into-separate-articles/cover.png"
thumbnail: "/assets/images/code_images/2024-03-17-csharp-12-news-that-did-not-make-it-into-separate-articles/cover.png"
keywords:
    - C# 12
    - programming languages
    - software development
    - coding
    - C# features
    - C# Experimental attribute
    - ref readonly parameters
    - default lambda parameters
    - primary constructor
    - collection expressions
---

C# 12 has been released November 2023. I've written separate articles about each of the new features:

- [C# 12 - Primary constructor]({{ site.baseurl }}{% link _posts/2023-10-10-csharp-primary-constructor.md %})
- [C# 12 - Collection expressions]({{ site.baseurl }}{% link _posts/2023-11-26-collection-expressions.md %})
- [Simplify tuple types using aliases]({{ site.baseurl }}{% link _posts/2024-02-18-using-alias-types.md %})

There were a few small things left that didn't make it into separate articles.

## Experimental attribute

In C# 12 we added a new `Experimental` attribute. We can use this attribute to indicate classes, methods, properties that are in experimental stage. 
It allows us to indicate that a given piece of code is in the experimental stage and may change or disappear completely.

```csharp
[Experimental(diagnosticId: "KROS_EXPERIMENTAL_001")]
public class ExperimentalClass
{
    [Experimental(diagnosticId: "KROS_EXPERIMENTAL_002")]
    public void ExperimentalMethod()
    {
    }

    [Experimental(diagnosticId: "KROS_EXPERIMENTAL_003")]
    public int ExperimentalProperty { get; set; }
}
```

Diagnostic message:

```
'{0}' is for evaluation purposes only and is subject to change or removal in future updates.
```

## ref readonly parameters

In C# 12, the option to use `ref readonly` parameters has been added. This way we can ensure that the method will not change the value of the parameter.

```csharp
static void Print(ref readonly int value)
{
    // value = 10; // 👈 compilation error
    Console.WriteLine(value);
}
```

[Reasons directly from the documentation](https://learn.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-12.0/ref-readonly-parameters):

- APIs created before `in` was introduced might use ref even though the argument isn't modified. Those APIs can be updated with `ref readonly`. It won't be a breaking change for callers, as would be if the ref parameter was changed to in.
- APIs that take an `in` parameter, but logically require a variable. A value expression doesn't work.
- APIs that use ref because they require a variable, but don't mutate that variable.

## Default Lambda Parameters

Until now it was not possible to use default values for parameters in lambdas. Since C# 12 this is now possible.

```csharp
var getProductPrice = (decimal price, string currency = "€", string format = "f4")
    => string.Format("Price is {0} {1}", price.ToString(format), currency);

string price1 = getProductPrice(1000M);
string price2 = getProductPrice(1000M, "CZK");
string price3 = getProductPrice(1000M, "CZK", "f2");
```
