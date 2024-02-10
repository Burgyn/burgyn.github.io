---
layout: post
title: Time travel with TimeProvider
tags: [csharp, dotnet, unittests]
author: Miňo Martiniak
comments: true
date: 2024-02-10 18:00:00.000000000 +01:00
---

If you write unit tests you know that using `DateTime.Now` directly is not a good idea 🤔. 
You probably have something like `IDateTimeProvider` or something similar in your project.

🌠 Microsoft after 21 years came up with their own solution. Starting with .NET 8, we have the `TimeProvider` abstract class. 
We can have this one injected where we need it and use it. 
In the project we then configure the usage on `TimeProvider.System`.

🧪 In tests, we can use the `FakeTimeProvider` class from the `Microsoft.Extensions.Time.Testing` library. 
This class will allow us to travel in time to test our scenarios.

Use the new `TimeProvider` instead of the original `DateTime.Now` or `DateTime.UtcNow`.

```csharp
// 👇 Inject time provider
public class Basket(TimeProvider timeProvider, LoyaltyLevel loyaltyLevel)
{
    private readonly DateTimeOffset _expireAt = timeProvider.GetUtcNow()  // 👈 Use time provider
        .AddDays(loyaltyLevel == LoyaltyLevel.Standard ? 1 : 7);

    public bool IsExpired => timeProvider.GetUtcNow() > _expireAt; // 👈 Use time provider
}
```

`TimeProvider.System` is available for standard use cases. Inject it where you need it.

```csharp
// 👇 Use System time provider in your code
var basket = new Basket(TimeProvider.System, LoyaltyLevel.Gold);
```

In tests use `FakeTimeProvider` and time travel as needed using `Advance` method.

```csharp
[Fact]
public void GoldendUserShouldBeExpiredAfter7Days()
{
    // 👇 Use fake time provider in your test
    var fakeTime = new FakeTimeProvider(DateTimeOffset.UtcNow);
    var basket = new Basket(fakeTime, LoyaltyLevel.Gold);

    // 👇 Travel in time
    fakeTime.Advance(TimeSpan.FromDays(8));

    Assert.True(basket.IsExpired);
}
```