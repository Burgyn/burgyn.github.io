---
layout: post
title: Ocelot ETag Caching
tags: [csharp, dotnet, caching, architecture]
comments: true
description: "A blog post discussing the use of ETag caching with Kros.Ocelot.ETagCaching library and Ocelot API Gateway."
linkedin_post_text: "Interested in optimizing your API Gateway performance? Check out our latest blog post that explains how to implement ETag Caching with Kros.Ocelot.ETagCaching library. It saves bandwidth and reduces server load, making your applications more efficient. Check it out! 👉 {placeholder for blog post link}"
date: 2024-06-02 18:00:00.000000000 +01:00
image: "/assets/images/code_images/ocelot-etag-caching/cover.png"
thumbnail: "/assets/images/code_images/ocelot-etag-caching/cover.png"
keywords:
- Caching
- ETag
- Ocelot
- API Gateway
- Kros.Ocelot.ETagCaching
- HTTP Caching
- 304 Not Modified
- Cache Invalidation
- Redis
---

The `Kros.Ocelot.ETagCaching` library brings ETag caching support to the Ocelot API Gateway. ETag caching is an HTTP caching mechanism that allows clients to verify if the cached data is still current without downloading the entire resource again. If the data hasn't changed, the server responds with a `304 Not Modified` status, prompting the client to use the cached data, thereby saving bandwidth and reducing server load.

## Why Use ETag Caching?

ETag caching is particularly useful in scenarios where data changes infrequently but is requested frequently. It optimizes network usage and improves response times by minimizing data transfer. By using ETags, clients can ensure they always have the most recent version of the data.

## How ETag Caching Works

ETag caching involves the use of two HTTP headers:

- `ETag`: A unique identifier for the data, typically a hash or a version number.
- `cache-control`: Instructs the client that the response can be cached. For ETag caching, this should be set to `private`.

When a client receives a response with these headers, it caches the data and the ETag value. On subsequent requests, the client sends an `If-None-Match` header with the ETag value. The server then compares the ETag with the current version of the data. If they match, the server returns a `304 Not Modified` status, indicating the client should use the cached data.

## Implementation in Ocelot

The `Kros.Ocelot.ETagCaching` library integrates seamlessly with Ocelot's middleware. It handles ETag generation, storage, and validation transparently. Here’s how to get started:

### Ocelot Configuration

Configure your routes in the `ocelot.json` file, specifying cache policies:

```json
{
    "Routes": [
        {
            "Key": "getAllProducts",
            "DownstreamPathTemplate": "/api/products/",
            "UpstreamPathTemplate": "/products/",
            "CachePolicy": "getAllProducts" // 👈 Cache policy key
        },
        {
            "Key": "getProduct",
            "DownstreamPathTemplate": "/api/products/{id}",
            "UpstreamPathTemplate": "/products/{id}",
            "CachePolicy": "getProduct" // 👈 Cache policy key
        },
        {
            "Key": "deleteProduct",
            "DownstreamPathTemplate": "/api/products/{id}",
            "UpstreamPathTemplate": "/products/{id}",
            "InvalidateCachePolicy": "invalidateProductCachePolicy"
        }
    ]
}
```

### Program.cs Configuration

Set up the ETag caching policies in `Program.cs`:

```csharp
// 👇 Define policies
builder.Services.AddOcelotETagCaching((c) =>
{
    //  👇 Simple policy with expiration and tag templates
    c.AddPolicy("getAllProducts", p =>
    {
        p.Expire(TimeSpan.FromMinutes(5));
        p.TagTemplates("products:{tenantId}", "all", "tenantAll:{tenantId}");
    });

    // 👇 Policy with custom cache key, ETag generator, and cache control
    c.AddPolicy("getProduct", p =>
    {
        p.Expire(TimeSpan.FromMinutes(5));
        p.TagTemplates("product:{tenantId}:{id}", "tenant:{tenantId}:all", "all");
        p.CacheKey(context => context.Request.Headers.GetValues("id").FirstOrDefault());
        p.ETag(context => new($""{Guid.NewGuid()}""));
        p.CacheControl(new() { Public = false });
    });
});
```

Add the ETag caching middleware to the Ocelot pipeline:

```
app.UseOcelot(c =>
{
    // 👇 Add ETag caching middleware
    c.AddETagCaching();
}).Wait();
```

## Tag Templates and Cache Invalidation

Tag templates are used to generate cache tags based on request parameters, making it easy to invalidate specific cache entries. For example, for the route `/api/{tenantId}/products/{id}` and the tag template `product:{tenantId}:{id}`, the tag will be `product:1:2`.

### Automatic Cache Invalidation

Define invalidate cache policies in `ocelot.json`:

```json
{
    "Key": "deleteProduct",
    "UpstreamHttpMethod": [ "Delete" ],
    "DownstreamPathTemplate": "/api/products/{id}",
    "UpstreamPathTemplate": "/products/{id}",
    "InvalidateCachePolicy": "invalidateProductCachePolicy" 
    // 👆 Invalidate cache policy key
}
```

And configure them in `Program.cs`:

```csharp
builder.Services.AddOcelotETagCaching(conf =>
{
    // 👇 Define invalidate cache policy
    conf.AddInvalidatePolicy("invalidateProductCachePolicy", builder =>
    {
        // 👇 Define tag templates to invalidate
        builder.TagTemplates("product:{tenantId}", "product:{tenantId}:{id}");
    });
});
```

### Manual Cache Invalidation

Manually invalidate cache entries using the `IOutputCacheStore`:

```csharp
public class ProductsService {
    private readonly IOutputCacheStore _outputCacheStore;

    public ProductsService(IOutputCacheStore outputCacheStore)
    {
        _outputCacheStore = outputCacheStore;
    }

    public async Task DeleteProduct(int tenantId, int id)
    {
        await _outputCacheStore.InvalidateAsync(
            $"product:{tenantId}", $"product:{tenantId}:{id}");
        // 👆 Invalidate cache entries by tags            
    }
}
```

## Redis Integration

By default, the library uses `InMemoryCacheStore`, but you can configure it to use Redis for distributed caching:

```csharp
builder.Services.AddStackExchangeRedisOutputCache(options =>
{
    options.Configuration 
        = builder.Configuration.GetConnectionString("MyRedisConStr");
    options.InstanceName = "SampleInstance";
});
```

## Sources

- [Kros.Ocelot.ETagCaching GitHub Repository](https://github.com/Kros-sk/Kros.Ocelot.ETagCaching)
- [Ocelot](https://ocelot.readthedocs.io/en/latest/)
