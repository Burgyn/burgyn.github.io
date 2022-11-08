---
layout: post
title: Azure Service Bus - Ako sme nepoužili Topic filters
tags: []
author: Miňo Martiniak
comments: true
---

Pri vývoji mikroslužieb pravdepodobne narazíte na potrebu message broker-u. Spoľahlivému systému na posielanie správ medzi službami.

My v KROS a.s. sme sa rozhodli na tento účel použiť Azure Service Bus, ktorý v rámci vytvoreného namespaces ponúka takzvané topiky, ku ktorým môžete mať viacero subscriberov.

V poslednom období sme chceli využiť jeho funkcionalitu [Topic filtes](https://learn.microsoft.com/en-us/azure/service-bus-messaging/topic-filters). Tá umožňuje, že na jednotlivých subscriptions pre daný topik môžete mať takzvaný filter, alebo pravidlo, ktoré rozhodne či správa bude doručená danému subskriberovi.

My sme to chceli použiť na náš use case s indexovaním do searchu. Pri zmene doménových entít v naších službách posielame správu o zmene entity. Posielame informácie o type entity a zmenené vlastnosti. Azure funkcia tieto správy odchytáva a zabezpečuje indexovanie zmien do nášho full text search-u. Chceli sme si to zautomatizovať a preto máme celý mechanizmus v base triedach. V našom prípade bolo najjednoduchšie posielať správy o zmene do jedného spoločného topiku, ale zároveň sme chceli aby na každý typ entity bol samostatný subscriber. Topic filters nám prišiel na to ideálny. Z pohľadu návrhu sa nám to páčilo, publisher posiela do jedného topiku a viac sa nezaujíma. Subscriber dostane takú správu ako očakáva a správne doručenie zabezpečí logika na strane infraštruktúry.

Prišlo však jedno ale! A to v podobe throttlingu. My využívame Azure Service Bus v Standard tier. Ten podľa [dokumentácia](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-throttling) využíva zdieľané zdroje. Aby Azure zabezpečil spravodlivé využitie zdrojov naprieč všetkými namespaces, ktoré používajú rovnaké prostredie, používa throttling založený na kreditnom systéme. Tento systém obmedzuje počet operácií, ktoré môžu byť vykonané v danom čase.

Na začiatok tohto časového obdobia (aktuálne jedna sekunda) pridelí Azure určitý počet kreditov *(aktuálne `1000`. Teda `1000 credits per second`).* Ak sa kredity minú, tak ďalšie operácie v danom časovom intervale budú throttled až do ďalšieho časového obdobia. Kredity sú doplnené po uplynutí časového obdobia.

Základné dátové operácie (`Send`, `Receive`, `Peek` a ich `async` verzie) sú spoplatnené jedným kreditom.

Plus je v dokumentácií jedna dôležitá poznámka:

>ℹ️ Note
>Please note that when sending to a Topic, each message is evaluated against filter(s) before being made available on the Subscription. Each filter evaluation also counts against the credit limit (i.e. 1 credit per filter evaluation).

</aside>

Čiže vyhodnotenie každého filtra je spoplatnené jedným kreditom.

No a tu prichádza naša matematika. Pre daný topic sme mali 56 subscriberov a tým pádom 56 filtrov. Pri už relatívne nízkej záťaži 20 zmien na entitách za sekundu by sme potrebovali **1 160 kreditov. `20 (odoslanie) + 20*56 (vyhodnotenie filtrov) + 20 (prijatie) = 1 160`** Čiže 160 operácií bolo throttlovaných ☹️.

## Možné riešenia?

### Prejsť na Premium tier

Premium tier je na dedikovaných zdrojoch a throttling tu nie je aplikovaný. Bohužiaľ je tu veľký rozdiel v cene. Pri aktuálnom Standard tier platíme mesačne zhruba 11€ / mesiac, pri Premium tier by to bolo cez 700€ / mesiac.

Nehovorím, že na Premium tier neprejdeme, ale aktuálne je to navýšenie ceny príliš vyskoné voči tomu čo od toho potrebujeme.

### Samostatný topic pre každú entity

Pri odosielaní budeme mať pre každú entitu samostatný topic. Výsledna spotreba kreditov by bola 40 kreditov `20 (odoslanie) + 20 (prijatie) = 40` .

Nevýhoda, publisher sa musí rozhodovať, do ktorého topicu má danú správu odoslať.

### Jeden topic jedna subscription

Odosielať sa bude bude do jedného topic. Bude jeden subscriber, ktorý sa v tele metódy bude musieť rozhodovať čo s danou správou vykoná.

Výsledna spotreba kreditov by bola 40 kreditov `20 (odoslanie) + 20 (prijatie) = 40` .

Nevýhoda, subscriber sa musí rozhodovať čo má s danou správou spraviť.

## Čo sme vybrali?

Rozhodli sme sa ísť cestou jedného subscribera. Je to v našom kontexte lepšie riešenie ako mať topic per entitu.
