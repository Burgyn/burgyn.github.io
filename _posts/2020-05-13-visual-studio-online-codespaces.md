---
layout: post
title: Visual Studio ~~Online~~ Codespaces
tags: [VS Online, VS Codespaces, VS Code, Environment]
author: Miňo Martiniak
comments: true
date: 2020-05-13 17:00:00 +0100
---

V nedávno som písal o tom [ako som začal používať VS Online]({% post_url 2020-01-16-ako-som-zacal-pouzivat-vs-online %}). V úvode som si robil srandu, že Microsoft mal zaplatenú doménu ešte z doby keď pod rovnakým názvom prevádzkoval terajšie Azure DevOps. No a zjavne táto doména expirovala, pretože sa rozhodol službu Visual Studio Online premenovať na [Visual Studio Codespaces](https://visualstudio.microsoft.com/services/visual-studio-codespaces/) 😁.

Vybrať správny názov služby je dôležité a je pravda, že pôvodný názov bol mätúci. Aj ja som sa stretol s tým, že to ľudia v mojom okolí považovali "len" za Visual Studio Code v prehliadači.

## Ďalšie novinky

### Nová *nižšia* cena

Aby to výraznejšie spropagovali, rozhodli sa znížiť cenu. V pôvodnom článku som písal, že pri konfigurácií 8 jadier a 16GB RAM by odhadovaná mesačná cena pri full time vývoji mala byť 55€. Ponovom to má byť 26€. To už stojí za zamyslenie. Viac o cenách na [oficiálnej stránke](https://azure.microsoft.com/en-gb/pricing/details/visual-studio-online/).

### Nová konfigurácia

Pribudla nová, nižšia konfigurácia Basic. 2 jadrá a 4GB RAM. V prípade, že by ste tento environment chceli používať na kontrolovanie pull request-ov, Microsoft odhaduje cenu 0,21€ mesačne.

### Self-host environment

Pokiaľ sa vám myšlienka cloud-host vývoja pozdáva, ale ani vďaka nižšej cene sa vám za to nechce platiť, môžte využiť nejakú voľnú výkonnejšiu mašinu/server, ktorý sa vám vo firme niekde povaľuje. Microsoft ponúka možnosť self-host environmentu. Miesto toho aby dané prostredie bolo na Azure, kde za neho platíte, bude u vás a zadarmo. To ako to nastaviť je spísané v [dokumentácií](https://docs.microsoft.com/en-us/visualstudio/online/how-to/self-hosting-vscode#sign-up).

Môže to byť užitočné aj v prípade, že máte doma výkonný desktop a často ste na cestách, kde máte buď slabší notebook, poprípade tablet. V taktomto prípade sa pohodlne prihlásite na svoj workstation a pokračujete v práci. *Hmm, asi to vyskúšam.*



> Btw. aj GitHub *(ktorý už vlastní Microsoft)* prišiel som svojím vlastným [Codespaces](https://github.com/features/codespaces/).
