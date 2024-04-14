---
layout: post
title: Throw vs. Throw ex - Back to the basics
tags: [csharp, tools, dotnet, basics]
comments: true
description: "Understand the difference between 'throw' and 'throw ex' in C# and how they affect stack traces during exception handling."
linkedin_post_text: "🔍 Get back to basics with C#! Learn how to use 'throw' & 'throw ex' and their impact on stack traces during exceptions. Understand how they aid in problem identification. Don't miss the details! 🚀 👨‍💻 [Link to blog post]"
date: 2024-04-14 18:00:00.000000000 +01:00 2055-02-18 18:00:00.000000000 +01:00
image: "/assets/images/code_images/throw-vs-throw-ex-back-to-the-basics/cover.png"
thumbnail: "/assets/images/code_images/throw-vs-throw-ex-back-to-the-basics/cover.png"
keywords:
- C#
- Exception Handling
- Throw
- Throw ex
- Stack Trace
- Error Handling
- Back to basics
- Programming Basics
- Coding
---

This is another article in the "Back to the basics" series. The first part covered [Boxing and UnBoxing](/2024/03/04/boxing-unboxing/), today we'll look at the difference between `throw` and `throw ex`.

> 💁 If you know the difference between `throw` and `throw ex` you don't need to read any further, you won't learn anything new.

`Throw` and `throw ex` are both used to raise/forward the exception above. However, their behavior is different. The difference is whether the stack trace is preserved or not.

```csharp
try
{
    var dataProvider = new DataProvider();
    var responseBody = await dataProvider.GetData();
    Console.WriteLine(responseBody);
}
catch (Exception ex)
{
    // 👇 throw ex - create and throw new exception based on ex
    throw ex;
}

public class DataProvider
{
    public async Task<string> GetData()
    {
        using var client = new HttpClient();
        var response = await client.GetAsync("https://www.nonexistingdomain.com");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }
}
```

In the example above, if an exception occurs when `GetData` is called, the exception is caught in the `catch` block and forwarded upstream using `throw ex`. However, the original stack trace will be lost and the exception will only contain information from where it was raised:

```plaintext
Unhandled exception. System.Net.Http.HttpRequestException: The requested name is valid, but no data of the requested type was found. (www.nonexistingdomain.com:443)
 ---> System.Net.Sockets.SocketException (11004): The requested name is valid, but no data of the requested type was found.
   at System.Net.Sockets.Socket.AwaitableSocketAsyncEventArgs.ThrowException(SocketError error, CancellationToken cancellationToken)
   at System.Net.Sockets.Socket.AwaitableSocketAsyncEventArgs.System.Threading.Tasks.Sources.IValueTaskSource.GetResult(Int16 token)
   at System.Net.Sockets.Socket.<ConnectAsync>g__WaitForConnectWithCancellation|285_0(AwaitableSocketAsyncEventArgs saea, ValueTask connectTask, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.ConnectToTcpHostAsync(String host, Int32 port, HttpRequestMessage initialRequest, Boolean async, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   at Program.<Main>$(String[] args) in D:\Zmaz\throwVsThrowEx\Program.cs:line 12
```

We lost information about where the exception went and therefore the ability to identify the problem faster.

Conversely, if we use `throw` without `ex`:

```csharp
try
{
    var responseBody = await GetData();
    Console.WriteLine(responseBody);
}
catch (Exception ex)
{
    // 👇 throw - rethrow the original exception
    throw;
}
```

The exception will also contain the original stack trace:

```plaintext
Unhandled exception. System.Net.Http.HttpRequestException: The requested name is valid, but no data of the requested type was found. (www.nonexistingdomain.com:443)
 ---> System.Net.Sockets.SocketException (11004): The requested name is valid, but no data of the requested type was found.
   at System.Net.Sockets.Socket.AwaitableSocketAsyncEventArgs.ThrowException(SocketError error, CancellationToken cancellationToken)
   at System.Net.Sockets.Socket.AwaitableSocketAsyncEventArgs.System.Threading.Tasks.Sources.IValueTaskSource.GetResult(Int16 token)
   at System.Net.Sockets.Socket.<ConnectAsync>g__WaitForConnectWithCancellation|285_0(AwaitableSocketAsyncEventArgs saea, ValueTask connectTask, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.ConnectToTcpHostAsync(String host, Int32 port, HttpRequestMessage initialRequest, Boolean async, CancellationToken cancellationToken)
   --- End of inner exception stack trace ---
   // 👇👇👇 an important part of the stack trace that was missing in the previous example
   at System.Net.Http.HttpConnectionPool.ConnectToTcpHostAsync(String host, Int32 port, HttpRequestMessage initialRequest, Boolean async, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.ConnectAsync(HttpRequestMessage request, Boolean async, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.CreateHttp11ConnectionAsync(HttpRequestMessage request, Boolean async, CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.AddHttp11ConnectionAsync(QueueItem queueItem)
   at System.Threading.Tasks.TaskCompletionSourceWithCancellation`1.WaitWithCancellationAsync(CancellationToken cancellationToken)
   at System.Net.Http.HttpConnectionPool.SendWithVersionDetectionAndRetryAsync(HttpRequestMessage request, Boolean async, Boolean doRequestAuth, CancellationToken cancellationToken)
   at System.Net.Http.RedirectHandler.SendAsync(HttpRequestMessage request, Boolean async, CancellationToken cancellationToken)
   at System.Net.Http.HttpClient.<SendAsync>g__Core|83_0(HttpRequestMessage request, HttpCompletionOption completionOption, CancellationTokenSource cts, Boolean disposeCts, CancellationTokenSource pendingRequestsCts, CancellationToken originalCancellationToken)
   at DataProvider.GetData() in D:\Zmaz\throwVsThrowEx\Program.cs:line 20
   at Program.<Main>$(String[] args) in D:\Zmaz\throwVsThrowEx\Program.cs:line 7
```

In this example, we can see that there are parts of `HttpConnectionPool`, `HttpClient` and our `DataProvider` class that were missing in the previous example and can help us identify the problem faster.

So, if we want to keep the original stack trace, let's use `throw` without `ex`. If we want to discard the stack trace, let's use `throw ex`.

