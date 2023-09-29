import { Expr } from "./ast/expressions/expr.js";
import { Statement } from "./ast/stmts.js";
import { Type } from "./ast/type.js";
import { Span } from "./parser/token.js";

export class ThrowableEcruError extends Error {
	constructor(err: EcruError, stacktrace: string[]) {
		super(err.msg);
		this.stack = stacktrace.join("\n");
	}
}

export abstract class EcruError {
	name: string;
	msg: string;
	span: Span;
	constructor(name: string, msg: string, span: Span) {
		this.name = name;
		this.msg = msg;
		this.span = span;
	}

	toString(): string {
		return `${this.name}:${this.span} -- ${this.msg}`;
	}
}

export class CompilerError extends EcruError {
	constructor(msg: string, span?: Span) {
		super("CompilerError", msg, span ? span : new Span(0, 0, 0, 0));
	}
}

export class ExpressionAsTypeError extends EcruError {
	constructor(expr: Expr, span: Span) {
		super(
			"ExpressionAsTypeError",
			`Can't treat expr ${expr} as a type.`,
			span
		);
	}
}

export class TypeAsExpressionError extends EcruError {
	constructor(type: Type, span: Span) {
		super(
			"TypeAsExpressionError",
			`Can't treat type ${type} as an expression.`,
			span
		);
	}
}

export class StackOverflowError extends EcruError {
	constructor(maxDepth: number) {
		super(
			"StackOverflowError",
			`Maximum recursion depth of ${maxDepth} encountered.`,
			new Span(0, 0, 0, 0)
		);
	}
}

export class DivisionByZeroError extends EcruError {
	constructor(span: Span) {
		super("DivisionByZeroError", "Division by zero encountered.", span);
	}
}

export class ParserError extends EcruError {
	constructor(exp: string, saw: string, span: Span) {
		super("ParserError", `Expected ${exp} but saw "${saw}"`, span);
	}
}

export class MissingSemicolonError extends EcruError {
	constructor(span: Span) {
		super("MissingSemicolonError", `Semicolon (;) expected.`, span);
	}
}

export class UnknownCharacterError extends EcruError {
	constructor(c: string, span: Span) {
		super(
			"UnknownCharacterError",
			`Unknown string ${c} encountered.`,
			span
		);
	}
}

export class IllegalCallError extends EcruError {
	constructor(type: Type, span: Span) {
		super(
			"IllegalCallError",
			`Cannot call expression of type ${type}.`,
			span
		);
	}
}

export class OutOfBoundsError extends EcruError {
	constructor(index: number, arrlen: number, span: Span) {
		super(
			"OutOfBoundsError",
			`Array has length ${arrlen} but index is ${index}`,
			span
		);
	}
}

export class IllegalIndexError extends EcruError {
	constructor(type: Type, span: Span) {
		super(
			"IllegalIndexError",
			`Cannot index expression of type ${type}.`,
			span
		);
	}
}

export class UndefinedIdentifierError extends EcruError {
	constructor(id: string, span: Span) {
		super(
			"UndefinedIdentifierError",
			`Id ${id} hasn't been defined.`,
			span
		);
	}
}

export class RedefinedIdentifierError extends EcruError {
	constructor(id: string, span: Span) {
		super(
			"RedefinedIdentifierError",
			`Id ${id} has already been defined.`,
			span
		);
	}
}

export class IllegalTypeConversionError extends EcruError {
	constructor(currentType: Type, desiredType: Type, span: Span) {
		super(
			"IllegalTypeConversionError",
			`Cannot convert type ${currentType} to type ${desiredType}.`,
			span
		);
	}
}

export class NonexistentReturnError extends EcruError {
	constructor(expectedType: Type, span: Span) {
		super(
			"NonexistentReturnError",
			`Function has type ${expectedType} but the definition does not end with a return statement.`,
			span
		);
	}
}

export class UnreachableCodeError extends EcruError {
	constructor(block: Statement[], span: Span) {
		//TODO
		super("", "", span);
	}
}

export class ArgumentLengthError extends EcruError {
	constructor(callLength: number, declLength: number, span: Span) {
		super(
			"ArgumentLengthError",
			`Function call contains ${callLength} arguments while definition requires ${declLength}.`,
			span
		);
	}
}

export class UnsupportedBinop extends EcruError {
	constructor(op: string, type: Type, span: Span) {
		super(
			"UnsupportedBinop",
			`Binary operator ${op} doesn't support using type ${type}.`,
			span
		);
	}
}

export class DimensionError extends EcruError {
	constructor(expectedDim: number, sawDim: number, span: Span) {
		super(
			"DimensionError",
			`Tuple has ${expectedDim} dimensions but saw ${sawDim}.`,
			span
		);
	}
}
