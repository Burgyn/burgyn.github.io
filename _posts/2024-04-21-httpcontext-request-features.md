---
layout: post
title: HttpContext Request Features
tags: [csharp, asp.net core, multi-tenant, architecture]
comments: true
description: "Learn how to use HttpContext.Request.Features in ASP.NET Core to store and retrieve information related to individual requests."
linkedin_post_text: "Discover how to use HttpContext.Request.Features in ASP.NET Core for efficiently managing data for individual requests 🚀 This can add a powerful tool to your .NET developer toolkit! Read more here: [blogpost]"
date: 2024-04-21 18:00:00.000000000 +01:00
image: "/assets/images/code_images/httpcontext-request-features/cover.png"
thumbnail: "/assets/images/code_images/httpcontext-request-features/cover.png"
keywords:
- ASP.NET Core
- HttpContext.Request.Features
- Dependency Injection
- Middleware
- Request Lifecycle
- IFeatureCollection
- ICurrentTenantInfo
- HttpContext.Items
---

In ASP.NET Core, we are used to working with dependency injection and we tend to pass most of the information through dependency injection to the classes where we need it. 
However, sometimes we work with information that is closely tied to a particular request and we don't need, want, or can't inject it into classes as dependencies. 
For such cases, there is `HttpContext.Features`.

The `Features` property is a simple collection of type `IFeatureCollection`, where we can store strongly typed objects and then retrieve them at places where we need them. 
This collection is available within `HttpContext` and is available throughout the request lifecycle. 
The [ASP.NET Core framework ](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/use-http-context?view=aspnetcore-8.0#features)itself uses this collection to store various information, for example: 
- `IRouteValuesFeature` - contains information about the parameters and their values from the request path 
- `IEndpointFeature` - contains information about the endpoint that processes the request 
- ...

The `Features` property is also available to us and we can store our own information that we will need during the request processing.
An example use case might be storing information about the current user, the current tenant, or other information that is necessary 
for processing the request with is bound in some way, or retrieved from the request itself.

Information is typically stored in `Features` within middleware that is registered within the application pipeline. 
The middleware can retrieve the information from the request, process it, and then store it in `Features` for further processing within the application.

An example of middleware that retrieves information about the current tenant from a request and stores it in `Features` might look like the following:

```csharp
public class CurrentTenantInfoMiddleware(RequestDelegate next)
{
    private readonly RequestDelegate _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        // 👇 More complex logic to determine the current tenant can be added here
        if (context.Request.Headers.TryGetValue("X-TenantId", out var routeValue)
            && Guid.TryParse(routeValue.First()?.ToString(), out var tenantId))
        {
            var tenantInfo = await tenantService.GetTenantInfoAsync(tenantId);
            // 👇 Store the tenant info in Features
            context.Features.Set(tenantInfo);
        }

        await _next(context);
    }
}

// 👇 Register the middleware
app.UseMiddleware<CurrentTenantInfoMiddleware>();
```

We can then access information about the current tenant from `Features` within other parts of the application:

```csharp
app.MapGet("/api/", (HttpContext context) =>
{
    // 👇 Access the current tenant info from the context
    var currentTenantInfo = context.Features.Get<ICurrentTenantInfo>();
    return Results.Ok(currentTenantInfo?.Id);
});
```

For simplicity, we can create an extension method for `IFeatureCollection`:

```csharp
public static class IFeatureCollectionExtensions
{
    public static ICurrentTenantInfo? GetTenant(this IFeatureCollection features)
    {
        return features.Get<ICurrentTenantInfo>();
    }
}

var tenantInfo = context.Features.GetTenant();
```

> For completeness: another way to transfer information during one request is to use `HttpContext.Items`. This collection is available within `HttpContext` and is available throughout the request lifecycle. However, `Items` is not strongly typed. It is a key value. Therefore, it is preferable to use `Features` if we need to store strongly typed objects.
