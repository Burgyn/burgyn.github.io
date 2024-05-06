---
layout: post
title: ASP.NET Core - Queued hosted service
tags: [csharp, dotnet, asp.net core, AZURE]
comments: true
description: "Discover how to process long-running actions with ASP.NET Core by task queuing, simultaneously improving your application's performance."
linkedin_post_text: "Improve your application's performance with long-running actions by using a task queue in ASP.NET Core. Check out the techniques in our latest post. 🔗"
date: 2024-05-05 18:00:00.000000000 +01:00
image: "/assets/images/code_images/asp-net-core-queued-hosted-service/cover.png"
thumbnail: "/assets/images/code_images/asp-net-core-queued-hosted-service/cover.png"
keywords:
- ASP.NET Core
- AZURE
- AWS
- Service bus
- AZURE Functions
- task queue
- background task
- IBackgroundTaskQueue
- System.Threading.Channel
- background service
- job queue
- Hangfire
---

> ℹ️ This is a follow-up to [ASP.NET Core - Periodic Background Task](/2024/04/28/asp-net-core-periodic-background-task).

There are situations when you do not want to process a longer-running action directly during request processing, but want to queue it and have it processed later. This is very useful when processing a large number of requests, where processing them directly (or parts of them) could slow down the overall performance of the application. If you use cloud services like AZURE or AWS, you may want to reach for their solutions. In AZURE, this would likely be a combination of [Service bus](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-messaging-overview) and [AZURE Functions](https://azure.microsoft.com/en-us/products/functions#:~:text=Azure%20Functions%20is%20an%20event,highest%20level%20of%20hardware%20abstraction.).

But it's good to know that we can implement a similar solution directly in our ASP.NET Core service.

Let's define an interface describing a simple task queue:

```csharp
// 👇 Simple interface for background task queue
public interface IBackgroundTaskQueue
{
    ValueTask Queue(Func<CancellationToken, ValueTask> workItem);

    ValueTask<Func<CancellationToken, ValueTask>> Dequeue(CancellationToken cancellationToken);
}
```

For example, a task queue implementation based on `System.Threading.Channel` might look like this:

```csharp
// 👇 Simple implementation of background task queue based on System.Threading.Channel
public class BackgroundTaskQueue : IBackgroundTaskQueue
{
    private readonly Channel<Func<CancellationToken, ValueTask>> _queue;

    public BackgroundTaskQueue(int capacity)
    {
        var options = new BoundedChannelOptions(capacity)
        {
            // 👇 Wait for the queue to have space
            FullMode = BoundedChannelFullMode.Wait
        };
        _queue = Channel.CreateBounded<Func<CancellationToken, ValueTask>>(options);
    }

    public async ValueTask Queue(Func<CancellationToken, ValueTask> workItem)
    {
        ArgumentNullException.ThrowIfNull(workItem);

        await _queue.Writer.WriteAsync(workItem);
    }

    public async ValueTask<Func<CancellationToken, ValueTask>> Dequeue(CancellationToken cancellationToken)
    {
        var workItem = await _queue.Reader.ReadAsync(cancellationToken);

        return workItem;
    }
}
```

Finally, let's create a background service that will sequentially process tasks from the queue:

```csharp
// 👇 Hosted service that processes the queued work items
public class QueuedHostedService(
    IBackgroundTaskQueue taskQueue,
    ILogger<QueuedHostedService> logger) : BackgroundService
{
    private readonly ILogger<QueuedHostedService> _logger = logger;
    private readonly IBackgroundTaskQueue _taskQueue = taskQueue;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            // 👇 Dequeue the work item
            var workItem =
                await _taskQueue.Dequeue(stoppingToken);

            try
            {
                // 👇 Execute the work item
                await workItem(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred executing: {WorkItem}.", nameof(workItem));
                throw;
            }
        }
    }
}
```

Let's not forget to register the service and the job queue in DI containers:

```csharp
// 👇 Register the hosted service and the background task queue in the DI container
builder.Services.AddSingleton<IBackgroundTaskQueue>(new BackgroundTaskQueue(30));
builder.Services.AddHostedService<QueuedHostedService>();
```

For example, instead of processing an order directly within an endpoint, the use case might be to place it in a job queue:

```csharp
// 👇 Endpoint for processing orders
app.MapPost("/orders", async (
    Order order, 
    [FromServices] IBackgroundTaskQueue backgroundTaskQueue, 
    [FromServices] ILogger<Order> logger) =>
{
    // 👇 Enqueue the work item
    await backgroundTaskQueue.Queue(async token =>
    {
        // 👇 Simulate processing the order
        logger.LogInformation("Processing order: {order}", order);
        await Task.Delay(1000, token);
        logger.LogInformation("Order processed: {order}", order);
    });

    return Results.Created($"/orders/{order.Id}", order);
});
```

In this way, we have created a simple job queue that processes jobs in the background. This solution is suitable for simple scenarios. For more complex scenarios, for example, you need to persist the jobs so that you can process them in case of an outage. You can use solutions such as Redis, AZURE Storage Account Queues, or a database to store the jobs.

If even this is not enough (potrebujete ukladať správy kvôli možným výpadkom), try solutions like [Hangfire](https://www.hangfire.io/), or cloud platform services like AZURE Service Bus + AZURE Functions.
