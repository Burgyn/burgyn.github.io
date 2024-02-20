---
layout: post
title: My troubles with the new JSON source generator in the ASP.NET API
tags: [C#,Generators,ASP.NET,.NET]
comments: true
date: 2022-01-25 21:00:00 +0100
---

New in .NET 6 is the C# JSON generator. In some cases, benchmarks promised up to ~40% increase in serialization performance *([For example here.](https://devblogs.microsoft.com/dotnet/try-the-new-system-text-json-source-generator/))*.

I wanted to test the impact this will have on real use cases in ASP.NET API projects. It should be easy to use:

```csharp
builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.AddContext<InvoiceJsonContext>();
});
```

I didn't expect a 40% increase of performance 🙂, but I hoped it would at partially reflect the response time, throughput, reduced memory requirements, ... at least something. But nothing, my experiment showed almost no differences with or without using the generated context. I assumed I was making a mistake on the side of my experiment *(I cannot generate the relevant load, the test data is not comprehensive enough, ...)*. But even after trying several options, I did not achieve satisfactory results.

So I started to investigate if the generated context was used at all. I found that although my context would be registered, it would not be used at all in deserialization. While debugging ASP.NET, I found that when creating the `SystemTextJsonOutputFormatter` class, which is responsible for serializing the response, the registered context is not taken over.

I already wanted to go write an issue when I found out that it already exists 🙃 *([JsonSerializerOptions constructor is not copying the contex](https://github.com/dotnet/aspnetcore/issues/38720))*.

## Conclusion?

> Before you start your own research, first google it 😀 That is the conclusion for me.

JSON serialization / deserialization is happening in ASP.NET Core API all the time and therefore the JSON source generator could help the performance of our APIs. Because is not currently used for `GET` requests *(the number of `GET` requests predominates over `POST` / `PUT` in common APIs)* it will not affect us enough. Maybe in .NET 7?
