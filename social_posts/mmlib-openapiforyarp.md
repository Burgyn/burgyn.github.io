---
key: mmlib-openapiforyarp
blog_post_title: "Aggregating OpenAPI docs on a YARP gateway with MMLib.OpenApiForYarp"
blog_post_path: "_drafts/mmlib-openapiforyarp.md"
created_date: 2026-06-19
---

## LinkedIn

🚀 Years ago I built a library that's now passed 3.8M downloads. This week I rewrote it from scratch — for YARP.

The original was MMLib.SwaggerForOcelot: one Swagger view for every service sitting behind an Ocelot gateway.

But the stack moved on — Ocelot → YARP, Swashbuckle → Microsoft.OpenApi, Swagger UI → Scalar. So instead of patching the old one, I started fresh: MMLib.OpenApiForYarp.

🛠️ What it does:
 → Fetches each downstream service's OpenAPI document at runtime
 → Rewrites the paths to match how the gateway exposes them — read straight from your YARP routes, no parallel config
 → Serves a clean per-service or merged document in Scalar (or Swagger UI)

Three lines to turn on, and the path rewriting comes automatically from your existing YARP transforms.

⚠️ It's a v1, so there are gaps — no request aggregation yet, no dynamic reload. If something's missing for your setup, issues and PRs are welcome.

👉 How are you exposing OpenAPI docs behind your gateway today?

Full write-up + source in the comments.

#dotnet #csharp #yarp #openapi #aspnetcore

### First comment (link goes here for better reach)

Full write-up: https://blog.burgyn.online/2026/06/19/mmlib-openapiforyarp
Source + NuGet: https://github.com/Burgyn/MMLib.OpenApiForYarp

## Bluesky

I rebuilt MMLib.SwaggerForOcelot for the modern stack - YARP, Microsoft.OpenApi, Scalar. One clean OpenAPI view for every service behind your gateway, in three lines.

https://blog.burgyn.online/2026/06/19/mmlib-openapiforyarp

#dotnet #yarp
