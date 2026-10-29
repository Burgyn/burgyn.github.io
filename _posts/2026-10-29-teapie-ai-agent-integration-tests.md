---
layout: post
title: "Let your AI agent write integration tests for your API"
tags: [dotnet, testing, api, ai]
comments: true
description: "AI agents write backend code fast. With TeaPie and its Claude Code plugin, they can also write, run and fix integration tests for your API."
linkedin_post_text: ""
social_post_key: ""
date: 2026-10-29 12:00:00 +01:00
image: "/assets/images/teapie-ai-agent-integration-tests-cover.png"
thumbnail: "/assets/images/teapie-ai-agent-integration-tests-cover.png"
keywords:
  - TeaPie
  - AI agent
  - Claude Code
  - API integration testing
  - .http files
  - dotnet tool
---

AI agents write backend code fast. A new endpoint, a validation rule, a background
job - a few minutes and it's done. The part that usually stays behind is the proof
that the API really behaves the way you think it does.

Unit tests help, and agents are happy to write them. However, they test classes,
not the HTTP contract: status codes, headers, JSON shapes, auth, and what happens
when a background job finishes two seconds later. That's what integration tests are
for, and that's exactly the part I want the agent to do for me.

In this post I'll show how I let an agent write, run and fix API integration tests
with [TeaPie](https://www.teapie.fun) - and why plain `.http` files turned out to be
a great format for it.

> 💁 If you haven't used TeaPie yet, the
> [getting started post](/2026/03/12/teapie-getting-started) takes five minutes.
> You don't need it to follow this one, though.

## Why TeaPie fits AI agents

An agent works in a loop: write something, run it, read the output, fix it, repeat.
The faster and clearer that loop is, the better the result. TeaPie fits it well:

- **Tests are plain text.** A test case is a `.http` file with optional C# scripts
  next to it. No test project, no compilation of a whole solution, no fixtures.
  The agent writes a small file and runs it right away.
- **Simple checks need no code.** `## TEST-EXPECT-STATUS: [201]` is one line the agent
  can't get wrong. C# scripts are there only for real assertions.
- **One CLI command with an exit code.** `teapie test` returns `0` when everything
  passes, so the agent (and your CI) knows immediately whether it's done.
- **Failures are easy to investigate.** `--requests-log-file` writes every request and
  response to a JSON file, so the agent can see exactly what the server returned
  instead of guessing.
- **Everything ends up in your PR.** The tests live next to the backend code, so you
  review them like any other change.

The missing piece is that the agent has to *know* TeaPie: the file conventions,
the directives, the `tp` API in scripts. That's what the TeaPie skill is for.

## Install the TeaPie plugin

You need the TeaPie CLI:

```bash
dotnet tool install -g TeaPie.Tool
```

In Claude Code, install the TeaPie plugin. It contains a skill that teaches the agent
everything about TeaPie - how to structure test cases, which directives exist,
how to write `.csx` scripts, and how to debug failing tests:

```text
/plugin install teapie --marketplace Kros-sk/TeaPie
```

Using a different agent, or want the skill committed into your repository so the
whole team gets it? Download it into the project instead:

```bash
teapie install-skills
```

This puts the skill into `.claude/skills/teapie/`.

## Ask for tests

I'll use [MMLib.DummyApi](https://github.com/Burgyn/MMLib.DummyApi) as the backend
again, so you can try it without writing an API first:

```bash
docker run -p 8080:8080 ghcr.io/burgyn/mmlib-dummyapi
```

Its `orders` endpoints are a nice test subject. They require an `X-Api-Key`
header, validate the body, and a background job moves each new order to
`completed` a few seconds after it's created.

Now the prompt:

```text
Cover the orders endpoints of the API running on http://localhost:8080 with TeaPie
integration tests. The API key is test-api-key-123. Include the happy path,
validation errors, a missing API key, and check that a new order eventually
reaches the 'completed' status. Run the tests and make sure they pass.
```

I ran exactly this prompt in Claude Code with the TeaPie plugin installed, in an
empty folder. Here's what happened.

First, the agent loaded the TeaPie skill. Then it found the OpenAPI document at
`/openapi/v1.json`. The spec doesn't say which header carries the API key, so it
sent a few requests with `curl` to see how the API really behaves. It read the
skill's references on directives and retries, ran `teapie init`, put the base URL
and the API key into `.teapie/env.json`, and wrote the tests:

```text
tests/teapie/
├── 001-Orders-Lifecycle/
│   ├── 001-Create-Order-req.http
│   ├── 001-Create-Order-test.csx
│   ├── 002-Get-Order-By-Id-req.http
│   ├── ...
│   └── 008-Get-Deleted-Order-req.http
├── 002-Orders-Validation/
│   ├── 001-Create-Order-Invalid-req.http
│   ├── 002-Update-Order-Invalid-req.http
│   └── 003-Non-Existent-Order-req.http
└── 003-Orders-Authentication/
    ├── 001-Missing-Api-Key-req.http
    └── 002-Invalid-Api-Key-req.http
```

26 files, 60 checks, about four minutes from the prompt to a green run.
*(It cost about $1.50 in API usage.)*

## What the agent writes

The tests look like the ones you'd write by hand. That's the point - you can read
and review them in a minute. All snippets below are exactly what the agent wrote.

The create request uses directives for the simple checks:

```http
# @name CreateOrderRequest
## TEST-EXPECT-STATUS: [201]
## TEST-HAS-BODY
## TEST-HAS-HEADER: Location
POST {{ApiBaseUrl}}/orders
Content-Type: application/json
X-Api-Key: {{ApiKey}}

{
    "customerId": "{{$guid}}",
    "customerName": "Jane Doe",
    "customerEmail": "jane.doe@example.com",
    "totalAmount": 149.99,
    "shippingAddress": "Main Street 12",
    "shippingCity": "Bratislava",
    "shippingCountry": "Slovakia"
}
```

The post-response script compares the response with the request and stores the
ID for the following test cases:

```csharp
await tp.Test("Created order should match the request and have an ID.", async () =>
{
    string requestBody = await tp.Request.Content.ReadAsStringAsync();
    string responseBody = await tp.Response.Content.ReadAsStringAsync();
    JsonContains(responseBody, requestBody);

    dynamic response = await tp.Response.GetBodyAsExpandoAsync();
    True(Guid.TryParse((string)response.id, out _));

    // 👇 shared with the next test cases in the collection
    tp.SetVariable("OrderId", (string)response.id);
    tp.SetVariable("CreatedOrder", requestBody);
});
```

The background job is where agents usually reach for `Thread.Sleep`. With the
skill, it used a TeaPie retry strategy instead. It registered the strategy once
in `.teapie/init.csx`:

```csharp
tp.RegisterRetryStrategy("Wait for order processing", new RetryStrategyOptions<HttpResponseMessage>
{
    MaxRetryAttempts = 30,
    Delay = TimeSpan.FromSeconds(1),
    BackoffType = DelayBackoffType.Constant
});
```

Then it retried the request until the test passed:

```http
## RETRY-STRATEGY: Wait for order processing
## RETRY-UNTIL-TEST-PASS: Order should eventually reach the completed status.
## TEST-EXPECT-STATUS: [200]
GET {{ApiBaseUrl}}/orders/{{OrderId}}
X-Api-Key: {{ApiKey}}
```

```csharp
await tp.Test("Order should eventually reach the completed status.", async () =>
{
    string responseBody = await tp.Response.Content.ReadAsStringAsync();
    var order = System.Text.Json.JsonDocument.Parse(responseBody).RootElement;
    True(order.TryGetProperty("status", out var status), "Order has no status yet.");
    Equal("completed", status.GetString());
});
```

The negative cases are just directives. Several requests share one file,
separated by `###`:

```http
# @name GetAllOrdersWithoutApiKey
## TEST-EXPECT-STATUS: [401]
GET {{ApiBaseUrl}}/orders

###

# @name CreateOrderWithoutApiKey
## TEST-EXPECT-STATUS: [401]
POST {{ApiBaseUrl}}/orders
Content-Type: application/json

{ ... }
```

## The loop: run, read, fix

Then the agent ran the whole collection:

```bash
teapie test tests/teapie
```

The first run wasn't green: 58 checks passed, 2 failed. The interesting one was
the test that reads the new order:

```text
'TeaPie.Json.CaseInsensitiveExpandoObject' does not contain a definition for 'status'
```

The agent didn't guess. It re-ran just the lifecycle folder, watched the retries,
and found out that the API returns a new order without any `status` for the first
three seconds or so. Then it goes `pending`, `processing`, and `completed` after
about ten seconds. The agent adjusted the tests to that behavior, ran the
collection again, and got 60 passed checks and exit code `0`.

And then the part I liked the most. In its summary, it pointed out that an order
without a status might be a bug in the API, and that if a new order should be
`pending` right away, the check should become strict. That's exactly the
conversation you want to have during code review.

> 💁 When the console output isn't enough, the skill tells the agent to re-run
> the failing test case with `--requests-log-file requests.json` (every request
> and response as JSON) or with `-v` for verbose logging. In my run, the console
> output was enough.

Notice what happened there, though. The agent made the tests pass by adapting
them to the API, and only *mentioned* the possible bug. Mine did it openly, but
don't count on that every time. If you test an API you own, tell the agent in
the prompt to report suspicious behavior instead of changing the expected values,
and review the assertions in the PR.

## Tests from an OpenAPI specification

If your API has an OpenAPI document, you can go one step further:

```text
Create TeaPie tests for all endpoints in our OpenAPI specification.
```

The skill describes how to find the specification (a file in the repository or a
runtime endpoint such as `/swagger/v1/swagger.json`) and how to turn each operation
into test cases with the right status codes and request bodies. It's a good way to
get a baseline for an existing API, and then you add the scenarios that matter
to your domain.

## Run it in CI

Nothing changes for CI. It's the same command, plus a JUnit XML report that
GitHub Actions or Azure DevOps can display:

```bash
teapie test Tests -e staging -r test-results.xml
```

The agent writes the tests, CI runs them on every PR, and you review both the code
and the tests in one place.

## Wrap-up

For me, the combination works because both sides are simple. TeaPie tests are
small text files with clear conventions, and the skill gives the agent exactly the
knowledge it needs to write them and debug them. You describe *what* to test, the
agent handles the *how*, and you stay in control through code review.

Give it a try on one of your endpoints. And if you have ideas on what the skill
should do better, [open an issue](https://github.com/Kros-sk/TeaPie/issues).

## Links

- [TeaPie on GitHub](https://github.com/Kros-sk/TeaPie)
- [TeaPie documentation](https://www.teapie.fun/docs/introduction.html)
- [AI Agent Skills documentation](https://www.teapie.fun/docs/ai-agent-skills.html)
- [Requests logging](https://www.teapie.fun/docs/requests-logging.html)
- [Retrying](https://www.teapie.fun/docs/retrying.html)
- [MMLib.DummyApi on GitHub](https://github.com/Burgyn/MMLib.DummyApi)
- [TeaPie: Test your REST API in 5 minutes](/2026/03/12/teapie-getting-started)
- [TeaPie: Testing real-world API scenarios](/2026/03/18/teapie-real-world-api-testing)
