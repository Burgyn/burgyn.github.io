---
layout: post
title: Own mediator
tags: [csharp, dotnet, unit tests, architecture]
comments: true
description: "Discover how to build your own implementation of the Mediator design pattern in a .NET environment without third-party libraries."
linkedin_post_text: "Interested in the Mediator design pattern for .NET? Check out how you can create your own implementation without third-party libraries. 🎯💻 {link to blogpost}"
date: 2024-06-09 18:00:00.000000000 +01:00 
image: "/assets/images/code_images/own-mediator/cover.png"
thumbnail: "/assets/images/code_images/own-mediator/cover.png"
keywords:
- Mediator design pattern
- .NET
---

Currently, the Mediator design pattern is often used. Its purpose is to separate the communication between objects from each other. Which will reduce dependencies between classes, make the code more transparent and simplify testing. 
In a .NET environment, a developer often reaches for the cool library [MediatR](https://github.com/jbogard/MediatR) by Jimmy Bogard. This library provides an easy way to implement the Mediator pattern into an application.

However, there are situations where we can't/don't want to use a third party library. For example, you are writing some custom library/framework and you don't want to introduce such dependencies into it.

Something similar happened to us. Fortunately, we didn't need the complete functionality that MediatR provides, but just a basic event dispatch and processing was enough.

Therefore, I will now show how to easily create such an implementation of your own Mediator.

Let's start with defining the message interface. In our case it was a domain event, hence the name.

```csharp
public interface IDomainEvent
{
}
```

> It's just a pure markup interface. We could do without it, but it's a good way to indicate that it's an event.

Then the event processing interface.

```csharp
public interface IDomainEventHandler<TEvent> 
    where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent domainEvent, CancellationToken cancellationToken = default);
}
```

We need an interface for sending events.

```csharp
public interface IEventPublisher
{
    Task PublishAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent;
}
```

We could stop with the abstractions here and start implementing. However, we decided to add an abstraction for the processing strategy in there. For now, the sequential processing of events was enough, but we might need other strategies in the future.

```csharp
public interface IEventPublisherStrategy
{
    Task PublishAsync<TEvent>(
        IEnumerable<IDomainEventHandler<TEvent>> handlers,
        TEvent domainEvent,
        CancellationToken cancellationToken)
        where TEvent : IDomainEvent;
}
```

## Implementation

Publisher can look like this:

```csharp
internal class EventPublisher : IEventPublisher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IEventPublisherStrategy _publisherStrategy;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public EventPublisher(
        IServiceProvider serviceProvider,
        IHttpContextAccessor httpContextAccessor,
        IEventPublisherStrategy publisherStrategy)
    {
        _serviceProvider = serviceProvider;
        _publisherStrategy = publisherStrategy;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task PublishAsync<TEvent>(TEvent domainEvent, CancellationToken cancellationToken = default)
        where TEvent : IDomainEvent
    {
        IEnumerable<IDomainEventHandler<TEvent>> handlers;
        if (_httpContextAccessor.HttpContext is not null)
        {
            // 👇 if available, then find handlers in HttpContext services
            handlers = GetHandlers<TEvent>(_httpContextAccessor.HttpContext.RequestServices);
            // 👇 publish event to all handlers
            await _publisherStrategy.PublishAsync(handlers, domainEvent, cancellationToken);
        }
        else
        {
            // 👇 if not, then create new scope
            using var scope = _serviceProvider.CreateScope();
            handlers = GetHandlers<TEvent>(scope.ServiceProvider);
            // 👇 publish event to all handlers
            await _publisherStrategy.PublishAsync(handlers, domainEvent, cancellationToken);
        }
    }

    private static IEnumerable<IDomainEventHandler<TEvent>> GetHandlers<TEvent>(IServiceProvider serviceProvider)
        where TEvent : IDomainEvent
        => serviceProvider.GetServices<IDomainEventHandler<TEvent>>();
}
```

Publisher takes care of getting the handlers from the container and then forwards them to publisher strategy, which decides how they will be processed.

```csharp
public sealed class ForeachAwaitPublisherStrategy : IEventPublisherStrategy
{
    public async Task PublishAsync<TEvent>(
        IEnumerable<IDomainEventHandler<TEvent>> handlers,
        TEvent domainEvent,
        CancellationToken cancellationToken)
        where TEvent : IDomainEvent
    {
        // 👇 publish event to all handlers
        foreach (var handler in handlers)
        {
            await handler.HandleAsync(domainEvent, cancellationToken);
        }
    }
}

```

Our `ForeachAwaitPublisherStrategy` handles events sequentially. It forwards the message to all handlers and waits for them to process it.

## Registration

In order to use the abstractions we create, we need to register them in the DI container.

```csharp
public static IServiceCollection AddEventPublisher(this IServiceCollection services)
{
    services.AddHttpContextAccessor();
    services.TryAddSingleton<IEventPublisher, EventPublisher>();
    services.TryAddSingleton<IEventPublisherStrategy, ForeachAwaitPublisherStrategy>();
    return services;
}
```

We can also create an extension for easy registration of handlers.

```csharp
public static IServiceCollection AddDomainEventHandler<TEvent, THandler>(
    this IServiceCollection services,
    ServiceLifetime lifetime = ServiceLifetime.Transient)
    where TEvent : IDomainEvent
    where THandler : class, IDomainEventHandler<TEvent>
{
    services.Add(new ServiceDescriptor(typeof(IDomainEventHandler<TEvent>), typeof(THandler), lifetime));

    return services;
}
```

> Using this extension looks like this `services.AddDomainEventHandler<YourEvent, YourHandler>();`. 
> This is because I wanted to avoid reflection. If reflection doesn't bother you, a simplified call to `services.AddDomainEventHandler<YourHandler>();`. 
> But I'll leave that up to you 😉.

## Usage

Finally, we'll show you how to use our own Mediator.

Event and handler:

```csharp
// 👇 The event that the product was created
public record ProductCreated(int Id, string Name, decimal Price) : IDomainEvent;

// 👇 The handler that will process the event
public class ProductCreatedHandler : IDomainEventHandler<ProductCreated>
{
    public Task HandleAsync(ProductCreated domainEvent, CancellationToken cancellationToken = default)
    {
        // 👇 Process the event
        Console.WriteLine($"Product created: {domainEvent.Name}");
        return Task.CompletedTask;
    }
}
```

The registration:

```csharp
builder.Services.AddEventPublisher();
builder.Services.AddDomainEventHandler<ProductCreated, ProductCreatedHandler>();
```

Use in endpoint:

```csharp
app.MapPost("/products", async (Product product, IEventPublisher publisher) =>
{
    // Save the product
    // 👇 Publish the event
    await publisher.PublishAsync(new ProductCreated(product.Id, product.Name, product.Price));
    return product;
});
```

## Links

- [Sample project](https://github.com/Burgyn/MMLib.Sample.Mediator)
