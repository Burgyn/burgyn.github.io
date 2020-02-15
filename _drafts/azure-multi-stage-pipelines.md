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
  vmImage: ubuntu-latest

workspace:
  clean: outputs

steps:
  - template: build-steps-core.yml
  - template: build-steps-publish.yml
```

Časť `trigger` definuje udalosti, ktoré spúšťajú daný build. V našom prípade máme podmienku na `master` vetvu a chceme aby sa nový build nespustil pokiaľ neskončil predchádzajúci `batch: true`. [Viac info o triggroch](https://docs.microsoft.com/en-us/azure/devops/pipelines/build/triggers?view=azure-devops&tabs=yaml).

Na buildovanie vášho kódu, alebo jeho nasadzovanie potrebujete jedného alebo viacerých agentov. V rámci DevOps konta máte automaticky jedného free [Microsoft-hosted agenta](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser#microsoft-hosted-agents)

> ⚠ Free agent má obmedzený počet hodín behu za mesiac. Na malý projekt to stačí. Ale pokiaľ spúšťate buildy / nasadzovanie niekoľkokrát denne, tak vám tento čas pravdepodobne dôjde.

V našom prípade použijeme na buildovanie agenta z pripraveného Ubuntu obrazu `vmImage: ubuntu-latest`. Agentov je možné hostovať aj na svojích on-premise mašinách. [Self-hosted agents](https://docs.microsoft.com/en-us/azure/devops/pipelines/agents/agents?view=azure-devops&tabs=browser#install).

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

Potvrdíme zmeny, push-neme ich na server `git add . | git commit -m "Creating build pipeline" | git push` a presunieme sa do [DevOps portálu](https://dev.azure.com).

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

Môžme si ho pomenovať napríklad `Build - Demo - CI`. Na tento názov sa budeme odkazovať v release pipeline.

## Časť 2. - Nasadzovanie

Artefakty máme pripravené. Môžme začať nasadzovať. V tomto príklade budeme nasadzovať do dvoch prostredí. Testing a Production. Po nasadení do testovacieho prostredia spustíme UI a Postman testy a pokiaľ tieto testy prejdú a schválime nasadenie do produkcie, tak swap-neme jednotlivé služby do produkčného prostredia.

Pipeline-a, ktorú ideme vytvárať bude vyzerať nasledovne:
![pipeline](/assets/images/multi-stage-pipelines/pipeline.png)

> Je možné vytvoriť akokoľvek komplexné a sofistikované pipeline-y. Všetko záleží od vašich procesov. Táto je relatívne jednoduchá, ale pokúsim sa na nej ukázať všetky podstatné veci.

### Vytvorenie Azure prostredia

Ak si chcete tento príklad vyskúšať reálne nasadiť, tak si musíte pod svojím Azure kontom vytvoriť potrebné prostredie.
Aby ste to celé nemuseli robiť ručne, pripravil som pre vás [ARM šablónu](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/overview) popisujúcu toto prostredie. Šablónu nájdete v súbore xxxx.

Parametre ktoré je potrebné nastaviť:
 - parameter 1
 - parameter dva
 -

Návod ako použiť ARM šablónu nájdete [sem](https://docs.microsoft.com/en-us/azure/azure-resource-manager/templates/quickstart-create-templates-use-the-portal#edit-and-deploy-the-template).

### Vytvorenie kostry release pipeline-y

Môžme pokračovať v pôvodnom yaml súbore v ktorom sme definovali build. Z viacerých dôvodov je ale vhodné rozdeliť proces zostavenia produktu a jeho deployment. *(Napríklad chcete jednu konkrétnu verziu build-u použiť vo viacerých deployment pipeline-nách, alebo naopak chcete jednu deployment pipelinu použiť viackrát s rôznymi verziami build-u.)*

Do projektu `Kros.AspNetCore.BestPractices` si pridáme yaml súbor s definíciou deployment procesu. Pomenujeme ho napríklad `deploy-demo-cd.yml` *(cd - continuous deployment. Bude sa spúšťať po skončení build-u `Build - Demo- CI`)*.

```yml
trigger: none

resources:
  pipelines:
  - pipeline: ToDosDemoServices
    source: Build - Demo - CI
    trigger: true

stages:
- stage: 'Tests'
  displayName: 'Testing'
  jobs:
  - deployment: Services
    pool:
      vmImage: ubuntu-latest
    environment: Testing
    strategy:
      runOnce:
        deploy:
          steps:
          - download: ToDosDemoServices
            artifact: drop
            displayName: 'Download artifacts'

          - powershell: echo Deploy to testing

- stage: 'Production'
  displayName: 'Production'
  jobs:
  - deployment: Services
    pool:
      vmImage: ubuntu-latest
    environment: Production
    strategy:
      runOnce:
        deploy:
          steps:
          - download: ToDosDemoServices
            artifact: drop
            displayName: 'Download artifacts'

          - powershell: echo Deploy to production
```

Štandardný trigger vypneme `trigger: none`, pretože nechceme aby sa spúšťala po commit-e do vetvy, ale chceme ju spúšťať po úspešnom skončení build pipeline-y.

Pomocou sekcie `resources` vieme pridať odkaz na iné pipeline-y.

```yml
resources:
  pipelines:
  - pipeline: ToDosDemoServices
    source: build-demo-ci
    trigger: true
```

V našom prípade pridávame odkaz na `build-demo-ci`. Pomenujeme ju `ToDosDemoServices` *(na tento názov sa budeme ďalej odkazovať)* a nastavíme ju ako trigger, ktorý bude spúšťať našu deployment pipeline-u `trigger: true`.

Pomocou `stages` rozdelíme našu pipeline-u na dve časti `- stage: 'Tests'` a `- stage: 'Production'`. Pomocou `displayName:` im môžme dať ľudský popis, ktorý sa bude zobrazovať vo vizualizácií procesu. Štandardne jednotlivé stages sa vykonávajú v poradí ako sú definované. Ak toto chceme zmeniť, alebo chceme docieliť zložitejší proces ako napríklad [fan-out fan-in](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/stages?view=azure-devops&tabs=yaml#specify-dependencies), tak môžeme použiť nastavenie `dependsOn:`.

V časti venovanej buildu sme nespomínali takzvané job-y. Pretože v našom prípade sa tam používal jeden implicitný job. Jednotlivé kroky môžme rozdeľovať do [viacerých job-ov](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/phases?view=azure-devops&tabs=yaml). Pokiaľ máme v definovanom pool-e viacerých voľných agentov, tak tieto job-y môžu vykonávať definované kroky na týchto agentoch paralelne. *(Každý agent v danom čase môže vykonávať kroky z jedného job-u.)*

Pre deployment proces sa odporúča použiť špeciálny `- deployment:` typ job-u. Tento typ job-u umožňuje viaceré stratégie deploymentu. Viac sa dočítate v [dokumentácii](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/deployment-jobs?view=azure-devops).

Keď máme definované stages, job-y a statégiu, môžme sa pustiť do definovania jednotlivých krokov.
Ako prvý krok potrebujeme stiahnuť artefakty z nášho build-u. *(pokiaľ máme build a deployment v jednej yaml pipeline tak tento krok môžeme vynechať)*

```yml
- download: ToDosDemoServices
  artifact: drop
  displayName: 'Download artifacts'
```

Sťahujeme artefakty pomenované `drop` z pipeline-y `ToDosDemoServices`.

Ďalšie kroky budeme definovať o chvíľu, zatiaľ si tam dajme len jednoduchý výpis `- powershell: echo Deploy to production`.

Potvrdíme zmeny, push-neme ich na server `git add . | git commit -m "Creating deployment pipeline" | git push` a presunieme sa do [DevOps portálu](https://dev.azure.com), kde pridáme pipeline-u rovnako ako pri build pipeline.

Pokiaľ ideme spustiť túto pipeline-u ručne, tak si môžme zvoliť ktoré stage chceme spustiť.

![select stages](/assets/images/multi-stage-pipelines/selectStages.png)

### Azure service connection

Pokiaľ chceme pomocou Azure DevOps Pipelines nasadzovať do Azure služieb, musíme si pridať spojenie na našu Azure Subscription.

![add azure connection](/assets/images/multi-stage-pipelines/addAzureSubscription1.png)

V nastaveniach projektu zvolíme **Service connection** kde pridáme nové [**Azure Resource Manager**](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops&tabs=yaml#sep-azure-resource-manager) spojenie. Ideálne ak máte jedno konto pre Azure aj Azure DevOps, v tom prípade zvoľte (Automatic) v opačnom prípade (manula).

![add azure connection](/assets/images/multi-stage-pipelines/addAzureSubscription2.png)

### Nasadenie jednej služby

Princíp nasadzovania si ukážeme na jednej zo služieb. Napríklad `ToDos`.

```yml
variables:
  AzureSubscriptionName: 'Demo Azure Subscription'
  ResourceGoupName: 'mino-demo-rsg'

stages:
- stage: 'Tests'
  displayName: 'Testing'
  variables:
    SlotName: 'Testing'
  jobs:
  - deployment: Services
    pool:
      vmImage: ubuntu-latest
    environment: Testing
    strategy:
      runOnce:
        deploy:
          steps:
          - download: ToDosDemoServices
            artifact: drop
            displayName: 'Download artifacts'

          - task: AzureWebApp@1
            displayName: 'Deploy: ToDos'
            inputs:
              azureSubscription: $(AzureSubscriptionName)
              appName: 'mino-demo-todos-api'
              package: '$(Pipeline.Workspace)/ToDosDemoServices/drop/Kros.ToDos.Api.zip'
              deployToSlotOrASE: true
              resourceGroupName: $(ResourceGoupName)
              slotName: $(SlotName)
```

Na nasadenie našej služby do Azure WebApps môžeme použiť task [AzureWebApp@1](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-rm-web-app?view=azure-devops). Ktorému musíme nastaviť `azureSubscription`. Túto hodnotu nastavíme na názov nášho spojenia s Azure. Ďalej `appName` čo je názov vašej Azure WebApps služby kam chcete nasadiť aplikáciu, ktorú daný task hľadá na mieste, ktoré definujete pomocou `package` parametra. využívame tu premennú `$(Pipeline.Workspace)` kde máme stiahnuté naše artefakty. Artefakty z pipeline-y `ToDosDemoServices` sa stiahli do príslušného podadresára. Tieto tri nastavenia stačia pri štandardnom nasadzovaní.

My však chceme využiť možnosti [slotov v Azure WebApps](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots), čo nám umožní pomocou swap-ovania dostiahnuť bezodstávkové nasadzovanie. Preto musíme nastaviť parameter `deployToSlotOrASE: true`, názov resource group-y v ktorej sa nachádza naša služba `resourceGroupName: $(ResourceGoupName)` a názov slotu do ktorého nasadzujeme `slotName: $(SlotName)`.

Miest toho aby sme tieto hodnoty zadávali priamo, definujeme si ich ako premenné. Bude sa nám to ľahšie spravovať a môžme ich používať na viacerých miestach s tým, že definované ich máme len na jednom mieste. Premenné `AzureSubscriptionName` a `ResourceGoupName` si definujeme na úrovni celej pipeline-y. Ale `SlotName` v rámci daného stage, pretože v každom stage potrebujeme inú hodnotu. Premenné je ešte možné extrahovať do šablónu alebo použiť [priamo z DevOps](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml).



  - [ ] Task nasadenie. Daj link na zoznam taskov, poprípade aj marketplace.
  - [ ] Ako pridať názov subscriptions
  - [ ] Daj tu transformáciu. Ale upozorni, že to nie je najlepší spôsob. Daj odkaz na Azure KeyVault
  - [ ] Info o tom ako si u seba vytvoria prostredie.

### Refaktor, aby sme mohli jednoducho nasadiť všetky služby

### Nasadenie Angular aplikácie

### Nasadenie do testovacieho prostredia

### Nasadenie do Staging prostredia

- vysvetliť Environments a approvals

### Swap do produkcie

### Zapnúť CD

### Sumár

### Čo ďalej?

    - asynchrónne nasadzovanie
    - podmienky
    - premenné

### Odkazy

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
