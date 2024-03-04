---
layout: post
title: Boxing & UnBoxing - Back to the basics
tags: [csharp, dotnet, architecture]
comments: true
description: 'Explore the basics of Boxing and UnBoxing in .NET, their importance, and how to properly use or avoid them.'
linkedin_post_text: 'Get back to basics with Boxing and UnBoxing in .NET. Understand their role, importance and how to either use them properly or avoid them in your code. Perfect for developers seeking to deepen their knowledge and improve their proficiency. 👩‍💻👨‍💻📚 Read more http://blog.burgyn.online/2024/03/04/'
date: 2024-03-04 05:00:00.000000000 +01:00 
image: "/assets/images/code_images/boxing-unboxing/cover.png"
thumbnail: "/assets/images/code_images/boxing-unboxing/cover.png"
keywords:
    - Boxing
    - Unboxing
    - .NET
    - CLR
    - System.Object
    - GC
    - Guid
    - StringBuilder
    - IDisposable
    - Stack
    - Heap
    - Reference type
    - Value type
    - Generics
    - String interpolation
    - C#
---

Unless you know what **Boxing and UnBoxing** *(no UnBoxing is not fancy unboxing a new iPhone by your favorite youtuber)* is, don't read this post. In all likelihood, you won't learn anything new here.

I belong to the group of people who were caught by the times that when they wanted to get started with a new technology, they had to wade through books. Usually something like two or three 400-600 pages books.
You had to go through the basics, understand the language, its syntax, basic concepts, ... how compilation works, memory management, runtime. He was learning about the ecosystem, the libraries, the tools, ...
He did the standard "Hello World" *(does anyone else do that? 🤔)* and then he started a more complex project.

Today it's different. People learn from blogs, on youtube, ... Such a person can very quickly start working on a project *(either his or her own or at work)* and dedicate himself to what he needs.
This is great.

But there should also come a stage when one starts to be interested in things like: Why does the `StringBuilder` class exist, what is this Garbage Collector, why is it important to use `using` when working with `IDisposable`, what did generics come about, ... Simply to move on and be able to do better things, one needs to know more than just language syntax and feature libraries.

It's the same with **Boxing and UnBoxing**.

So this is a bit of a back to basics for those who are already programming in .NET but don't know about this concept, or just have a hunch.

## Boxing

Boxing is the process where a value type *(variable whose value is on the stack)* is converted to a reference type *(variable whose value is on the heap)*. This process is implicit, that is, it happens automatically.
When the CLR boxes a value type, it creates a new instance of `System.Object` and copies the value from the original variable to this object.

```csharp
int age = 39;

object age_obj = age; // 👈 boxing value
```

Another example where it may not be so obvious:

```csharp
Guid id = Guid.NewGuid();
int amount = 42;
decimal price = 42.42m;

var text = string.Format(
    "The id is {0}, the amount is {1}, the price is {2}",
    id, amount, price); // 👈 boxing values
```

On a stack it might look like this, for example:
![Stack](/assets/images/code_images/boxing-unboxing/stack.png)

On a heap after boxing, it might look like this, for example:
![Heap](/assets/images/code_images/boxing-unboxing/heap.png)

## UnBoxing

UnBoxing is the opposite process to Boxing. It is a process where a value from a reference type is converted back to a value type, 
which means it is extracted from the heap and moved to the stack. This process is explicit.

```csharp
int age2 = (int)age_obj; // 👈 unboxing value
```

## Advantages and disadvantages

Boxing and UnBoxing is a process that allows us to treat both value and reference types as one type in situations where we need to.
However, as already felt, it is a process that is not free. It has a price. 

1. It is necessary to allocate memory for a new object.
2. You need to copy the value from the original variable to the new object.
3. Since it is a reference type, it needs to be managed afterwards *(GC)* * *(each GC execution means, for example, freezing the web API, ...)*

There are situations where boxing can be avoided. For example, this was one of the reasons why generics came to .NET.

```csharp
[Benchmark]
public void AddToArrayList()
{
    for (int i = 0; i < MaxCount; i++)
    {
        _arrayList.Add(i);
    }
}

[Benchmark]
public void AddToList()
{
    for (int i = 0; i < MaxCount; i++)
    {
        _list.Add(i);
    }
}

| Method         | Mean      | Error     | StdDev    | Median    |
|--------------- |----------:|----------:|----------:|----------:|
| AddToArrayList | 82.743 ms | 13.359 ms | 29.880 ms | 70.806 ms |
| AddToList      |  8.414 ms |  4.583 ms | 10.250 ms |  5.068 ms |
```

Everyone probably knows about this advantage and the use of generics, and I didn't surprise anyone with that. But did you know about this, for example?

```csharp
[Benchmark]
public string UseStringFormat()
{
    return string.Format("Product: {0}, Price: {1} {2}, Amount: {3}. Date: {4} (Id: {5})",
        productName, price, currency, stockQuantity, date, guid);
}

[Benchmark]
public string UseStringInterpolation()
{
    return $"Product: {productName}, Price: {price} {currency}, " +
        $"Amount: {stockQuantity}. Date: {date} (Id: {guid})";
}

| Method                   | Mean     | Error   | StdDev   | Gen0   | Allocated |
|------------------------- |---------:|--------:|---------:|-------:|----------:|
| UseStringFormat          | 287.1 ns | 5.62 ns |  7.69 ns | 0.0544 |     456 B |
| UseStringInterpolation   | 204.9 ns | 4.00 ns |  6.89 ns | 0.0324 |     272 B |
```

String interpolation is faster than `string.Format` and more importantly causes less allocations and therefore less work for the GC.

Why is this so? There are multiple reasons, but one of them is that string interpolation uses generics in the background. 
And there arises something like the following:

```csharp
DefaultInterpolatedStringHandler handler = new ();

handler.AppendLiteral("Product: ");
handler.AppendFormatted(productName);
handler.AppendLiteral(", Price: ");
handler.AppendFormatted<decimal>(price);
handler.AppendLiteral(" ");
handler.AppendFormatted(currency);
handler.AppendLiteral(", Amount: ");
handler.AppendFormatted<int>(stockQuantity);
handler.AppendLiteral(". Date: ");
handler.AppendFormatted<DateTime>(date);
handler.AppendLiteral(" (Id: ");
handler.AppendFormatted<Guid>(guid);
handler.AppendLiteral(")");
```

## Conclusion

Boxing and UnBoxing is a process that is very important in .NET and it is good to know how it works so that we can use it properly or avoid it 🙂 .

## Links

- [Boxing and Unboxing](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/types/boxing-and-unboxing)
- [BenchmarkDotNet](https://github.com/dotnet/BenchmarkDotNet)