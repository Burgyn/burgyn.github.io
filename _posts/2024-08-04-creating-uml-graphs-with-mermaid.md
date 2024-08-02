---
layout: post
title: Creating UML / Graphs with Mermaid
tags: [tools, architecture]
comments: true
description: "The blog outlines how to leverage tools like PlantUML, Mermaid for diagram creation in markdown, storage, and sharing."
linkedin_post_text: ""
date: 2024-08-02 18:00:00.000000000 +01:00
image: "/assets/images/code_images/creating-uml-graphs-with-mermaid/cover.png"
thumbnail: "/assets/images/code_images/creating-uml-graphs-with-mermaid/cover.png"
keywords:
- UML diagrams
- charts
- draw.io
- PlantUML
- Mermaid
- Notion
- GitHub
- Jekyll
- VsCode
- AZURE DevOps
- ChatGPT
---

How do you draw UML diagrams or charts? Do you draw? Not really, but sometimes it comes in handy and it's nice to have the some part of the system described with a sequence diagram, for example. 
In the past I used [draw.io](https://draw.io). Cool tool, but there was a standard problem with it. How to store the diagrams? How to add them to the documentation? How to share them? And the biggest problem how to edit them afterwards 🤔? 
I used [PlantUML](https://plantuml.com/) a couple of times, which solved exactly this. I simply create the diagram using text directly in markdown, and the tool renders the outline for me at that point. For me it's a great solution. 

However, I discovered [Mermaid](https://mermaid.js.org/). Same idea, but given where and how it's integrated everywhere, it's a significantly better choice for me.

```
sequenceDiagram
    participant Author
    participant Notion
    participant Blog1 as blog.burgyn.online
    participant Blog2 as blog.vyvojari.dev
    participant Social as Social media

    Author->>Notion: Record ideas for articles
    Author->>Notion: Select an idea to write about
    Author->>Author: Write the basic structure of the article
    Note right of Author: Drink lots of coffee!
    Author->>Author: Insert images and diagrams
    Author->>Author: Check grammar and style
    Author->>Blog1: Publish the article
    Author->>Blog2: Publish the article
    Author->>Author: Create graphic material
    Author->>Social: Share the article from blog.burgyn.online
    Note right of Author: Wait for feedback!
```

{% mermaid %}
sequenceDiagram
    participant Author
    participant Notion
    participant Blog1 as blog.burgyn.online
    participant Blog2 as blog.vyvojari.dev
    participant Social as Social media

    Author->>Notion: Record ideas for articles
    Author->>Notion: Select an idea to write about
    Author->>Author: Write the basic structure of the article
    Note right of Author: Drink lots of coffee!
    Author->>Author: Insert images and diagrams
    Author->>Author: Check grammar and style
    Author->>Blog1: Publish the article
    Author->>Blog2: Publish the article
    Author->>Author: Create graphic material
    Author->>Social: Share the article from blog.burgyn.online
    Note right of Author: Wait for feedback!
{% endmermaid %}

Benefits for me:
  - easy to use directly in markdown
    - so it's part of the documentation
    - native git support (versioning, sharing, ...)
    - post-editing
  - possibility to create different types of diagrams (flowchart, sequence, class, state, ...)
  - various integrations
    - Notion
    - GitHub
    - Jekyll (I used [jekyll-mermaid](https://github.com/jasonbellamy/jekyll-mermaid))
    - VsCode
    - AZURE DevOps (Wiki only for now)
    - ChatGPT 🤣
    - ...

[Plugin for ChatGPT](https://docs.mermaidchart.com/plugins/mermaid-chart-gpt). I created the diagram above with a simple prompt to ChatGPT:

> I'm going to post an article just about Mermaid. Create me some interesting sequence diagram on how to write such a blog post. I'm writing the ideas in Notion, posting the post on blog.burgyn.online and blog.vyvojari.dev. I then do a social media post about it.
