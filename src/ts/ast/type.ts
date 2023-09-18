import { IOBuffer } from "../IOBuffer.js";
import {
	CompilerError,
	DimensionError,
	IllegalTypeConversionError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { divides, gcd, unionSpan } from "../utils.js";
import { AST } from "./asts.js";
import { Scope } from "./symbols.js";

export const enum TypeEnum {
	FORMULA,
	REAL,
	RATIONAL,
	INTEGER,
	NATURAL,
	STRING,
	VOID,
	MAP,
	TUPLE,
	MODULUS,
	DUMMY,
	ANY,
}

export type NumberType =
	| TypeEnum.REAL
	| TypeEnum.RATIONAL
	| TypeEnum.INTEGER
	| TypeEnum.NATURAL
	| TypeEnum.MODULUS;

export type FundTypeEnum =
	| NumberType
	| TypeEnum.FORMULA
	| TypeEnum.STRING
	| TypeEnum.VOID
	| TypeEnum.ANY;

export type FundTypeString =
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
	| "String"
	| "Str"
	| "Dummy"
	| "void"
	| "Any";

export type TypeString =
	| FundTypeString
	| "Map"
	| "Tuple"
	| "Modulus"
	| "Bool"
	| "Boolean";

export function typeEnumToString(t: TypeEnum): TypeString {
	switch (t) {
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
		case TypeEnum.STRING:
			return "String";
		case TypeEnum.VOID:
			return "void";
		case TypeEnum.MAP:
			return "Map";
		case TypeEnum.TUPLE:
			return "Tuple";
		case TypeEnum.DUMMY:
			return "Dummy";
		case TypeEnum.ANY:
			return "Any";
		case TypeEnum.MODULUS:
			return "Modulus";
	}
}

export function typeStringToEnum(s: TypeString): TypeEnum {
	switch (s) {
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
		case "String":
		case "Str":
			return TypeEnum.STRING;
		case "void":
			return TypeEnum.VOID;
		case "Map":
			return TypeEnum.MAP;
		case "Tuple":
			return TypeEnum.TUPLE;
		case "Modulus":
		case "Boolean":
		case "Bool":
			return TypeEnum.MODULUS;
		case "Dummy":
			return TypeEnum.DUMMY;
		case "Any":
			return TypeEnum.ANY;
	}
}

abstract class Type extends AST {
	type: TypeEnum;
	name: TypeString;
	constructor(name: TypeString | TypeEnum, span: Span) {
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

	override toString(): string {
		return `${this.name}`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	equals(other: TypeAST) {
		return other.type == this.type;
	}

	abstract copy(): Type;
}

export class TypeAST extends Type {
	constructor(
		name: FundTypeString | FundTypeEnum,
		span: Span = new Span(0, 0, 0, 0)
	) {
		super(name, span);
	}

	override copy(): TypeAST {
		return new TypeAST(this.name as FundTypeString);
	}
}

export class ProductType extends Type {
	types: TypeAST[];
	constructor(types: TypeAST[], span: Span = new Span(0, 0, 0, 0)) {
		super("Tuple", span);
		this.types = types;
	}

	override copy(): ProductType {
		return new ProductType(
			this.types.map((t) => t.copy()),
			this.span
		);
	}

	override equals(other: TypeAST): boolean {
		if (!(other instanceof ProductType)) return false;

		let o: ProductType = other as ProductType;
		if (o.types.length != this.types.length) return false;

		for (let i = 0; i < this.types.length; i++)
			if (!this.types[i].equals(o.types[i])) return false;

		return true;
	}

	override toString(): string {
		let ts: string[] = this.types.map((t) => t.toString());
		return `(${ts.join(",")})`;
	}
}

export class FunctionType extends Type {
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

	override copy(): FunctionType {
		return new FunctionType(
			this.domain.copy(),
			this.codomain.copy(),
			this.span
		);
	}

	override equals(other: TypeAST): boolean {
		if (!(other instanceof FunctionType)) return false;

		let o: FunctionType = other as FunctionType;

		return this.domain.equals(o.domain) && this.codomain.equals(o.codomain);
	}

	override toString(): string {
		return `${this.domain}->${this.codomain}`;
	}
}

export class ModulusType extends Type {
	mod: number;
	constructor(mod: number, span: Span) {
		super("Modulus", span);
		this.mod = mod;
	}

	override copy(): ModulusType {
		return new ModulusType(this.mod, this.span);
	}
}

export function gcdType(t1: TypeAST, t2: TypeAST, buffer?: IOBuffer): TypeAST {
	const precedence: FundTypeEnum[] = [
		TypeEnum.ANY,
		TypeEnum.STRING,
		TypeEnum.INTEGER,
		TypeEnum.NATURAL,
	];
	if ((t1.type == TypeEnum.TUPLE) != (t2.type == TypeEnum.TUPLE)) {
		if (buffer)
			buffer.throwError(
				new CompilerError("Girl this aint workin")
				//new IllegalTypeConversionError(t1, t2, t1.span)
			);
		return new TypeAST("Dummy");
	}

	if (t1.type == TypeEnum.TUPLE && t2.type == TypeEnum.TUPLE) {
		let a: ProductType = t1 as ProductType;
		let b: ProductType = t2 as ProductType;
		if (a.types.length != b.types.length) {
			if (buffer)
				buffer.throwError(
					new DimensionError(a.types.length, b.types.length, a.span)
				);
			return new TypeAST("Dummy");
		}

		let types: TypeAST[] = [];
		for (let i = 0; i < a.types.length; i++) {
			types.push(gcdType(a.types[i], b.types[i], buffer));
		}
		return new ProductType(types, unionSpan([t1.span, t2.span]));
	}

	if (t1.type == TypeEnum.MODULUS && t2.type == TypeEnum.MODULUS) {
		let a: ModulusType = t1 as ModulusType;
		let b: ModulusType = t2 as ModulusType;

		if (a.mod == b.mod) return a;
		return new TypeAST("Int");
	}

	for (let type of precedence) {
		if (t1.type == type || t2.type == type) {
			return new TypeAST(type);
		}
	}

	if (buffer)
		buffer.throwError(new IllegalTypeConversionError(t1, t2, t1.span));
	return new TypeAST("Dummy");
}
