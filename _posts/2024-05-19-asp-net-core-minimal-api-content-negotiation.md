---
layout: post
title: ASP.NET CORE Minimal API - Content Negotiation
tags: [csharp, asp.net core]
comments: true
description: "A guide to creating your own support for Content Negotiation in ASP.NET Core Minimal API by developing a custom 'IResult' implementation."
linkedin_post_text: "Discover how to enhance ASP.NET Core Minimal API's capabilities with your own support for content negotiation. Learn the step-by-step process, complete with code examples. 💻🎓🔧 #ASPNET #MinimalAPI #ContentNegotiation #CodingTutorial Read more here: {placeholder for blog post link}"
date: 2024-05-19 18:00:00.000000000 +01:00 
image: "/assets/images/code_images/asp-net-core-minimal-api-content-negotiation/cover.png"
thumbnail: "/assets/images/code_images/asp-net-core-minimal-api-content-negotiation/cover.png"
keywords:
- ASP.NET Core Minimal API
- Content Negotiation
- IResult
- ASP.NET Core
- JSON
- XML
- serialization
- IResponseNegotiator
- ContentNegotiationProvider
---

The primary goal of [ASP.NET Core Minimal API](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview?view=aspnetcore-8.0) is to deliver a straightforward, simple, and most importantly, very powerful framework for creating APIs. Rather than delivering features to cover every possible usage scenario *(unlike [MVC](https://learn.microsoft.com/en-us/aspnet/core/tutorials/choose-web-ui?view=aspnetcore-8.0))* it is designed with certain specific patterns in mind. One of these cases is that the Minimal API consumes and produces only the `JSON` format *(Thus, it does not support [Content Negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation) which is handled by [Output formatters](https://learn.microsoft.com/en-us/aspnet/core/web-api/advanced/formatting?view=aspnetcore-8.0#content-negotiation) in the case of MVC)*.
However, there are situations where you really need either a different type of output *(for example, standard `XML`)*, or you need to be more in control of the serialization process, and you want to take advantage of the simplicity and power of the Minimal API. In this article, I will try to show how you can create your own support for Content Negotiation in the Minimal API.

> ⚠️ This is a functional implementation, but it doesn't cover all scenarios and is just a basic example of what such support could look like.

The whole solution is based on a custom implementation for `IResult`. [More info in the documentation](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-8.0).

## `IResponseNegotiator`

Let's first define the interface whose implementation will be responsible for serializing the response.

```csharp
public interface IResponseNegotiator
{
    string ContentType { get; }

    bool CanHandle(MediaTypeHeaderValue accept);

    Task Handle<TResult>(HttpContext httpContext, TResult result, CancellationToken cancellationToken);
}
```

## Implementation for JSON

For JSON, we can directly use `Ok<TResult>` result, which is part of the Minimal API.

```csharp
public class JsonNegotiator : IResponseNegotiator
{
    public string ContentType => MediaTypeNames.Application.Json;

    public bool CanHandle(MediaTypeHeaderValue accept)
        => accept.MediaType == ContentType;

    public Task Handle<TResult>(HttpContext httpContext, TResult result, CancellationToken cancellationToken)
    {
        // 👇 Use original Ok<TResult> type for JSON serialization
        return TypedResults.Ok(result).ExecuteAsync(httpContext);
    }
}
```

## Implementation for XML

For XML, we can create a custom implementation that uses, for example, `DataContractSerializer`.

```csharp
public class XmlNegotiator : IResponseNegotiator
{
    public string ContentType => MediaTypeNames.Application.Xml;

    public bool CanHandle(MediaTypeHeaderValue accept)
        => accept.MediaType == ContentType;

    public async Task Handle<TResult>(HttpContext httpContext, TResult result, CancellationToken cancellationToken)
    {
        httpContext.Response.ContentType = ContentType;

        // 👇 Use DataContractSerializer for XML serialization
        using var stream = new FileBufferingWriteStream();
        using var streamWriter = new StreamWriter(stream);
        var serializer = new DataContractSerializer(result.GetType());

        serializer.WriteObject(stream, result);

        await stream.DrainBufferAsync(httpContext.Response.Body, cancellationToken);
    }
}
```

## Registration

Unfortunately, due to the way `IEndpointMetadataProvider` works and the way serialization works directly in the Minimal API, I couldn't find an elegant way to use the DI container *(there would be a few inelegant ones 😊).* So I resorted to a custom registrar for negotiators.

```csharp
public static class ContentNegotiationProvider
{
    private static readonly List<IResponseNegotiator> _negotiators = [];

    // 👇 Internal list of negotiators
    internal static IReadOnlyList<IResponseNegotiator> Negotiators => _negotiators;

    // 👇 Add negotiator to the list
    public static void AddNegotiator<TNegotiator>()
        where TNegotiator : IResponseNegotiator, new()
    {
        _negotiators.Add(new TNegotiator());
    }
}
```

We register the negotiators in `Program.cs` or `Startup.cs`.

```csharp
ContentNegotiationProvider.AddNegotiator<JsonNegotiator>();
ContentNegotiationProvider.AddNegotiator<XmlNegotiator>();
```

## `ContentNegotiationResult<TResult>`

```csharp
public class ContentNegotiationResult<TResult>(TResult result)
    : IResult, IEndpointMetadataProvider, IStatusCodeHttpResult, IValueHttpResult
{
    private readonly TResult _result = result;

    // ...

    public Task ExecuteAsync(HttpContext httpContext)
    {
        if (_result == null)
        {
            httpContext.Response.StatusCode = StatusCodes.Status204NoContent;
            return Task.CompletedTask;
        }

        // 👇 Get negotiator based on Accept header
        var negotiator = GetNegotiator(httpContext);
        if (negotiator == null)
        {
            httpContext.Response.StatusCode = StatusCodes.Status406NotAcceptable;
            return Task.CompletedTask;
        }

        // 👇 Set status code
        httpContext.Response.StatusCode = StatusCode;

        // 👇 Handle the result
        return negotiator.Handle(httpContext, _result, httpContext.RequestAborted);
    }

    private static IResponseNegotiator? GetNegotiator(HttpContext httpContext)
    {
        var accept = httpContext.Request.GetTypedHeaders().Accept;
        // 👇 Get negotiator based on Accept header (use ContentNegotiationProvider)
        return ContentNegotiationProvider.Negotiators.FirstOrDefault(n =>
        {
            return accept.Any(a => n.CanHandle(a));
        });
    }

    //...
}
```

To make the documentation nicely generated and contain information about possible formats, we can implement `IEndpointMetadataProvider`.

```csharp
static void IEndpointMetadataProvider.PopulateMetadata(MethodInfo method, EndpointBuilder builder)
{
    // 👇 Add produces response type metadata
    builder.Metadata.Add(new ProducesResponseTypeMetadata(StatusCodes.Status200OK, typeof(TResult),
        ContentNegotiationProvider.Negotiators.Select(n => n.ContentType).ToArray()));
}
```

## Helper method

Let's create a static helper for ease of use.

```csharp
public static class Negotiation
{
    public static ContentNegotiationResult<T> Negotiate<T>(T result)
        => new(result);
}
```

## Usage

```csharp
app.MapGet("/products", () =>
{
    // 👇 Use Negotiation
    return Negotiation.Negotiate(new List<Product>() { new(1, "Product 1", 100) });
});

app.MapGet("/products/{id}", GetProduct);

static Results<ContentNegotiationResult<Product>, NotFound> GetProduct(int id)
{
    if (id == 1)
    {
        // 👇 Use Negotiation
        return Negotiation.Negotiate(new Product(1, "Product 1", 100));
    }
    else
    {
        return TypedResults.NotFound();
    }
}
```

That's it ✅.

```http
### GET products as XML
GET http://localhost:5210/product/
Accept: application/xml

### Response
<ArrayOfProduct xmlns="http://schemas.datacontract.org/2004/07/" xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
  <Product>
    <Id>1</Id>
    <Name>Product 1</Name>
    <Price>100</Price>
  </Product>
</ArrayOfProduct>
```

> ⚠️ This solution is just a basic suggestion and does not cover all possible scenarios. 
> For example, the way it is done you can only use it for `200 OK` answers (but it can be extended).


The full example is on [GitHub](https://github.com/Burgyn/Samples.ContentNegotion).
