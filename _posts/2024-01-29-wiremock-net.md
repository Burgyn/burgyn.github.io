---
layout: post
title: WireMock.NET
tags: [dotnet, unittesting, csharp, wiremock]
author: Miňo Martiniak
comments: true
date: 2024-01-29 08:00:00.000000000 +01:00
carousel_images:
- path: "/assets/images/wiremock/1.png"
  alt: "WireMock.NET"
- path: "/assets/images/wiremock/2.png"
  alt: "WireMock.NET"
- path: "/assets/images/wiremock/3.png"
  alt: "WireMock.NET"
- path: "/assets/images/wiremock/4.png"
  alt: "WireMock.NET"
- path: "/assets/images/wiremock/5.png"
  alt: "WireMock.NET"
- path: "/assets/images/wiremock/6.png"
  alt: "WireMock.NET"
- path: "/assets/images/wiremock/7.png"
  alt: "WireMock.NET"            
---

❓ How do you write unit/integration tests for functionality that depends on a third party API?

We at KROS a.s. use [WireMock.NET library](https://s.burgyn.online/b-wiremock), which elegantly allows you to create a mock server, simply define rules for responses and from it create an HTTP client that you can use directly in the test.

It's simple and elegant. In most cases it doesn't require any complex configuration.