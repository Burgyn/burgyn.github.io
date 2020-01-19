---
layout: post
title: "Ako som začal používať Visual Studio Online (Cloud IDE)"
date: 2020-01-16 09:00:00 +0100
tags: [VS Online, VS Code, Environment]
author: Miňo Martiniak
---

Áno, naozaj som sa nepomýlil a mám na mysli Visual Studio Online. Nie akuálne DevOps, ktoré sa ešte nedávno presne rovnako menovalo *(s rovnakou doménou)*. *Asi mal Microsoft ešte stále zaplatenú doménu a tak sa ju rozhodol využiť pre novú službu "Cloudové IDE" 😊.*

Som vlastníkom Surface Go. Čo je veľmi šikovný malý Windows 10 tablet. Doma som si zvykol používať ho na väčšinu veci. Bežný notebook zapínam len keď idem niečo spraviť do pár opensource projektov o ktoré sa starám. Či už je to vývoj nových vecí, prototypovanie či review zložitejšieho PR, ktorý chcem vidieť vo VS a nestačí mi GitHub portál. Na také niečo je už ten môj Surface slabý a ani ho nechcem "zašpiniť" takýmito vecami. Preto som začal pokukovať po [VS Online](https://online.visualstudio.com).

## Visual Studio Online

VS Online je cloudové developerské prostredie dostupné odkiaľkoveľvek. Máte slabý počítač, nechce sa vám kvôli nejakému prototypovaniu "špiniť" svoj počítač? Jednoducho si vytvoríte pomocou VS Online developerské prostredie na AZURE a vyvíjate tam. Žiadne RDP a pripájanie sa na virtuálnu mašinu. Pekne cez browser, alebo lokálne nainštalované VS Code s extension. *(Je podpora aj pre VS, ale netestoval som to)*

## Ako na to?

Je to jednoduché. Stačí navštíviť priamo portál [https://online.visualstudio.com](https://online.visualstudio.com). Prihlásiť sa pomocou Microsoft konta, ku ktorému je priradený AZURE Subscription. *(Pokiaľ také nemáte, môžte vyskúšať [free prístup na 12 mesiacov](https://azure.microsoft.com/en-us/free/)).*

Skôr ako začneme vytvárať prostredia, musíme si vytvoriť plán.
![Billing plan](/assets/images/vsonline/BillingPlan.png)

Na AZURE sa Vám vytvorí Resource Groupa a Visual Studio Online Plan.
![AZURE Plan](/assets/images/vsonline/Azure.png)

Konečne si môžme vytvoriť svoj prvý cloud environment.
![Creating environment](/assets/images/vsonline/CreateEnvironment.png)

Na výber máme z dvoch konfigurácií:

1. 4 jadrá a 8GB RAM
2. 8 jadier a 16GB RAM

Čo nie je málo, keď zoberiete do úvahy, že je to výkon vyhradený pre váš vývoj *(žiadny Chrome / Spotify / žiadna aplikácia bežiaca ako Electron apps / ...)*.

Pricing plan je dostupný na [tomto mieste](https://azure.microsoft.com/en-us/pricing/details/visual-studio-online/).
Podľa Microsoft výpočtov by to v prípade druhej konfigurácie a full time vývoju malo byť **55€** mesačne. *(posúdenie či je to veľa alebo málo nechám na vás)*

Nastavím si vypínanie po piatich minútach nečinnosti, aby som šetril svoj kredit čo mám na Azure 😄.

Po necelej minúte je prostredie pripravené a ja sa môžem cez browser k nemu pripojiť.
Otvorí sa nám webová verzia Visual Studio Code.

V našom prostredí už máme predinštalovaný `dotnet core`, takže môžme rovno napríklad vyskúšať vytvoriť mvc aplikáciu. Otvoríme terminál `CTLR+SHIFT+C` a napíšeme `dotnet new mvc`.

![Visual Studio Code](/assets/images/vsonline/VisualStudioCode.png)

Na plnohodnotnú prácu s `dotnet core` odporúčam nainštalovať extension [OmniSharp](https://marketplace.visualstudio.com/items?itemName=ms-vscode.csharp). Potom stačí v debug okne aplikáciu spustiť.

Po spustení aplikácie Visual Studio Online automaticky vytvorí port forwarding a presmeruje Vás na vašu aplikáciu.

## VS Online

Práca cez browser je cool, ale povedzme si pravdu, je to fajn tak na malé úpravy. Nie na dlhodobú prácu. Omnoho pohodlnejšie to bude cez Visual Studio Code. *(Pravdepodobne aj cez "veľké" Visual Studio 2019, ale to som ešte neskúšal.)* Do VS Code je potrebné doinštalovať jedinú extension [Visual Studio Online](https://marketplace.visualstudio.com/items?itemName=ms-vsonline.vsonline) a pripojiť si svoje prostredie.

![Select plan](/assets/images/vsonline/SelectPlan.png)

![Select environment](/assets/images/vsonline/SelectEnvironment.png)

![Forward port](/assets/images/vsonline/Ports.png)

## Zhrnutie

Je super odkiaľkovek sa pripojiť a mať tam všetko pripravená tak, ako keď ste to použili naposledy. Nech sa pripojíte odkiaľkovek *(pracovný notebook, domáci notebook, tablet na cestách, ...)* nájdete svojú rozrobenú prácu presne tak, ako ste ju nechali.

Microsoft tvrdí, že je to vhodné na malé veci ako úprava PR, drobné zmeny, ale aj na dlhodbé veľké projekty. Stále je to ale označované ako "preview" a predpokladám, že ich ešte čaká veľa práce. *(Za pár týždňov používania som však narazil len na drobné výpadky intellisense-u.)* Či to v budúcnosti plnohodnotne nahradí developerské pracovné stanice neviem. Každopádne však tomuto projektu fandím a so záujmom budem sledovať ako sa bude vyvíjať.

## Odkazy

- [Announcing Visual Studio Online Public Preview](https://devblogs.microsoft.com/visualstudio/announcing-visual-studio-online-public-preview/?WT.mc_id=-blog-scottha)
- [Visual Studio Online](https://visualstudio.microsoft.com/cs/services/visual-studio-online/?rr=https%3A%2F%2Fwww.google.com%2F)
- [VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-vsonline.vsonline)