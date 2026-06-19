---
key: mmlib-openapiforyarp
blog_post_title: "Aggregating OpenAPI docs on a YARP gateway with MMLib.OpenApiForYarp"
blog_post_path: "_drafts/mmlib-openapiforyarp.md"
created_date: 2026-06-19
---

## LinkedIn

🚀 Aggregating OpenAPI docs on a YARP gateway

Years ago I built MMLib.SwaggerForOcelot so you'd get one Swagger view for all the services behind an Ocelot gateway. It grew past 3.8M downloads, which still surprises me.

But the stack moved on - Ocelot to YARP, Swashbuckle to Microsoft.OpenApi, Swagger UI to Scalar. So I rebuilt the idea from scratch: MMLib.OpenApiForYarp.

🛠️ What it does:
 → Fetches each downstream service's OpenAPI document at runtime
 → Rewrites the paths to match how the gateway exposes them - read straight from your YARP routes, no parallel config
 → Serves a clean per-service or merged document in Scalar (or Swagger UI)

It's three lines to turn on, and the path rewriting comes automatically from your existing YARP transforms.

⚠️ It's a v1, so there are gaps - no request aggregation yet, no dynamic reload. If something's missing for your setup, issues and PRs are welcome.

https://blog.burgyn.online/2026/06/19/mmlib-openapiforyarp

#dotnet #yarp #openapi #aspnetcore

## Bluesky

I rebuilt MMLib.SwaggerForOcelot for the modern stack - YARP, Microsoft.OpenApi, Scalar. One clean OpenAPI view for every service behind your gateway, in three lines.

https://blog.burgyn.online/2026/06/19/mmlib-openapiforyarp

#dotnet #yarp
