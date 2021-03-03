---
layout: post
title: Multiple databases with KORM
tags: [C#,.NET Core,ASP.NET Core, KORM]
author: Miňo Martiniak
comments: true
date: 2021-03-02 19:00:00 +0100
---

[KORM](https://github.com/Kros-sk/Kros.KORM) je rýchly a ľahko použiteľný "micro"-ORM framework. To prečo vznikol, aké sú jeho výhody respektíve nevýhody snáď napíšem niekedy nabudúce. Teraz sa povenujem tomu ako ho použiť v prípade, že sa v službe pripájate k viacerím databázam, respektíve máte multitenant systém, kde každý tenant je v samostatnej databáze.

KORM je možné integrovať do `ASP.NET Core` projektu pomocou nuget balíčku [Kros.KORM.Extensions.Asp](https://github.com/Kros-sk/Kros.KORM.Extensions.Asp). Tento balíček vám umožní nakonfigurovať DI kontajner tak, aby ste mohli pohodlne injektovať `IDatabase` do vaších tried `services.AddKorm(Configuration)`. Rovnako vám umožní používať databázové migrácie:

```csharp
services.AddKorm(Configuration)
    .UseDatabaseConfiguration<MasterDbConfiguration>()
    .AddKormMigrations(o =>
    {
        o.AddAssemblyScriptsProvider(Assembly.GetEntryAssembly(), "Sample.KormMultipleDatabases.SqlScripts.MasterDb");
    })
    .Migrate();
```

Viac o migráciach nájdete priamo v [dokumentácií](https://github.com/Kros-sk/Kros.KORM.Extensions.Asp#database-migrations).

Konfigurácia prebehne na základe nastavení connection stringu v konfigurácií:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=ServerName\\InstanceName; Initial Catalog=database; Integrated Security=true"
}
```

Otázka nastáva ako to celé použiť v prípade, že máme viacero databáz, ku ktorým potrebujeme v rámci jednej služby pristupovať. V taktomto prípade potrebujeme rozdielné connection stringy, rozdielne konfigurácie a taktiež rozdielne migračné scripty. Toto všetko KORM podporuje.

Connection string sa definuje štandardným spôsobom, kde ich je možné zadať viacero a pomenovať.

```json
"ConnectionStrings": {
    "FirstDatabase": "Server=localhost;Database=FirstDatabase;Trusted_Connection=True;",
    "SecondDatabase": "Server=localhost;Database=SecondDatabase;Trusted_Connection=True;"
}
```

Extension metódu `AddKorm` je možné zavolať viackrát. Pre každú databázu zvlášť.

```csharp
services.AddKorm(Configuration, "FirstDatabase")
    .UseDatabaseConfiguration<FirstDbConfiguration>()
    .AddKormMigrations(o =>
    {
        o.AddAssemblyScriptsProvider(Assembly.GetEntryAssembly(), "Sample.KormMultipleDatabases.SqlScripts.FirstDatabase");
    })
    .Migrate();

services.AddKorm(Configuration, "SecondDatabase")
    .UseDatabaseConfiguration<SecondDbConfiguration>()
    .AddKormMigrations(o =>
    {
        o.AddAssemblyScriptsProvider(Assembly.GetEntryAssembly(), "Sample.KormMultipleDatabases.SqlScripts.SecondDatabase");
    })
    .Migrate();
```

Pri takejto konfigurácií má každá databáza definovaný samostatný connection string, model builder a aj migračné scripty. Už ostáva len použiť KORM na prístup k databáze.
Miesto injektovania `IDatabase` je potrebné injektnúť `IDatabaseFactory`.

```csharp
public UsersController(IDatabaseFactory databaseFactory)
{
    _databaseFactory = databaseFactory;
}
```

A následne vyžiadať `IDatabase`.

```csharp
[HttpGet]
public IEnumerable<User> GetAll()
{
    using IDatabase database = _databaseFactory.GetDatabase("FirstDatabase")
    database.Query<User>();
}
```

## Multitenant architektúra

Trochu komplikovanejšie je to pri multitenant architektúre, kde každý tenant je v samostatnej databáze a tieto tenanty vznikajú dynamicky.

Tu je potrebné spraviť vlastnú podporu na strane vašej služby. Budete potrebovať spraviť vlastnú factory, ktorá vám poskytne potrebné `IDatabase`.
Rozhranie môže byť veľmi jednoduché:

```csharp
public interface ITenantDatabaseFactory
{
    IDatabase GetDatabase();
}
```

S implementáciou to je už o trochu zložitejšie. Potrebujete zabezpečiť aby sa spustili potrebné migrácie a vytvorila správne nakonfigurovaná `IDatabase`.
Vychádzajme zo scenára, že máme jednú master databázu a pre každý tenant je samostatná databáza, ale so zhodnou štruktúrou a konfiguráciou. Názov tenantu je zhodný s názvom databázy a tento názov sa nachádza v ceste `scheme://host/api/{tenant}/path`.

Impelemtácia potom môže vyzerať nasledovne:

```csharp
public class TenantDatabaseFactory : ITenantDatabaseFactory
{
    private static readonly ConcurrentDictionary<string, Builder> _builders = new ConcurrentDictionary<string, Builder>();
    private readonly KormConnectionSettings _connectionSettings;
    private readonly IServiceCollection _services;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantDatabaseFactory(
        KormConnectionSettings connectionSettings,
        IServiceCollection services,
        IHttpContextAccessor httpContextAccessor)
    {
        _connectionSettings = connectionSettings;
        _services = services;
        _httpContextAccessor = httpContextAccessor;
    }

    public IDatabase GetDatabase()
    {
        string name = GetTenantName();
        Builder builder = _builders.GetOrAdd(name, _ => new Builder(_connectionSettings, _services).Migrate(name));

        return builder.Build(name);
    }

    private string GetTenantName()
    {
        var route = _httpContextAccessor.HttpContext.GetRouteData();

        return route.Values.GetValueOrDefault("tenant").ToString();
    }

    private class Builder
    {
        private readonly KormConnectionSettings _connectionSettings;
        private readonly IServiceCollection _services;

        public Builder(KormConnectionSettings connectionSettings, IServiceCollection services)
        {
            _connectionSettings = connectionSettings;
            _services = services;
        }

        public Builder Migrate(string name)
        {
            new KormBuilder(_services, new KormConnectionSettings()
            {
                ConnectionString = _connectionSettings.GetConnectionString(name),
                AutoMigrate = true
            }).AddKormMigrations(o =>
            {
                o.AddAssemblyScriptsProvider(Assembly.GetEntryAssembly(), "Sample.KormMultipleDatabases.SqlScripts.TenantDb");
            })
            .Migrate();

            return this;
        }

        public IDatabase Build(string name)
            => Database.Builder
            .UseDatabaseConfiguration<TenantDbConfiguration>()
            .UseConnection(_connectionSettings.GetConnectionString(name))
            .Build();
    }
}

public static class KormConnectionSettingsExtension
{
    public static string GetConnectionString(this KormConnectionSettings value, string name)
        => value.ConnectionString.Format(name);
}
```

Názov tenantu získame z `HttpContext`-u.

```csharp
private string GetTenantName()
{
    var route = _httpContextAccessor.HttpContext.GetRouteData();

    return route.Values.GetValueOrDefault("tenant").ToString();
}
```

Pre každý tenant si môžeme držať vlastný `Builder`, ktorý dostane upravený connection string. V prípade, že buidler neexistuje tak sa vytvorí a využije pôvodný `KormBuilder` aby spustil migráciu.
Keď sa požiada o sprístupnenie `IDatabase` tak ho táto factory vytvorí prostredníctvom pôvodného buildera.

```csharp
public IDatabase GetDatabase()
{
    string name = GetTenantName();
    Builder builder = _builders.GetOrAdd(name, _ => new Builder(_connectionSettings, _services).Migrate(name));

    return builder.Build(name);
}
```

`appsettings.json` v tomto prípade môže vyzerať nasledovne:

```json
"ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=MashaDb;Trusted_Connection=True;",
    "TenantDb": "Server=localhost;Database={0};Trusted_Connection=True;"
},
```

> Tento príklad využíva to, že jednotlivý tenanti majú rovnaký connection string s tým, že sa mení len názov databázy. V praxy to pravdepodobne budete mať ináč. Budete mať connection string uložený niekde v KeyVault-e, poprípade budete mať master databázu, kde budete mať viace informácií o tom ako sa pripojiť na správnu databázu. To všetko tu samozrejme môžete použiť.

Konfgurácia DI kontajnera môže vyzerať nasledovne:

```csharp
services.AddKorm(Configuration)
    .UseDatabaseConfiguration<MasterDbConfiguration>()
    .AddKormMigrations(o =>
    {
        o.AddAssemblyScriptsProvider(Assembly.GetEntryAssembly(), "Sample.KormMultipleDatabases.SqlScripts.MasterDb");
    })
    .Migrate();

services.AddScoped<ITenantDatabaseFactory>(f => new TenantDatabaseFactory(
    Configuration.GetKormConnectionString("TenantDb"),
    services,
    f.GetRequiredService<IHttpContextAccessor>()));
}
```

Toto všetko nastavíte raz, následné použitie je už jednoduché.

Napríklad:

```csharp
[Route("api/{tenant}/[controller]")]
[ApiController]
public class WorksController : ControllerBase
{
    private readonly ITenantDatabaseFactory _databaseFactory;

    public WorksController(ITenantDatabaseFactory databaseFactory)
    {
        _databaseFactory = databaseFactory;
    }

    [HttpGet]
    public IEnumerable<Work> GetAll()
    {
        using IDatabase database = _databaseFactory.GetDatabase();

        return database.Query<Work>();
    }
}
```

## Odkazy

- [Demo projekt](https://github.com/Burgyn/Sample.KORMMultipleDatabases)
- [KORM dokumentácia](https://github.com/Kros-sk/Kros.KORM)
- [KORM ASP.NET Extension dokumentácia](https://github.com/Kros-sk/Kros.KORM.Extensions.Asp)