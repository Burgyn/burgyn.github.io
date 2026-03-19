---
key: teapie-real-world-api-testing
blog_post_title: "TeaPie: Testing real-world API scenarios"
blog_post_path: "_posts/2026-03-18-teapie-real-world-api-testing.md"
created_date: 2026-03-19
---

# teapie-real-world-api-testing

## LinkedIn

🧩 Second TeaPie article — what changes when you leave the minimal “first green test” setup behind.

Part 1 was directives, a bit of .csx, and chaining IDs. Here I skip repeating that pattern and focus on things that usually bite you on a real API.

🛠️ What’s in the post:
→ Environments — `.teapie/env.json`, shared defaults vs overrides when you point tests at another base URL
→ API keys — how DummyApi expects auth and how that flows into `.http` requests
→ Pre-request scripts — set variables that the file consumes (cleaner than hardcoding and copy-paste)
→ Built-in functions — small helpers so values stay readable in the file
→ Retries — flaky HTTP and work that finishes asynchronously in the background

Same Docker image for the demo API as in part 1; links to TeaPie docs where it helped me.

<https://blog.burgyn.online/2026/03/18/teapie-real-world-api-testing> #dotnet #testing #apitesting #teapie

## Bluesky

Part 2 on TeaPie: environments, API keys on DummyApi, pre-request vars, built-in .http helpers, retries — follow-up to the getting-started post. <https://blog.burgyn.online/2026/03/18/teapie-real-world-api-testing> #dotnet #testing
