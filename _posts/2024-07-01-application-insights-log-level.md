---
layout: post
title: Application Insights - Log Level
tags: [AZURE, csharp, asp.net core, logs]
comments: true
description: "Discover how to locate custom logs in Azure's ApplicationInsights and adjust settings so they're visible by default."
linkedin_post_text: ""
date: 2024-07-01 18:00:00.000000000 +01:00
image: "/assets/images/blog-post-base-cover.png"
thumbnail: "/assets/images/blog-post-base-cover.png"
keywords:
- ApplicationInsights
- Azure
- Custom logs
- LogLevel
- AppInsights
- ASP.NET Core
- Logging
- Information
- Debug
- Trace
- Warning
---

🤦 I've been using ApplicationInsights for a few years now, but only now have I had a real need to look for my own custom logs there. It took me a while to figure out why I can't find them there.

🤔 It's not enough to set the generic "LogLeve:Default" to "Information" (Debug, Trace), because by default the ApplicationInsights provider only pushes logs with severity Warning and higher to AppInsights anyway.

💡 In order to push them there you need to explicitly set "ApplicationInsights:LogLevel:Default:" to "Information" (Debug, Trace).

🤞 Maybe this will help you sometime too.

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information"
    },
    // 👇 This section is important
    "ApplicationInsights": {
      "LogLevel": {
        "Default": "Information"
      }
    }
  },
  "ApplicationInsights": {
    "ConnectionString": ""
  }
}
```
