---
layout: post
title: ASP.NET Core Short-circuit
tags: [aspnetcore, dotnet]
author: Miňo Martiniak
comments: true
date: 2023-12-11 15:00:00.000000000 +01:00
carousel_images:
- path: "/assets/images/shortcircuit/1.png"
  alt: "Short circuit"
- path: "/assets/images/shortcircuit/2.png"
  alt: "Short circuit"
- path: "/assets/images/shortcircuit/3.png"
  alt: "Short circuit"
- path: "/assets/images/shortcircuit/4.png"
  alt: "Short circuit"
- path: "/assets/images/shortcircuit/5.png"
  alt: "Short circuit"
---

🚀 ASP.NET Core #news - Short-circuit

Short-circuit is a new feature in ASP.NET Core 8.0 that allows you to skip the entire request pipeline and return a response directly from the endpoint. This feature is useful when you want to return a response without executing the rest of the pipeline. For example, endpoints like `/health`, `/favicon.ico`, or `/robots.txt` can be implemented using this feature.

#aspnetcore #dotnet #csharp #shortcircuit