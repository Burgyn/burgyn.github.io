---
layout: post
title: Distribuovanie vašej knižnice spolu s Roslyn analyzérom
tags: [Roslyn, C#, .NET Core, NuGet]
date: 2020-11-04 09:00:00 +0100
comments: true
---

Roslyn .NET kompilačná platforma je tu s nami už zhruba od roku 2011, keď bol zverejnený prvý public download. Odvtedy prešla dlhá doba a jednou pre nás zajznámejšou "vychytávkou" je možnosť písať vlastné analyzéri a k ním prísluchajúce code fixe provideri. Veľa z nás si vyskúšalo spraviť vlastný analyzér, kontrolovanie if-bloku, generovanie fieldu z parametrov konštruktoru, ... V súčasnej dobe keď máme k dispozícií `.editorconfig` a množstvo pripravených analyzérov či už priamo od Microsoftu, alebo projektov ako je napríklad [Roslynator](https://github.com/JosefPihrt/Roslynator), tak potreba písať vlastné analyzéri upadla. Pravdepodobne na väčšinu vaších problémov už nejaký existuje.

To kde to má stále veľký zmysel sú vaše vlastné knižnice. Vy ako autor knižnice viete ako sa má knižnica používať. Čomu sa vyvarovať kvôli výkonu, bezpečnosti. Možno viete dať odporúčanie aký dodržiavať code style kvôli ďalším tool-om, ktoré máte napríklad na automatizovanie generovania dokumentácie. V takomto prípade by ste chceli analyzér distribuovať priamo s vašou knižnicou v jednom NuGet balíčku.

V tomto článku nebudem písať o tom ako si vytvoriť vlastný Roslyn analyzér, o tom je už dosť článkov a videií. (Aj na našom [Dev Meetupe o tom rozprával Jirko Činčura](https://www.youtube.com/watch?v=Rv90NaTxv0E).) Ja sa budem venovať tomu ako to celé zabaliť do jedného NuGet balíčku, aby konzumér vášho balíčku po jeho inštalácií mal rovno nainštalovaný aj prislúchajúci analyzér.

## Demo projekt

Demo projekt sa nachádza na [GitHube](https://github.com/Burgyn/Sample.PackageWithRoslynAnalyzer). Pozostáva z dvoch projektov:

- `Sample.MyFancyPackage` - vymyslená knižnica, s dummy funkčnosťou, na ktorú som napísal analyzér. `.net core`
- `Sample.MyFancyPackageAnalyzer` - analyzér spolu s code fix provider-om pre knižnicu `Sample.MyFancyPackage`

## Ako na to

Potrebujeme vytvoriť priečinok v hlavnom projekte *(projekt, predstavujúci vašu knižnicu)* a do neho pridať dva powershell scripty:
- install.ps1
- uninstall.ps1

> Sú to scripty, ktoré vytvorí šablóna na vytvorenie Roslyn analyzéru. Taktiež sú dostupné [v dokumentácií](https://docs.microsoft.com/en-us/nuget/guides/analyzers-conventions#install-and-uninstall-scripts).

### Úprava `csproj` súboru vašej knižnice

Predpokladám, že vašu knižnicu distribujete ako NuGet balíček. V tom prípade už máte v sekcii `<PropertyGroup>` pridané nastavenie na generovanie balíčka.
```xml
<GeneratePackageOnBuild>true</GeneratePackageOnBuild>
```

Ďalej potrebujeme zabezpečiť aby sa spolu s vašou knužnicou build-oval aj analyzér. To môžte spraviť tak, že jednoducho pridáte referenciu na projekt. V tom prípade sa vám v NuGet balíčku vytvorí závislosť na balíčku vášho analyzéra. Čo v prípade, že analyzér nechcete distribuovať aj samostatne nieje žiadúce. Preto môžte závislosť definovať nasledovne.

```xml
<ItemGroup>
  <ProjectReference Include="..\Sample.MyFancyPackageAnalyzer\Sample.MyFancyPackageAnalyzer\Sample.MyFancyPackageAnalyzer.csproj">
    <ReferenceOutputAssembly>true</ReferenceOutputAssembly>
    <IncludeAssets>Sample.MyFancyPackageAnalyzer.dll</IncludeAssets>
  </ProjectReference>
</ItemGroup>
```

Pomocou takejto referencie zabezpečíte, že analyzér sa bude build-ovať spolu s vašou knižnicou a jeho dll-ka sa dostane do outputu vášho projektu.

Dll-ku analyzéra potrebujeme nakopírovať na prísluchajúce miesto. Microsoft má [odporúčané konvencie](https://docs.microsoft.com/en-us/nuget/guides/analyzers-conventions#analyzers-path-format) kam sa majú tieto analyzéri umiestňovať. V našom prípade to bude `analyzers/dotnet/cs`.
Docielíme to tak, že do `csproj` vašej knižnice pridáme nasledujúcu sekciu.

```xml
<Target Name="_AddAnalyzersToOutput">
  <ItemGroup>
    <TfmSpecificPackageFile Include="$(OutputPath)\Sample.MyFancyPackageAnalyzer.dll" PackagePath="analyzers/dotnet/cs" />
  </ItemGroup>
</Target>
```

A použijeme ju v `<PropertyGroup>` nasledovne:
```xml
<TargetsForTfmSpecificContentInPackage>$(TargetsForTfmSpecificContentInPackage);_AddAnalyzersToOutput</TargetsForTfmSpecificContentInPackage>
```

Potom nám už ostáva zabezpečiť aby sa nám aj scripty z nášho `tools` adresára dostali do outputu.

```xml
<ItemGroup>
  <None Update="tools\*.ps1" CopyToOutputDirectory="Always" Pack="true" PackagePath="tools" />
</ItemGroup>
```

Výsledný `csproj` môže vyzerať nasledovne:

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netcoreapp3.1</TargetFramework>
    <TargetsForTfmSpecificContentInPackage>$(TargetsForTfmSpecificContentInPackage);_AddAnalyzersToOutput</TargetsForTfmSpecificContentInPackage>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
  </PropertyGroup>

  <ItemGroup>
    <ProjectReference Include="..\Sample.MyFancyPackageAnalyzer\Sample.MyFancyPackageAnalyzer\Sample.MyFancyPackageAnalyzer.csproj">
      <ReferenceOutputAssembly>true</ReferenceOutputAssembly>
      <IncludeAssets>Sample.MyFancyPackageAnalyzer.dll</IncludeAssets>
    </ProjectReference>
  </ItemGroup>

  <Target Name="_AddAnalyzersToOutput">
    <ItemGroup>
      <TfmSpecificPackageFile Include="$(OutputPath)\Sample.MyFancyPackageAnalyzer.dll" PackagePath="analyzers/dotnet/cs" />
    </ItemGroup>
  </Target>

  <ItemGroup>
    <None Update="tools\*.ps1" CopyToOutputDirectory="Always" Pack="true" PackagePath="tools" />
  </ItemGroup>
</Project>
```

Na záver vytvoríme NuGet balíček pomocou `dotnet publish`. Takto vytvorený balíček obsahuje ako vašu knižnicu tak aj analyzér, ktorý sa po nainštalovaní tohto balíčku automatický pridá medzi analyzéri v projekte.

## Odkazy

- [Zlepšite si svoj zdrojový kód pomocou Roslyn](https://www.youtube.com/watch?v=Rv90NaTxv0E)
- [How to write a Roslyn Analyzer](https://devblogs.microsoft.com/dotnet/how-to-write-a-roslyn-analyzer/)