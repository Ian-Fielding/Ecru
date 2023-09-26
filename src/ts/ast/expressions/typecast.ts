import { IOBuffer } from "../../IOBuffer.js";
import { DimensionError, IllegalTypeConversionError } from "../../error.js";
import { StringLiteral, VoidObj } from "./ast_exprs.js";
import { Scope } from "../symbols.js";
import { Expr } from "./expr.js";
import {
	Type,
	FunctionType,
	TypeEnum,
	ProductType,
	ModulusType,
	INT_TYPE,
	VOID_TYPE,
	STR_TYPE,
	NAT_TYPE,
} from "../type.js";
import { NaturalLiteral } from "./terminals/natural.js";
import { IntegerLiteral } from "./terminals/integer.js";
import { ModulusLiteral } from "./terminals/modulus.js";
import { FuncDecl } from "./terminals/funcDecl.js";
import { Tuple } from "./terminals/tuple.js";

export function getTypeCast(expr: Expr, type: Type): Expr {
	switch (type.type) {
		case TypeEnum.INTEGER:
			return new TypeCastToInt(expr);
		case TypeEnum.NATURAL:
			return new TypeCastToNatural(expr);
		case TypeEnum.MODULUS:
			return new TypeCastToModulus(expr, type as ModulusType);
		case TypeEnum.STRING:
			return new TypeCastToString(expr);
		case TypeEnum.TUPLE:
			return new TypeCastToTuple(expr, type as ProductType);
		case TypeEnum.MAP:
			return new TypeCastToMap(expr, type as FunctionType);
		case TypeEnum.VOID:
			return new TypeCastToVoid(expr);
		case TypeEnum.ANY:
			return expr;
		default:
			//NOT IMPLEMENTEd
			throw new Error("NOT IMPLEMENTED " + type.type);
	}
}

class TypeCastToModulus extends Expr {
	expr: Expr;
	mod: number;

	constructor(expr: Expr, type: ModulusType) {
		super(expr.span);
		this.expr = expr;

		this.type = type;
		this.mod = type.mod;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): ModulusLiteral {
		let r: Expr = this.expr.rval(buffer);
		switch (r.type.type) {
			case TypeEnum.MODULUS:
				return r as ModulusLiteral;
			case TypeEnum.NATURAL:
				let m: NaturalLiteral = r as NaturalLiteral;
				return new ModulusLiteral(m.getVal(), this.mod, this.span);
			case TypeEnum.INTEGER:
				let n: IntegerLiteral = r as IntegerLiteral;
				return new ModulusLiteral(n.getVal(), this.mod, this.span);
			case TypeEnum.STRING:
				let s: StringLiteral = r as StringLiteral;
				if (isNaN(+s.name) || isNaN(parseFloat(s.name)))
					buffer.throwError(
						new IllegalTypeConversionError(
							INT_TYPE,
							this.type,
							this.span
						)
					);
				let val: number = +s.name;
				return new ModulusLiteral(val, this.mod, r.span);
			case TypeEnum.ANY:
			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			//TODO implement once types is good
			case TypeEnum.TUPLE:

			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			case TypeEnum.VOID:
				buffer.throwError(
					new IllegalTypeConversionError(r.type, this.type, this.span)
				);
				return new ModulusLiteral(0, this.mod, r.span);
		}
	}
}

class TypeCastToNatural extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;

		this.type = NAT_TYPE;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): NaturalLiteral {
		let r: Expr = this.expr.rval(buffer);
		switch (r.type.type) {
			case TypeEnum.NATURAL:
				return r as NaturalLiteral;
			case TypeEnum.MODULUS:
				let m: ModulusLiteral = r as ModulusLiteral;
				return new NaturalLiteral(m.val, this.span);
			case TypeEnum.INTEGER:
				let n: IntegerLiteral = r as IntegerLiteral;

				if (n.isNegative || n.isZero())
					buffer.throwError(
						new IllegalTypeConversionError(
							n.type,
							this.type,
							this.span
						)
					);

				return n.natural!;
			case TypeEnum.STRING:
				let s: StringLiteral = r as StringLiteral;
				if (isNaN(+s.name) || isNaN(parseFloat(s.name)))
					buffer.throwError(
						new IllegalTypeConversionError(
							INT_TYPE,
							this.type,
							this.span
						)
					);
				let val: number = +s.name;
				if (val <= 0)
					buffer.throwError(
						new IllegalTypeConversionError(
							s.type,
							this.type,
							this.span
						)
					);
				return new NaturalLiteral(+s.name, r.span);
			case TypeEnum.ANY:
			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			//TODO implement once types is good
			case TypeEnum.TUPLE:

			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			case TypeEnum.VOID:
				buffer.throwError(
					new IllegalTypeConversionError(r.type, this.type, this.span)
				);
				return new NaturalLiteral(1, this.span);
		}
	}
}

class TypeCastToVoid extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;
		this.type = VOID_TYPE;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): VoidObj {
		let r: Expr = this.expr.rval(buffer);

		if (r.type.type != TypeEnum.VOID)
			buffer.throwError(
				new IllegalTypeConversionError(r.type, this.type, this.span)
			);

		return new VoidObj();
	}
}

class TypeCastToMap extends Expr {
	expr: Expr;

	constructor(expr: Expr, type: FunctionType) {
		super(expr.span);
		this.expr = expr;
		this.type = type;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);

		if (!this.expr.type.equals(this.type))
			buffer.throwError(
				new IllegalTypeConversionError(
					this.expr.type,
					this.type,
					this.span
				)
			);
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): FuncDecl {
		let r: Expr = this.expr.rval(buffer);
		if (r instanceof FuncDecl) {
			return r as FuncDecl;
		}

		buffer.throwError(
			new IllegalTypeConversionError(r.type, this.type, this.span)
		);
		return new FuncDecl([], [], this.type as FunctionType, this.span);
	}
}

class TypeCastToTuple extends Expr {
	expr: Expr;

	constructor(expr: Expr, type: ProductType) {
		super(expr.span);
		this.expr = expr;
		this.type = type;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);

		let outputType: ProductType = this.type as ProductType;

		if (this.expr instanceof Tuple) {
			let input: Tuple = this.expr as Tuple;

			if (input.vals.length != outputType.types.length) {
				buffer.throwError(
					new DimensionError(
						outputType.types.length,
						input.vals.length,
						this.span
					)
				);
			}

			for (let i = 0; i < input.vals.length; i++) {
				input.vals[i] = getTypeCast(input.vals[i], outputType.types[i]);
				input.vals[i].applyType(buffer);
			}
			return;
		}
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): Tuple {
		let r: Expr = this.expr.rval(buffer);
		if (r instanceof Tuple) {
			return r as Tuple;
		}

		buffer.throwError(
			new IllegalTypeConversionError(r.type, this.type, this.span)
		);
		return new Tuple([], this.span);
	}
}

class TypeCastToInt extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;

		this.type = INT_TYPE;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): IntegerLiteral {
		let r: Expr = this.expr.rval(buffer);
		switch (r.type.type) {
			case TypeEnum.INTEGER:
				return r as IntegerLiteral;
			case TypeEnum.MODULUS:
				let m: ModulusLiteral = r as ModulusLiteral;
				return new IntegerLiteral(m.val, this.span);
			case TypeEnum.NATURAL:
				let n: NaturalLiteral = r as NaturalLiteral;
				return new IntegerLiteral(n.shorthand, this.span);
			case TypeEnum.STRING:
				let s: StringLiteral = r as StringLiteral;
				if (isNaN(+s.name) || isNaN(parseFloat(s.name)))
					buffer.throwError(
						new IllegalTypeConversionError(
							s.type,
							this.type,
							this.span
						)
					);
				return new IntegerLiteral(+s.name, r.span);
			case TypeEnum.ANY:
			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			//TODO implement once types is good
			case TypeEnum.TUPLE:

			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			case TypeEnum.VOID:
				buffer.throwError(
					new IllegalTypeConversionError(r.type, this.type, this.span)
				);
				return new IntegerLiteral(0, this.span);
		}
	}
}

class TypeCastToString extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;
		this.type = STR_TYPE;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);
	}

	override toString(): string {
		return this.expr.toString();
	}

	override rval(buffer: IOBuffer): StringLiteral {
		let r: Expr = this.expr.rval(buffer);
		switch (r.type.type) {
			case TypeEnum.STRING:
				return r as StringLiteral;
			case TypeEnum.INTEGER:
				let i: IntegerLiteral = r as IntegerLiteral;
				return new StringLiteral(i.getVal() + "", r.span);

			case TypeEnum.MODULUS:
				let m: ModulusLiteral = r as ModulusLiteral;
				if (m.mod == 2)
					return new StringLiteral(
						m.val == 1 ? "true" : "false",
						this.span
					);
				return new StringLiteral(m.val + "", this.span);
			case TypeEnum.NATURAL:
				let s: NaturalLiteral = r as NaturalLiteral;
				return new StringLiteral(s.getVal() + "", r.span);
			case TypeEnum.TUPLE:
				let t: Tuple = r as Tuple;
				let vs: string[] = [];
				for (let i = 0; i < t.vals.length; i++) {
					t.vals[i] = getTypeCast(t.vals[i], STR_TYPE);
					t.vals[i].applyType(buffer);
					vs.push((t.vals[i].rval(buffer) as StringLiteral).name);
				}
				return new StringLiteral(`(${vs.join(",")})`, r.span);

			case TypeEnum.ANY:
			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			//TODO implement once types is good

			case TypeEnum.VOID:
				buffer.throwError(
					new IllegalTypeConversionError(r.type, this.type, this.span)
				);
				return new StringLiteral("", this.span);
		}
	}
}
