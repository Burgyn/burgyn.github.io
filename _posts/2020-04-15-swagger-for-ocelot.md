---
layout: post
date: 2020-04-15 17:00:00 +0100
title: Swagger for Ocelot API Gateway (SK)
tags: [microservices,C#,.NET Core,ASP.NET Core]
author: Miňo Martiniak
---

Ak vyvíjate mikroslužby, tak určite používate nejakú formu API Gateway. A ak vyvíjate v prostredí .NET Core, tak to bude s veľkou pravdepodobnosťou [Ocelot](https://github.com/ThreeMammals/Ocelot).

<!-- excerpt -->
Ocelot je skvelý projekt na vytvorenie vlastnej API Gateway. Bohužiaľ, ale neumožňuje jednu podľa mňa dôležitú vec a to integráciu swagger domentácií vaších mikroslužieb (viď [dokumentácia](https://ocelot.readthedocs.io/en/latest/introduction/notsupported.html)).

## MMLib.SwaggerForOcelot

Projekt [MMLib.SwaggerForOcelot](https://github.com/Burgyn/MMLib.SwaggerForOcelot) prináša možnosť, ako toto dosiahnuť. Umožňuje vám prezerať dokumentáciu mikroslužieb priamo cez Ocelot API Gateway. Na jednom mieste máte k dispozícií dokumentáciu celého vášho systému. *MMLib.SwaggerForOcelot* transformuje dokumentáciu mikroslužieb tak, aby bola správna z pohľadu API Gateway-a. Takže upraví adresy a odstráni endpointy, ktoré nie sú cez API Gateway routované von.

## Ako na to?

1. Nakonfiguruj SwaggerGen vo vaších mikroslužbách.
> Podľa [SwashbuckleAspNetCore dokumentácie](https://github.com/domaindrivendev/Swashbuckle.AspNetCore#getting-started).

2. Nainštaluj [MMLib.SwaggerForOcelot](https://www.nuget.org/packages/MMLib.SwaggerForOcelot/2.0.0-alpha.2) do vášho Ocelot projektu
> dotnet add package MMLib.SwaggerForOcelot

3. Nakonfiguruj *MMLib.SwaggerForOcelot* v `ocelot.json`
```json
 {
  "ReRoutes": [
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

4. V metóde `ConfigureServices` triedy `Startup.cs` registrujte *MMLib.SwaggerForOcelot* generátor.
```CSharp
services.AddSwaggerForOcelot(Configuration);
```

5. V metóde `Configure` triedy `Startup.cs` registrujte middleware, ktorý sprístupní dokumentáciu.
```CSharp
services.AddSwaggerForOcelot(Configuration);
```

Sekcia `SwaggerEndPoints` obsahuje konfigurácie potrebné na získanie dokomentácií jednotlivých mikroslužieb. Property `Key` sa používa na párovanie s `ReRoute` konfiguráciou. `Name` sa zobrazuje v combobox-e. `Url` je adresa k dokumentácií danej mikroslužby. Pokiaľ máte viac verzií vášho api, tak v sekcii `Config` to môžete zohľadniť. Napríklad:

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

Následne máte swagger dokumentáciu pre váš systém dostupnú na adrese `http://ocelotserviceurl/swagger`.

![swagger](/assets/images/swagger-for-ocelot/swagger.png)

Viac info priamo v repe [MMLib.SwaggerForOcelot](https://github.com/Burgyn/MMLib.SwaggerForOcelot).