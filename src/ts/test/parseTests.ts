export interface ParseTest {
	name: string,
	input: string,
	expected: string
}

export let parseTests: ParseTest[] = [
	{
		name: "parse_test1",
		input: "",
		expected: "Program()",
	},{
		name: "parse_test2",
		input: "x: Integer;",
		expected: "Program(DeclStmt(x,IntegerType()))",
	},{
		name: "parse_test3",
		input: "x;",
		expected: "Program(IdExpr(x))",
	},{
		name: "parse_test4",
		input: "x;y;    \n \n \t \n z \t \t;  \t\t\t\t\t\t\t",
		expected: "Program(IdExpr(x),IdExpr(y),IdExpr(z))",
	},{
		name: "parse_test5",
		input: "x = 3;",
		expected: "Program(AssignStmt(IdExpr(x),3))",
	},{
		name: "parse_test6",
		input: "\n",
		expected: "Program()",
	},{
		name: "parse_test7",
		input: "\n",
		expected: "Program()",
	},{
		name: "parse_test8",
		input: "\n",
		expected: "Program()",
	},{
		name: "parse_test9",
		input: "\n",
		expected: "Program()",
	},{
		name: "parse_test10",
		input: "\n",
		expected: "Program()",
	},
];