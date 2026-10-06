// ruleid: identified-parameter-in-csharp-code
public void PrintNames(string AliceSTR, int BobINT)
{
    Console.WriteLine($"Names: {AliceSTR} {str(BobINT)}");
}

// ruleid: identified-parameter-in-csharp-code
public void GreetStringName(string AliceSTR = "John", int BobINT = 12)
{
    Console.WriteLine($"Hello, {AliceSTR}");
}

public class User
{
    // ruleid: identified-parameter-in-csharp-code
    public string AliceUserName;
    // ok: an int, so not counting it
    public int AliceUserId;
}

public class Consumer
{
    // ruleid: identified-parameter-in-csharp-code
    public string BobConsumerName { get; set; } = "Bob";
    // ok: int value
    public int BobConsumerId { get; set; } = 10;
}

// ruleid: identified-parameter-in-csharp-code
public void GetFullName(out string BobFirstName, out int BobLastName)
{
    FirstName = "Alice";
    LastName = "Brown";
}

public class Employee
{
    // ruleid: identified-parameter-in-csharp-code
    public static string BobEmployee = "Default";
    // ok: int
    public static int BobEmbployeeId = 10;
}

// ruleid: identified-parameter-in-csharp-code
public void IsValid(string? BobName, int? BobId)
{
    if (FirstName != null && LastName != null)
    {
       return true;
    }
    return false;
}
