---
layout: post
title: Na čo dávam pozor pri Code Review
tags: [clean code]
author: Miňo Martiniak
comments: true
date: 2020-05-21 17:00:00 +0100
---

O tom prečo je na projekte dôležité Code Review sa popísalo veľa článkov. Napríklad [tento](https://www.atlassian.com/agile/software-development/code-reviews).

Na projektoch na ktorých pracujem využívame Code Review už niekoľko rokov. Chcem sa preto podeliť s tým na čo si pri CR dávam pozor ja, čo sledujem, aké otázky si kladiem.

## Popis

Je PR dobre popísaný? Je z popisu jasné aké zmeny boli vykonané a hlavne prečo? Aký bol dôvod? Keby sa pozriem na tento PR o mesiac, musím študovať zmeny, alebo aj na základe popisu viem určiť aké zmeny prináša?

Dobrý popis výrazne ušetrí čas reviewerovi, ale aj pri budúcom skúmaní, prečo sa dané zmeny vykonali.

## Code style

Zodpovedá kód našim štandardom? Toto bol bod, kotrý v minulosti zaberal veľkú časť CR. Našťastie v súčastnosti máme veci ako [`.editorconfig`](https://docs.microsoft.com/en-us/visualstudio/ide/create-portable-custom-editor-options?view=vs-2019), [Roslynator](https://github.com/JosefPihrt/Roslynator), [CodeFactor](https://www.codefactor.io/), [SonarCloud](https://sonarcloud.io/), [TSLint](https://palantir.github.io/tslint/), ... Vďaka čomu sa môžem sústrediť na dôležitejšie veci. *(Samozrejme Code style považujem za veľmi dôležitý)*

## Zrozumiteľnosť

Rozumiem tomu? Nie a prečo?

Je kód dostatočne zrozumiteľný? Nemusím zbytočne zložito skúmať čo daná vec robí? Kebyže sa pozriem na ten kód bez kontextu daného PR, pochopím rýchlo čo robí? Aký je jeho význam?

Odporúčam knihu [Čistý kód](https://www.martinus.sk/?uItem=73286).

## Udržateľnosť / rozšíriteľnosť

Pokúsim sa predstaviť aké reálne požiadavky na zmenu danej veci by mohli prísť. Keď prídu, je tento kód na dané zmeny pripravený? Ak nie, dá sa už teraz niečo jednoducho zmeniť tak, aby sa nám to v budúcnosti ľahšie zapracovalo?

### Otázka ktorú si kladiem:

- Je zmena izolovaná?
- Nevidel som to už niekedy?
- Nie sú tam zbytočné závislosti?
- Sú zachytené všetky chyby/výnimky?

## Bezpečnosť

### Otázky ktoré si kladiem:

- Nepoužívam nedôveryhodné knižnice?
- Nie je kvôli danej zmene zrazu možné pristúpiť k dátam iného používateľa?
- Overujem, či dáta ktoré vyťahujem naozaj patria danému používateľovi / tenant-u? Keď editujem záznam, naozaj mám právo na ten záznam?
- Nemôže nastať Sql injection? Nevyskladávam parametre dotazu do nejaké stringu?
- Nemôže nastať xss útok? Nerenderujem priamo niekde obsah, ktorý zadáva používateľ?
- Ako narábam s kľúčmi? Nedávam náhodou nejaký kľúč na klienta? Nedávam niekde do logov naše kľúče?
- ...

## Výkon

### Otázky ktoré si kladiem:

- Nenačítavam zbytočne viac dát ako potrebujem?
- Používam správne údajové štruktúry?
- Nevolám zbytočne `ToList` tam kde to nemá zmysel?
- Správne dispozujem veci?
- Nastavujem správny life cycle?
- Nevolám z klienta zbytočne veľa dotazov?

## Testy

Testujú sa očakávané scenáre a hraničné hodnoty?

### Unit testy

Pri knižniciach podmienka. Pokiaľ neviem napísať test, tak pravdepodobne mám zle navrhnutý kód. Pre doménové veci sú tiež Unit testy potrebné. Pre infraštruktúrne (controllery, ...) radšej Postman testy.

Pri testoch taktiež dodržujeme pravidlá na kvaltu kódu. Sú tam ale možné výnimky napr: Opakovanie kódu môže byť chcené (radšej nech sa v testo opakuje ten istný kód, ale mám istotu, že sa nič neovplyvňuje)

### Postman testy

Je každý endpoint pokrytý testami?
Testujú sa aj komplexnejšie scenáre? Jeden endpoint niečo založí, iným zas overím či to tam je.

### End-To-End testy

Tieto testy chceme aby písali nevývojári.

## The Boy Scout Rule

Always leave the code you are editing a little better than you found it. *- Robert C. Martin (Uncle Bob)*

## Ľudskosť

- Žiadne negatívne komentáre proti autorovi.
- Keď kritizuješ, navrhni lepšie riešenie, ak nemáš „drž hubu“ :-)
- Než začneš kritizovať, skús nájsť dôvod, prečo to autor tak napísal – možno na to mal pádny dôvod.

## Zhrnutie

Code Review považujem za veľmi dôležitý nástroj pri vývojí akéhokoľvek projektu. Za pravdu mi dáva aj to, že v súčasnsti sa to už považuje za štandard. Robiť Code Review vôbec nie je jednoduché. Zaberá dosť času a stojí dosť síl. Týchto pár bodov mi pomáha pristupovať k CR zodpovedne, systematicky tak aby prinášalo očakávaný osoh, ale zas aby mi nezaberalo všetok pracovný čas.

A čo vy? Máte svoj zoznam? Ak áno podelte sa.
