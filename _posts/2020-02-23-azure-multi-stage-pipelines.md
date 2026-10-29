---
layout: post
date: 2020-02-23 17:00:00 +0100
title: Azure Multi-Stage Pipelines (časť 1. a 2. - Build a Nasadenie)
tags: [Azure, DevOps, CI/CD, YAML]
comments: true
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

### Vytvorenie kostry deployment pipeline-y

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

Pomocou `stages` rozdelíme našu pipeline-u na dve časti `- stage: 'Tests'` a `- stage: 'Production'`. `displayName:` nám dá ľudský popis, ktorý sa bude zobrazovať vo vizualizácií procesu. Štandardne jednotlivé stages sa vykonávajú v poradí ako sú definované. Ak toto chceme zmeniť, alebo chceme docieliť zložitejší proces ako napríklad [fan-out fan-in](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/stages?view=azure-devops&tabs=yaml#specify-dependencies), tak môžeme použiť nastavenie `dependsOn:`.

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

V nastaveniach projektu zvolíme **Service connection**, kde pridáme nové [**Azure Resource Manager**](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/service-endpoints?view=azure-devops&tabs=yaml#sep-azure-resource-manager) spojenie. Ideálne ak máte jedno konto pre Azure aj Azure DevOps, v tom prípade zvoľte (Automatic) v opačnom prípade (manula).

![add azure connection](/assets/images/multi-stage-pipelines/addAzureSubscription2.png)

### Nasadenie jednej služby

Princíp nasadzovania si ukážeme na jednej zo služieb. Napríklad `ToDos`.

```yml
variables:
  AzureSubscriptionName: 'Demo Azure Subscription'
  ResourceGoupName: 'mino-demo-rsg'
  SlotName: 'Testing'

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

Na nasadenie našej služby do Azure WebApps môžeme použiť task [AzureWebApp@1](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-rm-web-app?view=azure-devops). Ktorému musíme nastaviť `azureSubscription`. Túto hodnotu nastavíme na názov nášho spojenia s Azure. Ďalej `appName` čo je názov vašej Azure WebApps služby kam chcete nasadiť aplikáciu, ktorú daný task hľadá na mieste, ktoré definujete pomocou `package` parametra. Využívame tu premennú `$(Pipeline.Workspace)` kde máme stiahnuté naše artefakty. Artefakty z pipeline-y `ToDosDemoServices` sa stiahli do príslušného podadresára. Tieto tri nastavenia stačia pri štandardnom nasadzovaní.

My však chceme využiť možnosti [slotov v Azure WebApps](https://docs.microsoft.com/en-us/azure/app-service/deploy-staging-slots), čo nám umožní pomocou swap-ovania dostiahnuť bezodstávkové nasadzovanie. Preto musíme nastaviť parameter `deployToSlotOrASE: true`, názov resource group-y v ktorej sa nachádza naša služba `resourceGroupName: $(ResourceGoupName)` a názov slotu do ktorého nasadzujeme `slotName: $(SlotName)`.

Miesto toho aby sme tieto hodnoty zadávali priamo, definujeme si ich ako premenné. Bude sa nám to ľahšie spravovať a môžme ich používať na viacerých miestach s tým, že definované ich máme len na jednom mieste. Premenné `AzureSubscriptionName`, `ResourceGoupName` a `SlotName` si definujeme na úrovni celej pipeline-y. Premenné je ešte možné definovať na úrovni stage-u, extrahovať do šablóny, alebo použiť [priamo z DevOps](https://docs.microsoft.com/en-us/azure/devops/pipelines/library/variable-groups?view=azure-devops&tabs=yaml).

Pokiaľ sme sa nikde nepomýlili, tak po potvrdení zmien by sa nám prva služba mala úspešne nasadiť.

### Refaktor a nasadenie všetkých služieb

Pre nasadzovanie ostatných služieb môžme pridávať rovnakým spôsobom ďalšie kroky. Dá sa to ale aj elegantnejšie. Azure Pipelines podporujú viaceré [expressions](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/expressions?view=azure-devops). Jednou z nich je aj ["Each" Template Expresion](https://github.com/microsoft/azure-pipelines-yaml/blob/master/design/each-expression.md), ktorá sa dá použiť podobne ako bežný `foreach` v ostatých jazykoch.
Samotné nasadenie služieb extrahujeme do šablóny s názvom `deploy-microservice.yml`.


```yml
parameters:
  microservices: []

steps:
- ${{ each microservice in parameters.microservices }}: # Each microservice
  - task: AzureWebApp@1
    displayName: 'Microservice Deploy: ${{microservice}}'
    inputs:
      azureSubscription: $(AzureSubscriptionName)
      appName: 'mino-demo-${{microservice}}-api'
      package: '$(Pipeline.Workspace)/ToDosDemoServices/drop/Kros.${{microservice}}.Api.zip'
      deployToSlotOrASE: true
      resourceGroupName: $(ResourceGoupName)
      slotName: $(SlotName)
```

Vstupným parametrom pre túto šablónu je zoznam názov jednotlivých mikroslužieb `microservices: []`.

> Pri takejto automatizácií ná vedia veľmi pomôcť konvencie názvoslovia. Pokiaľ máme nejaký vzor pre nazývanie služieb, artefaktov, ..., tak si môžme takýmto spôsobom zjednodušiť život.

Pomocou konštrukcie `${{ each microservice in parameters.microservices }}` rozkopírujeme dané kroky *(v našom prípade jeden)* pre každý názov mikroslužby. Na názov konkrétnej služby sa referencujeme pomocou konštrukcie `${{microservice}}`.

Šablónu použijeme v našej pipeline nasledovne:

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

          - template: deploy-microservice.yml
            parameters:
              microservices: ['ToDos', 'Authorization', 'Organizations', 'ApiGateway']
```

> Premenné ako napríklad `$(AzureSubscriptionName)` si v našom prípade môžme dovoliť nechať takto. Preprocessing, ktorý spracováva túto pipelinu rozbaľuje jednotlivé šablóny a inplace-suje ich priamo do pipeline-y. Pokiaľ však túto šablóny chceme mať všeobecnú a použiteľnú aj v iných pipeline-ach / projektoch *(čo asi chceme)*, tak by sme z nich mali spraviť premenné. *(Poprípade poriadne zdokumentovať aké premenné majú byť nastavené pre fungovanie danej šablóny.)*

Takýmto spôsobom sme nasadili všetky potrebné služby. Backend máme nasadený do testovacieho prostredia. Teraz by malo nasledovať spustenie integračných testov. Niekedy v ďalšom článku si ukážeme ako spustiť postman testy.

### Nasadenie Angular aplikácie

Teraz je načase nasadiť klienta. Tak ako sme spomínali na začiatku, tak Angular aplikáciu budeme nasadzovať do Azure Storage Static Websites. Čo v jednoduchosti znamená pomocou [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/get-started-with-azure-cli?view=azure-cli-latest) nakopírovať súbory na blob storage.

Nasadenie klienta máme definované v šablóne `deploy-client.yml`.


```yml
parameters:
  storageAccount: string

steps:
  - download: ToDosDemoClient
    artifact: app
    displayName: 'Download client app artifacts'

  - task: AzureCLI@1
    displayName: 'Delete files from storage'
    inputs:
      azureSubscription: '$(AzureSubscriptionName)'
      scriptLocation: inlineScript
      inlineScript: 'az storage blob delete-batch -s $web --account-name ${{parameters.storageAccount}} --pattern /*'

  - task: AzureCLI@1
    displayName: 'Upload files to storage'
    inputs:
      azureSubscription: '$(AzureSubscriptionName)'
      scriptLocation: inlineScript
      inlineScript: |
        az storage blob upload-batch -d $web --account-name ${{parameters.storageAccount}} -s $(Pipeline.Workspace)/ToDosDemoClient/app/Kros.Angular.BestPractices
```


V prvom kroku samozrejme musíme stiahnúť artefakty. V tomto prípade z pipeline-y, ktorú si pridáme neskôr a pomenujeme ju `ToDosDemoClient`. Angular generuje súborom náhodne znaky, preto skôr ako upload-neme novú verziu, musíme vymazať starú.

Na volanie Azure CLI príkazov použijeme [`AzureCLI@1`](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-cli?view=azure-devops) task. Ktorému nastavíme `azureSubscription` nad ktorou sa príkazy budú spúšťať. Pomocou `scriptLocation` označíme, že script budeme písať priamo v tejto šablóne *(Ak chceme mať script v samostatnom súbore tak to nastavíme na `scriptPath`)*.

Príkazom [`az storage blob delete-batch`](https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az-storage-blob-delete-batch) vymažeme všetky súbory `--pattern /*` z kontajnera `$web` v Storage Account-e `--account-name ${{parameters.storageAccount}}`.

Rovnakým spôsobom upload-neme aj nové súbory z artefaktov umiestnených v `$(Pipeline.Workspace)/ToDosDemoClient/app/Kros.Angular.BestPractices`. Na upload súborov do Blob Storage je možné použiť aj [`AzureFileCopy@3`](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-file-copy?view=azure-devops) task, bohužiaľ tento neakceptuje nastavenú sytémovu proxy a preto na on-premise serveroch s tým býva problém.

Šablónu použijeme v našej pipeline.

```yml
trigger: none

resources:
  pipelines:
  - pipeline: ToDosDemoServices
    source: Build - Demo - CI
    trigger: true

  - pipeline: ToDosDemoClient
    source: Build - Angular - CI
    trigger: true

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

          - template: deploy-microservice.yml
            parameters:
              microservices: ['ToDos', 'Authorization', 'Organizations', 'ApiGateway']

  - deployment: Client
    pool:
      vmImage: ubuntu-latest
    environment: Testing
    strategy:
      runOnce:
        deploy:
          steps:
          - template: deploy-client.yml
            parameters:
              storageAccount: 'minodemostorage'
```

Definujeme si odkaz na pipeline-u, ktorá build-uje našu Angular aplikáciu:

```yml
- pipeline: ToDosDemoClient
  source: Build - Angular - CI
  trigger: true
```

Nasadenie klienta môžme vykonať paralelne s nasadzovaním backend-u, preto pridáme ďalší job `- deployment: Client`. Pokiaľ máme dostatok voľných agentov tak sa nám backend a frontend nasadia súčasne.

Takto pripravená pipeline-a nám nasadi celú našu aplikáciu. Po nasadení nám však aplikácia ešte nebude fungovať, pretože nie je nakonfigurovaná. *(Napríklad chýba connection string na databázu.)* To ako riešiť konfiguráciu systému v Azure prostredí je mimo záber tohto článku. Budem sa tomu venovať neskôr.

V tomto kroku by sa patrilo ešte spustiť UI testy. My na to využívame [cypress](https://www.cypress.io/). V ďalšom článku si ukážeme ako spustiť postman aj cypress testy.

### Swap do produkcie

Po otestovaní aplikácie v testovacom prostredí by sme chceli aplikáciu nasadiť do produkcie. V tejto časti si ukážeme ako na to využiť swapovanie. Swap-ovanie nám umožní využiť to, že naša aplikácia je v teste už "zahriata" a tým sa vyhneme studenému štartu. Taktiež nám to umožní spraviť bezodstávkové nasadzovanie.

Swap-nutie si definujeme v šablone `deploy-swap.yml`.

```yml
parameters:
  microservices: []

steps:
- ${{ each microservice in parameters.microservices }}: # Each microservice
  - task: AzureAppServiceManage@0
    displayName: 'Swap Slots: mino-demo-${{microservice}}-api'
    inputs:
      azureSubscription: $(AzureSubscriptionName)
      WebAppName: 'mino-demo-${{microservice}}-api'
      ResourceGroupName: '$(ResourceGoupName)'
      SourceSlot: $(SlotName)
```


Pomocou task-u [AzureAppServiceManage@0](https://docs.microsoft.com/en-us/azure/devops/pipelines/tasks/deploy/azure-app-service-manage?view=azure-devops) dokážeme menežovať Azure Web Apps. To čo s danou službou chceme urobiť určíme nastavením vlastnosti `action`. V našom prípade ju ale neuvádzame, pretože default hodnota je práve `Swap Slots`, čo chceme.

Celá deploy pipeline-a môže vyzerať nasledovne:

```yml
trigger: none

resources:
  pipelines:
  - pipeline: ToDosDemoServices
    source: Build - Demo - CI
    trigger: true

  - pipeline: ToDosDemoClient
    source: Build - Angular - CI
    trigger: true

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

          - template: deploy-microservice.yml
            parameters:
              microservices: ['ToDos', 'Authorization', 'Organizations', 'ApiGateway']

  - deployment: Client
    pool:
      vmImage: ubuntu-latest
    environment: Testing
    strategy:
      runOnce:
        deploy:
          steps:
          - template: deploy-client.yml
            parameters:
              storageAccount: 'minodemostorage'

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
          - template: deploy-swap.yml
            parameters:
              microservices: ['ToDos', 'Authorization', 'Organizations', 'ApiGateway']
```


Máme hotovú pipelinu-u, ktorá nám nasadí naše služby do testu a následne hneď do produkcie. Málokto z nás má celý proces nasadzovania a automatických testov dotiahnutý tak ďaleko, aby po commit-e do master vetvy mohol nechať automaticky zbehnuť nasadenie až do produkcie. Väčšinou chceme pred nasadením do produkcie nejaký proces schvaľovania. Pri Azure Multi Stage Pipelines na to môžeme využiť [Environments approvals](https://docs.microsoft.com/en-us/azure/devops/pipelines/process/approvals?view=azure-devops&tabs=check-pass). Pri každom stage-y sme definovali vlastnosť `environment:` buďto ako `Testing`, alebo `Production`. Azure DevOps robí audit nad týmtito prostrediami a všetko čo sa nasadzuje potom môžme vidieť pekne prehľadne po jednolivých prostrediach.

![environment](/assets/images/multi-stage-pipelines/environments.png)

Nad daným prostredím vieme vynútiť schvaľovanie. Daný stage sa potom začne vykonávať až po schválení definovanými osobami.

![approvals](/assets/images/multi-stage-pipelines/approvals1.png)

Pomocou ďalších možností ako napríklad Azure Functions / REST API / ... vieme docieliť aj komplikovanejšie / automatizovanejšie scenáre. Napríklad overíte či vo vašom issue tracker-y nie je evidovaná nejaká chyba, ktorá by mohla brániť nasadeniu.

### Sumár

Na rozdiel od klasickému (UI) definovania CI / CD procesu nám Azure Multi Stages Pipelines umožňujú definovať tento proces ako kód a starať sa o neho ako o kód. To nám dáva výhodu verzionovania / proces schvaľovania pomocou Pull Request-ov / prehľadnosť / ... Dokážeme pomocou toho jednoducho spraviť proces nasadzovania jednoduchých aplikácií, ale aj zložité scenáre, ktoré si vyžadujú komplexné systémy.

Azure Multi Stages pipelines sú síce ešte ako preview, ale už v súčasnosti sa dajú plnohodnotne používať na väčšinu scenárov. Microsoft do toho investuje nemalé úsilie, čo je vidieť aj z [Azure DevOps Roadmap-y](https://docs.microsoft.com/en-us/azure/devops/release-notes/features-timeline) pre najbližšie obdobje.

### Čo ďalej?

V najbližej dobe by som sa s Vami chcel ešte podeliť o nasnedovné témy v danej oblasti:

1. Asynchrónne nasadzovanie služieb
2. Spúšťanie "post deploy" testov
