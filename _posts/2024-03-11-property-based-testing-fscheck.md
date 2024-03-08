---
layout: post
title: Testing with properties using FsCheck
tags: [csharp, unit tests, FsCheck, architecture]
comments: true
description: 'Learn about property-based testing vs example-based testing with C# using the FsCheck library for verifying program correctness.'
date: 2024-03-10 18:00:00.000000000 +01:00 2021-05-10 00:00:00 +0200
linkedin_post_text: 'Improve your C# unit testing skills with property-based testing. Discover how the FsCheck library can help verify your code correctness based on properties or specification, rather than specific examples 🧮🔍. Refactoring or fuzz testing? Property-based testing can help! Read more in my latest blog post 👨‍💻 here: https://blog.burgyn.online/2024/03/10/property-based-testing-fscheck'
image: "/assets/images/code_images/2024-03-11-property-based-testing-fscheck/cover.png"
thumbnail: "/assets/images/code_images/2024-03-11-property-based-testing-fscheck/cover.png"
keywords:
    - property-based testing
    - example-based testing
    - FsCheck
    - C#
    - unit testing
    - commutative property
    - associative property
    - identity property
    - mathematical properties
    - test verification
    - code correctness
    - NuGet
    - test properties
    - refactoring
    - fuzz testing
---

I assume that most of us use a technique called *example-based testing* when writing unit tests. This technique is based on writing tests that verify the behavior of our functions for specific inputs. 

> It is a natural way because our perception works based on examples.

Example-based testing for an addition function might look like this:

```csharp
[Theory]
[InlineData(1, 2, 3)]
[InlineData(2, 2, 4)]
[InlineData(3, 2, 5)]
public void Add_ShouldReturnSumOfTwoNumbers(int a, int b, int expected)
{
    var result = Calculator.Add(a, b);
    result.Should().Be(expected);
}
```
It's simple, after all, what can go wrong with the addition function anymore. A couple of examples are enough and we have 100% coverage. Or do we?

But what if we want to implement our own "super fast" addition function based on bitwise operations? For example, something like the following:
    
```csharp
public static int Add(int a, int b)
{
    while (b != 0)
    {
        int carry = a & b;
        a = a ^ b;
        b = carry << 1;
    }
    return a;
}
```

How do we verify that this function is working correctly? What if the algorithm is complicated and a few examples are not enough? 
This is where *property-based testing* can help us. This is testing based on defined properties, or perhaps better specifications.

If you remember from math, addition has several properties that must be satisfied:

1. Commutative property: `a + b = b + a`
2. Associative property: `(a + b) + c = a + (b + c)`
3. Identity: `a + 0 = a`

We can use these properties to verify the correctness of our addition function. So that we don't have to do it all manually the `FsCheck` library can help us.
This is a library primarily designed for the F# language, but its API is also usable in C#.

We will install the library via NuGet:

```bash
dotnet add package FsCheck.Xunit
// 👆 based on your testing framework
```

And then we can write tests based on the properties:

```csharp
[Property] // 👈 attribute for property-based testing
public Property Add_Should_Be_Commutative(int a, int b)
{
    return (Add(a, b) == Add(b, a))
        .ToProperty(); // 👈 convert boolean to Property
}

[Property]
public Property Add_Should_Be_Associative(int a, int b, int c)
{
    return (Add(Add(a, b), c) == Add(a, Add(b, c))).ToProperty();
}

[Property]
public Property Add_Should_Be_Identity(int a)
{
    return (Add(a, 0) == a).ToProperty();
}
```

And that's it. Now we have tests that verify the correctness of our addition function based on mathematical properties. 
And all without having to write specific examples.

The `FsCheck` will generate random inputs for us and verify our function based on the defined properties. It has many generators for different data types and methodologies on how to generate random inputs *(what range, ...)*.

If the test reveals an error, it will use the *shrinking* method to find us the smallest input that causes the error.

For example, something like this:

```bash
FsCheck.Xunit.PropertyFailedException : 
Falsifiable, after 3 tests (11 shrinks) (StdGen (422220575,297303727)):
Original:
(-137, 122)
Shrunk:
(1, 101)
```

Yes, it's not every day we write a function for addition, or similar mathematical functions. But *property-based testing* can also help us test "common" algorithms or functions. For example, when testing parsers, serializers, validators, ...

It is useful when:

- there is an inverse function *(serialization / deserialization, write / read, crypt / decrypt, ...)*
- we can define the required properties *(commutative, associative, distributive, ...)*
- we do refactoring *(verifying that the new implementation is equivalent to the old one)*
- we do fuzz testing *(we want to see where the limits of our algorithm are)*
- ...

## 🔗 Sources

- [FsCheck](https://fscheck.github.io/FsCheck/)