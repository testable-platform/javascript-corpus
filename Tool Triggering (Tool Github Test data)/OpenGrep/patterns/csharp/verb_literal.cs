public static void Bar(input) {
    //MATCH:
    Foo("abc");
    
    //MATCH:
    Foo(@"abc");
    
    //MATCH:
    Foo("""abc""");
    
    //NO M.
    Foo("xyz");
    
    //NO M.
    Foo(@"xyz");
    
    //NO M.
    Foo("""xyz""");
    
    //NO M.
    Foo("@\"abc\"");
}

