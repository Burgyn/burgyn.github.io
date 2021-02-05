---
layout: post
title: Swagger documentation of Ocelot aggregates
tags: [microservices,C#,.NET Core,ASP.NET Core]
author: Miňo Martiniak
date: 2021-02-04 19:00:00 +0100
comments: true
---

I wrote in the article [Swagger for Ocelot API Gateway](https://blog.burgyn.online/2020/04/17/swagger-for-ocelot-api-gateway-en) about how to use the `MMLib.SwaggerForOcelot` package to document your system directly through the Ocelot gateway.
In this article, I want to look at its relatively new functionality, namely the ability to create and generate documentation for Ocelot aggregations.

---

You are probably familiar with Ocelot great feature [***Request Aggregation***](https://ocelot.readthedocs.io/en/latest/features/requestaggregation.html). Request Aggregation allows you to easily add a new endpoint to the gateway that will aggregate the result from other existing endpoints.
If you use these aggregations, you would probably want to have these endpoints in the api documentation as well.

In `ConfigureServices` allow `GenerateDocsForAggregates` option.

```CSharp
services.AddSwaggerForOcelot(Configuration,
  (o) =>
  {
      o.GenerateDocsForAggregates = true;
  });
```

Documentations of your aggregates will be available on custom page **Aggregates**.
![aggregates docs](https://raw.githubusercontent.com/Burgyn/MMLib.SwaggerForOcelot/master/demo/aggregates.png)

### Custom description

By default, this package generate description from downstream documentation. If you want add custom description for your aggregate route, you can add description to `ocelot.json`.

```json
"Aggregates": [ 
  {
    "RouteKeys": [
      "user",
      "basket"
    ],
    "Description": "Custom description for this aggregate route.",
    "Aggregator": "BasketAggregator",
    "UpstreamPathTemplate": "/gateway/api/basketwithuser/{id}"
  }
]
```

### Different parameter names

It is likely that you will have different parameter names in the downstream services that you are aggregating. For example, in the User service you will have the `{Id}` parameter, but in the Basket service the same parameter will be called `{BuyerId}`. In order for Ocelot aggregations to work, you must have parameters named the same in Ocelot configurations, but this will make it impossible to find the correct documentation.

Therefore, you can help the configuration by setting parameter name map.

```json
{
  "DownstreamPathTemplate": "/api/basket/{id}",
  "UpstreamPathTemplate": "/gateway/api/basket/{id}",
  "ParametersMap": {
    "id": "buyerId"
  },
  "ServiceName": "basket",
  "SwaggerKey": "basket",
  "Key": "basket"
}
```

Property `ParametersMap` is map, where `key` *(first parameter)* is the name of parameter in Ocelot configuration and `value` *(second parameter)* is the name of parameter in downstream service.

### Custom aggregator

The response documentation is generated according to the rules that Ocelot uses to compose the response from the aggregate. If you use your custom `IDefinedAggregator`, your result may be different. In this case you can use `AggregateResponseAttibute`.

```CSharp
[AggregateResponse("Basket with buyer and busket items.", typeof(CustomResponse))]
public class BasketAggregator : IDefinedAggregator
{
    public async Task<DownstreamResponse> Aggregate(List<HttpContext> responses)
    {
        ...
    }
}
```

### Modifying the generated documentation

If you do not like the final documentation, you can modify it by defining your custom postprocessor.

```CSharp
services.AddSwaggerForOcelot(Configuration,
  (o) =>
  {
      o.GenerateDocsForAggregates = true;
      o.AggregateDocsGeneratorPostProcess = (aggregateRoute, routesDocs, pathItemDoc, documentation) =>
      {
          if (aggregateRoute.UpstreamPathTemplate == "/gateway/api/basketwithuser/{id}")
          {
              pathItemDoc.Operations[OperationType.Get].Parameters.Add(new OpenApiParameter()
              {
                  Name = "customParameter",
                  Schema = new OpenApiSchema() { Type = "string"},
                  In = ParameterLocation.Header
              });
          }
      };
  });
```

### The Gateway documentation itself

When using the Ocelot gateway as an orchestrator *(a specific type of aggregation)*, you will probably want to view the documentation for the gateway itself.

In these scenarios, you can also add documentation.

1. Allow `GenerateDocsForGatewayItSelf` option in configuration section.
   
```CSharp
services.AddSwaggerForOcelot(Configuration,
  (o) =>
  {
      o.GenerateDocsForGatewayItSelf = true;
  });
```

2. Use Swagger generator in `Configure` section.

```csharp
app.UseSwagger();
```

![ocelot docs](https://raw.githubusercontent.com/Burgyn/MMLib.SwaggerForOcelot/master/demo/ocelotdocs.png)

### Demo sample

[Sample.ApiGatewayOcelot](https://github.com/Burgyn/Sample.ApiGatewayOcelot)