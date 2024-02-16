---
layout: post
title: Simplify tuple types using aliases
tags: [csharp, dotnet]
author: Miňo Martiniak
comments: true
date: 2024-02-18 18:00:00.000000000 +01:00 
---

Are you a fan of functional programming, or do you just like using tuple types? 
In that case your code might look something like this:

```csharp
static (decimal score, string grade) Grade(decimal score)
    => score switch
    {
        >= 90M => (score, "A"),
        >= 80M => (score, "B"),
        >= 70M => (score, "C"),
        >= 60M => (score, "D"),
        _ => (score, "F")
    };

(decimal score, string grade) grade1 = Grade(95M);

static Task<IEnumerable<(decimal score, string grade)>> GetGrades()
    => Task.FromResult(Enumerable.Empty<Grade>());
```

Since C# 12, we can simplify this and similar code by defining aliases for tuple types.

```csharp
using Grade = (decimal score, string grade);
using Grades = System.Collections.Generic.IEnumerable<(decimal score, string grade)>;
```

Now we can use these aliases in our code.

```csharp
static Grade Grade(decimal score)
    => score switch
    {
        >= 90M => (score, "A"),
        >= 80M => (score, "B"),
        >= 70M => (score, "C"),
        >= 60M => (score, "D"),
        _ => (score, "F")
    };

Grade grade1 = Grade(95M);
var grade2 = new Grade(91, "A");

static Task<Grades> GetGrades()
    => Task.FromResult(Enumerable.Empty<Grade>());
```
