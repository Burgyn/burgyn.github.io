---
layout: post
title: Azure DevOps Pipelines - Asynchronous deployment of multiple services
tags: [Azure, DevOps, CI/CD, YAML, PowerShell]
date: 2020-06-25 17:00:00 +0100
---

If you have a larger project, you probably deploying more services. *(especially if you are developing microservices)* In this article, we will show you how to deploy all services in parallel into the AZURE WebApp and thus significantly reduce deployment time.
<!-- excerpt -->

ZIP deploy to Azure Web App is from the point of view of the machine on which the agent runs in simplicity, the work of a network card that must upload a ZIP file.

Instead of the classic `AzureWebApp@1` to deploy the service, we would rather use `AzureCLI@1` and deploy the service by the [AZURE CLI](https://docs.microsoft.com/en-us/cli/azure/webapp/deployment/source?view=azure-cli-latest#az-webapp-deployment-source-config-zip). We will create a PowerShell script whose input parameter will be a list of microservices to be deployed and a path to the artifact directory.

PowerShell allows us to run multiple jobs in parallel with the `Start-Job` command to run deploy `az webapp deployment source config-zip`. All you have to do is set the `--resource-group` in which your Web App is located, the name of the service where we deploy `--name`, and finally the path to the ZIP file that we are going to deploy `--src`. We will put the running jobs in the `$jobs` variable so that we can wait for `Wait-Job -Job $jobs` to finish.

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

Once the script is complete, we can use it in the deployment pipeline `deploy-cd.yml`.

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

### Azure Parallel Deploy task

Using the PowerShell script is fine, but it's a bit impractical if you have multiple projects where you want to use it. In this case, you must somehow ensure that it is copied to the artifacts. It would be easier if it existed task that can do it. Does not exist directly in the DevOps, but my colleague prepared one. [Azure Parallel Deploy](https://marketplace.visualstudio.com/items?itemName=stano-petko.azure-parallel-deploy)

With him, it can look like this:

```yaml
steps:
- task: AzureParallelDeploy@1
  displayName: Deploy microservices
  inputs:
    ConnectedServiceName: $(azureSubscriptionName)
    ResourceGroup: 'kros-demo-rsg'
    Services: 'ToDos, Authorization, Organizations, ApiGateway'
    AppNameFormat: '{0}-api'
    AppSourceFormat: 'Kros.{0}.zip'
````

### Summary

Instead of approximately **140 seconds**, it now takes approximately **40 seconds** to deploy all four services. It is not exactly a quarter of the time because of course there is some overhead, but the time saved is still noticeable. Every minute saved counts. The team who is waiting for their changes to deploy to testers or customers is sure to thank you. *(Although maybe not out loud )*

> This task *(or the given script)* can also be used in classic UI releases.
