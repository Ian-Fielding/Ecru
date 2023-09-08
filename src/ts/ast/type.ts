import { IOBuffer } from "../IOBuffer.js";
import { CompilerError, IllegalTypeConversionError } from "../error.js";
import { Span } from "../parser/token.js";
import { divides, gcd } from "../utils.js";
import { AST } from "./asts.js";
import { Expr, NumberLiteral, StringLiteral, VoidObj } from "./exprs.js";
import { Scope } from "./symbols.js";

export const enum TypeEnum {
	OBJECT = 1,
	FORMULA = 2,
	REAL = 2 * 2,
	RATIONAL = 2 * 2 * 2,
	INTEGER = 2 * 2 * 2 * 2,
	NATURAL = 2 * 2 * 2 * 2 * 2,
	BOOLEAN = 2 * 2 * 2 * 2 * 2 * 2,
	STRING = 3,
	VOID = 5,
	MAP = 7,
	PROD = 11,
	DUMMY = 23456789,
}

export type TypeString =
	| "Object"
	| "Obj"
	| "Formula"
	| "Form"
	| "Real"
	| "R"
	| "Rational"
	| "Q"
	| "Integer"
	| "Int"
	| "Z"
	| "Natural"
	| "N"
	| "Boolean"
	| "Bool"
	| "String"
	| "Str"
	| "void"
	| "Map"
	| "CartProd"
	| "dummy"
	| "Dummy";

export function typeEnumToString(t: TypeEnum): TypeString {
	switch (t) {
		case TypeEnum.OBJECT:
			return "Object";
		case TypeEnum.FORMULA:
			return "Form";
		case TypeEnum.REAL:
			return "R";
		case TypeEnum.RATIONAL:
			return "Q";
		case TypeEnum.INTEGER:
			return "Z";
		case TypeEnum.NATURAL:
			return "N";
		case TypeEnum.BOOLEAN:
			return "Bool";
		case TypeEnum.STRING:
			return "String";
		case TypeEnum.VOID:
			return "void";
		case TypeEnum.MAP:
			return "Map";
		case TypeEnum.PROD:
			return "CartProd";
		case TypeEnum.DUMMY:
			return "Dummy";
	}
}

export function typeStringToEnum(s: string): TypeEnum {
	switch (s) {
		case "Object":
		case "Obj":
			return TypeEnum.OBJECT;
		case "Formula":
		case "Form":
			return TypeEnum.FORMULA;
		case "Real":
		case "R":
			return TypeEnum.REAL;
		case "Rational":
		case "Q":
			return TypeEnum.RATIONAL;
		case "Integer":
		case "Int":
		case "Z":
			return TypeEnum.INTEGER;
		case "Natural":
		case "N":
			return TypeEnum.NATURAL;
		case "Boolean":
		case "Bool":
			return TypeEnum.BOOLEAN;
		case "String":
		case "Str":
			return TypeEnum.STRING;
		case "void":
			return TypeEnum.VOID;
		case "Map":
			return TypeEnum.MAP;
		case "CartProd":
			return TypeEnum.PROD;
		case "dummy":
		case "Dummy":
		default:
			return TypeEnum.DUMMY;
	}
}

export class TypeAST extends AST {
	type: TypeEnum;
	name: TypeString;

	constructor(
		name: TypeString | TypeEnum,
		span: Span = new Span(0, 0, 0, 0)
	) {
		let str: TypeString;
		let num: TypeEnum;
		if (typeof name == "string") {
			num = typeStringToEnum(name);
			str = typeEnumToString(num);
		} else {
			str = typeEnumToString(name);
			num = name;
		}
		super(span);
		this.type = num;
		this.name = str;
	}

	instanceOf(t: TypeAST | number): boolean {
		if (t instanceof TypeAST) return divides(t.type, this.type);

		return divides(t, this.type);
	}

	closestParent(t: TypeAST | number): TypeAST {
		if (t instanceof TypeAST)
			return new TypeAST(gcd(this.type, t.type), this.span);
		return new TypeAST(gcd(this.type, t), this.span);
	}

	isMathType(): boolean {
		return this.type % TypeEnum.REAL == 0;
	}

	isFunction(): boolean {
		return this.type % TypeEnum.MAP == 0;
	}

	override toString(): string {
		return `${this.name}`;
	}

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		// TODO Check if needed
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}
}

export class ProductType extends TypeAST {
	types: TypeAST[];
	constructor(types: TypeAST[], span: Span = new Span(0, 0, 0, 0)) {
		super("CartProd", span);
		this.types = types;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}
}

export class FunctionType extends TypeAST {
	domain: TypeAST;
	codomain: TypeAST;

	constructor(
		domain: TypeAST,
		codomain: TypeAST,
		span: Span = new Span(0, 0, 0, 0)
	) {
		super("Map", span);
		this.domain = domain;
		this.codomain = codomain;
	}
}
