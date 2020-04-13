---
layout: post
title: Azure Multi-Stage Pipelines (časť 3. - Asynchrónne nasadenie viacerých služieb)
tags: [Azure, DevOps, CI/CD, YAML, PowerShell]
author: Miňo Martiniak
---

Pri väčšom projekte s veľkou pravdepodobnosťou nasadzujete viaceré služby. *(hlavne pokiaľ vyvíjate mikroslužby)* V tomto článku si ukážeme, ako môžme výrazne skrátiť čas nasadzovania celého riešenia do AZURE Web Apps.
<!-- excerpt -->

V predchádzajúcom článku [Azure Multi-Stage Pipelines (časť 1. a 2. - Build a Nasadenie)]({% post_url 2020-02-23-azure-multi-stage-pipelines %}) som ukázal, ako môžme nasadiť ASP.NET Core API do Azure Web Apps. Teraz na to nadviažem a upravíme nasadzovaciu pipeline-u tak, aby sme výrazne skrátili čas nasadzovania.

Jednotlivé služby sú na sebe nezávislé a je preto možné ušetriť čas tým, že ich nasadíme paralelne. Najjednoduchšie by bolo využiť viacerých agentov. *(pre každú službu iného)* Avšak takýmto spôsobom by sme kvôli jednému nasadzovaniu použili veľa agentov, ktorí by mohli chýbať. *(pravdepodobne by ste blokovali prácu ďalších ľudí v tíme, alebo ostatné tími vo vašej firme. Build PR, spúšťanie testov, ďalšie nasadzovanie, ...)* Preto sa to pokúsime spraviť vrámci jedného job-u.

ZIP deploy do Azure Web App je z pohľadu mašiny na ktorej beží daný agent v jednoduchosti povedané len práca sieťovej karty, ktorá musí uploadnúť ZIP súbor. Preto sa daný agent pri tomto task-u viac menej fláka.

Namiesto klasického task-u `AzureWebApp@1` na sadenie služby použijeme radšej `AzureCLI@1` a nasadíme službu pomocu [AZURE CLI](https://docs.microsoft.com/en-us/cli/azure/webapp/deployment/source?view=azure-cli-latest#az-webapp-deployment-source-config-zip). Vytvoríme si PowerShell script, ktorého vstupným parametrom bude zoznam mikroslužieb, ktoré treba nasadiť a cesta k adresáru s artefaktmi.

>💡 V našom prípade môžme ťažiť z toho, že máme pattern pre nazývanie služieb v AZURE aj pre názvy projektov. Preto stačí ako parameter poslať zoznam názvov služieb.

PowerShell nám umožňuje pomocou príkazu `Start-Job` spustiť paralelne viacero job-ov v rámci ktorých spustíme deploy `az webapp deployment source config-zip`. Stačí mu nastaviť `--resource-group` v ktorej sa nachádza vaša Web App, ďalej názvo služby kam nasadzujeme `--name` a nakoniec cestu k ZIP súboru, ktorý ideme nasadzovať `--src`. Spustené joby si odložíme do premennej `$jobs` aby sme mohli počkať na ich dokončenie `Wait-Job -Job $jobs`.

```pwsh
param (
    [Parameter(Mandatory = $true)][String[]]$microservices,
    [Parameter(Mandatory = $true)][String]$artifactPath
)

$jobs = @()
ForEach ($service in $microservices) {
    Write-Host "Start deploying microservice: " $service -ForegroundColor Green
    $jobs += Start-Job -ArgumentList $service, $artifactPath -ScriptBlock {
        param($name, $path)
            $result = az webapp deployment source config-zip --resource-group kros-demo-rsg --name kros-demo-$name-api --src "$path/Kros.$name.Api.zip"
            if (!$result){
                throw "Microservice ($name) failed. More information: $result"
            }
    }
}

Wait-Job -Job $jobs

$failed = $false

foreach ($job in $jobs) {
    if ($job.State -eq 'Failed') {
        Write-Host ($job.ChildJobs[0].Error) -ForegroundColor Red
        $failed = $true
    }
}

if ($failed -eq $true) {
   Write-Host 
   Write-Error "Microservices deploy failed."
}
```

Keď máme script dokončený, môžme ho použiť v deployment pipeline `deploy-cd.yml`.

```yaml
- task: AzureCLI@2
  displayName: Deploy microservices
  inputs:
    azureSubscription: $(azureSubscriptionName)
    scriptType: ps
    scriptLocation: scriptPath
    scriptPath: '$(Pipeline.Workspace)\ToDosDemoServices\drop\pipelines\Deploy-Async.ps1'
    arguments: -microservices 'ToDos', 'Authorization', 'Organizations', 'ApiGateway' -artifactPath '$(Pipeline.Workspace)\ToDosDemoServices\drop\'
```

### Kros.XXX task

Používanie PowerShell scriptu je fajn, ale je to trošku nepraktické pokiaľ máte viac projektov, kde ho chcete použiť. V takom prípade musíte nejakým spôsobom zabezpečiť jeho nakopírovanie k artefaktom. Jednoduchšie by bolo keby existoval v DevOps task, ktorý to dokáže spraviť. Priamo v rámci DevOps taký nie je, ale spolu s kolegom sme jeden taký pripravili. XXXX

### Sumár

Miesto pôvodných zhruba **140 sekúnd** teraz trvá nasadenie všetkých štyroch služieb približne len **40 sekúnd**. Nie je to presne štvrtina času, pretože je s tým samozrejme spojená určitá réžia, ale aj tak ušetrený čas je citeľný. Každá ušetrená minúta sa počíta. Tím, ktorý čaká kým sa jeho zmeny nasadia aby sa dostali k testerom alebo zákazníkom sa vám určite poďakuje. *(Aj keď možno nie nahlas 😊)*

> Tento task *(respektíve aj daný script)* sa dá použiť aj v klasických UI release pripelne-nách.