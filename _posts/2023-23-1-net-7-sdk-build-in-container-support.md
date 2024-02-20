---
layout: post
title: ".NET 7 SDK - build-in container support"
tags: [dotnet, C#, docker]
comments: true
image: /assets/images/net7-docker-build-in/NET 7 SDK - build-in container support.png
date: 2023-01-23 22:00:00 +0100
---
![.NET 7 SDK - build-in container support](/assets/images/net7-docker-build-in/NET 7 SDK - build-in container support.png)

Či chceme alebo nie tak docker sa stáva už aj pri vývoji dotnet aplikácií štandardom. Väčšina návodov a článkov ukazuje aké je jednoduché kontajnerizovať dotnet aplikáciu.

Napríklad niečo takéto:

```bash
FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /source

COPY *.sln .
COPY aspnetapp/*.csproj ./aspnetapp/
RUN dotnet restore

COPY aspnetapp/. ./aspnetapp/
WORKDIR /source/aspnetapp
RUN dotnet publish -c release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:7.0
WORKDIR /app
COPY --from=build /app ./
ENTRYPOINT ["dotnet", "aspnetapp.dll"]
```

Problém nastáva akonáhle máme väčšie solution, zložitejšie vzťahy medzi projektami prípadne používame `Directory.Packages.props` alebo `NuGet.config`, ktoré sú v inom adresári ako je `Dockerfile`.

Chalani v Microsofte sa to rozhodli riešiť a pridali podporu pre build-in kontajnerizáciu priamo do .NET 7 SDK. Miesto toho aby sme museli vytvárať vlastný `Dockerfile`, špecifikovať všetky závislosti a vytvárať kontajner, je to teraz zahrnuté v publish procese dotnet-u. Napríklad `dotnet publish --os linux --arch x64 -c Release -p:PublishProfile=DefaultContainer` vygeneruje image, ktorý je pripravený na spustenie.

```bash
# create a new project 👇
dotnet new mvc -n my-test-app
cd my-test-app

# add package that creates the container (is not include in to your assembly) 👇
# ℹ️ Note: This package only supports Web projects (those that use the Microsoft.NET.Sdk.Web SDK) in this version.
dotnet add package Microsoft.NET.Build.Containers

# publish your project for linux-x64 (required if you not on linux OS) 👇
dotnet publish --os linux --arch x64 -c Release -p:PublishProfile=DefaultContainer

# run your app using the new container 👇
docker run -it --rm -p 5000:80 my-test-app:1.0.0
```

Super jednoduché. Vytvoríme projekt, pridáme balíček *(ktorý je len na build, nie je potrebný pre beh aplikácie)* a zavoláme publish. 
Výsledkom je image, ktorý je pripravený na spustenie.

> Tento postup je možné použiť aj na existujúce dotnet 6.0 aplikácie. Podmienkou je .NET 7 SDK a balíček `Microsoft.NET.Build.Containers`.

## Konfigurácia

Čo keď chcem niečo zmeniť? Platformu, base image prípadne názov výsledného image? Všetko je možné konfigurovať priamo vo vašom `.cspoj` súbore.
[Viac info priamo v dokumentácií.](https://github.com/dotnet/sdk-container-builds/blob/main/docs/ContainerCustomization.md)
