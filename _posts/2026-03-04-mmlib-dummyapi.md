---
layout: post
title: MMLib.DummyApi - Configurable mock API for prototypes and testing
tags: [dotnet, api, testing, tools]
comments: true
description: "I built a configurable mock API with CRUD and edge-case simulation for UI prototypes, demos, and testing tools."
linkedin_post_text: ''
social_post_key: 'mmlib-dummyapi'
date: 2026-03-04 18:00:00.000000000 +01:00
image: "/assets/images/mmlib-dummyapi-cover.png"
thumbnail: "/assets/images/mmlib-dummyapi-cover.png"
keywords:
- mock api
- ui prototyping
- integration testing
- load testing
- dummy data
---

This is probably one of those projects that helps mostly me. Still, I wanted to share it in case you run into the same problems.

I often need a working API for quick UI prototypes, UI framework testing, integration tool testing, load-testing tools, and demo projects for talks *(conference, school, meetup)*. I do not want to build a new backend every single time just to have realistic endpoints and data.

So I built [`MMLib.DummyApi`](https://github.com/Burgyn/MMLib.DummyApi): a configurable mock REST API that starts fast and gives me fully functional CRUD endpoints, generated seed data, validation, and edge-case simulation.

## Why this project exists

The core idea is simple:

- I have different frontends and tools to test.
- I need realistic data and behavior.
- I need to control "bad" scenarios too.

Instead of creating another one-off API *(or asking an agent to generate one again)*, I provide configuration and the API is ready.

Out of the box, it is not read-only mock data. The API works with:

- `GET /{collection}`
- `GET /{collection}/{id}`
- `POST /{collection}`
- `PUT /{collection}/{id}`
- `DELETE /{collection}/{id}`

POST/PUT payloads are validated by your JSON schema, and collections can be seeded with dummy data on startup.

## Quick start

Run it with Docker:

```bash
docker pull ghcr.io/burgyn/mmlib-dummyapi
docker run -p 8080:8080 ghcr.io/burgyn/mmlib-dummyapi
```

Try a default collection:

```bash
curl http://localhost:8080/products
```

API docs are available at `http://localhost:8080/scalar/v1`.

## Create your own records collection

In my case, I often need some custom "evidence" or "records" collection. Here is a minimal example:

```json
{
  "collections": [
    {
      "name": "records",
      "displayName": "Records",
      "seedCount": 5,
      "schema": {
        "type": "object",
        "required": ["title", "status"],
        "properties": {
          "title": { "type": "string", "minLength": 2 },
          "status": { "type": "string", "enum": ["new", "processing", "done"] },
          "ownerEmail": { "type": "string", "format": "email" }
        }
      }
    }
  ]
}
```

Save it as `my-collections.json` and start the container with config mount:

```bash
docker run -p 8080:8080 \
  -v ./my-collections.json:/config/collections.json \
  -e DUMMYAPI__COLLECTIONSFILE=/config/collections.json \
  ghcr.io/burgyn/mmlib-dummyapi
```

Now verify round-trip CRUD quickly:

```bash
curl -X POST http://localhost:8080/records \
  -H "Content-Type: application/json" \
  -d '{"title":"Load test scenario","status":"new","ownerEmail":"john@example.com"}'

curl http://localhost:8080/records
```

## Simulate edge cases without extra coding

This is the part I use a lot in demos and testing:

- Delays: `X-Simulate-Delay: 500`
- Forced error: `X-Simulate-Error: true`
- Retry scenario: `X-Simulate-Retry: 3` with `X-Request-Id`
- Random chaos latency/failures with chaos headers
- Background updates with `backgroundJob` *(for example status transitions)*

A tiny retry simulation call can look like this:

```bash
curl http://localhost:8080/records \
  -H "X-Simulate-Retry: 3" \
  -H "X-Request-Id: demo-retry-1"
```

This lets me test how UI and integration clients behave when things are not perfect, without implementing custom fault endpoints.

## Wrap-up

I built this as a practical utility for my own daily workflows, but maybe it helps you too if you prototype often or need controllable API behavior for tests and demos.

I kept this article intentionally simple. Full details, all configuration options, and more advanced scenarios are in the project README.

## Links

- GitHub repository: <https://github.com/Burgyn/MMLib.DummyApi>
