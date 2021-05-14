---
layout: post
title: C# Source Generators - prvý pokus
tags: []
author: Miňo Martiniak
comments: true
date: 2021-05-13 19:00:00 +0100
---

Po C# Source Generátoroch pokukujem odkedy boli predstavené spolu s .NET 5 a C# 9. Plánujem ich využiť na odbúranie učitých "boilerplate" v naších projektoch. Na zoznámenie mi to však prišlo celkom veľké sústo a tak som si vymyslel `ToString` generátor 😉.

## Prečo `ToString`?

Častokrát robievam pri zložitejšom debugovaní to, že si overridujem metódu `ToString`. (Kto z nás to niekedy neurobil? 🙄) Keď bol predstavený nový `record` type, tak sa mi páčilo, že má túto metódu implementovanú tak, že tam vidím všetko podstatné. Preto som si povedal, že Source Generators vyskúšam tak, že si spravím generátor, ktorý implementuje `ToString` za mňa.

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

## Source Generators

V krátkosti. Source Generators sú súčasťou Roslyn kompilátora. Umožňujú vkladať kód do procesu kompilácie za účelom vygenerovania nových súborov (tried), ktoré budú kompilované súčasne s vaším kódom. [Viac info napríklad v tomto blogu](https://devblogs.microsoft.com/dotnet/introducing-c-source-generators/).

> V aktuálnej verzii sa môžu generátory spúšťať už počas editovania vaších zdrojákov, bez nutnosti spustenia kompilácie. Tým pádom už pri zmene vaších zdrojových súborov sa vygeneruje nová verzia generovaných súborov.

## Ako si spraviť vlastný Source Generator?

V prvom kroku si vytvoríme štandardný .NET Standard projekt.

`dotnet new classlib -f netstandard2.0`

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <LangVersion>preview</LangVersion>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.CodeAnalysis.CSharp.Workspaces" Version="3.8.0" />
    <PackageReference Include="Microsoft.CodeAnalysis.Analyzers" Version="3.3.1" PrivateAssets="all" />
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

Váš generátor musí byť odekorovaný atribútom `[Generator]` a implementovať interface `ISourceGenerator`. Tento interface je jednoduchý.

Metóda `Initialize` je volaná raz a pomocou nej môžete inicializovať vaše pomocné štruktúry, analyzovať kód, nachystať si čo potrebujete. V mojom prípade registrujem vlastný `ToStringReceiver` pomocou ktorého identifikujem triedy označené mojim atribútom `[ToString]`.

```csharp
public sealed class ToStringReceiver: ISyntaxReceiver
{
    private static readonly string _attributeShort = nameof(ToStringAttribute).TrimEnd("Attribute");
    private readonly List<ClassDeclarationSyntax> _candidates = new();

    public IEnumerable<ClassDeclarationSyntax> Candidates => _candidates;

    public void OnVisitSyntaxNode(SyntaxNode syntaxNode)
    {
        if (syntaxNode is ClassDeclarationSyntax classSyntax && classSyntax.HaveAttribute(_attributeShort))
        {
            _candidates.Add(classSyntax);
        }
    }
}
```

`HaveAttribute` je moja extension metóda na zistenie či trieda je odekorovaná daným atribútom:

```csharp
 public static bool HaveAttribute(this ClassDeclarationSyntax classDeclaration, string attributeName)
    => classDeclaration?.AttributeLists.Count > 0
        && classDeclaration
            .AttributeLists
                .SelectMany(SelectWithAttributes(attributeName))
                .Any();
```

Takýto receiver môžete registrovať v metóde `Initialize` nasledovne:

```csharp
public void Initialize(GeneratorInitializationContext context)
{
    context.RegisterForSyntaxNotifications(() => new ToStringReceiver());
}
```

Metóda `Execute` slúži na samotné generovanie. Najjednoduchšia implementácia môže vyzerať nasledovne:

```csharp
public void Execute(GeneratorExecutionContext context)
{
    context.AddSource("myGeneratedFile.cs", SourceText.From(@"
namespace GeneratedNamespace
{
public class GeneratedClass
{
    public static void GeneratedMethod()
    {
        // generated code
    }
}
}", Encoding.UTF8));
}
```

Pomocou `context.AddSource` potrebujete pridať nový súbor s jeho názvom a obsahom. To ako vygenerujete váš obsah je čisto na vás.
Stratégia, ktorá sa mi osvečila je v prvom kroku postaviť model toho čo idete generovať. V mojom prípade si zistiť veci ako, namespace, meno tiedy, modifikátor a zoznam properties. Na zistenie týchto vecí som si spravil extension metódy, ktoré sú v súbore [`RoslynExtensions.cs`](https://github.com/Burgyn/MMLib.ToString/blob/main/src/MMLib.ToString.Generator/RoslynExtensions.cs).

Keď máte model, tak vygenerovať obsah je už jednoduché. V mojom prípade by stačil aj `StringBuilder` a vyskladať si danú `partial class` ručne, ale keďže môj cieľ je vytvoriť kompexnejší generátor tak som sa rozhodol použiť [Scriban](https://github.com/scriban/scriban) ako templejtovací "framework".

> ⚠ Aktuálne source generátory neumožňujú upravovať existujúci kód. Umožňujú iba vytvárať nové súbory. Preto pokiaľ chcete pridať novú metódu existujúcej triede, tak ju musíte vytvoriť ako `partial`.

Generovanie kódu s použitím Scriban-u môže vyzerať nasledovne:

```csharp
internal static class SourceCodeGenerator
{
    public static string Generate(ClassModel model)
    {
        var template = Template.Parse(EmbeddedResource.GetContent("PartialClassTemplate.txt"));

        string output = template.Render(model, member => member.Name);

        return output;
    }
}
```

Šablóna `PartialClassTemplate.txt`

{% raw %}

```csharp
//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated by a tool.
// </auto-generated>
//------------------------------------------------------------------------------
{{
    count = Properties.size
    i = 1
}}

/// <summary>
/// Generated partial class for overriding ToString method.
/// </summary>
namespace {{Namespace}}
{
    {{ Modifier }} class {{ Name }}
    {
        /// <summary>
        /// Generated ToString override.
        /// </summary>
        public override string ToString()
            => $"{{ Name }} {%{{{}%}{{~ for prop in Properties ~}} {{prop}} = { {{~ prop -}} }
            {{-
                if i < count
                    ", "
                end
                i = i + 1
            -}}
            {{- end -}}{%{}}}%}";
    }
}
```

{% endraw %}

Ok, s použitím `StringBuilder`-a by to v tomto prípade bolo jednoduchšie. Ale zámerne som si to chcel vyskúšať, keďže to budem chcieť použiť a tušil som problémy. A áno boli. Vysvetlím nižšie.

Finálny `ToStringGenerator` vyzerá nasledovne:

```csharp
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Text;
using System.Text;

namespace MMLib.ToString.Generator
{
    [Generator]
    public class ToStringGenerator : ISourceGenerator
    {
        public void Initialize(GeneratorInitializationContext context)
        {
           context.RegisterForSyntaxNotifications(() => new ToStringReceiver());
        }

        public void Execute(GeneratorExecutionContext context)
        {
            if (context.SyntaxReceiver is ToStringReceiver actorSyntaxReciver)
            {
                foreach (ClassDeclarationSyntax candidate in actorSyntaxReciver.Candidates)
                {
                    (string fileName, string sourceCode) = GeneratePartialClass(candidate, context.Compilation);

                    context.AddSource(fileName, SourceText.From(sourceCode, Encoding.UTF8));
                }
            }
        }

        private static (string fileName, string sourceCode) GeneratePartialClass(
            ClassDeclarationSyntax syntax,
            Compilation compilation)
        {
            CompilationUnitSyntax root = syntax.GetCompilationUnit();
            SemanticModel classSemanticModel = compilation.GetSemanticModel(syntax.SyntaxTree);
            var classSymbol = classSemanticModel.GetDeclaredSymbol(syntax) as INamedTypeSymbol;

            var classModel = new ClassModel(root.GetNamespace(), syntax.GetClassName(),
                syntax.GetClassModifier(), classSymbol.GetProperties());

            string source = SourceCodeGenerator.Generate(classModel);

            return ($"{classModel.Name}-ToString.cs", source);
        }
    }
}
```

Problém so `Scriban`-om, respektíve akoukoľvek knižnicou, ktorú chcete použiť je v tom, že Váš generátor nie je priamo súčasťou výslednej assembly Vášho projektu a pokiaľ to nezabezpečíte ináč, tak pri použití vášho generátora budete dostávať expcetion, že daná knižnica nebola nájdená. Musíte zabezpečiť aby sa daná knižnica dostala priamo do vašeho nuget balíčku.

```xml
<ItemGroup>
    <PackageReference Include="Scriban" Version="3.6.0" PrivateAssets="all" GeneratePathProperty="true" />
    <None Include="$(PkgScriban)\lib\netstandard2.0\*.dll" Pack="true" PackagePath="analyzers/dotnet/cs" Visible="false" />
</ItemGroup>
```

Bližšie vysvetlenie nájdete [sem](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md#use-functionality-from-nuget-packages).

Po použití nuget balíku s generátorom, si môžete vygenerované súbory pozrieť priamo v Dependencies projektu.

![dependencies](/assets/images/generators/generators.png)

## Odkazy

- [Celý projekt](https://github.com/Burgyn/MMLib.ToString)
- [Sumár odkazov a zoznam verejných generátorov](https://github.com/amis92/csharp-source-generators)