---
layout: post
title: C# Source Generator
tags: [C#,Generators,Roslyn,.NET]
date: 2022-10-10 07:00:00 +0100
comments: true
---

## Čo to je?

C# Source Generators boli predstavené ako novinka spolu s .NET 5. Jedná sa o formu meta programovania, kde na základe metadát môžeme strojovo generovať nový zdrojový kód. Ako metadáta si môžeme predstaviť rôzne značkovacie atribúty, rozhrania ale aj napríklad konvencie, ktoré vo vašom projekte dodržiavate *(prefixy, sufixy, …)* Ide o natívnu súčasť Roslyn kompilátora.

> „If you're familiar with Roslyn Analyzers, you can think of Source Generators as analyzers that can emit C# source code.”

## Ako to funguje?

![Roslyn schema](/assets/images/generators/roslyn.png)

Do procesu kompilácie *(a to je jedno či si napísal `dotnet build` stlačil `F5` vo Visual Štúdiu, ale aj keď len edituješ nejaký kód a Roslyn analyzuje zmenený kód)* pridali nový krok a to spustenie tvojho generátora. Toto generovanie sa deje v dvoch krokoch. V prvom kroku Roslyn ponúkne informácie o tom, čo aktuálne spracováva *(máš k dispozícií syntaktický aj sémanticky model tej časti kódu, ktorú spracováva)*. V tomto kroku sa môžeme rozhodnúť, či nás to zaujíma, alebo nie. Pokiaľ nás to zaujíma, tak v druhom kroku vygenerujeme na základe týchto informácií nový kód. Vygenerovaný kód sa pridá ako vstup do pokračujúcej kompilácie a bude zahrnutý vo výslednom assembly.

Je potrebné povedať, že myšlienka generovania kódu nie je nová. Aj v .NET-e sme to mohli robiť už dávnejšie. Mohli sme si spraviť vlastné scripty a spúšťať ich pred samotným buildom. Toto nám však prináša tú výhodu, že Roslyn kompilátor o novo vygenerovanom kóde vie a teda môže zafungovať všetok očakávaný tooling ako je intellisense, code analysis, …

## Na čo je to dobré?

Za necelé dva roky, čo je to vonku, sa už vykryštalizovali určité use cases, kde to vývojári / komunita využívajú.

### 🔋 Výkon

Tou najväčšou oblasťou sú veci ohľadom zvyšovania výkonu aplikácií. Generátory nám umožňujú zbaviť sa startup a runtime time reflexie. Vznikajú preto rôzne parsery, mappery, serializéry, ktoré sú vygenerované na mieru pre vaše triedy. Nedochádza tam k žiadnej reflexii, zbytočnej alokácií pamäte, … Do tejto sekcie patria aj rôzne nové DI kontajnery, ktoré strom závislosti dokážu vygenerovať už počas buildu a preto zrýchlia štart vašich služieb.

### 🌀 Automatizácia

Ďalšou oblasťou je zjednodušenie si života 🙂. Zbavenie sa rutinne písaného kódu, ktorý nie je nijak kreatívny, ale je potrebné ho napísať, lebo si to vyžaduje napríklad nejaký framework. 

> Ako príklad použijem interface `INotifyPropertyChanged`, ktorý dobre poznajú ľudia čo vyvíjali WPF, alebo Xamarin aplikácie. Tieto frameworky vyžadujú, aby každá property, ktorá má byť bindovatelná musí v `set` metóde notifikovať o zmene. Toto je pekná vec na automatizáciu pomocou Source generátora.

> Ďalšími príkladmi môže byť generovani rôznych proxy tried, DTO tried na základe OpenApi dokumentácie, vlastný DSL, …

## Demo

### ❓Prečo `ToString`?

Častokrát robievam pri debugovaní to, že si overridujem metódu `ToString`. *(Kto z nás to niekedy neurobil? 🙄).* Keď bol predstavený nový `record` type, páčilo sa mi, že má túto metódu implementovanú tak, že tam vidím všetko podstatné. Prišlo mi to ako vhodný kandidát na vyskúšanie C# Source Generators. Ukážem teda ako si vytvoriť vlastný generátor, ktorý `ToString` vygeneruje za nás.

```csharp
[ToString()]
public partial class Person
{
    public int Id { get; set; }

    public string Name { get; set; }

    public Foo Foo { get; set; } = new Foo()
    {
        Id = 1,
        Bar = "bar",
        Created = DateTime.Now,
        Name = "somebody"
    };
}

[ToString()]
public partial class Foo
{
    public int Id { get; set; }

    public string Bar { get; set; }

    public string Name { get; set; }

    public DateTime Created { get; set; }
}

var p = new Person() { Id = 1, Name = "Nobody" };
Console.WriteLine(p); 
//Output:
//Person {Id = 1, Name = Nobody, Foo = Foo {Id = 1, Bar = bar, Name = somebody, Created = 24. 4. 2021 20:39:04}}
```

### 💻 **Ako si spraviť vlastný Source Generator?**

V prvom kroku si vytvoríme štandardný .NET Standard projekt.

`dotnet new classlib -f netstandard2.0`

```xml
<Project Sdk="Microsoft.NET.Sdk">
	<PropertyGroup>
		<!-- 👇 Musí to byť zacielené voči netstandard 2.0 -->
		<TargetFramework>netstandard2.0</TargetFramework>
		<!-- 👇 Pre jednoduchšie debugovanie -->
		<IsRoslynComponent>true</IsRoslynComponent>
		<BuildOutputTargetFolder>analyzers</BuildOutputTargetFolder>
	</PropertyGroup>

	<ItemGroup>
		<!-- 👇 Potrebné balíčky -->
		<PackageReference Include="Microsoft.CodeAnalysis.Analyzers" Version="3.3.3" PrivateAssets="all" />
		<PackageReference Include="Microsoft.CodeAnalysis.CSharp.Workspaces" Version="3.11.0" PrivateAssets="all" />
	</ItemGroup>
</Project>
```

Následne si už môžeme do projektu pridať vlastný generátor:

```csharp
namespace MMLib.ToString.Generator
{
    [Generator]
    public class ToStringGenerator : ISourceGenerator
    {
        public void Execute(SourceGeneratorContext context)
        {
            // Source generator
        }

        public void Initialize(InitializationContext context)
        {
            // Some initialization
        }
    }
}
```

Generátor musí byť odekorovaný atribútom `[Generator]` a implementovať interface `ISourceGenerator`. Tento interface je jednoduchý, vyžaduje len dve metódy `Initialize` a `Execute`.

Metóda `Initialize` je volaná raz a pomocou nej môžete inicializovať vaše pomocné štruktúry, analyzovať kód, nachystať si, čo potrebujete. V mojom prípade registrujem vlastný `ToStringReceiver` pomocou ktorého identifikujem triedy označené mojim atribútom `[ToString]`.

```csharp
public sealed class ToStringReceiver: ISyntaxReceiver
{
    private static readonly string _attributeShort = nameof(ToStringAttribute).TrimEnd("Attribute");
    private readonly List<ClassDeclarationSyntax> _candidates = new();

    public IEnumerable<ClassDeclarationSyntax> Candidates => _candidates;

    public void OnVisitSyntaxNode(SyntaxNode syntaxNode)
    {
		// 👇 Ak sa jedná o deklaráciu triedy a tá trieda je odekorovaná mojím atribútom tak je to môj kandidát
        if (syntaxNode is ClassDeclarationSyntax classSyntax && classSyntax.HaveAttribute(_attributeShort))
        {
            _candidates.Add(classSyntax);
        }
    }
}
```

`HaveAttribute` je extension metóda na zistenie či trieda je odekorovaná daným atribútom:

```csharp
public static bool HaveAttribute(this ClassDeclarationSyntax classDeclaration, string attributeName)
    => classDeclaration?.AttributeLists.Count > 0
        && classDeclaration
            .AttributeLists
                .SelectMany(SelectWithAttributes(attributeName))
                .Any();
```

Tento receiver je registrovaný v metóde `Initialize`.

```csharp
public void Initialize(GeneratorInitializationContext context)
{
    context.RegisterForSyntaxNotifications(() => new ToStringReceiver());
}
```

Metóda `Execute` slúži na samotné generovanie. Najjednoduchšia implementácia môže vyzerať nasledovne:

```csharp
public void Execute(GeneratorExecutionContext context)
{
    // 👇 Generate ToStringAttribute.
    const string attribute = @"
using System;
namespace ToString
{
[AttributeUsage(AttributeTargets.Class, AllowMultiple = false, Inherited = true)]
public class ToStringAttribute: Attribute
{
}
}";
    context.AddSource("Attribute.cs", SourceText.From(attribute, Encoding.UTF8));
}
```

> V tomto prípade som si vygeneroval samotný `ToString` atribút, ktorý chcem, aby klientský programátor použil na odekorovanie triedy, pre ktorú sa má generovať `ToString` override. Je bežná prax, že pomocné / značkovacie atribúty / rozhrania sa do výsledného assembly generujú a nie referencujú ako pomocná knižnica.
> 

To ako budeš generovať výsledný kód je čisto na tebe. Niekedy stačí jednoduchý `string`. Inokedy je vhodnejšie použiť `StringBuilder` a v špecifických prípadoch je správne použiť rôzne templejtovacie frameworky ako je napríklad `Scriban`. V tomto prípade bude úplne stačiť práve `StringBuilder`. Pri generovaní sa mi osvedčila technika, že najskôr si pripravím potrebné dáta do podoby, ktorá mi vyhovuje a až následne spustím samotné generovanie.

```csharp
// 👇 Model predstavujúci dáta potrebné pre generovanie ToString override.
internal class ClassModel
{
    public string Namespace { get; set; }

    public string Name { get; set; }

    public string Modifier { get; set; }

    public string[] Properties { get; set; }
}

// 👇 Získanie dát potrebných pre generovanie
private static ClassModel GenerateModel(
    ClassDeclarationSyntax classDeclaration,
    Compilation compilation)
{
    CompilationUnitSyntax root = classDeclaration.GetCompilationUnit();
    SemanticModel classSemanticModel = compilation.GetSemanticModel(classDeclaration.SyntaxTree);
    var classSymbol = classSemanticModel.GetDeclaredSymbol(classDeclaration);

    return new ClassModel()
    {
        Namespace = root.GetNamespace(),
        Name = classDeclaration.GetClassName(),
        Modifier = classDeclaration.GetClassModifier(),
        Properties = classSymbol.GetProperties()
    };
}
```

Samotné generovanie je potom už jednoduché:
```csharp
private static string Generate(ClassModel model)
{
    var sb = new StringBuilder();

    sb.Append($@"
namespace {model.Namespace}
{{
{model.Modifier} class {model.Name}
{{
public override string ToString()
=> $""");

    for (int i = 0; i < model.Properties.Length; i++)
    {
        string prop = model.Properties[i];
        sb.Append($"{prop} = {{{prop}}}");
        if (i < model.Properties.Length - 1)
        {
            sb.Append(", ");
        }
    }

    sb.Append("\";}}");

    return sb.ToString();
}
```

Generovanie vykonáme v metóde `Execute`.

```csharp
// 👇 Prechádzam všetkých kandidátov.
foreach (ClassDeclarationSyntax candidate in actorSyntaxReciver.Candidates)
{
    // 👇 Vygenerujem model.
    ClassModel model = GenerateModel(candidate, context.Compilation);

    // 👇 Ak trieda neobsahuje partial modifikátor, tak reportujem informáciu pre klientského programátora.
    if (!model.Modifier.Contains("partial"))
    {
        context.ReportMissingPartialModifier(candidate);
        continue;
    }

    // 👇 Generujem kód.
    string code = Generate(model);

    // 👇 Vygenerovaný kód pridám ako vstup pre ďalší proces kompilácie.
    context.AddSource($"{model.Name}.cs", SourceText.From(code, Encoding.UTF8));
}
```

Po použití nuget balíku s generátorom, si môžeš vygenerované súbory pozrieť priamo v Dependencies projektu.

![https://blog.burgyn.online/assets/images/generators/generators.png](https://blog.burgyn.online/assets/images/generators/generators.png)

## 🔗 Užitočné odkazy

### Demo projekt

[Burgyn/Sample.Meetup.Generators.AllInOne (github.com)](https://github.com/Burgyn/Sample.Meetup.Generators.AllInOne)

### Dokumentácia

[Source Generators](https://learn.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/source-generators-overview)

[dotnet/roslyn (github.com)](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.md)

[cookbook dotnet/roslyn (github.com)](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md)

### Generátory z našej dielne

[Kros-sk/Kros.SourceGenerators.PropertyAccessors (github.com)](https://github.com/Kros-sk/Kros.SourceGenerators.PropertyAccessors)

[Kros-sk/Kros.Generators.Flattening (github.com)](https://github.com/Kros-sk/Kros.Generators.Flattening)

[Burgyn/MMLib.MediatR.Generators (github.com)](https://github.com/Burgyn/MMLib.MediatR.Generators)

### Iné

[https://github.com/amis92/csharp-source-generators](https://github.com/amis92/csharp-source-generators)