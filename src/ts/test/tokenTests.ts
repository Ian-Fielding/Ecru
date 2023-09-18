import { Token, Span } from "../parser/token.js";

export interface TokenTest {
	name: string;
	input: string;
	tokens: Token[];
}

export let tokenTests: TokenTest[] = [
	{
		name: "token1",
		input: "x:3 ;",
		tokens: [
			new Token("ID", "x", new Span(1, 1, 1, 2)),
			new Token(":", ":", new Span(1, 2, 1, 3)),
			new Token("NUM", "3", new Span(1, 3, 1, 4)),
			new Token(";", ";", new Span(1, 5, 1, 6)),
			new Token("EOF", "EOF", new Span(1, 6, 1, 6)),
		],
	},
	{
		name: "token2",
		input: "x\n :\n\t \t3 ;   \n  ",
		tokens: [
			new Token("ID", "x", new Span(1, 1, 1, 2)),
			new Token(":", ":", new Span(2, 2, 2, 3)),
			new Token("NUM", "3", new Span(3, 4, 3, 5)),
			new Token(";", ";", new Span(3, 6, 3, 7)),
			new Token("EOF", "EOF", new Span(4, 3, 4, 3)),
		],
	},
	{
		name: "token3",
		input: "3..14x3 ",
		tokens: [
			new Token("NUM", "3..14", new Span(1, 1, 1, 6)),
			new Token("ID", "x3", new Span(1, 6, 1, 8)),
			new Token("EOF", "EOF", new Span(1, 9, 1, 9)),
		],
	},

	{
		name: "token4",
		input: "x4 5y",
		tokens: [
			new Token("ID", "x4", new Span(1, 1, 1, 3)),
			new Token("NUM", "5", new Span(1, 4, 1, 5)),
			new Token("ID", "y", new Span(1, 5, 1, 6)),
			new Token("EOF", "EOF", new Span(1, 6, 1, 6)),
		],
	},

	{
		name: "token5",
		input: "",
		tokens: [new Token("EOF", "EOF", new Span(1, 1, 1, 1))],
	},

	{
		name: "token6",
		input: "this is // ignore \n a test :)",
		tokens: [
			new Token("ID", "this", new Span(1, 1, 1, 5)),
			new Token("ID", "is", new Span(1, 6, 1, 8)),
			new Token("COM", "// ignore ", new Span(1, 9, 1, 19)),
			new Token("ID", "a", new Span(2, 2, 2, 3)),
			new Token("ID", "test", new Span(2, 4, 2, 8)),
			new Token(":", ":", new Span(2, 9, 2, 10)),
			new Token(")", ")", new Span(2, 10, 2, 11)),
			new Token("EOF", "EOF", new Span(2, 11, 2, 11)),
		],
	},

	{
		name: "token7",
		input: "this is /* ignore \n//*/ a test",
		tokens: [
			new Token("ID", "this", new Span(1, 1, 1, 5)),
			new Token("ID", "is", new Span(1, 6, 1, 8)),
			new Token("COM", "/* ignore \n//*/", new Span(1, 9, 2, 5)),
			new Token("ID", "a", new Span(2, 6, 2, 7)),
			new Token("ID", "test", new Span(2, 8, 2, 12)),
			new Token("EOF", "EOF", new Span(2, 12, 2, 12)),
		],
	},

	{
		name: "token8",
		input: 'a b "a b"',
		tokens: [
			new Token("ID", "a", new Span(1, 1, 1, 2)),
			new Token("ID", "b", new Span(1, 3, 1, 4)),
			new Token("STR", '"a b"', new Span(1, 5, 1, 10)),
			new Token("EOF", "EOF", new Span(1, 10, 1, 10)),
		],
	},

	{
		name: "token9",
		input: "//full",
		tokens: [
			new Token("COM", "//full", new Span(1, 1, 1, 7)),
			new Token("EOF", "EOF", new Span(1, 7, 1, 7)),
		],
	},

	{
		name: "token10",
		input: "~= ===",
		tokens: [
			new Token("~=", "~=", new Span(1, 1, 1, 3)),
			new Token("==", "==", new Span(1, 4, 1, 6)),
			new Token("=", "=", new Span(1, 6, 1, 7)),
			new Token("EOF", "EOF", new Span(1, 7, 1, 7)),
		],
	},

	{
		name: "token11",
		input: "print \n x;",
		tokens: [
			new Token("print", "print", new Span(1, 1, 1, 6)),
			new Token("ID", "x", new Span(2, 2, 2, 3)),
			new Token(";", ";", new Span(2, 3, 2, 4)),
			new Token("EOF", "EOF", new Span(2, 4, 2, 4)),
		],
	},
	{
		name: "token12",
		input: "x: Z/2Z;",
		tokens: [
			new Token("ID", "x", new Span(1, 1, 1, 2)),
			new Token(":", ":", new Span(1, 2, 1, 3)),
			new Token("ID", "Z", new Span(1, 4, 1, 5)),
			new Token("/", "/", new Span(1, 5, 1, 6)),
			new Token("NUM", "2", new Span(1, 6, 1, 7)),
			new Token("ID", "Z", new Span(1, 7, 1, 8)),
			new Token(";", ";", new Span(1, 8, 1, 9)),
			new Token("EOF", "EOF", new Span(1, 9, 1, 9)),
		],
	},
];
