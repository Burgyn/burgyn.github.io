---
layout: post
title: ASP.NET CORE Minimal API - Filters & Validation
tags: [C#,.NET, ASP.NET CORE, Minimal API]
author: Miňo Martiniak
comments: true
image: /assets/images/asp-net-core-minimal-api-filters/cover.png
date: 2023-01-16 22:00:00 +0100
---

![ASP.NET CORE Minimal API - Filters & Validation](/assets/images/asp-net-core-minimal-api-filters/cover.png)

ASP.NET CORE Minimal API je ešte stále relatívna novinka, ktorá okolo seba nesie veľkú diskusiu o tom či je to dobrý alebo zlý koncept.
Ako pri väčšine si myslím, že pravda je niekde uprostred a je to závislé od toho čo chceme robiť. Minimal API je skvelý spôsob ako vytvoriť svoje prvé API. Žiadne komplikované triedy, nastavovanie. Jeden súbor, pár riadkov a je to.

[Vďaka novinkám, ktoré prišli v .NET 7](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-7.0?view=aspnetcore-7.0#minimal-apis), sa Minimal API stáva ešte viac atraktívnym *(Filtes, Route Groups, ..)* aj pri vývoji komplexnejších API.

### Dnes sa pozrieme na to ako využiť vlastné filtre na validáciu dát

Pokiaľ ste doteraz vytvárali API pomocou ASP.NET CORE tak ste s najväčšou pravdepodobnosťou používali triedy, ktoré dedia z `ControllerBase`. Táto trieda obsahuje veľa vecí, ktoré sú pre vás už pripravené. Jednou z nich je aj validácia dát. Všetko čo musíte urobiť je pridať atribút `ApiController` a všetky dáta, ktoré prídu do vašej akcie budú automaticky validované. Ak boli dáta nevalidné tak sa vráti 400 Bad Request.

Prípadne ste mohli validáciu vynútiť aj manuálne pomocou `ModelState.IsValid`.
```csharp
if (!ModelState.IsValid)
{
    //return 400 Bad Request
}
```

Bohužiaľ, alebo možno našťastie toto pri minimal API nemôžeme využiť. Dôvod je ten, že model validation mechanizmus je historicky súčasťou MVC a Minimal API sa cielene snaží očistiť tvorbu API od MVC.

Novinkou .NET 7 sú práve [action filtes](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/min-api-filters?view=aspnetcore-7.0), ktoré sa na to dajú elegantne použiť.
Ja na validáciu rád používam [Fluent Validation](https://docs.fluentvalidation.net/en/latest/). Pridajme si preto do projektu balíček `FluentValidation.AspNetCore` 
`dotnet add package FluentValidation.AspNetCore` a vytvorme si validátor pre zakladanie nového projektu.

```csharp
internal class NewProjectValidator : AbstractValidator<CreateProjetDto>
{
    public NewProjectValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(20);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(100);
    }
}
```

Aby sme mohli použiť tento validátor musíme ho najskôr zaregistrovať. To urobíme v `Program.cs`.

```csharp
builder.Services.AddScoped<IValidator<CreateProjetDto>, NewProjectValidator>();
```

Filter môžeme definovať priamo pri definícií endpointu, ale my chceme tento filter využiť opakovanie, takže si ho definujeme pomocou rozhrania `IEndpointFilter`.

```csharp
internal class ValidationFilter<T> : IEndpointFilter
    where T : class
{
    private readonly IValidator<T> _validator;

    public ValidationFilter(IValidator<T> validator)
    {
        _validator = validator;
    }

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        // 👇 this can be more complicated
        if (context.Arguments.First(a => a is T) is not T model)
        {
            throw new InvalidOperationException("Model is null");
        }

        var validationResult = await _validator.ValidateAsync(model);

        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        return await next(context);
    }
}
```

Náš filter je generický, pričom generikum `T` predstavuje validované dáta. Cez konštruktor si injektneme validátor, ktorý sme si vytvorili vyššie. V metóde `InvokeAsync` najskôr vyhľadáme náš argument, ktorý je typu `T` a potom ho validujeme. Ak validácia prebehne úspešne tak sa zavolá ďalší filter. Ak validácia zlyhá tak sa vráti `400 Bad Request` s chybovou správou pomocou novej triedy `Results`.

Filter pridáme do endpointu pomocou extension metódy `AddEndpointFilter`.

```csharp
app.MapPost("/projects", (CreateProjetDto project) => project)
    .AddEndpointFilter<ValidationFilter<CreateProjetDto>>();
```

Prípadne si môžeme vytvoriť extension metódu, ktorá nám toto zjednoduší.

```csharp
internal static class ValidationFilter
{
    public static IEndpointConventionBuilder WithValidation<T>(this RouteHandlerBuilder builder)
        where T : class
        => builder.AddEndpointFilter<ValidationFilter<T>>();
}
```

Použitie môže vyzerať takto.

```csharp
app.MapPost("/projects", (CreateProjetDto project) => project)
    .WithValidation<CreateProjetDto>();

app.MapPut("/projects/{id}/description", (ChangeProjectDescriptionDto description) => description)
    .WithValidation<ChangeProjectDescriptionDto>();
```

Celý projekt nájdete na GitHub-e [tu](https://github.com/Burgyn/Samples.MinimalApiFilters).