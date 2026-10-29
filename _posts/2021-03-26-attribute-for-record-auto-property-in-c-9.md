---
layout: post
title: Attributes for record auto-property in C#9
tags: [C#,.NET]
date: 2021-03-27 05:00:00 +00:00
comments: true
---

O `record` ako novom spôsobe pre jednoduché a elegantné vytváranie immutable objektov sa popísalo veľa. [Napríklad tu.](https://devblogs.microsoft.com/dotnet/c-9-0-on-the-record/)

Jednou zo zaujímavých vlastností je možnosť využiť syntaxt nazývanú **positional records**.
V tomto prípade môžeme definovať jednotlivé property priamo v konštruktore.

```csharp
public record Person(string FirstName, string LastName);
```

Problém môže nastať, pokiaľ daným property chceme nastaviť atribút. Napríklad `[JsonProperty]`.
Prvoplánovo to môžeme skúsiť nasledovne.

```csharp
public record Person([JsonProperty("name")]string FirstName, string LastName);
```

Keby sme sa však pozreli na skutočne vygenerovaný kód, tak uvidíme niečo nasledovné:

```csharp
// Simplied code 
public class Person : IEquatable<Person>
{
    public string FirstName
    {
        get;
        init;
    }

    public string LastName
    {
        get;
        init;
    }

    public Person([JsonProperty("name")] string FirstName, string LastName)
    {
        this.FirstName = FirstName;
        this.LastName = LastName;
    }
}
```

A to nie je to čo sme chceli. My sme chceli nastaviť ten atribút pre property, nie pre parameter konštruktora.
Samozrejme môžeme použiť tradičnú syntaxt s deklaráciou properties.

```csharp
public record Person
{
    [JsonProperty("name")]
    public string FirstName { get; init; } 

    public string LastName { get; init; }

    public Person(string firstName, string lastName) 
      => (FirstName, LastName) = (firstName, lastName);
}
```

Ale čo keď naozaj chceme použiť **positional records**?

Riešením je použitie `property:`.

```csharp
public record Person([property:JsonProperty("name")]string FirstName, string LastName);
```

> Attributes can be applied to the synthesized auto-property and its backing field by using property: or field: targets for attributes syntactically applied to the corresponding record parameter. [Viď špecifikácia.](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-9.0/records#properties)

Pokiaľ si to pozrieme napríklad cez ILSpy tak uvidíme niečo nasledovné.

```csharp
// Simplied code 
public class Person : IEquatable<Person>
{
    [JsonProperty("name")]
    public string FirstName
    {
        get;
        init;
    }

    public string LastName
    {
        get;
        init;
    }

    public Person(string FirstName, string LastName)
    {
        this.FirstName = FirstName;
        this.LastName = LastName;
    }
}
```

A to je to čo sme chceli dosiahnúť. (Teda aspoň ja 😉)