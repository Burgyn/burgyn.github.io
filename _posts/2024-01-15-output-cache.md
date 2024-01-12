---
layout: post
title: Output cache with ASP.NET Core
tags: [aspnetcore, outputcache, redis, caching, dotnet]
author: Miňo Martiniak
comments: true
date: 2024-01-15 08:00:00.000000000 +01:00
carousel_images:
- path: "/assets/images/outputcache/1.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/2.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/3.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/4.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/5.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/6.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/7.png"
  alt: "Output cache"
- path: "/assets/images/outputcache/8.png"
  alt: "Output cache"              
---

🚀 Speed up your API with output caching.

ASP.NET Core since version 7 offers outcaching out of the box. Just use the `AddOutputCache` method to add configuration to the DI container, register the middlaware using the `UseOutputCache` method, and just mark your endpoint with `CacheOutput` method (or the `[OutputCache]` attribute in the case of controllers).

Then the output from your endpoint will be automatically cached 🚀.

You can define the configuration using policies. You can define a base policy for all `GET` and `HEAD` requests using `AddBasePolicy` or add a named policy for specific endpoints using `AddPolicy`.

📦 "Cache revalidation" is also supported. Just set the `ETag` header and if the client sends the same value in the `If-None-Match` header your API will automatically respond with `304 Not Modified`.

🧹 You can invalidate a cache based on tags. You can assign multiple tags to each policy and then use `IOutputCacheStore` to invalidate that part of the cache.
⚠️☹️ Unfortunately this is quite a problem for multitenant systems. By default you can't invalidate a part of the cache based on tenant alone (unless you already have a list of tenants when you start the service). 
🤔💡 I already have an idea in my head how this could be implemented. If I manage to do it, I'll share it in the next post 🙂.

🏬 By default the data is cached in memory. To use the redis store, you need to use the `Microsoft.AspNetCore.OutputCaching.StackExchangeRedis` library.

❓What type of caching do you use in your projects?