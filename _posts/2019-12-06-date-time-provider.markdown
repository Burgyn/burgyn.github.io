---
layout: post
title:  "DateTimeProvider for unit testing"
date:   2019-12-06 09:14:53 +0100
categories:
  - C#
  - .NET
  - .NET Core
  - Unit tests
  - Patterns
---
When writing unit tests, you probably met with the question of how to test the method, the calculation of which is dependent on `DateTime.Now`. `DateTime.Now` always returns a new value according to the current time, so testing this method is not directly possible. 
<!-- excerpt -->

It is certainly a number of ways this problem can be solved. The most frequent recommendations are however two:

1. Methods that calculation is depends on the current date and time should get this date as an input parameter. This means that you will not use `DateTime.Now` in the body of the method, but need send a `DateTime` type parameter sent to you by your method. Thus, send the test date what you need. Of course, not always it is possible and it is not always desirable.

2. Do not use directly `DateTime.Now`, but have custom DateTime Provider
 

## Custom DateTimeProvider

Under own `DateTimeProvider` think custom class, which we will ask for the current date and time. And it will be possible inject the current date. An example of this class:

```CSharp
public class DateTimeProvider : IDisposable 
{
    private static AsyncLocal<DateTime?> _injectedDateTime = new AsyncLocal<DateTime?>(); 
 
    private DateTimeProvider() 
    { 
    } 
 
    /// <summary> 
    /// Gets DateTime now. 
    /// </summary> 
    /// <value> 
    /// The DateTime now. 
    /// </value> 
    public static DateTime Now => _injectedDateTime.Value ?? DateTime.Now;
 
    /// <summary> 
    /// Injects the actual date time. 
    /// </summary> 
    /// <param name="actualDateTime">The actual date time.</param> 
    public static IDisposable InjectActualDateTime(DateTime actualDateTime) 
    { 
        _injectedDateTime.Value = actualDateTime; 
 
        return new DateTimeProvider(); 
    } 
 
    public void Dispose() 
    { 
        _injectedDateTime.Value = null; 
    } 
} 
```

The normal used in the method is the same as when you use the `DateTime`.

 
```CSharp
private void MakeTransaction(Transaction transaction) 
{ 
    transaction.TransactionDate = DateTimeProvider.Now; 
    _transactions.Add(transaction); 
}
```

Class implements `IDisposable` and has the static factory method `InjectActualDateTime` by which it can you inject the fake date.
If the class has injected a fake date, `Now` property returns just this.
The use own date in test:

```
[TestClass] 
public class BankAccountShould 
{ 
    [TestMethod] 
    public void SetCorrectDateTimeToTransaction() 
    { 
        var expectedDateTime = new DateTime(2016, 4, 6); 
 
        using (DateTimeProvider.InjectActualDateTime(expectedDateTime)) 
        { 
            var bankAccount = new BankAccount(); 
 
            bankAccount.DepositMoney(600); 
 
            var lastTransaction = bankAccount.Transactions.Last(); 
 
            Assert.AreEquel(expectedDateTime, bankAccount.Transactions[0].TransactionDate); 
        } 
    } 
} 
```

See [demo project.](https://github.com/Burgyn/Sample.DateTimeProvider)
