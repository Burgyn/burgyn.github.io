---
layout: post
title: "TeaPie: Testing real-world API scenarios"
tags: [dotnet, testing, api, tools]
comments: true
description: >
  Environments, API keys on DummyApi, pre-request variables, built-in .http
  functions, and resilient retries - with links to TeaPie docs.
linkedin_post_text: ""
social_post_key: "teapie-real-world-api-testing"
date: 2026-03-18 18:00:00 +01:00
image: /assets/images/teapie-real-world-api-testing-cover.png
thumbnail: /assets/images/teapie-real-world-api-testing-cover.png
keywords:
- TeaPie
- API testing
- environments
- retry
- dotnet tool
---

In the [first article]({% post_url 2026-03-12-teapie-getting-started %}),
I showed how to get from zero to passing tests in a few minutes - directives,
a `POST` with a `.csx` script, and chaining IDs across test cases.

This post skips repeating that path. I won't walk through extra CRUD steps or
another "invalid body returns 400" example - you already have the pattern from
Part 1. Instead: **environments**, how this demo API expects an **API key**,
**pre-request scripts** that feed variables into `.http` files, **built-in
functions** for inline values, and **retries** - both for flaky HTTP responses
and for work that finishes asynchronously in the background.

I'm still using
[MMLib.DummyApi](https://github.com/Burgyn/MMLib.DummyApi) as the demo backend.
If you haven't read
[Part 1]({% post_url 2026-03-12-teapie-getting-started %}), start there; spin up
the API with
`docker run -p 8080:8080 ghcr.io/burgyn/mmlib-dummyapi`.

## Environments

Until now, the API base URL was hardcoded in every `.http` file. That breaks
the moment you want to run the same tests against staging. Let's fix that.

Create `.teapie/env.json` in your project root:

```json
{
  "$shared": {
    "ApiBaseUrl": "http://localhost:8080",
    "ApiKey": "test-api-key-123"
  },
  "staging": {
    "ApiBaseUrl": "https://my-staging-api.example.com"
  }
}
```

`$shared` is the default environment - its variables are always available.
`staging` overrides `ApiBaseUrl` for that specific environment.

Now update your `.http` files to use the variable:

{% raw %}

```http
## TEST-EXPECT-STATUS: [200]
## TEST-HAS-BODY
GET {{ApiBaseUrl}}/products
```

{% endraw %}

Run against local (default):

```bash
teapie test Tests/
```

Run against staging:

```bash
teapie test Tests/ -e staging
```

One test collection, multiple environments.

> Of course, tests won't pass against `staging` right now - that URL doesn't
> exist. Replace it with your real staging endpoint when you have one.

## API keys in this demo (and what comes next)

The DummyApi `orders` endpoints expect an `X-Api-Key` header. Without it, you get
`401`. For this sample, put the key in **`.teapie/env.json`** (the same file as
in [Environments](#environments)). The `ApiKey` property becomes variable
{% raw %}{{ApiKey}}{% endraw %} in `.http` files. That is handy for workshops
and Docker demos, but not how every real API handles identity.

A follow-up post will cover other authentication styles and a **custom auth
provider** in TeaPie so you don't have to paste secrets into every request by
hand.

Positive path: use the env value in a header the same way you use
{% raw %}{{ApiBaseUrl}}{% endraw %}. Create
`Tests/002-Orders/001-List-Orders-Authorized-req.http`:

{% raw %}

```http
## TEST-EXPECT-STATUS: [200]
## TEST-HAS-BODY
GET {{ApiBaseUrl}}/orders
X-Api-Key: {{ApiKey}}
```

{% endraw %}

`ApiKey` is resolved from `.teapie/env.json` when you run `teapie test`.

Quick negative check - no header, expect rejection. Create
`Tests/002-Orders/004-Unauthorized-Access-req.http`:

{% raw %}

```http
## TEST-EXPECT-STATUS: [401]
GET {{ApiBaseUrl}}/orders
```

{% endraw %}

## Pre-request scripts: set variables, keep `.http` readable

Sometimes you need to prepare values **before** TeaPie sends the request. Add a
**pre-request script** next to the test case: same base name, suffix
`-init.csx`. It runs first; use `tp.SetVariable` for anything the `.http` file
should reference by name.

Example: `Tests/002-Orders/002-Create-Order-init.csx`:

```csharp
tp.SetVariable("OrderCustomerId", Guid.NewGuid().ToString());
```

Http file: `Tests/002-Orders/002-Create-Order-init.http`:

{% raw %}

```http
# @name CreateOrderRequest
## TEST-EXPECT-STATUS: [201]
POST {{ApiBaseUrl}}/orders
Content-Type: application/json
X-Api-Key: {{ApiKey}}

{
  "customerId": "{{OrderCustomerId}}",
  "customerName": "TeaPie Demo Customer",
  "customerEmail": "teapie.demo@example.com",
  "totalAmount": 29.98,
  "status": "pending",
  "shippingAddress": "123 TeaPie Lane",
  "shippingCity": "Demo City",
  "shippingCountry": "SK"
}
```

{% endraw %}

`002-Create-Order-test.csx` (shortened):

```csharp
await tp.Test("Created order should have a valid ID.", async () =>
{
    dynamic body = await tp.Response.GetBodyAsExpandoAsync();
    True(body.id != null);
    tp.SetVariable("NewOrderId", (string)body.id.ToString());
});

await tp.Test("Order status should start as 'pending'.", async () =>
{
    dynamic body = await tp.Response.GetBodyAsExpandoAsync();
    Equal("pending", (string)body.status);
});
```

## Built-in functions in `.http` files

TeaPie can inject dynamic values **directly** in the request file, without an
`init` script. You can use build-in functions; names start with
`$` and use space-separated arguments (no commas), for example
`{% raw %}{{$randomInt 1 100}}{% endraw %}`.

The defaults today are:

| Function | Role |
| --- | --- |
| `$guid` | New GUID |
| `$now` | Current local time, optional format string |
| `$rand` | Random double in [0, 1) |
| `$randomInt` | Random int in [min, max) |

You can rewrite preview `.http` file without `-init.csx` file.

{% raw %}

```http
# @name CreateOrderRequest
## TEST-EXPECT-STATUS: [201]
POST {{ApiBaseUrl}}/orders
Content-Type: application/json
X-Api-Key: {{ApiKey}}

{
  "customerId": "{{$guid}}",
  "customerName": "TeaPie Demo Customer",
  "customerEmail": "teapie.demo@example.com",
  "totalAmount": 29.98,
  "status": "pending",
  "shippingAddress": "123 TeaPie Lane",
  "shippingCity": "Demo City",
  "shippingCountry": "SK"
}
```

{% endraw %}

You can also define **your own functions** and use them from `.http`
files like the built-ins. How that works is worth its own walkthrough - I'll
cover it in the next article.

## Retrying when the server answers "not yet"

Sometimes the API is up, but the **response is not ready** - cold starts, short
outages, overloaded instances, or an honest `500`. Reasonable clients **repeat
the request** with backoff until they get a successful status (or give up).

DummyApi can force that shape without a real outage. You flip behavior with
simulation headers (full list is in the
[DummyApi README](https://github.com/Burgyn/MMLib.DummyApi)):

| Header | Effect |
| --- | --- |
| `X-Simulate-Delay: 500` | Add 500 ms delay before responding |
| `X-Simulate-Error: true` | Return `500` |
| `X-Simulate-Retry: 3` | Two failing responses, then success on the 3rd |
| `X-Request-Id` | Correlation id; required when using `X-Simulate-Retry` |

For a **worked example**, ask for two failures then success, and tell TeaPie to
retry until it finally sees `200`:

`Tests/003-Retry/001-Simulate-Flaky-Get-req.http`:

{% raw %}

```http
## TEST-EXPECT-STATUS: [200]
## TEST-HAS-BODY
## RETRY-MAX-ATTEMPTS: 5
## RETRY-UNTIL-STATUS: [200]
GET {{ApiBaseUrl}}/products
X-Simulate-Retry: 3
X-Request-Id: {{$guid}}
```

{% endraw %}

Without retries, the first responses would be errors. With `RETRY-UNTIL-STATUS`
and enough attempts, the run lines up with the 3rd successful response.

## Retrying until the body matches what you expect

In production you often see this: the API returns **`200`** right away because the
request itself was accepted, but the **real outcome** is produced later - a
message on a queue, a background job, a workflow engine, whatever runs
**asynchronously**. Until that work finishes, the resource still looks "in
progress". Your test needs to prove that the job **eventually** reached the
expected state - not that the first HTTP response was OK.

DummyApi does the same with orders: `status` advances in the background
(`pending` → `processing` → `completed`). Your `GET /orders/{id}` can keep
returning **`200`** while the JSON still says `pending`, so
{% raw %}`## RETRY-UNTIL-STATUS: [200]`{% endraw %} tells you nothing new - you
already had `200` on the first try.

What you need is **retry until a post-response test passes**. Put the real
condition in `.csx` (here: `status` is `completed`), then point the directive at
that test's **exact name**:

`Tests/002-Orders/003-Check-Order-Status-req.http`:

{% raw %}

```http
# @name CheckOrderStatusRequest
## RETRY-UNTIL-TEST-PASS: Order should eventually reach 'completed' status.
## RETRY-MAX-ATTEMPTS: 15
## RETRY-BACKOFF-TYPE: Linear
GET {{ApiBaseUrl}}/orders/{{NewOrderId}}
X-Api-Key: {{ApiKey}}
```

{% endraw %}

`003-Check-Order-Status-test.csx`:

```csharp
await tp.Test("Order should eventually reach 'completed' status.", async () =>
{
    dynamic body = await tp.Response.GetBodyAsExpandoAsync();
    Equal("completed", (string)body.status);
});
```

The string in `RETRY-UNTIL-TEST-PASS` must match the first argument of
`tp.Test` character for character.

## Where you are now

You have:

- **Environments** via `.teapie/env.json` and `teapie test … -e <name>`
- **Pre-request scripts** that set variables consumed from `.http` files
- **Built-in `$…` functions** for inline dynamic values
- **Retries** for flaky status codes and for
  async state using `RETRY-UNTIL-TEST-PASS`, with the
  [retrying documentation](https://www.teapie.fun/docs/retrying.html) for deeper
  configuration

The [next article](/) goes deeper: custom test directives, custom auth
providers, named retry strategies, reporting, and TeaPie's AI-assisted workflows.

## Links

- [TeaPie documentation](https://www.teapie.fun/docs/introduction.html)
- [Environments](https://www.teapie.fun/docs/environments.html)
- [Retrying](https://www.teapie.fun/docs/retrying.html)
- [Functions](https://www.teapie.fun/docs/functions.html)
- [MMLib.DummyApi on GitHub](https://github.com/Burgyn/MMLib.DummyApi)
- [Part 1 of this series]({% post_url 2026-03-12-teapie-getting-started %})
