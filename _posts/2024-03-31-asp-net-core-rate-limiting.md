---
layout: post
title: ASP.NET Core - Rate limiting
tags: [asp.net core, csharp, architecture, multi-tenant]
comments: true
description: "Learn how to implement rate limiting in ASP.NET Core using built-in features or custom algorithms. Covers multi-tenant scenarios."
date: 2024-03-31 18:00:00.000000000 +01:00
linkedin_post_text: "🚀 Rate limiting is a technique used mainly with APIs to control and limit the number of requests that clients can make to the API in a defined time. It belongs to the Resiliences family of paterns, which ensure that an API remains stable and available to all users, preventing misuse or overuse that could compromise its performance.\n\r\n\r👉If you want to know more, read on: https://blog.burgyn.online/2024/03/31/asp-net-core-rate-limiting\n\r\n\r#aspnetcore #csharp #dotnet #resiliencepatterns #performance #AspNetCoreRateLimit"
image: "/assets/images/code_images/2024-03-31-asp-net-core-rate-limiting/cover.png"
thumbnail: "/assets/images/code_images/2024-03-31-asp-net-core-rate-limiting/cover.png"
keywords:
    - Rate Limiting
    - API
    - ASP.NET Core
    - .NET 7
    - Resilience Patterns
    - Performance
    - AspNetCoreRateLimit
    - csharp
    - Fixed Window
    - Sliding Window
    - Token Bucket
    - Concurrency
    - Multi-tenancy
---

Rate limiting is a technique used mainly with APIs to control and limit the number of requests that clients can make to the API in a defined time. 
It belongs to the Resiliences family of paterns, which ensure that an API remains stable and available to all users, preventing misuse or overuse that could compromise its performance.

In the past, ASP.NET Core used the [AspNetCoreRateLimit](https://github.com/stefanprodan/AspNetCoreRateLimit) library for rate limiting. As of .NET 7, ASP.NET Core rate limiting is available directly within the framework.

Choose one of the available rate limiting algorithms:

- Fixed window
- Sliding window
- Token bucket
- Concurrency

> 💁 You can find the individual methods explained in detail directly in [documentation](https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit?view=aspnetcore-8.0).

Register a policy first:

```csharp
builder.Services.AddRateLimiter(limiter =>
{
    // 👇 Define the status code to be returned when the request is rejected.
    limiter.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    // 👇 Define the policy.
    limiter.AddFixedWindowLimiter(policyName: "products", options =>
    {
        options.PermitLimit = 10;
        options.Window = TimeSpan.FromSeconds(1);

        // 👇 If you want to use a queue to process requests that exceed the limit, you can set the following options.
        options.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        options.QueueLimit = 4;
    });
});
```

Then add the middleware to the pipeline:

```csharp
app.UseRateLimiter();
```

And use the policy when defining the endpoint:

```csharp
app.MapGet("/products", () =>
{
    return new string[] { "product1", "product2", "product3", "product4" };
}).RequireRateLimiting("products"); // 👈 Add the policy to endpoint.
```

If we have defined a policy on a whole group of endpoints, you can then disable rate limiting for a specific endpoint:

```csharp
var group = app.MapGroup("/api/products")
    .RequireRateLimiting("products");

group.MapGet("/", () =>
{
    return new string[] { "product1", "product2", "product3", "product4" };
}).DisableRateLimiting(); // 👈 Disable the policy for the endpoint.
```

For controllers, you can use the `[EnableRateLimiting(...)]` and `[DisableRateLimiting]` attributes.

```csharp
[EnableRateLimiting("products")]
public class ProductsController : Controller
{
    [HttpGet]
    public IEnumerable<string> Get()
    {
        return new string[] { "product1", "product2", "product3", "product4" };
    }

    [DisableRateLimiting]
    [HttpGet("{id}")]
    public string Get(int id)
    {
        return "product";
    }
}
```

## Multitenancy

If you are building a multi-tenant system, you probably want to have rate limiting for each tenant. For example, you want a tenant to be able to make 10 requests per second. Alternatively, you want to have different limits for different tenants. This can be achieved using the `RateLimitPartition` class.

```csharp
builder.Services.AddRateLimiter(limiter =>
{
    // 👇 Define custom policy.
    limiter.AddPolicy("fixed-by-tenant",
        context => RateLimitPartition
            .GetFixedWindowLimiter(
                context.Request.Headers["tenant-id"].First(), // 👈 Get tenant id
                _ => new FixedWindowRateLimiterOptions
                {
                    Window = TimeSpan.FromSeconds(1),
                    PermitLimit = 10
                }));
    
    // 👇 If you want different policy per tenant
    limiter.AddPolicy("fixed-by-tenant-2",
        context => RateLimitPartition
            .GetFixedWindowLimiter(
                context.Request.Headers["tenant-id"].First(), // 👈 Get tenant id
                tenantId => GetOptionsByTenant(tenantId))); 
                // 👆 Get options by tenan from your configuration
});
```
