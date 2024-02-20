---
layout: post
title: Swagger for Ocelot API Gateway
tags: [microservices,C#,.NET Core,ASP.NET Core]
date: 2020-04-17 17:00:00 +0100
comments: true
---

If you're developing microservices, you're definitely using some form of API Gateway. And if you're developing in a .NET Core ecosystem, it's maybe to be [Ocelot](https://github.com/ThreeMammals/Ocelot).

<!-- excerpt -->
Ocelot is a great project to create your own API Gateway. Unfortunately, it does not allow one important thing, to integrate the swagger documentations of your microservices into one place. (see [documentation](https://ocelot.readthedocs.io/en/latest/introduction/notsupported.html)).

## MMLib.SwaggerForOcelot

The [MMLib.SwaggerForOcelot](https://github.com/Burgyn/MMLib.SwaggerForOcelot) package provides a way to achieve this. It allows you to view microservices documentation directly via Ocelot API Gateway. Document your entire system in one place. *MMLib.SwaggerForOcelot* transforms microservice documentation to be correct from the Gateway API point of view. So it modifies the addresses and removes endpoints that are not routed out via the API Gateway.

## How to start?

1. Configure SwaggerGen in your downstream services.
   > Follow the [SwashbuckleAspNetCore documentation](https://github.com/domaindrivendev/Swashbuckle.AspNetCore#getting-started).
2. Install Nuget package into yout ASP.NET Core Ocelot project.
   > dotnet add package MMLib.SwaggerForOcelot
3. Configure SwaggerForOcelot in `ocelot.json`.
```json
 {
  "Routes": [
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "UpstreamPathTemplate": "/api/contacts/{everything}",
      "ServiceName": "contacts",
      "SwaggerKey": "contacts"
    },
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "UpstreamPathTemplate": "/api/orders/{everything}",
      "ServiceName": "orders",
      "SwaggerKey": "orders"
    }
  ],
  "SwaggerEndPoints": [
    {
      "Key": "contacts",
      "Config": [
        {
          "Name": "Contacts API",
          "Version": "v1",
          "Url": "http://localhost:5100/swagger/v1/swagger.json"
        }
      ]
    },
    {
      "Key": "orders",
      "Config": [
        {
          "Name": "Orders API",
          "Version": "v1",
          "Url": "http://localhost:5200/swagger/v1/swagger.json"
        }
      ]
    }
  ],
  "GlobalConfiguration": {
    "BaseUrl": "http://localhost"
  }
}
```

4. In the `ConfigureServices` method of `Startup.cs` register the SwaggerForOcelot generator.
```c#
services.AddSwaggerForOcelot(Configuration);
```

5. In `Configure` method insert the `SwaggerForOcelot` middleware to expose interactive documentation.
```c#
app.UseSwaggerForOcelotUI(Configuration)
```

The `SwaggerEndPoints` section contains the configurations needed to obtain documentation for each microservice. The `Key` property is used to pair with the `ReRoute` configuration. `Name` is displayed in the combobox. `Url` is the address for the microservice documentation. If you have multiple versions of your api, you can take this into account in the `Config` section. For example:

```json
"Key": "orders",
"Config": [
  {
    "Name": "Orders API",
    "Version": "v1",
    "Url": "http://localhost:5200/swagger/v1/swagger.json"
  },
  {
    "Name": "Orders API",
    "Version": "v2",
    "Url": "http://localhost:5200/swagger/v2/swagger.json"
  }
]
```

Show your microservices interactive documentation `http://ocelotserviceurl/swagger`.

![swagger](/assets/images/swagger-for-ocelot/swagger.png)

Learn more in the repository [MMLib.SwaggerForOcelot](https://github.com/Burgyn/MMLib.SwaggerForOcelot).

If you liked this article, let me know about it at this [voting poll](https://app.swallowpoll.com/NYBznJrhGr).
