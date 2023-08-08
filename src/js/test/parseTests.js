export let parseTests = [
    {
        name: "parse_test1",
        input: "",
        expected: "Program()",
    }, {
        name: "parse_test2",
        input: "x: Integer;",
        expected: "Program(DeclStmt(x,IntegerType()))",
    }, {
        name: "parse_test3",
        input: "x;",
        expected: "Program(IdExpr(x))",
    }, {
        name: "parse_test4",
        input: "x;y;    \n \n \t \n z \t \t;  \t\t\t\t\t\t\t",
        expected: "Program(IdExpr(x),IdExpr(y),IdExpr(z))",
    }, {
        name: "parse_test5",
        input: "x = 3;",
        expected: "Program(AssignStmt(IdExpr(x),3))",
    }, {
        name: "parse_test6",
        input: "\nxz : String\n   \t = 3+4;",
        expected: "Program(DeclStmt(xz,StringType()), AssignStmt(x,add(3,4)))",
    }, {
        name: "parse_test7",
        input: "x",
        expected: "Error",
    }, {
        name: "parse_test8",
        input: "x^2;",
        expected: "Program(exp(x,2))",
    }, {
        name: "parse_test9",
        input: "print\nx;",
        expected: "Program(PrintStmt(IdExpr(x)))",
    }, {
        name: "parse_test10",
        input: "\n\n\npprint(x+x);",
        expected: "Program(pprint(x+x+x))",
    },
];
