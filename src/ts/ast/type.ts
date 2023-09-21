import { IOBuffer } from "../IOBuffer.js";
import {
	CompilerError,
	DimensionError,
	IllegalTypeConversionError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { unionSpan } from "../utils.js";
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
	ANY,
}

export function typeEnumToString(t: TypeEnum): string {
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
		case TypeEnum.ANY:
			return "Any";
		case TypeEnum.MODULUS:
			return "Modulus";
	}
}

export abstract class Type extends AST {
	type: TypeEnum;
	name: string;
	constructor(type: TypeEnum, span: Span) {
		super(span);
		this.type = type;
		this.name = typeEnumToString(type);
	}

	override toString(): string {
		return `${this.name}`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	equals(other: Type) {
		return other.type == this.type;
	}

	abstract copy(): Type;
}

export class RationalType extends Type {
	constructor(span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.RATIONAL, span);
	}

	override copy(): Type {
		return new RationalType(this.span);
	}
}
export class IntType extends Type {
	constructor(span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.INTEGER, span);
	}

	override copy(): Type {
		return new IntType(this.span);
	}
}
export class NaturalType extends Type {
	constructor(span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.NATURAL, span);
	}

	override copy(): Type {
		return new NaturalType(this.span);
	}
}
export class StringType extends Type {
	constructor(span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.STRING, span);
	}

	override copy(): Type {
		return new StringType(this.span);
	}
}
export class VoidType extends Type {
	constructor(span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.VOID, span);
	}

	override copy(): Type {
		return new VoidType(this.span);
	}
}
export class AnyType extends Type {
	constructor(span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.ANY, span);
	}

	override copy(): Type {
		return new AnyType(this.span);
	}
}

export const RAT_TYPE = new RationalType();
export const INT_TYPE = new IntType();
export const NAT_TYPE = new NaturalType();
export const STR_TYPE = new StringType();
export const VOID_TYPE = new VoidType();
export const ANY_TYPE = new AnyType();

export class ProductType extends Type {
	types: Type[];
	constructor(types: Type[], span: Span = new Span(0, 0, 0, 0)) {
		super(TypeEnum.TUPLE, span);
		this.types = types;
	}

	override copy(): ProductType {
		return new ProductType(
			this.types.map((t) => t.copy()),
			this.span
		);
	}

	override equals(other: ProductType): boolean {
		let o: ProductType = other;
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
	domain: Type;
	codomain: Type;

	constructor(
		domain: Type,
		codomain: Type,
		span: Span = new Span(0, 0, 0, 0)
	) {
		super(TypeEnum.MAP, span);
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

	override equals(other: FunctionType): boolean {
		return (
			this.domain.equals(other.domain) &&
			this.codomain.equals(other.codomain)
		);
	}

	override toString(): string {
		return `${this.domain}->${this.codomain}`;
	}
}

export class ModulusType extends Type {
	mod: number;
	constructor(mod: number, span: Span) {
		super(TypeEnum.MODULUS, span);
		this.mod = mod;
	}

	override copy(): ModulusType {
		return new ModulusType(this.mod, this.span);
	}
}

export function gcdType(t1: Type, t2: Type, buffer?: IOBuffer): Type {
	if ((t1.type == TypeEnum.TUPLE) != (t2.type == TypeEnum.TUPLE)) {
		if (buffer)
			buffer.throwError(new IllegalTypeConversionError(t1, t2, t1.span));
		return ANY_TYPE;
	}

	if (t1.type == TypeEnum.TUPLE && t2.type == TypeEnum.TUPLE) {
		let a: ProductType = t1 as ProductType;
		let b: ProductType = t2 as ProductType;
		if (a.types.length != b.types.length) {
			if (buffer)
				buffer.throwError(
					new DimensionError(a.types.length, b.types.length, a.span)
				);
			return ANY_TYPE;
		}

		let types: Type[] = [];
		for (let i = 0; i < a.types.length; i++) {
			types.push(gcdType(a.types[i], b.types[i], buffer));
		}
		return new ProductType(types, unionSpan([t1.span, t2.span]));
	}

	if (t1.type == TypeEnum.MODULUS && t2.type == TypeEnum.MODULUS) {
		let a: ModulusType = t1 as ModulusType;
		let b: ModulusType = t2 as ModulusType;

		if (a.mod == b.mod) return a;
		return INT_TYPE;
	}

	if (t1.type == TypeEnum.ANY || t2.type == TypeEnum.ANY) return ANY_TYPE;
	if (t1.type == TypeEnum.STRING || t2.type == TypeEnum.STRING)
		return STR_TYPE;
	if (t1.type == TypeEnum.INTEGER || t2.type == TypeEnum.INTEGER)
		return INT_TYPE;
	if (t1.type == TypeEnum.NATURAL || t2.type == TypeEnum.NATURAL)
		return NAT_TYPE;

	if (buffer)
		buffer.throwError(new IllegalTypeConversionError(t1, t2, t1.span));
	return ANY_TYPE;
}
