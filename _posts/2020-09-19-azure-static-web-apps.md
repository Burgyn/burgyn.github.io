---
layout: post
title: Azure Static Web Apps
tags: [Azure, DevOps, GitHub, SPA, Angular]
date: 2020-09-17 19:00:00 +0000
author: Miňo Martiniak
comments: true
---

Microsoft v máji na Build-e predstavil novú službu [Azure Static Web Apps](https://azure.microsoft.com/en-us/services/app-service/static/). Ako už názov napovedá je určená na hostovanie statických aplikácií. Primárne na frondend-ové aplikácie vyvíjané pomocou frameworkov ako Angular, React, ... a backend-u postavenom na serverless Azure funkciách *(serverless api sa v tomto članku venovat nebudem)*.

Veľkou výhoudou má byť silná *(ako marketingové informácie uvádzajú "natívna")* podpora GitHub workflow. V princípe za pár sekúnd máte nastavený celý CI/CD proces vrátane automatického vytvárania a mazania staging prostredia pre pull requesty. *(Bohužial z nejaký dôvod je to naozaj dostupné len pre GitHub.)*

## Hosting pre Angular aplikácie

Pokiaľ ste sa snažili hostovať Angular aplikáciu v Azure prostredí, tak ste mali na výber niekoľko nie úplne ideálnych možností.

1. Virtuálna mašina

   Komu by sa v dnešnej dobe chcelo kvôli statickým súborom spravovať virtuálnu mašinu? *(Samozrejme je to iné, keď už nejakú máte a staráte sa o ňu tak či tak.)*
2. App service

   Pre čisto statický obsah zbytočne drahé.
3. Static Web Site + CDN

   Je možné použiť Static Web Site v Azure Storage Account-e. Ale v prípade Angularu je pred to potrebné postaviť nejakú CDN, alebo reverzné proxy na správny routing. *(pokiaľ nechcete používať #, alebo pokiaľ chcete mať viacero verzií vašej aplikácie)*

Tymto pribudla nová možnosť, ktorá sa javí na to ako stvorená *(až na to, že v súčasnosti tam aplikáciu nedostanete ináč ako z GitHub-u)*.

## Ako na to?

Samozrejme potrebujete Azure a GitHub konto. Ďalej repo s Angular aplikáciou. [Napríklad toto.](https://github.com/Burgyn/Sample.AngularOnAzureStaticWebApps)

Potom už stačí len vytvoriť Azure Static Web App.

![Vytvorenie static web app.](/assets/images/staticwebapp/createswa.png)

Väčšina parametrov je zrejmá. Pozastavím sa pri sekcií *Build Details*. Tu nastavujete spôsob akým sa bude buildiť vaša aplikácia. Môžete vychádzať z predpripravených presetov *(Angular, React, ...)*. V mojom prípade vyberiem Angular.

### App location

Cesta k umiestneniu, kde sa nachádza váš kód. `/` reprezentuje root. V mojom prípade nechávam `/`.

### Api location

Cesta k umiestneniu, kde sa nachádzajú vaše Azure funkcie. `/` reprezentuje root. Ja nechávam bez zmeny. Žiadne AZ Funkcie nemám.

### App artifact location

Cesta k umiestneniu, kde bude vybuildovaná vaša aplikácia. Prednastavený je `dist` adresár. Ale pozor, pokiaľ používate štandardný Angular build tak cesta by mala byť `dist/project-name`. V mojom prípade `dist/sample-angular-on-azure-static-web`.

Po potvrdení sa vytvorí Azure resource, GitHub action *(do repozitára sa vám pridá adresár `.github/workflows` s `yml` súborom popisujúcim definíciu CI/CD procesu. [Napríklad takýto.](https://github.com/Burgyn/Sample.AngularOnAzureStaticWebApps/blob/master/.github/workflows/azure-static-web-apps-zealous-beach-02c37fd03.yml))* a spustí sa nasadenie. Priebeh nasadzovanie môžete sledovať v sekcii [GitHub Actions](https://github.com/Burgyn/Sample.AngularOnAzureStaticWebApps/runs/1128581568?check_suite_focus=true).

Jednoduché. Nie?

### Produkčný build

Pokiaľ vytvoríme tento resource podľa spomínaného wizardu *(inú možnosť zatiaľ nemáme)*, tak tam chýba ešte jedna dôležitá vec. Aplikácia sa vybuilduje v developerskom režime. Na to aby bola v produkčnom, musíme zeditovať `yml` súbor s definíciou CI/CD procesu.
Do stepu `Azure/static-web-apps-deploy@v0.0.1-preview` musíme pridať parameter `app_build_command: "npm run build -- --prod"`.

```yml
jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v2
        with:
          submodules: true
      - name: Build And Deploy
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v0.0.1-preview
        with:
          azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN_WHITE_MUSHROOM_0201C7603 }}
          repo_token: ${{ secrets.GITHUB_TOKEN }} # Used for Github integrations (i.e. PR comments)
          action: "upload"
          ###### Repository/Build Configurations - These values can be configured to match you app requirements. ######
          # For more information regarding Static Web App workflow configurations, please visit: https://aka.ms/swaworkflowconfig
          app_location: "/" # App source code path
          api_location: "api" # Api source code path - optional
          app_artifact_location: "dist/sample-angular-on-azure-static-web" # Built app content directory - optional
          app_build_command: "npm run build -- --prod"
          ###### End of Repository/Build Configurations ######
```

### Falback routes

Angular sa spolieha na client-side routing pre navigáciu v aplikácií. Tieto klient client-side routing pravidlá upravujú `windows.location` v prehliadači bez toho aby sa posielal request na server. Pokiaľ však spravíte refresh alebo zadáte priamo adresu, tak je potrebné server-side fallback pravidlo, ktoré vám poskytne html stránku aplikácie. Ak máte Angular aplikáciu na IIS tak použijete routing pravidlá v `web.config`. Tuto však `web.config` nemáme. Miesto toho môžme použiť `routes.json`. Ktorý v prípade Angular aplikácie musíme umiestniť do adresára `assets`.

```json
{
  "routes": [
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ]
}
```

## GitHub Workflow

Po akejkoľvek zmene pushnutej do master vetvy sa automaticky spustí nasadenie a o pár minút mate zmeny nasadené.
V prípade, že vytvoríte PR tak sa vám zmeny z tohto PR nasadia do *staging* prostredia.

![Pull request check.](/assets/images/staticwebapp/pullrequest.png)

Po nasadení do staging prostredia, vám to bot oznámi správou priamo v PR. V rámci tejto správy máte aj link na dané prostredie.

![Bot.](/assets/images/staticwebapp/bot.png)

Aktuálne prostredia si môžete pozrieť na Azure portály v sekcii `Environments`.

![Bot.](/assets/images/staticwebapp/environments.png)

> Vo free verzii môžete mať len jedno staging prostredie. Čo je limitujúce, ale pochopiteľné. Aktuálne je celá služba v *Preview* a nie je ešte známy cenník.

## DevOps

Nie každý má / chce mať svoj komerčný projekt na GitHub-e *(aj keď v privátnom repe)*. Asi nikto nebude kvôli tomuto migrovať existujúce projekty na GitHub. Bolo by super, keby bola možnosť nasadzovať do Azure Static Web App aj iným spôsobom ako z GitHub-u. Bohužiaľ zatiaľ nie je *(snáď časom príde)*. Snažil som sa zistiť akým spôsobom prebieha samotné nasadenie. Pokiaľ by za tým bolo nejaké CLI tak by som si vytvoril task pre naše DevOps. Po pátraní som však zistil, že deploy zabezpečuje docker image, ktorý sa nedá stiahnuť inde ako na GitHub-e.

Napadla mi ešte jedna možnosť. Svoje zdrojáky necháme v existujúcich repozitároch, upravíme svoj build proces tak, aby výstupne artefakty posielal na privátne GitHub repo. No a tam upravíme danú GitHub action tak aby, tieto artefakty nasadila. Je to len myšlienka, ale verím, že ju v najbližšej dobe vyskúšam.

## Záver

Jednoduchý deploy, workflow podporujúci staging prostredie pre pull requesty, custom domény, automatické certifikáty, globálna distribúcia vášho statického obsahu, robia z tejto služby vhodného kandidáta na štandard čo sa hostovania javascriptových aplikácií týka. Škoda toho pevného previazania s GitHub-om. Neviem čo s tým Microsoft sleduje, ale verím, že je to len začiatok a čoskoro príde podpora napríklad pre Azure DevOps. Uvidíme aká bude nakoniec cena, ale verím že prijateľná a začneme to používať v produkcii.

## Zdroje

[Dokumentácia](https://docs.microsoft.com/en-us/azure/static-web-apps/)
