---
layout: post
title: "TeaPie: Advanced customization, CI/CD, and AI-powered testing"
tags: [dotnet, testing, api, tools]
comments: true
description: "Custom directives, authentication providers, retry strategies, chaos testing, JUnit reporting, and AI-assisted test generation with TeaPie."
linkedin_post_text: ""
social_post_key: "teapie-advanced-customization-and-ai"
date: 2055-02-18 18:00:00 +01:00
image: /assets/images/teapie-advanced-customization-and-ai-cover.png
thumbnail: /assets/images/teapie-advanced-customization-and-ai-cover.png
keywords:
- TeaPie
- API testing
- custom directives
- CI/CD
- AI testing
- dotnet tool
---

This is the third and final article in the TeaPie series. In [part 1](/) we went from zero to passing tests in minutes. In [part 2](/) we handled environments, auth, retry polling, and validation. Now let's go deeper — the things that make TeaPie genuinely powerful for production test suites.

I'll cover: custom test directives, custom authentication providers, named retry strategies, chaos testing with [MMLib.DummyApi](https://github.com/Burgyn/MMLib.DummyApi) simulation headers, JUnit XML reporting for CI/CD, and AI-powered test generation with TeaPie's agent skill.

## Initialization script

Everything in this article lives in `.teapie/init.csx`. This script runs once before the first test case in a collection run — it's where you register everything that needs to exist before tests execute.

```bash
# if you don't have one yet
touch .teapie/init.csx
```

## Custom test directives

If you write `## TEST-HAS-BODY` and `## TEST-EXPECT-STATUS` on every request, you're fine. But eventually you'll have project-specific assertions that repeat across many test cases. Custom directives let you package those assertions and use them inline in `.http` files.

Let's register a directive that checks whether a JSON response contains a property with a specific value. Add this to `.teapie/init.csx`:

```csharp
tp.RegisterTestDirective(
    "FIELD-EQUALS",
    TestDirectivePatternBuilder
        .Create("FIELD-EQUALS")
        .AddStringParameter("FieldName")  // 👈 e.g. "status"
        .AddStringParameter("ExpectedValue")  // 👈 e.g. "pending"
        .Build(),
    (parameters) =>
        $"Field '{parameters["FieldName"]}' should equal '{parameters["ExpectedValue"]}'.",
    async (response, parameters) =>
    {
        dynamic body = await response.GetBodyAsExpandoAsync();
        var actual = ((IDictionary<string, object>)body)[parameters["FieldName"]]?.ToString();
        Equal(parameters["ExpectedValue"], actual);
    }
);
```

Now use it in any `.http` file:

```http
# @name CreateOrderRequest
## TEST-EXPECT-STATUS: [201]
## TEST-FIELD-EQUALS: status; pending
POST {{ApiBaseUrl}}/orders
Content-Type: application/json
X-Api-Key: {{ApiKey}}

{
  "customerId": "{{$guid}}",
  "quantity": 1,
  "totalPrice": 14.99
}
```

The directive reads cleaner than a `.csx` assertion for common checks, and any failure message is meaningful: `Field 'status' should equal 'pending'.`

## Custom authentication provider

In part 2, we passed the API key directly in the header of each request. That works, but it's noisy and doesn't scale. A better approach is a proper authentication provider that injects the header automatically.

Register it in `.teapie/init.csx`:

```csharp
// 👇 Define the provider class inside the init script
public class ApiKeyAuthProvider(IApplicationContext context) : IAuthProvider
{
    private readonly IApplicationContext _context = context;
    private string _apiKey = string.Empty;

    public IAuthProvider ConfigureOptions(string apiKey)
    {
        _apiKey = apiKey;
        return this;
    }

    public Task Authenticate(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.TryAddWithoutValidation("X-Api-Key", _apiKey);
        return Task.CompletedTask;
    }
}

// Register and set as default for all requests
tp.RegisterDefaultAuthProvider(
    "ApiKey",
    new ApiKeyAuthProvider(tp.ApplicationContext)
        .ConfigureOptions(tp.GetVariable<string>("ApiKey"))
);
```

Now all requests get the `X-Api-Key` header automatically. To disable it for unauthenticated endpoints, add the directive:

```http
## AUTH-PROVIDER: None
GET {{ApiBaseUrl}}/products
```

For OAuth2, TeaPie has built-in support — configure it with `tp.ConfigureOAuth2Provider()` and call `tp.SetOAuth2AsDefaultAuthProvider()`. The same `## AUTH-PROVIDER: OAuth2` directive syntax applies.

## Named retry strategies

In part 2, retry directives were applied per-request. For complex suites, it's cleaner to register named strategies once and reference them by name.

In `.teapie/init.csx`:

```csharp
tp.RegisterRetryStrategy("WaitForCompletion", new RetryStrategyOptions<HttpResponseMessage>
{
    MaxRetryAttempts = 15,
    Delay = TimeSpan.FromSeconds(2),
    MaxDelay = TimeSpan.FromSeconds(10),
    BackoffType = DelayBackoffType.Linear,
    ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
        .HandleResult(r => r.IsSuccessStatusCode)  // keep retrying on any success
});
```

Reference it in a `.http` file and override only what you need for that specific request:

```http
## RETRY-STRATEGY: WaitForCompletion
## RETRY-UNTIL-TEST-PASS: Order should eventually reach 'completed' status.
GET {{ApiBaseUrl}}/orders/{{NewOrderId}}
```

`RETRY-UNTIL-TEST-PASS` retries until the named test (defined in the corresponding `.csx` script) passes — more expressive than just checking the status code.

## Chaos testing

This is where DummyApi really shines for testing. It supports simulation headers that trigger failure modes without any backend changes:

| Header | Effect |
| --- | --- |
| `X-Simulate-Delay: 2000` | 2 second delay |
| `X-Simulate-Error: true` | Forces 500 Internal Server Error |
| `X-Simulate-Retry: 3` | Fails first 2 requests, succeeds on the 3rd |
| `X-Chaos-FailureRate: 0.4` | 40% random failure rate |
| `X-Chaos-LatencyRange: 200-800` | Random latency between 200 and 800 ms |

Combine them with TeaPie retry strategies to verify your client handles instability correctly.

`Tests/003-Edge-Cases/002-Chaos-Testing-req.http`:

```http
# @name ChaoticGet
## RETRY-STRATEGY: WaitForCompletion
## RETRY-MAX-ATTEMPTS: 5
## RETRY-UNTIL-STATUS: [200]
GET {{ApiBaseUrl}}/products
X-Chaos-FailureRate: 0.5
X-Chaos-LatencyRange: 100-500
```

`Tests/003-Edge-Cases/002-Chaos-Testing-test.csx`:

```csharp
tp.Test("Response should eventually succeed despite chaos.", () =>
{
    Equal(200, tp.Response.StatusCode());
});
```

### Testing retry behavior explicitly

`Tests/003-Edge-Cases/003-Simulate-Retry-req.http`:

```http
## RETRY-MAX-ATTEMPTS: 5
## RETRY-UNTIL-STATUS: [200]
GET {{ApiBaseUrl}}/products
X-Simulate-Retry: 3
X-Request-Id: {{$guid}}
```

`X-Request-Id` is required with `X-Simulate-Retry` — DummyApi tracks retry state per request ID. TeaPie's `{{$guid}}` generates a fresh ID each run.

## Reporting

### Console output

By default, TeaPie prints a summary table to the console at the end of each collection run. No configuration needed.

### JUnit XML for CI/CD

GitHub Actions and Azure DevOps both understand JUnit XML natively:

```bash
teapie test Tests/ -r test-results.xml
```

In a GitHub Actions workflow:

```yaml
- name: Run API tests
  run: teapie test Tests/ -r test-results.xml

- name: Publish test results
  uses: dorny/test-reporter@v1
  if: always()
  with:
    name: TeaPie Results
    path: test-results.xml
    reporter: java-junit
```

### Custom reporter

For anything beyond the built-in formats, register a reporter in `.teapie/init.csx`:

```csharp
tp.RegisterReporter(async summary =>
{
    if (!summary.AllTestsPassed)
    {
        // Send a notification, write to a file, call a webhook, etc.
        var message = $"{summary.NumberOfFailedTests} tests failed " +
                      $"({summary.PercentageOfFailedTests:F1}% failure rate).";

        foreach (var failed in summary.FailedTests)
        {
            message += $"\n  - {failed.TestName}: {failed.FailureMessage}";
        }

        Console.Error.WriteLine(message);
    }

    await Task.CompletedTask;
});
```

`TestsResultsSummary` has everything you need: `AllTestsPassed`, `NumberOfExecutedTests`, `NumberOfFailedTests`, `PercentageOfFailedTests`, `FailedTests`, and more.

## AI-powered testing with TeaPie Skills

TeaPie ships with an AI agent skill for Cursor and VS Code. Once installed, your AI agent knows the TeaPie API, file conventions, and best practices — and can generate test cases for you.

### Install the skill

You can do it manually, or paste this prompt into your AI agent:

```text
Set up TeaPie in this project by following these steps:

1. Download the TeaPie skill from the GitHub repository into this project.
   - Skill location: https://github.com/Kros-sk/TeaPie/tree/master/.cursor/skills/teapie/
   - Determine the target location based on the IDE:
     * For Cursor: .cursor/skills/teapie/
     * For VS Code: .github/skills/teapie/
   - Download the entire teapie directory and copy it to the correct target location.

2. Install TeaPie.Tool globally using:
   dotnet tool install -g TeaPie.Tool

3. Initialize TeaPie configuration by running:
   teapie init
```

The agent downloads the skill, installs the CLI, and sets up the project.

### Generate tests with the agent

Once the skill is active, you can describe what you want tested and the agent generates proper `.http` files and `.csx` scripts. It understands context: your `env.json`, existing test cases, and the TeaPie conventions. You get something to review and iterate on rather than starting from a blank file.

This is especially useful when you need to cover a lot of endpoints quickly — let the agent draft the structure, you refine the assertions.

## The complete init.csx

Here's the full `.teapie/init.csx` after all three articles:

```csharp
// Environment
tp.SetEnvironment("local");

// Authentication
tp.RegisterDefaultAuthProvider(
    "ApiKey",
    new ApiKeyAuthProvider(tp.ApplicationContext)
        .ConfigureOptions(tp.GetVariable<string>("ApiKey"))
);

// Retry strategies
tp.RegisterRetryStrategy("WaitForCompletion", new RetryStrategyOptions<HttpResponseMessage>
{
    MaxRetryAttempts = 15,
    Delay = TimeSpan.FromSeconds(2),
    MaxDelay = TimeSpan.FromSeconds(10),
    BackoffType = DelayBackoffType.Linear,
    ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
        .HandleResult(r => r.IsSuccessStatusCode)
});

// Custom directives
tp.RegisterTestDirective(
    "FIELD-EQUALS",
    TestDirectivePatternBuilder
        .Create("FIELD-EQUALS")
        .AddStringParameter("FieldName")
        .AddStringParameter("ExpectedValue")
        .Build(),
    (p) => $"Field '{p["FieldName"]}' should equal '{p["ExpectedValue"]}'.",
    async (response, p) =>
    {
        dynamic body = await response.GetBodyAsExpandoAsync();
        var actual = ((IDictionary<string, object>)body)[p["FieldName"]]?.ToString();
        Equal(p["ExpectedValue"], actual);
    }
);

// Reporting
tp.RegisterReporter(async summary =>
{
    if (!summary.AllTestsPassed)
    {
        Console.Error.WriteLine(
            $"{summary.NumberOfFailedTests} tests failed.");
    }
    await Task.CompletedTask;
});

// Custom provider class
public class ApiKeyAuthProvider(IApplicationContext context) : IAuthProvider
{
    private readonly IApplicationContext _context = context;
    private string _apiKey = string.Empty;

    public IAuthProvider ConfigureOptions(string apiKey)
    {
        _apiKey = apiKey;
        return this;
    }

    public Task Authenticate(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        request.Headers.TryAddWithoutValidation("X-Api-Key", _apiKey);
        return Task.CompletedTask;
    }
}
```

## Wrap-up

That's the full picture. Three articles, one progressively-built demo project, and a complete TeaPie setup:

1. **Part 1** — directives, `.csx` scripts, request variables. Zero to tests in minutes.
2. **Part 2** — environments, CRUD workflows, auth, async polling with retries, validation.
3. **Part 3** — custom directives, custom auth providers, named retry strategies, chaos testing, CI/CD reporting, and AI-powered test generation.

TeaPie stays out of your way when you don't need it and gives you the tools when you do.

## Links

- [TeaPie documentation](https://www.teapie.fun/docs/introduction.html)
- [Directives reference](https://www.teapie.fun/docs/directives.html)
- [Authentication](https://www.teapie.fun/docs/authentication.html)
- [Reporting](https://www.teapie.fun/docs/reporting.html)
- [MMLib.DummyApi on GitHub](https://github.com/Burgyn/MMLib.DummyApi)
- [Part 1 of this series](/)
- [Part 2 of this series](/)
