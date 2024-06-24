---
layout: post
title: Arch tests - Check project references
tags: [csharp, architecture, unit tests, AZURE]
comments: true
description: "The blog post discusses managing project references in WebAPI projects featuring C# codes to perform architectural tests and maintain project independence."
linkedin_post_text: "🧩Ever struggled with maintaining independence of your WebAPI projects? Our latest blog discusses how to manage project references and perform architectural tests to avoid dependencies. Includes C# code samples. Read it here: [Blog Post Link]👈 #WebAPI #CSharp #Azure #Architecture #UnitTests"
date: 2024-06-23 18:00:00.000000000 +01:00 
image: "/assets/images/code_images/arch-tests-check-project-references/cover.png"
thumbnail: "/assets/images/code_images/arch-tests-check-project-references/cover.png"
keywords:
- project references
- architectural test
- test project
- library
- code review
- ASP.NET Core WebAPI
---

In our company we have a large solution which contains more than 100 projects (not including test projects). Within that solution are WebAPI projects, libraries and AZURE functions. 
A couple of times it happened to us that our WebAPI projects referenced each other. Which is fundamentally wrong. They should be independent of each other and only reference other libraries.
*(we missed it during code review)*

> It is bad not only in principle, but also because MSBuild still has a problem and if you reference WebAPI projects in this way, it can non-deterministically give you `json` files in the output of one of the projects that are from another project. We have had this happen to us quite often.

We decided to do a test on it. I don't know if this is really the type of an architectural test, but let's say it is 😊.

I originally tried to use the `Microsoft.Build` and `Microsoft.Build.Locator` libraries. These libraries contain the `Project` and `ProjectCollection` classes, which can retrieve project properties and references. *(Microsoft uses this for MSBuild)* But the problem with this was that it was very slow and had its flies.

Fortunately we didn't need anything complicated from `csproj`, to be able to find out if it is a host project and its references.
So we read the necessary information from the `csproj` files directly via `XDocument`.

```csharp
internal class ProjectFile
{
    private HashSet<string> _projectReferences = [];

    public string Name { get; private set; } = string.Empty;

    public string DirectoryPath { get; private set; } = string.Empty;

    public string FullPath { get; private set; } = string.Empty;

    public string Sdk { get; private set; } = string.Empty;

    public string OutputType { get; private set; } = string.Empty;

    public string AzureFunctionsVersion { get; private set; } = string.Empty;

    public bool IsWebProject
        => OutputType.Equals("Exe", StringComparison.OrdinalIgnoreCase)
        || Sdk.Equals("Microsoft.NET.Sdk.Web", StringComparison.OrdinalIgnoreCase)
        || AzureFunctionsVersion.StartsWith("v", StringComparison.OrdinalIgnoreCase);

    public IEnumerable<string> ProjectsReferences => _projectReferences;

    public static async Task<ProjectFile> LoadAsync(string projectFilePath)
    {
        var projectFile = new ProjectFile();

        projectFile.Name = Path.GetFileNameWithoutExtension(projectFilePath);
        projectFile.FullPath = projectFilePath;
        projectFile.DirectoryPath = Path.GetDirectoryName(projectFilePath) ?? string.Empty;

        using var fileStream = new FileStream(projectFilePath, FileMode.Open, FileAccess.Read);

        var doc = await XDocument.LoadAsync(fileStream, LoadOptions.None, default);

        var projectElement = doc.Element("Project");
        if (projectElement != null)
        {
            projectFile.Sdk = projectElement.Attribute("Sdk")?.Value ?? string.Empty;

            var propertyGroup = projectElement.Element("PropertyGroup");
            if (propertyGroup != null)
            {
                projectFile.OutputType = propertyGroup.Element("OutputType")?.Value ?? string.Empty;
                projectFile.AzureFunctionsVersion = propertyGroup.Element("AzureFunctionsVersion")?.Value ?? string.Empty;
            }

            projectFile._projectReferences = projectElement
                .Elements("ItemGroup")
                .Elements("ProjectReference")
                .Attributes("Include")
                .Select(attr => attr.Value)
                .ToHashSet();
        }

        return projectFile;
    }
}
```

> be careful when using `Directory.Build.props`, then not all properties are directly in the `csproj` file.
> We didn't mind, though, because the necessary ones were there.

We used the SDK property for ASP.NET Core WebAPI projects to determine if it is a host project and the `AzureFunctionsVersion` property for Azure Functions.

```csharp
public bool IsWebProject
    => OutputType.Equals("Exe", StringComparison.OrdinalIgnoreCase)
    || Sdk.Equals("Microsoft.NET.Sdk.Web", StringComparison.OrdinalIgnoreCase)
    || AzureFunctionsVersion.StartsWith("v", StringComparison.OrdinalIgnoreCase);
```

A `ProjectFileCollection` class that retrieves all the projects in the subdirectories and their references.

```csharp
internal class ProjectFileCollection : IEnumerable<ProjectFile>
{
    private readonly Dictionary<string, ProjectFile> _projects = new();

    public static async Task<ProjectFileCollection> LoadSolution(string solutionDirectory)
    {
        var projectFileCollection = new ProjectFileCollection();
        foreach (var projectFile in Directory.GetFiles(solutionDirectory, "*.csproj", SearchOption.AllDirectories))
        {
            var project = await ProjectFile.LoadAsync(projectFile);
            projectFileCollection._projects.Add(project.FullPath, project);
        }

        return projectFileCollection;
    }

    public ProjectFile GetProject(string projectPath)
        => _projects[projectPath];

    public IEnumerable<ProjectFile> GetProjectReferences(ProjectFile project)
        => project.ProjectsReferences
            .Select(p => GetProject(GetReferenceFullPath(project.DirectoryPath, p)));

    private static string GetReferenceFullPath(string projectDir, string referencePath)
    {
        if (Path.IsPathRooted(referencePath))
        {
            return referencePath;
        }

        return Path.GetFullPath(Path.Combine(projectDir, referencePath));
    }

    public IEnumerator<ProjectFile> GetEnumerator() => _projects.Values.GetEnumerator();

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}
```

The test itself can then look like this:

```csharp
[Fact]
public async Task WebProjects_ShouldNotReferenceOtherWebProjects()
{
    string solutionDirectory = FindSolutionDirectory();
    var projects = await ProjectFileCollection.LoadSolution(Path.Combine(solutionDirectory, "src"));

    var webProjects = projects.Where(p => p.IsWebProject);
    var errorMessage = new StringBuilder();
    var wrongRecerencesCount = 0;

    foreach (var webProject in webProjects)
    {
        var projectReferences = projects.GetProjectReferences(webProject);
        var webProjectReferences = projectReferences.Where(p => p.IsWebProject);

        if (webProjectReferences.Any())
        {
            errorMessage.AppendFormat("> {0}:", webProject.Name).AppendLine();
            foreach (var reference in webProjectReferences)
            {
                errorMessage.AppendFormat("\t- {0}", reference.Name).AppendLine();
            }
            wrongRecerencesCount++;
            errorMessage.AppendLine("----------------------------------------");
        }
    }

    wrongRecerencesCount.Should()
        .Be(0, "Web project should not reference other web project:\n" + errorMessage.ToString());
}
```

The result may look like this:

```plaintext
Expected wrongRecerencesCount to be 0 because Web project should not reference other web project:
> Kros.Esw.ApiProjectA:
	- Kros.Esw.ApiProjectB
	- Kros.Esw.ApiProjectC
	- Kros.Esw.ApiProjectD
----------------------------------------
, but found 1 (difference of 1).
```
