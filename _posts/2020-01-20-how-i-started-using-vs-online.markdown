---
layout: post
title: "How I started using the Visual Studio Online (Cloud IDE)"
date: 2020-01-20 19:00:00 +0100
tags: [VS Online, VS Code, Environment]
author: Miňo Martiniak
comments: true
---

Yes, I really  mean Visual Studio Online. Not the DevOps, which until recently had exactly the same name *(with the same domain)*. *Maybe Microsoft still had a paid domain, so he decided to use it for the new "Cloud IDE" service. 😃*

I'm the owner of Surface Go device. Which is a very handy little Windows 10 tablet. At home I use to use it for most things. I only turn on a regular laptop when I'm going to do something in a few opensource projects that I take care of. Whether it is the development of new things, prototyping or reviewing more complex PR that I want to see in the VS. For such stuff my Surface is already weak. That's why I started testing [VS Online](https://online.visualstudio.com).

## Visual Studio Online

VS Online is a cloud development environment accessible from anywhere. Do you have a weak computer? You simply create your development environment on AZURE using the VS Online. No RDP and connection to virtual machine. Through browser or locally installed VS Code with extension. *(Is there support for VS, but I haven't tested it)*

## How to do it?

It is simple. Just visit the portal [https://online.visualstudio.com](https://online.visualstudio.com). Log in using the Microsoft account to which AZURE Subscription is assigned. *(If you don't have one, you can try [free access for 12 month](https://azure.microsoft.com/en-us/free/)).*

We need to create a plan before we can create environments.
![Billing plan](/assets/images/vsonline/BillingPlan.png)

AZURE will create a Resource Group and Visual Studio Online Plan.
![AZURE Plan](/assets/images/vsonline/Azure.png)

Finally, we can create our first cloud environment.
![Creating environment](/assets/images/vsonline/CreateEnvironment.png)

There are two configurations to choose from:

1. 4 cores with 8GB RAM
2. 8 cores with 16GB RAM

That's not so much when you consider that it's performance reserved for your development *(no Chrome / Spotify / no application running like Electron apps / ...)*.

Pricing plan is available on [azure.microsoft.com](https://azure.microsoft.com/en-us/pricing/details/visual-studio-online/).
According to Microsoft calculations, this should be **55 €** per month for the second configuration and full time development.

 I changed suspend setting to 5 minutes *(the default is 30)* of inactivity to save my credit on Azure 😄.

After less than a minute the environment is ready and I can connect to it through the browser.
The web version of Visual Studio Code will open.

We already have `dotnet core` pre-installed in our environment, so we can try to create an mvc application. Open the terminal `CTLR + SHIFT + C` and type `dotnet new mvc`.

![Visual Studio Code](/assets/images/vsonline/VisualStudioCode.png)

To better work with `dotnet core` I recommend installing an extension [OmniSharp](https://marketplace.visualstudio.com/items?itemName=ms-vscode.csharp). Then you can run the application.

When you start app, Visual Studio Online automatically creates port forwarding and redirects you to your application.

## VS Online

Working through a browser is cool, but let's just say the truth, it's fine for a little bit of editing. Not for long-term work. It will be much more convenient through Visual Studio Code. *(Probably through Visual Studio 2019, but I haven't tried it yet)*. You need to install a single extension in VSCode [Visual Studio Online](https://marketplace.visualstudio.com/items?itemName=ms-vsonline.vsonline) and connect to environment.

![Select plan](/assets/images/vsonline/SelectPlan.png)

![Select environment](/assets/images/vsonline/SelectEnvironment.png)

![Forward port](/assets/images/vsonline/Ports.png)

## Summary

It's great to connect from anywhere and have everything there ready the way you used it the last time. Whether you connect from anywhere *(work laptop, home laptop, tablet on the go, ...)* you will find your work exactly as you left it.

Microsoft claims that this is suitable for small things like PR adjustments, minor changes, but also for long-term large projects. But it's still marked as "preview" and I suppose they still have a lot of work to do. *(In a few weeks of use, however, I only encountered minor outages of intellisense.)* I don't know if this will fully replace the development workstations in the future. However, I support this project and watch with interest as it develops.

## Links

- [Announcing Visual Studio Online Public Preview](https://devblogs.microsoft.com/visualstudio/announcing-visual-studio-online-public-preview/?WT.mc_id=-blog-scottha)
- [Visual Studio Online](https://visualstudio.microsoft.com/cs/services/visual-studio-online/?rr=https%3A%2F%2Fwww.google.com%2F)
- [VSCode extension](https://marketplace.visualstudio.com/items?itemName=ms-vsonline.vsonline)