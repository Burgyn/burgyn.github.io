---
layout: post
title: Multi-Tenant Output Cache Policy
tags: [aspnetcore, outputcache, redis, caching, dotnet, multi-tenant]
author: Miňo Martiniak
comments: true
date: 2024-01-22 08:00:00.000000000 +01:00
carousel_images:
- path: "/assets/images/outputcache-multitenant/1.png"
  alt: "Output Cache Multi-Tenant"
- path: "/assets/images/outputcache-multitenant/2.png"
- path: "/assets/images/outputcache-multitenant/3.png"
- path: "/assets/images/outputcache-multitenant/4.png"
- path: "/assets/images/outputcache-multitenant/5.png"  
---

🚀 ASP.NET Core Output Cache for MultiTenancy Services

[In the previous post](https://blog.burgyn.online/2024/01/15/output-cache), I showed how to use the ASP.NET Core output cache.
I mentioned that it is not sutible for multi-tenancy services (especially invalidating the cache for tenant) and that I had a solution for that in mind.

So here it is 🙋‍♂️.

The key is to create your own custom cache policy.

Implement `IOutputCachePolicy`. In the `CacheRequestAsync` method, resolve tenantId and create new tags based on it.

Register your policy, define tags and use it in your endpoints.

When you want to invalidate cache for tenant, call `EvictByTagAsync` with tag based on tenantId.

You can also simply it all with creating own extension method for `IOutputCacheStore` and `OutputCacheOptions`.

Note: if you do not have `tenantId` in the path, you will need to modify `CacheVaryByRules` to use other values (e.g. header, query string, etc.)

Full code is available on [GitHub](https://github.com/Burgyn/Sample.OutputCache).