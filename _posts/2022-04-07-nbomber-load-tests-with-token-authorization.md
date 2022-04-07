---
layout: post
title: NBomber load tests with token authentication
tags: [C#, .NET, Load test]
author: Miňo Martiniak
comments: true
date: 2022-04-07 18:30:00 +0100
---

I usually used [jMeter](https://jmeter.apache.org/) to create load tests. It's a really comprehensive tool with which you can basically do everything you can think of. However, the visual definition of load tests may not suit everyone.

And that's why I looked for other options. I found [NBomber](https://nbomber.com/), lightweight framework for writing load tests. I liked it so much that we started using it.

This article will not be about what load tests are, nor will it be a general guide to NBomber *(they have it nicely described in their [documentation](https://nbomber.com/docs/overview/))*. It's about how to authenticate virtual users when requesting the API server.

You test the load, so you want tens, hundreds, thousands, ... of virtual users. But you don't usually need *(or don't want)* that many users for the given requests.

First we load the users we want to use:

```csharp
List<User> users = new()
{
    new("user1", "pwd1"), new("user2", "pwd2"), new("user3", "pwd3"),
    new("user4", "pwd4"), new("user5", "pwd5")
};
```

> In the real world, values come from some configuration file.

We define how to obtain an authorization token from your authentication server.

E.g.:

```csharp
async Task<string> GetUserToken(User user)
{
    using var client = new HttpClient();
    client.BaseAddress = new Uri("https://your_authentication_server_uri");

    // call your authentication server
    var response = await client.PostAsJsonAsync("/api/login", user);

    return await response.Content.ReadAsStringAsync();
}
```

This is key. We define how the client used in each step will be created. We will use the [`ClientFactory`](https://nbomber.com/docs/general-concepts#clientfactory) for that.

```csharp
// Create 5 http clients for 5 real users with token
var httpFactory = ClientFactory.Create(
    "http_factory",
    clientCount: 5,
    initClient: async (number, _) =>
    {
        var client = new HttpClient();
        client.BaseAddress = new Uri("http://api_server_uri");
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                await GetUserToken(users[number]));
        return client;
    });
```

The `clientCount: 5` must match the number of real users.

In the initialization part we get the token and set it as the default authorization header:

```csharp
client.DefaultRequestHeaders.Authorization = 
    new AuthenticationHeaderValue(
        "Bearer", 
        await GetUserToken(users[number])
```

Each virtual user then uses one of these five real users.

> All steps within one iteration of the scenario use the same client.

And we can now use that client with `await context.Client...`.

```csharp
var getListStep = Step.Create("Get projects list", httpFactory, async context =>
{
    var response = await context.Client.GetAsync("/api/projects", context.CancellationToken);

    if (!response.IsSuccessStatusCode)
    {
        return Response.Fail(statusCode: (int)response.StatusCode);
    }

    var projects = await response.Content.ReadFromJsonAsync<IEnumerable<Project>>();

    return Response.Ok(statusCode: (int)response.StatusCode, payload: projects!.First().Id);
});
```

You can see the whole demo project at [Github](https://github.com/Burgyn/Sample.NBomber).
