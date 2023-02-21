---
layout: post
title: Prechod z Choco na Winget
tags: [Windows]
author: Miňo Martiniak
comments: true
image: /assets/images/winget/Winget.png
date: 2023-02-20 22:00:00 +0100
---

![Winget](/assets/images/winget/Winget.png)

Pre tých, ktorí nie sú zoznámení s balíčkovacími systémami, to sú nástroje, ktoré uľahčujú inštaláciu a aktualizáciu softvéru na vašom počítači. Inak povedané, ak potrebujete nainštalovať program, nemusíte hľadať súbor na stiahnutie z internetu, stiahnuť ho, nainštalovať a potom aktualizovať. Balíčkovací systém sa o to postará za vás. Stačí vám zadať príkaz a systém sa postará o zvyšok.

Najväčšia výhoda takýchto systémov pre mňa je v tom, že dokážu vyexportovať zoznam aktuálne nainštalovaných aplikácií. Ten si môžete editovať, niekam napríklad na cloud archivovať a pri reinštalácií systému, prípadne pri inštalácií nového zariadenia si nemusíte zdĺhavo všetky vaše obľúbené aplikácie inštalovať. Zadáte jeden príkaz, odídete na kávičku a o chvíľu máte všetko nainštalované tak, ako v predchádzajúcom zariadení.

Niekoľko rokov som na toto používal [Choco](https://chocolatey.org/) *(celým názvom Chocolatey*). Robil presne to čo som od neho očakával. Vedel inštalovať, aktualizovať aplikácie. Dokázal vyexportovať zoznam a hlavne mal v katalógu takmer všetky aplikácie, ktoré používam.

Microsoft pred pár rokmi predstavil svoj vlastný balíčkovací systém [Winget](https://learn.microsoft.com/en-us/windows/package-manager/winget/). Zo záujmu som si ho vtedy vyskúšal, ale práve z dôvodu, že neobsahoval potrebné aplikácie som ho nepoužíval.

Tento mesiac som si kúpil nový notebook *(áno chválim sa 😎)* a samozrejme ako prvé som šiel použiť Choco, aby som si nainštaloval všetky potrebné aplikácie. Zastavil som sa však vtedy, keď mi už pri druhej aplikácií za sebou zahlásil, že nesedí checksum. Skúsil som teda Winget, že či tam nájdem aplikácie ktoré chcem, no a našiel som. 

Prvá vyhoda Winget-u. Nie je potrebné ho inštalovať. Pri Choco musíte najskôr nainštalovať Choco cez Powershell *(aj to nie je vždy jednoduché)*. Winget už máte nainštalovaný s Windowsom. Pri spúšťaní ani nemusíte byť správca.

Druhá výhoda Winget-u je, že dokážete vyexportovať zoznam nainštalovaných aplikácií aj keď ste ich neinštalovali cez Winget. Pri Choco ste dokázali vytvoriť zoznam aplikácií len z tých, ktoré ste inštalovali cez neho. Tým, že Winget je integrovaný priamo vo Windows, dokáže prejsť všetky aplikácie, ktoré máte nainštalované, vyhľadá ich v svojich zdrojoch a ak nájde, tak pridá do výsledného zoznamu. Takže mne stačilo na starom notebooku zavolať príkaz 

```bash
winget export -o list.json
```

A mal som pripravený zoznam svojich aplikácií *(ten mimochodom archivujem na svojom GitHub-e)*

Následne mi stačilo zavolať 

```bash
winget import -i list.json --accept-package-agreements --accept-source-agreements
```

A o chvíľu *(ok, necelú hodinku to trvalo)* som mal notebook pripravený k používaniu.

Ďalšou výhodou môže byť, že Winget umožňuje pridávať alternatívne zdroje *(sources / repositories)*, kde sa nachádzajú aplikácie. Toto som zatiaľ ale nemal potrebu vyskúšať.

Pokiaľ si chceš overiť či tvoja obľúbená aplikácia sa tam nachádza, tak môžeš vyskúšať [winget.run](https://winget.run/).