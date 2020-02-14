---
layout: post
title: Azure Multi-Stage Pipelines
tags: [Azure, DevOps, CI/CD, .NET Core, ASP.NET Core]
author: Miňo Martiniak
---

Azure DevOps umožňuje dva spôsoby, ako vytvoriť Continuous Deployment. Môžme použiť *classic* UI editor, alebo nový spôsob pomocou YAML súboru, kde jednotlivé kroky, job-y, stage verziujeme ako kód priamo v source control-e. Tento druhý spôsob sa nazýva [Multi-Stage Pipelines](https://devblogs.microsoft.com/devops/whats-new-with-azure-pipelines/). Pomocou Multi-Stage Pipelines dokážete vytvoriť proces nasadzovania od build-u, spustenia testov, nasadenia do rôznych prostredí *(napríklad, Development, Staging, Production, ...)* rozdelením na takzvané stages. Práve tento spôsob si ukážeme v tomto poste.

![stages](/assets/images/multi-stage-pipelines/stages.png)

## Čo potrebujeme

- [Azure account](https://azure.microsoft.com/en-us/free/)
- [Azure DevOps account](https://azure.microsoft.com/en-us/services/devops/)
- Zapnúť Public preview feature

  *Multi-Stage Pipelines sú v čase písania tohto článku ešte public preview a v DevOps portáli ich je potrebné zapnúť.*

  ![preview feature](/assets/images/multi-stage-pipelines/preview-feature.png)

## Čo budeme nasadzovať?

Vyskúšame nasadiť demo aplikáciu, ktorá pozostáva z mikroslužieb postavených na ASP.NET Core frameworku a Angular-ového klienta. Mikroslužby nasadíme do [Azure Web Apps](https://azure.microsoft.com/en-us/services/app-service/web/) a klienta do [static website v Azure Storage](https://docs.microsoft.com/en-us/azure/storage/blobs/storage-blob-static-website).

![architecture](/assets/images/multi-stage-pipelines/architecture.png)

> Demo si môžete forknúť na GitHub-e. [Mikroslužby](https://github.com/Kros-sk/Kros.AspNetCore.BestPractices), [Angluar klient](https://github.com/Kros-sk/Kros.Angular.BestPractices).

## Časť 1. - Build

*(Ak yaml build pipeline-u ovládate, môžete preskočiť rovno na časť nasadzovania [Časť 2. - Nasadzovanie](#&#x10D;as&#x165;-2---nasadzovanie).)*

V prvom kroku musíme naše projekty zbuildovať. Do projektu `Kros.AspNetCore.BestPractices` si pridáme yaml súbor s definíciou buildu. Pomenujeme ho napríklad `build-demo-ci.yml` *(ci - continuous integrations. Bude sa spúšťať po každom commit-e do master vetvy)*.

>💡 Odporúčam umiestňovať yaml súbory do zvlášť adresára. Napríklad `pipelines`.

```yml
trigger:
  batch: true
  branches:
    include: [ 'master' ]

pool:
  vmImage: ubuntu-16.04

workspace:
  clean: outputs

steps:
  - template: build-steps-core.yml
  - template: build-steps-publish.yml
```

Časť `trigger` definuje udalosti, ktoré spúšťajú daný build. V našom prípade máme podmienku na `master` vetvu a chceme aby sa nový build nespustil pokiaľ neskončil predchádzajúci `batch: true`. [Viac info o triggroch](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers?view=azure-devops&tabs=yaml).

Na buildovanie vášho kódu, alebo jeho nasadzovanie potrebujete jedného alebo viacerých agentov. V rámci DevOps konta máte automaticky jedného free [Microsoft-hosted agenta](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser#microsoft-hosted-agents)

> ⚠ Free agent má obmedzený počet hodín behu za mesiac. Na malý projekt to stačí. Ale pokiaľ spúšťate buildy / nasadzovanie niekoľkokrát denne, tak vám tento čas pravdepodobne dôjde.

V našom prípade použijeme na buildovanie agenta z pripraveného Ubuntu obrazu `vmImage: ubuntu-16.04`. Agentov je možné hostovať aj na svojích on-premise mašinách. [Self-hosted agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser#install).

> 💡 Pokiaľ máte Visual Studio Enterprise licenciu, tak na každú takúto licenciu máte jedného [Self-hosted agenta zadarmo](https://docs.microsoft.com/en-us/azure/devops/organizations/billing/buy-more-build-vs?view=azure-devops#self-hosted-private-projects).

Celý proces build-ovacej pipeliny pozostáva z niekoľkých krokov. Napríklad: build, spustenie testov, exportovanie výsledkov testov pre budúce zobrazenie, publish projektu a publish [artefaktov](https://docs.microsoft.com/en-us/azure/devops/pipelines/artifacts/artifacts-overview?view=azure-devops) pre nasadenie. Tieto kroky sa definujú v časti `steps` pomocou task-ov. K dispozícií je veľké množstvo preddefinovaných [task-ov](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/?view=azure-devops), task-ov z [marketplace-u](https://marketplace.visualstudio.com/search?target=AzureDevOps&category=Azure%20Pipelines&sortBy=Installs), alebo si môžte vytvoriť [vlastný task](https://www.parksq.co.uk/azure-dev-ops/custom-build-tasks).

Jednolitvé kroky / skupiny krokov môžme extrahovať do samostatných súborov a tieto súbory využívať v rôznych pipeline-ach `- template: build-steps-core.yml` *(je to jednoduchšie ako vytvárať custom task)*. Najjednoduchšie je, keď máte túto šablónu v rovnakom repe ako v našom prípade. Ale je možné všeobecné šablóny umiestňovať do samostatného repa.

Napríklad:

```yml
resources:
  repositories:
    - repository: templates
      type: git
      name: DevShared/Templates
```

Kroky pre samotný build máme definované v súbore `pipelines/build-steps-core.yml`.

{% raw %}

```yml
parameters:
  buildConfiguration: 'Release'
  buildVerbosity: 'minimal'

steps:
  - task: DotNetCoreCLI@2
    displayName: Build
    inputs:
      projects: '**/*.csproj'
      arguments: '--configuration ${{ parameters.buildConfiguration }} --verbosity ${{ parameters.buildVerbosity }}'

  - task: DotNetCoreCLI@2
    displayName: Test
    inputs:
      command: 'test'
      projects: '**/*.csproj'
      arguments: '--configuration ${{ parameters.buildConfiguration }} --verbosity ${{ parameters.buildVerbosity }}'
```

{% endraw %}

[DotNetCoreCLI@2](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/build/dotnet-core-cli?view=azure-devops) je task pre využívanie [dotnet core cli](https://docs.microsoft.com/en-us/dotnet/core/tools/?tabs=netcore2x). V tomto prípade ho využívame na build a spustenie testov.

V ďalšom kroku si musíme vypublikovať artefakty `build-steps-publish.yml`

```yml
parameters:
  buildConfiguration: 'Release'
  buildVerbosity: 'minimal'

steps:
  - task: DotNetCoreCLI@2
    displayName: Publish
    inputs:
      command: publish
      projects: '**/*.csproj'
      arguments: '--configuration ${{ parameters.buildConfiguration }} --verbosity ${{ parameters.buildVerbosity }} --output "$(Build.ArtifactStagingDirectory)"'
      publishWebProjects: false
      modifyOutputPath: true
      zipAfterPublish: true

  - task: CopyFiles@2
    displayName: 'Copy tests from /tests/PostDeployTests to Artifacts'
    inputs:
      SourceFolder: '$(Build.SourcesDirectory)/tests/Services/PostDeployTests'
      Contents: '**'
      TargetFolder: '$(Build.ArtifactStagingDirectory)/PostDeployTests'
      OverWrite: true

  - task: CopyFiles@2
    displayName: 'Copy templates definition from /pipelines to artifact pipelines'
    inputs:
      SourceFolder: '$(Build.SourcesDirectory)/pipelines'
      Contents: '**'
      TargetFolder: '$(Build.ArtifactStagingDirectory)/pipelines'
      OverWrite: true

  - task: PublishBuildArtifacts@1
    displayName: 'Publish Artifacts'
    inputs:
      PathtoPublish: '$(Build.ArtifactStagingDirectory)'
```

Skôr ako vypublikujeme artefakty do adresára definovaného [premennou](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/variables?view=azure-devops&tabs=yaml) `$(Build.ArtifactStagingDirectory)`, tak si ešte k artetaktom, pomocou task-u [CopyFiles@2](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/utility/copy-files?view=azure-devops&tabs=yaml), nakopírujeme ďalšie súbory, ktoré neboli súčasťou buildu, ale chceme ich pre ďalšie použitie v release pipelnie. V našom prípade tam budeme kopírovať súbory z adresára `/tests/Services/PostDeployTests` a `pipelines`.

Potvrdíme zmeny, pushneme ich na server `git add . | git commit -m "Creating build pipeline" | git push` a presunieme sa do [DevOps portálu](https://dev.azure.com).

V DevOps musíme mať založený projekt. V projekte sa presunieme do sekcie Pipelines a ideme pridať novú pipeline-u definovanú v GitHub repe.

![new pipeline](/assets/images/multi-stage-pipelines/newPipeline.png)

Voči GitHub-u je potrebné sa autorizovať , aby ste mohli pridať build pre vaše repo.

![github authorization](/assets/images/multi-stage-pipelines/authorizeGitHub.png)

Po vybraní repa, v ktorom sa nachádza vaša nová pipeline-a musíme ešte zvoliť, že ideme použiť existujúci YAML súbor a nie vytvárať nový.

![existing ymal file](/assets/images/multi-stage-pipelines/existingYamlFile.png)

Ostáva už len uložiť a spustiť. Je možné, že pri prvom spustení budete musieť povoliť prístup k resourcom.

![permit](/assets/images/multi-stage-pipelines/permit.png)

Ak sme všetko spravili správne, tak by náš prvý build mal úspešne zbehnúť.

![success run](/assets/images/multi-stage-pipelines/successRun.png)

> 💡 Takýto build vieme vyžadovať aj pri PR. To znamená, že pokiaľ nám neprejde build, alebo zlyhá nejaký test, tak automaticky nedovolíme schválenie PR. Odporúčam pre build, ktorý sa bude spúšťať v rámci PR vytvoriť samostatnú pipeline-u, kde nebudeme publikovať artefakty. Tie nie sú v tomto prípade potrebné a zrýchlime tak odozvu na náš PR.

Build Angular projektu vytvoríme veľmi podobne, preto to tu nebudem rozpisovať. Príklad ako to môže vyzerať nájdete priamo v [damom projekte](https://github.com/Kros-sk/Kros.Angular.BestPractices/blob/master/pipelines/build-angular-ci.yml).

Ešte typ na záver tejto časti. Azure DevOps nazval vašu pipeline-u podľa vášho projektu. Ak ju chcete premenovať urobíte to tak, že vyberiete danú pipeline-u a z menu zvolíte Rename / Move. *(už párkrát som to nevedel nájsť 😔)*

![rename](/assets/images/multi-stage-pipelines/rename.png)

## Časť 2. - Nasadzovanie

- [ ] vytvoriť yml súbor
- [ ] Dať tam kostru releasu
  - [ ] Vysvetliť resource. Odkaz na inú pipeline, trigger (zatiaľ zakomentovaný) Odkaz na ostatné možnosti.
  - [ ] Stages. Čo to je, čo je potrebné nastaviť. Depends, ...
  - [ ] Jobs, deployment, strategy
  - [ ] Steps
    - [ ] download artifacts
    - [ ] pws
- [ ] commit, push, pridaj info ako to pridať do pipelines

## Nasadenie jednej služby

  - [ ] Task nasadenie. Daj link na zoznam taskov, poprípade aj marketplace.
  - [ ] Ako pridať názov subscriptions
  - [ ] Daj tu transformáciu. Ale upozorni, že to nie je najlepší spôsob. Daj odkaz na Azure KeyVault
  - [ ] Info o tom ako si u seba vytvoria prostredie.

## Refaktor, aby sme mohli jednoducho nasadiť všetky služby

## Nasadenie Angular aplikácie

## Nasadenie do testovacieho prostredia

## Nasadenie do Staging prostredia

- vysvetliť Environments a approvals

## Swap do produkcie

## Zapnúť CD

## Sumár

## Čo ďalej?

    - asynchrónne nasadzovanie

## Odkazy

Poznámky:

- [x] čo to je a prečo nie release. Výhody
- [ ] Predstavnie demo príkladu
    - [ ] Upratať demo
    - [ ] Vysvetliť ako si vytvoria prostredie
- [ ] Spraviť build. Jednoducho. Dať odkaz na nejaký blog. Veď o tomto je ich dosť.
- [ ] Začať robiť deploy
    - [ ] vysveliť teda tie stage.
    - [ ] DEV - STAGING - PRODUCTION
    - [ ] vysvetliť Fun in fun out, ...
    - [ ] vysvetliť deploy job
    - [ ] Nasadiť jednu službu
    - [ ] Vysvetliť premenné
    - [ ] použiť powershell script
    - [ ] celé to nasadiť z templaty
    - [ ] pridať ďalší job na clienta
- [ ] Ukázať a vysvetliť environments
    - [ ] spraviť approvals
- [ ] nasadiť do STAGING
- [ ] swap do produkcie
