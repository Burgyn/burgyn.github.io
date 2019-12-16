---
layout: post
title: "Deconstructors for non tuple types in C# 7.0"
date: 2019-12-15 09:00:00 +0100
tags: [C#, .NET, .NET Core]
author: Miňo Martiniak
---

There are a lot of articles about tupple and how to deconstruct them. [See example](https://visualstudiomagazine.com/articles/2017/01/01/tuples-csharp-7.aspx)

This funcionality is great. However, only a few knows that even class can be deconstructed, not just tupple.

This example shows how class `Person` can be deconstructed into `firstName` and `lastName` variables.

```CSharp
public class Person
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }

    public void Deconstruct(out string firstName, out string lastName)
    {
        firstName = FirstName;
        lastName = LastName;
    }
}
```

You can then deconstruct your class into variables.

```CSharp
var person = new Person()
{
    FirstName = "Janko",
    LastName = "Hraško"
};

var (firstName, lastName) = person;

firstName.Should().Be("Janko");
lastName.Should().Be("Hraško");
```

We created `person` as an instance of `Person` and deconstructed it into two variables.

You only have to define `Deconstruct(out T var1, ... , out T varN)` method. Parameters have to be defined as `out`.
You can have as many parameters as you wish and also overloads too.

Example:

```CSharp
public class Person
{
    public int Id { get; set; }
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public int Age { get; set; }
    public string Email { get; set; }

    public void Deconstruct(out string firstName, out string lastName)
    {
        firstName = FirstName;
        lastName = LastName;
    }

    public void Deconstruct(out string firstName, out string lastName, out int age)
    {
        firstName = FirstName;
        lastName = LastName;
        age = Age;
    }
}
```

The same instance of the `Person` class can be deconstructed both ways based on the context.

```CSharp
var (firstName, lastName) = person;
(string firstName, string lastName, var age) = person;
```

# Ambiguous overload

There is a one scenario that can be confusing. When you would like to have two overload methods with the same number of parameters but different types.
We would like to consider overload method `public void Deconstruct(out string firstName, out string lastName, out string email)` as possible.

But when you try it compilator raises following exception:

> The call is ambiguous between the following methods or properties: 'Person.Deconstruct(out string, out string, out int)' and 'Person.Deconstruct(out string, out string, out string)'

Reason for this exception is that there are more ways how to declare variables into which class would be deconstructed. There is nothing else but to accept.

# Extensions

Another advantage new language brings us is that we can deconstruct classes that are not ours. This can be accomplished using extension methods.

Following example shows how to deconstruct instance of the class `Point` into variables `x` and `y`.

Let's declare extension method.

```CSharp
public static class PointExtensions
{
    public static void Deconstruct(this Point point, out int x, out int y)
    {
        x = point.X;
        y = point.Y;
    }
}
```

Now we can deconstruct.

```CSharp
Point point = new Point(45, 85);

var (x, y) = point;

x.Should().Be(45);
y.Should().Be(85);
```

# Magic pattern-base C# features

Maybe it all seems magic to you. You don't have to implement any interface, don't have to inherit and it just works. C# started to using so called **pattern-base** (or convention-base) access. It means they define conventions and those that we adhere it just works.

[Demo is available here](https://github.com/Burgyn/Sample.DeconstructorsForNonTuple)
