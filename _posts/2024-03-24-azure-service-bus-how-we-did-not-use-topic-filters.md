---
layout: post
title: AZURE Service Bus - How we didn't use Topic filters
tags: [AZURE, architecture, csharp, dotnet]
comments: true
date: 2024-03-24 18:00:00.000000000 +01:00
description: "Learn about throttling with AZURE Service Bus in microservices development, its challenges and possible solutions found by KROS a.s team."
linkedin_post_text: "❓ Ever came across throttling challenges with Azure Service Bus in microservices? We at KROS a.s. did not use the topics filter functionality that we would have liked.\n\r\n\r👉If you want to know more, read on: https://blog.burgyn.online/2024/03/24/azure-service-bus-how-we-did-not-use-topic-filters\n\r\n\r#azure"
image: "/assets/images/service-bus-topics/cover.png"
thumbnail: "/assets/images/service-bus-topics/cover.png"
keywords:
    - Azure Service Bus
    - microservices development
    - message broker
    - throttling
    - topic filters
    - entity change message
    - KROS a.s
    - one subscriber solution
---

When developing microservices, you are likely to encounter the need for a message broker. A reliable system for sending messages between services.

We at KROS a.s. have decided to use Azure Service Bus for this purpose, which offers so-called topics within the created namespaces to which you can have multiple subscribers.

Recently we wanted to use its functionality [Topic filtes](https://learn.microsoft.com/en-us/azure/service-bus-messaging/topic-filters). This allows you to have a so-called filter, or rule, on individual subscriptions for a given topic that decides whether a message is delivered to a given subscription.

We wanted to apply this to our use case with search indexing. When we change domain entities in our service, we send an entity change message. We send information about the entity type and the changed properties. The Azure function catches these messages and ensures the changes are indexed into our full text search. We wanted to automate this so we have the whole mechanism in the base class. In our case, it was easiest to send the change messages to one common topic, but we also wanted there to be a separate subscriber for each entity type. Topic filters seemed perfect for this to us. From a design perspective we liked it, the publisher sends to one topic and doesn't care about more. The subscriber gets the message as it expects and the correct delivery is ensured by the logic on the infrastructure side.

But there was one problem! And that was in the form of throttling. We use Azure Service Bus in Standard tier. The latter, according to [documentation](https://learn.microsoft.com/en-us/azure/service-bus-messaging/service-bus-throttling), uses shared resources. To ensure fair resource usage across all namespaces that use the same environment, Azure uses credit-based throttling. This system limits the number of operations that can be executed at any given time.

At the beginning of that time period (currently one second), Azure allocates a certain number of credits *(currently `1000`. Thus `1000 credits per second`).* If the credits run out, then further operations in that time interval will be throttled until the next time period. Credits are replenished after the time period has elapsed.

Basic data operations (`Send`, `Receive`, `Peek` and their `async` versions) are charged one credit.

Plus there is one important note in the documentation:

>ℹ️ Note
>Please note that when sending to a Topic, each message is evaluated against filter(s) before being made available on the Subscription. Each filter evaluation also counts against the credit limit (i.e. 1 credit per filter evaluation).

That is, the evaluation of each filter is charged with one credit.

Well, here comes our math. For a given topic we had 56 subscribers and thus 56 filters. With an already relatively low load of 20 changes on entities per second, we would need **1,160 credits. So `20 (send) + 20*56 (filter evaluation) + 20 (receive) = 1 160`** That is, 160 operations were throttled by ☹️.

## Possible solutions?

### Go to Premium tier

Premium tier is on dedicated resources and throttling is not applied here. Unfortunately there is a big difference in price. With the current Standard tier we pay roughly 11€/month, with the Premium tier it would be over 700€/month.

I'm not saying we won't upgrade to Premium tier, but the current price increase is too high relative to what we need from it.

### Separate topic for each entity

When sending, we will have a separate topic for each entity. The resulting credit consumption would be 40 credits `20 (sending) + 20 (receiving) = 40` .

Disadvantage, publisher has to decide which topic to send the message to.

### One topic one subscription

It will be sent to one topic. There will be one subscriber, who will have to decide in the body of the method what to do with the message.

The resulting credit consumption would be 40 credits `20 (send) + 20 (receive) = 40` .

Disadvantage, the subscriber has to decide what to do with the message.

## What did we choose?

We decided to go the way of one subscriber. In our context, this is a better solution than having a topic per entity.
