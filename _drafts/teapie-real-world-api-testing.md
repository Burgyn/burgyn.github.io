---
layout: post
title: "TeaPie: Testing real-world API scenarios"
tags: [dotnet, testing, api, tools]
comments: true
description: "Environments, authenticated endpoints, retry polling, pre-request scripts, and validation — real-world API testing with TeaPie."
linkedin_post_text: ""
social_post_key: "teapie-real-world-api-testing"
date: 2055-02-18 18:00:00 +01:00
image: /assets/images/teapie-real-world-api-testing-cover.png
thumbnail: /assets/images/teapie-real-world-api-testing-cover.png
keywords:
- TeaPie
- API testing
- environments
- authentication
- retry
- dotnet tool
---

In the [first article](/), I showed how to get from zero to passing tests in a few minutes — a `GET` test with only directives, then a `POST` test with a `.csx` script for real assertions.

That's a solid start, but real APIs are messier. They have environments (local vs staging), authenticated endpoints, background jobs that take time, and they reject invalid payloads. Let's cover all of that.

I'm still using [MMLib.DummyApi](https://github.com/Burgyn/MMLib.DummyApi) as the demo backend. If you haven't read the [first article](/), the short version is: spin it up with `docker run -p 8080:8080 ghcr.io/burgyn/mmlib-dummyapi`.

## Environments

Until now, the API base URL was hardcoded in every `.http` file. That breaks the moment you want to run the same tests against staging. Let's fix that.

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

`$shared` is the default environment — its variables are always available. `staging` overrides `ApiBaseUrl` for that specific environment.

Now update your `.http` files to use the variable:

```http
## TEST-EXPECT-STATUS: [200]
## TEST-HAS-BODY
GET {{ApiBaseUrl}}/products
```

Run against local (default):

```bash
teapie test Tests/
```

Run against staging:

```bash
teapie test Tests/ -e staging
```

One test collection, multiple environments.

## Full CRUD workflow

Let me add the remaining product operations. The products collection from the first article now gets update and delete steps.

### Update a product

`Tests/001-Products/004-Update-Product-req.http`:

```http
# @name UpdateProductRequest
## TEST-EXPECT-STATUS: [200]
## TEST-HAS-BODY
PUT {{ApiBaseUrl}}/products/{{NewProductId}}
Content-Type: application/json

{
  "productName": "TeaPie Mug (Updated)",
  "price": 14.99,
  "category": "merchandise",
  "sku": "MUG-001"
}
```

`{{NewProductId}}` was set by `tp.SetVariable` in the create test case. TeaPie caches collection-level variables across test cases within the same run.

`004-Update-Product-test.csx`:

```csharp
await tp.Test("Updated product name should reflect the change.", async () =>
{
    dynamic body = await tp.Response.GetBodyAsExpandoAsync();
    Equal("TeaPie Mug (Updated)", (string)body.productName);
    Equal(14.99, (double)body.price);
});
```

### Delete a product

`Tests/001-Products/005-Delete-Product-req.http`:

```http
## TEST-EXPECT-STATUS: [200]
DELETE {{ApiBaseUrl}}/products/{{NewProductId}}
```

No post-response script needed — the status directive is enough.

## Authenticated endpoints

The `orders` collection requires an `X-Api-Key` header. If you send a request without it, you get 401.

### Positive test — create an order

`Tests/002-Orders/001-Create-Order-req.http`:

```http
# @name CreateOrderRequest
## TEST-EXPECT-STATUS: [201]
POST {{ApiBaseUrl}}/orders
Content-Type: application/json
X-Api-Key: {{ApiKey}}

{
  "customerId": "{{$guid}}",
  "productId": "{{$guid}}",
  "quantity": 2,
  "totalPrice": 29.98
}
```

`{{ApiKey}}` comes from `env.json`. `{{$guid}}` is a built-in TeaPie function that generates a UUID on each run.

`001-Create-Order-test.csx`:

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

### Negative test — unauthorized access

Testing that your API correctly rejects unauthorized requests is just as important as testing happy paths.

`Tests/002-Orders/003-Unauthorized-Access-req.http`:

```http
## TEST-EXPECT-STATUS: [401]
GET {{ApiBaseUrl}}/orders
```

No `X-Api-Key` header. The `TEST-EXPECT-STATUS: [401]` directive asserts the rejection. Simple.

## Testing background jobs with retries

The `orders` collection has a background job that advances the order status through `pending → processing → completed` every few seconds. How do you test async state transitions like this?

With **retry directives**. Create an order, then poll the status endpoint until it reaches `completed`.

`Tests/002-Orders/002-Check-Order-Status-req.http`:

```http
# @name CheckOrderStatusRequest
## RETRY-UNTIL-STATUS: [200]
## RETRY-MAX-ATTEMPTS: 10
## RETRY-BACKOFF-TYPE: Linear
GET {{ApiBaseUrl}}/orders/{{NewOrderId}}
```

TeaPie retries the request using the configured strategy until the condition is met or attempts are exhausted. You don't need to write any polling loop — the directive handles it.

`002-Check-Order-Status-test.csx`:

```csharp
await tp.Test("Order should eventually reach 'completed' status.", async () =>
{
    dynamic body = await tp.Response.GetBodyAsExpandoAsync();
    Equal("completed", (string)body.status);
});
```

> You can also use `## RETRY-UNTIL-TEST-PASS: <test-name>` to keep retrying until a named test in your `.csx` script passes. This gives you finer control than just checking the status code.

## Pre-request scripts and custom functions

Sometimes you need to set up data or compute values before sending a request. That's what pre-request scripts (`-init.csx`) are for.

Let me add a custom date function so the order request can include a `dueDate` field computed at runtime. Create `Tests/002-Orders/001-Create-Order-init.csx`:

```csharp
// Register a custom function usable in .http files
tp.RegisterFunction("$dueDateFromNow", (int days) =>
{
    return DateTime.UtcNow.AddDays(days).ToString("yyyy-MM-dd");
});
```

Now use it in the request body:

```http
{
  "customerId": "{{$guid}}",
  "productId": "{{$guid}}",
  "quantity": 2,
  "totalPrice": 29.98,
  "dueDate": "{{$dueDateFromNow 7}}"
}
```

`{{$dueDateFromNow 7}}` calls the registered function with `7` as the argument — returns a date 7 days from now.

## Validation testing

APIs should reject invalid payloads. Let's verify that the products endpoint enforces its schema.

`Tests/003-Edge-Cases/001-Validation-Error-req.http`:

```http
## TEST-EXPECT-STATUS: [400]
POST {{ApiBaseUrl}}/products
Content-Type: application/json

{
  "price": -5
}
```

Price is negative and `productName` is missing — both are invalid per the DummyApi schema. The `400` directive asserts rejection.

For more detailed validation of the error response body:

`001-Validation-Error-test.csx`:

```csharp
await tp.Test("Validation error response should contain error details.", async () =>
{
    dynamic body = await tp.Response.GetBodyAsExpandoAsync();
    // The response should have an 'errors' property
    NotNull(body.errors);
});
```

## Where you are now

The test collection now covers:

- Multiple environments via `env.json` — switch with `-e`
- Full CRUD with variables flowing between test cases
- Authenticated endpoints (positive and negative paths)
- Async background job polling with retry directives
- Pre-request scripts with custom functions
- Validation failure testing

The [next article](/) goes deeper: custom test directives to eliminate repetitive assertions, a custom authentication provider for cleaner auth setup, named retry strategies, chaos testing with DummyApi simulation headers, custom reporting, and how to use TeaPie's AI skill to generate tests with an AI agent.

## Links

- [TeaPie documentation](https://www.teapie.fun/docs/introduction.html)
- [Environments](https://www.teapie.fun/docs/environments.html)
- [Retrying](https://www.teapie.fun/docs/retrying.html)
- [MMLib.DummyApi on GitHub](https://github.com/Burgyn/MMLib.DummyApi)
- [Part 1 of this series](/)
