---
key: teapie-getting-started
blog_post_title: "TeaPie: Test your REST API in 5 minutes"
blog_post_path: "_posts/2026-03-12-teapie-getting-started.md"
created_date: 2026-03-13
---

## LinkedIn

🎓 About a year ago, Matej Grochal - a colleague from KROS - built TeaPie as part of his thesis. Since then it has become our primary tool for integration testing - we now have thousands of tests built on top of it. And it's slowly getting discovered by people outside our team too.

I wrote a getting-started article that shows how to go from zero to running API tests in a few minutes.

🛠️ What TeaPie is:
→ A CLI tool for REST API testing using plain .http and .csx files
→ The same format you know from VS Code REST Client or Visual Studio HTTP file support

📝 Three things I show in the article:
→ Directives - TEST-EXPECT-STATUS, TEST-HAS-BODY - assertions without any C# code
→ .csx post-response scripts - real assertions using XUnit or your preferred assertion library
→ Request variables - chain requests together (use the ID from a POST response in the next GET)

📌 This is just the start. More articles are coming - environments, authentication, background jobs, validation errors, custom directives, and AI-assisted test generation.

https://blog.burgyn.online/2026/03/12/teapie-getting-started

#testing #apitesting #teapie

## Bluesky

Wrote a getting-started guide for TeaPie — a .NET CLI tool for API testing with .http files. Matej Grochal built it as his thesis; we've been running thousands of integration tests on it ever since.

https://blog.burgyn.online/2026/03/12/teapie-getting-started

#dotnet #testing
