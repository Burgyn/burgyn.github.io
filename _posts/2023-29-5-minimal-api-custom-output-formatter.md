---
layout: post
title: "Minimal API - Custom output formatter"
tags: [dotnet, C#, asp.net core, minimal api]
author: Miňo Martiniak
comments: true
image: /assets/images/net7-docker-build-in/NET 7 SDK - build-in container support.png
date: 2023-05-29 22:00:00 +0100
---
Primárny cieľ [ASP.NET Core Minimal API](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/overview?view=aspnetcore-8.0) je priniesť priamočiarý, jednoduchý a hlavne veľmi výkonný framework na tvorbu API. Miesto toho aby prinášal features, ktoré umožnia pokryť každý možný scenár použitia *(na rozdiel od [MVC](https://learn.microsoft.com/en-us/aspnet/core/tutorials/choose-web-ui?view=aspnetcore-8.0))* je navrhnutý s ohľadom na určité špecifické patterny. Jedným z týchto prípadov je aj to, že Minimal API konzumuje a produkuje iba `JSON` formát *(Nepodporuje teda ani [Content Negotiation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Content_negotiation) ktorý sa v prípade MVC rieši pomocou [Output formatters](https://learn.microsoft.com/en-us/aspnet/core/web-api/advanced/formatting?view=aspnetcore-8.0#content-negotiation))*.

Sú ale situácie, keď naozaj potrebujete buď iný typ výstupu *(napríklad štandardný `XML`)*, prípadne potrebujete mať proces serializácie viac pod kontrolou a zároveň chcete využiť jednoduchosť a silu Minimal API. Mne sa stala podobná situácia. Potreboval som namiesto `System.Text.Json` serializácie využiť už v tejto dobe “staručký” [Newtonsoft](https://www.newtonsoft.com/json). Ukážem preto ako použiť custom serializér pre výstup z Minimal API. Ukážem to práve na príklade s Newtonsoft, ale rovnaký princíp sa dá použiť aj v prípade ak potrebujete z API vracať napríklad `XML`.

## Demo príklad

Vytvorme si jednoduchý demo príklad `dotnet new webapi -minimal`.

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/products", () => new Product[]
{
    new("Keyboard", "Mechanical keyboard", 100),
    new("Mouse", "Gaming mouse", 50),
    new("Monitor", "4k monitor", 500)
});

app.Run();

public record Product(string Name, string Description, decimal Price);
```

Pomocou jednoduchého endpointu `/products` vrátime zoznam produktov.

## Vlastný `IResult`

Vytvorme si vlastný `IResult`, ktorý bude miesto `System.Text.Json` používať `Newtonsoft`.

```csharp
internal class NewtonsoftJsonResult<T> : IResult
{
    private readonly T _result;

    public NewtonsoftJsonResult(T result)
    {
        _result = result;
    }

    public async Task ExecuteAsync(HttpContext httpContext)
    {
        using var stream = new FileBufferingWriteStream();
        using var streamWriter = new StreamWriter(stream);
        using var jsonTextWriter = new JsonTextWriter(streamWriter);

        var serializer = new JsonSerializer();
        serializer.Serialize(jsonTextWriter, _result);
        await jsonTextWriter.FlushAsync();

        httpContext.Response.ContentType = System.Net.Mime.MediaTypeNames.Application.Json;
        await stream.DrainBufferAsync(httpContext.Response.Body);
    }
}
```

Implementácia nie je až tak dôležitá *(ak potrebujete napríklad už spomínaný `XML` serializér, tak implementácia bude logicky vyzerať ináč)*. Čo je dôležité, tak implementujeme rozhranie `IResult`, ktoré predpisuje jedinú metódu a to `Task ExecuteAsync(HttpContext httpContext)`. Práve v tejto metóde sa deje serializácia dát *(ktoré sme dostali cez konštruktor)* a následne ich zapíšem do `Body` odpoveďe, ktoré máme k dispozícií vez `HttpContext`.

Prvoplánové použitie môže vyzerať nasledovne:

```csharp
app.MapGet("/products", () => new NewtonsoftJsonResult<IEnumerable<Product>>(new Product[]
{
    new("Keyboard", "Mechanical keyboard", 100),
    new("Mouse", "Gaming mouse", 50),
    new("Monitor", "4k monitor", 500)
}));
```

Je to funkčné riešenie, ktoré vo výsledku spraví, to čo potrebujeme. Zápis je ale trochu kostrbatý minimálne z dôvodu nutnosti zadávať dané generikum. Môžeme si na to spraviť nejakú statickú factory metódu, ktorá by daný problém vyriešil. [ASP.NET](http://ASP.NET) Core však na to odporúča vytvoriť vlastnú extension metódu nad značkovacím rozhraním  `IResultExtensions`.

```csharp
public static class NewtonsoftJsonResultExtensions
{
    public static IResult NJson<T>(this IResultExtensions _, T result)
        => new NewtonsoftJsonResult<T>(result);
}
```

Použitie následne vyzerá napríklad takto

```csharp
app.MapGet("/products", () => Results.Extensions.NJson(new Product[]
{
    new("Keyboard", "Mechanical keyboard", 100),
    new("Mouse", "Gaming mouse", 50),
    new("Monitor", "4k monitor", 500)
}));
```

## 🖇️ Odkazy

Dokumentácia - ****[How to create responses in Minimal API apps](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/responses?view=aspnetcore-8.0)****

Demo - [Burgyn/Samples.MinimalApiCustomFormatters (github.com)](https://github.com/Burgyn/Samples.MinimalApiCustomFormatters)