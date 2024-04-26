---
layout: post
title: ASP.NET Core - Periodic Background Task
tags: [csharp, dotnet, architecture, ASP.NET Core]
comments: true
description: "Learn how to run periodic tasks in the background of ASP.NET Core services by implementing your own hosted service using the IHostedService interface."
linkedin_post_text: "Looking to run periodic tasks in the background of your ASP.NET Core services? 🕒 My latest blog post explains how you can do this by implementing your own hosted service using the IHostedService interface. Explore more on [Link to blog post] 👷‍♀️ #ASP.NETCore #BackgroundTasks #coding"
date: 2024-04-29 18:00:00.000000000 +01:00 
image: "/assets/images/code_images/asp-net-core-periodic-background-task/cover.png"
thumbnail: "/assets/images/code_images/asp-net-core-periodic-background-task/cover.png"
keywords:
- ASP.NET Core
- background task
- job scheduling
- IHostedService
- Hosted service
- Periodic tasks
- Service execution
- BackgroundService
- Hangfire
- Quartz.NET
- AWS Lambda
- AZURE Functions
---

You may have had a need in your services to run some task that will run periodically in the background *(cache updates, data synchronization, deleting old data, etc.)*. In new architectures, you might reach for something like AZURE Functions, AWS Lambda, or other serverless solutions. But it's good to know that you can also do this directly in your [ASP.NET Core service](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/host/hosted-services?view=aspnetcore-8.0&tabs=visual-studio). Just implement your own hosted service using the `IHostedService` interface. 
This interface defines two methods `StartAsync` and `StopAsync` that are called when the service starts and stops.

```csharp
public interface IHostedService
{
    Task StartAsync(CancellationToken cancellationToken);

    Task StopAsync(CancellationToken cancellationToken);
}
```

But rather than creating your own implementation of `IHostedService`, you can inherit the `BackgroundService` abstract class to make your stuff easier. With this class, you can override the `StartAsync` and `StopAsync` methods and implement your logic in them. Or you can just implement the `ExecuteAsync` method and implement only what you want to be executed in it.

The following example shows a simple implementation of `BackgroundService` that runs in the background and prints the current time every 5 seconds.

```csharp
// 👇 This is a simple implementation of a hosted service that runs a background task
public class PeriodicBackgroundTask(ILogger<PeriodicBackgroundTask> logger, TimeProvider timeProvider) 
    : BackgroundService
{
    private readonly ILogger<PeriodicBackgroundTask> _logger = logger;
    private readonly TimeProvider _timeProvider = timeProvider;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // 👇 In real-world scenarios, you should get the interval from configuration
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(5));

        // 👇 This loop will run every 5 seconds
        while (!stoppingToken.IsCancellationRequested
            && await timer.WaitForNextTickAsync(stoppingToken))
        {
            _logger.LogInformation("Current time: {CurrentTime}", _timeProvider.GetUtcNow().TimeOfDay);
        }
    }
}
```

The given background task needs to be arranged in the DI container as a hosted service using the `AddHostedService` method.

```
// 👇 Register the hosted service in the DI container
builder.Services.AddHostedService<PeriodicBackgroundTask>();
```

You can inject any services you need to execute into your background task. However, they must be registered as either singleton or transient services. Therefore, if you need to access scoped services, you must create a new scope using `IServiceProvider.CreateScope()` and get the dependencies from that scope.

```csharp
// 👇 Use scoped dependency injection
public class ProductProcesSyncBackgroundTask(IServiceProvider serviceProvider) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromHours(2));

        while (!stoppingToken.IsCancellationRequested
            && await timer.WaitForNextTickAsync(stoppingToken))
        {
            // 👇 Create a new scope to resolve scoped services
            using var scope = serviceProvider.CreateScope();
            var service = scope.ServiceProvider.GetRequiredService<IProductPricesSyncService>();

            await service.SyncProductPricesAsync(stoppingToken);
        }
    }
}
```

> ℹ️ In the next article, I'll show how to create your own background processing jobs that will be queued.

If you need more complex job scheduling, you can use libraries such as [Hangfire](https://www.hangfire.io/) or [Quartz.NET](https://www.quartz-scheduler.net/), which give you more options and configurations for job scheduling.
