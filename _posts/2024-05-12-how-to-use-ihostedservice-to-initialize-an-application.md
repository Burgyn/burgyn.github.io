---
layout: post
title: How to use IHostedService to initialize an application
tags: [csharp, asp.net core, architecture]
comments: true
description: "Learn how to use IHostedService in ASP.NET Core for tasks like database migrations or local cache loading before the service starts responding."
linkedin_post_text: "Looking for a clean way to initialize your ASP.NET Core application before it starts handling requests? Check out my latest blog post on using IHostedService for tasks such as database migrations and local cache loading. Master the elegant way of preparing your service for startup! 🔵🚀 #ASPNETCore #IHostedService #Initialization [blog post link]"
date: 2024-05-12 18:00:00.000000000 +01:00
image: "/assets/images/code_images/how-to-use-ihostedservice-to-initialize-an-application/cover.png"
thumbnail: "/assets/images/code_images/how-to-use-ihostedservice-to-initialize-an-application/cover.png"
keywords:
- ASP.NET Core
- IHostedService
- database migrations
- local cache
- initialization
- service start
- IServiceScopeFactory
- ProductsDbContext
- AppInitializerHandler
- Entity Framework
- CI/CD process
- dotnet ef migrations bundle
---

> ℹ️ This is another article in a series showing how you can use `IHostedService`. 
> - [ASP.NET Core - Periodic Background Task](/2024/04/28/asp-net-core-periodic-background-task).
> - [ASP.NET Core - Queued hosted service](/2024/05/05/asp-net-core-queued-hosted-service).

You may find that you need to do some initialization before your ASP.NET Core service starts (before the service starts responding to queries). 
For example, you need to run database migrations, create some records, create storage, load data into the local cache, and so on.

> ⚠️ Beware of database migrations and data initialization. 
> For a more complex system it is recommended to do this in the CI/CD process and not at service start *(complications with multiple service instances, slowing down the application start, ...)*.  
> In the case of [Entity Framework it is possible for example to create a bundle.exe](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/applying?tabs=dotnet-core-cli#bundles) `dotnet ef migrations bundle` and run this in the CD process. 
> 
> 
> However, this is suitable for simple services or for local development needs.

A simple and quite nice way to do this is to use `IHostedService`.

Let's create an interface for such an application initializer:

```csharp
public interface IAppInitializer
{
    Task InitializeAsync(CancellationToken cancellationToken = default);
}
```

We then create a handler that implements `IHostedService` and handles all the initializers:

```csharp
internal class AppInitializerHandler(IServiceScopeFactory scopeFactory) 
    : IHostedService
{
    private readonly IServiceScopeFactory _scopeFactory = scopeFactory;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        // 👇 Create a new scope to retrieve scoped services
        using var scope = _scopeFactory.CreateScope();
        // 👇 Get all initializers
        var initializers = scope.ServiceProvider.GetServices<IAppInitializer>();

        foreach (var initializer in initializers)
        {
            // 👇 Run the initializer (choose your async strategy)
            await initializer.InitializeAsync(cancellationToken);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
```

An example of an initializer that will populate the local cache:

```csharp
public class CacheInitializer(
    IMemoryCache memoryCache, 
    IProductRepository productRepository) : IAppInitializer
{
    private readonly IMemoryCache _memoryCache = memoryCache;
    private readonly IProductRepository productRepository = productRepository;

    public Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        // Your logic for initializing the cache can go here
        return Task.CompletedTask;
    }
}
```

In case we want to run database migrations, we can directly implement this interface in DbContext:

```csharp
public class ProductsDbContext : DbContext, IAppInitializer
{
    public DbSet<Product> Products { get; set; }

    public ProductsDbContext(DbContextOptions options) : base(options)
    {
    }

    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        // 👇 Apply pending migrations
        await Database.MigrateAsync(cancellationToken);
    }
}
```

Finally, we register all initializers and handler in DI containers:

```csharp
// 👇 Register the initializers
builder.Services.AddScoped<IAppInitializer, ProductsDbContext>();
builder.Services.AddScoped<IAppInitializer, CacheInitializer>();

// 👇 register AppInitializerHandler as a hosted service
builder.Services.AddHostedService<AppInitializerHandler>();
```

This way we can elegantly initialize our application before it starts answering queries.

> ⚠️ Nezabudni, že inicializácia by mala byť rýchla.

To simplify registration to the DI container, we can create an extension:

```csharp
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppInitializer<T>(
        this IServiceCollection services) 
        where T : class, IAppInitializer
    {
        services.AddScoped<IAppInitializer, T>();
        return services;
    }
}

// 👇 Register the initializers
builder.Services.AddAppInitializer<ProductsDbContext>();
builder.Services.AddAppInitializer<CacheInitializer>();
```
