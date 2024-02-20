---
layout: post
title: "NUKE.Build skip the execution of the upcoming targets"
tags: [C#,.NET,NUKE]
comments: true
date: 2022-05-15 18:00:00 +0100
---

### NUKE.Build skip the execution of the upcoming targets

We use NUKE.Build to build our projects. Sometimes we want to skip the execution of the upcoming targets. For example, if the previous target did not produce a specific artifact, you want to end all trigger targets. In this case, you can use the `Status` property of the targets in all targets in the execution plan and set it to `Skipped`.

```csharp
Target A => _ => _
    .Triggers(B,C)
    .Executes(() =>
    {
        if (!ContainsSpecificArtifacts())
        {
            foreach (var target in ExecutionPlan)
            {
                target.Status = ExecutionStatus.Skipped;
            }
        }
        Log.Logger.Information("Target A");
    });
```
