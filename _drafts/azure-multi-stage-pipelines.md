---
layout: post
title: Azure Multi-Stage Pipelines
tags: [Azure, DevOps, CI/CD, .NET Core, ASP.NET Core]
author: Miňo Martiniak
---

Azure DevOps umožňuje dva spôsoby, ako vytvoriť Continuous Deployment. Môžme použiť *classic* UI editor, alebo nový spôsob pomocou YAML súboru, kde jednotlivé kroky, job-y, stage verziujeme ako kód priamo v source control-e. Tento druhý spôsob sa nazýva Multi-Stage Pipelines. Pomocou Multi-Stage Pipelines dokážete vytvoriť proces nasadzovania od buidl-u, spustenia testov, nasadenia do rôznych prostredí *(napríklad, Development, Staging, Production, ...)* rozdelením na takzvané stages.

Obrázok.

## Čo potrebujeme

- Azure Account
- Azure DevOps Account
- Zapnúť Public preview feature
  - Multi-Stage Pipelines sú aktuálne ešte public preview a v DevOps portáli ich je potrebné zapnúť.

## Čo budeme nasadzovať?

- [ ] link na demo
- [ ] Obrázok
- [ ] sumár
- [ ] Sprav si fork

## Build

- [ ] vytvoriť súbor
  - [ ] vysvetliť triggers
  - [ ] Pool. 
- [ ] spraviť build
- [ ] Publish artifacts
- [ ] Commit, push
- [ ] Návod ako v DevOps sa pripojiť na GitHub. Info ako to premenovať.
- [ ] Dať info na PR, že tam napríklad netreba publish artifact. Dať nejaký link ako to nastaviť.

## Konstra releasu

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
