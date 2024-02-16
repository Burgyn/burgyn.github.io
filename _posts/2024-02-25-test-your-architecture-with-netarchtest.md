---
layout: post
title: Test your architecture with NetArchTest
tags: [dotnet, unit tests, architecture, csharp]
author: Miňo Martiniak
description: "Discover how NetArchTest enhances architectural compliance in .NET projects. Learn to create unit tests for architecture integrity."
comments: true
date: 2024-02-25 18:00:00.000000000 +01:00 
keywords:
  - NetArchTest .NET
  - .NET architecture testing
  - Unit testing for software architecture
  - Validate .NET project architecture
  - .NET architectural rules validation
  - Ensuring architecture integrity in .NET
  - Custom architecture validation rules .NET
  - NetArchTest examples
  - Code quality improvement .NET
  - Continuous integration architecture tests
  - Software design principles testing .NET
---

Do you have an architecture type defined on the project? Onion / Clean / Vertical Slice / ... architecture? 
Or do you have your own architecture rules? 
How do you verify that they are followed?

We have `.editorconfig`, [Roslynator](https://github.com/dotnet/roslynator), [SonarCloud](https://www.sonarsource.com/), ... But this is not enough for architecture.

A solution may be to use the [NetArchTest](https://github.com/BenMorris/NetArchTest) library. 
This library allows you to define different rules for the architecture and then continuously validate them using unit tests.

What are the rules? Preferably with examples:

- the domain layer must not contain dependencies on other layers
- access to the database can only be in the infrastructure layer
- value objects must be immutable
- repositories must have the `Repository` suffix
- DTO classes must not be used in the domain and infrastructure layers
- `async` methods must not have a return type of `void` and suffix `Async`
- and many other rules that may be important on your project

How to do it?

- Add a reference to the `NetArchTest` library to the test project.

```bash
dotnet add package NetArchTest.Rules
```

- We will create unit tests to verify our rules.

```csharp
[Fact]
public void RepositoriesShouldBeLocatedInInfrastructureNamespace()
{
    var result = Types.InAssembly(typeof(ProductRepository).Assembly)
        .That()
        .ImplementInterface(typeof(IRepository)) // 👈 rule for repositories
        .Should()
        .ResideInNamespaceEndingWith("Infrastructure") // 👈 use rule
        .GetResult();

    result.IsSuccessful.Should().BeTrue();
}

[Fact]
public void DomainShouldNotReferenceInfrastructure()
{
    var result = Types.InAssembly(typeof(ProductDto).Assembly)
        .That()
        .ResideInNamespace("EShop.Domains")
        .ShouldNot()
        .HaveDependencyOn("EShop.Infrastructure")
        .GetResult();

    result.IsSuccessful.Should().BeTrue();
}
```

- We can also create our own rules.

```csharp
public class IsRecordRule : ICustomRule
{
    // 👇 use custom rule for checking if type is Record
    public bool MeetsRule(TypeDefinition type)
        => type.GetMethods().Any(m => m.Name == "<Clone>$");
}

public static class CustomRules
{
    // 👇 extension method to simplify the use of a custom rule
    public static ConditionList BeRecord(this Conditions conditions)
        => conditions.MeetCustomRule(new IsRecordRule());
}

[Fact]
public void DtoShouldBeRecordType()
{
    var result = Types.InAssembly(typeof(ProductDto).Assembly)
        .That()
        .HaveNameEndingWith("Dto")
        .Should()
        .BeRecord()
        .GetResult();

    result.IsSuccessful.Should().BeTrue();
}
```

[Whole demo](https://github.com/Burgyn/Sample.NetArchTest)
[Documentation](https://github.com/BenMorris/NetArchTest)