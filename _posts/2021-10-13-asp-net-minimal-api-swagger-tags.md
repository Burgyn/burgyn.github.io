---
layout: post
title: ASP.NET Core Minimal API Swagger tags
tags: [C#,.NET Core, .NET,ASP.NET Core, MinimalApi, Swagger]
comments: true
date: 2021-10-13 20:30:00 +0100
---

[The ASP.NET Minimal API](https://www.hanselman.com/blog/exploring-a-minimal-web-api-with-aspnet-core-6) is currently a fairly discussed topic. Some adore him and some curse him. Time will tell if it finds a real use.

I was interested in new extensions methods over `IEndpointRouteBuilder` that make it easy to add a new endpoint.

```csharp
app.MapGet("/todo", () => "Hello world")
```

This can be helpful if you need to automatically generate an endpoints. For example, if you want to generate CRUD endpoints based on your domain classes. In this case, you would like to generate documentation for the given endpoints.

[Swashbuckle.AspNetCore](https://github.com/domaindrivendev/Swashbuckle.AspNetCore) will generate it for you, unfortunately all added endpoints will be grouped by one tag.
![minimalapi](/assets/images/minimalapi/minimalapi.png)

## Possible solution

As a workaround, you can use the `TagActionsBy` method when configuring the swagger generator.

You can use `RelativePath` as a naive solution, for example:

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.TagActionsBy(d =>
    {
        return new List<string>() { d.RelativePath! };
    });
});
```

Deciding on the basis of `RelativePath` can be complicated. A better solution may be to use `DisplayName`.

```csharp
app.MapGet("/api/catalogs/{id}", () => "Hello world").WithDisplayName("Catalogs");
```

```csharp
builder.Services.AddSwaggerGen(c =>
{
    c.TagActionsBy(d =>
    {
        return new List<string>() { d.ActionDescriptor.DisplayName! };
    });
});
```

![minimalapi2](/assets/images/minimalapi/minimalapi2.png)

## UPDATED 2.1. 2021

New `.WithTags ("Catalogs")` extension method have been added in version `6.0.0` (not RC).

So just call

```csharp
app.MapGet("/api/catalogs/{id}", () => "Hello world").WithTags("Catalogs");
```

Thanks to [@captainsafia](https://github.com/captainsafia). [PR 2210](https://github.com/domaindrivendev/Swashbuckle.AspNetCore/pull/2210)