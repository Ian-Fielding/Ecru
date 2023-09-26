import { IOBuffer } from "../../IOBuffer.js";
import {
	CompilerError,
	IllegalTypeConversionError,
	UnsupportedBinop,
} from "../../error.js";
import { Span } from "../../parser/token.js";
import { StringLiteral, VoidObj } from "./ast_exprs.js";
import { Scope } from "../symbols.js";
import {
	INT_TYPE,
	ModulusType,
	NAT_TYPE,
	Type,
	TypeEnum,
	gcdType,
} from "../type.js";
import { getTypeCast } from "./typecast.js";

import { Expr } from "./expr.js";
import { NaturalLiteral } from "./terminals/natural.js";
import { IntegerLiteral } from "./terminals/integer.js";
import { ModulusLiteral } from "./terminals/modulus.js";
import { BooleanLiteral } from "./terminals/boolean.js";
import { Tuple } from "./terminals/tuple.js";
export abstract class Binop extends Expr {
	a: Expr;
	b: Expr;
	symbol: string;

	constructor(a: Expr, b: Expr, symbol: string, span: Span) {
		super(span);
		this.a = a;
		this.b = b;
		this.symbol = symbol;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.a.applyBind(scope, buffer);
		this.b.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.a.applyType(buffer);
		this.b.applyType(buffer);
		let aType: Type = this.a.type;
		let bType: Type = this.b.type;

		this.type = gcdType(aType, bType, buffer);
		this.a = getTypeCast(this.a, this.type);
		this.a.applyType(buffer);
		this.b = getTypeCast(this.b, this.type);
		this.b.applyType(buffer);

		//buffer.throwError(new UnsupportedBinop(this.symbol, aType, this.span));

		return;
	}
}

export class Negate extends Expr {
	expr: Expr;

	constructor(expr: Expr, span: Span) {
		super(span);
		this.expr = expr;
		this.type = INT_TYPE;
	}

	override toString(): string {
		return `negate(${this.expr})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.expr.applyType(buffer);
		this.expr = getTypeCast(this.expr, this.type);
		this.expr.applyType(buffer);
	}

	override rval(buffer: IOBuffer): Expr {
		let a: IntegerLiteral = this.expr.rval(buffer) as IntegerLiteral;
		return new IntegerLiteral(-a.getVal(), a.span); // TODO sucks!
	}
}

export class Factorial extends Expr {
	expr: Expr;
	constructor(expr: Expr, span: Span) {
		super(span);
		this.expr = expr;
	}

	override toString(): string {
		return `fact(${this.expr})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class Exponent extends Expr {
	base: Expr;
	pow: Expr;

	constructor(expr1: Expr, expr2: Expr, span: Span) {
		super(span);
		this.base = expr1;
		this.pow = expr2;
	}

	override toString(): string {
		return `pow(${this.base},${this.pow})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class Mod extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "%", span);
	}

	override toString(): string {
		return `mod(${this.a},${this.b})`;
	}

	override applyType(buffer: IOBuffer): void {
		this.type = INT_TYPE;
		this.a = getTypeCast(this.a, this.type);
		this.a.applyType(buffer);
		this.b = getTypeCast(this.b, NAT_TYPE);
		this.b.applyType(buffer);

		return;
	}

	override rval(buffer: IOBuffer): IntegerLiteral {
		let aRval: IntegerLiteral = this.a.rval(buffer) as IntegerLiteral;
		let bRval: NaturalLiteral = this.b.rval(buffer) as NaturalLiteral;

		let ret: number = aRval.getVal() % bRval.getVal(); //TODO Check if sucks
		if (ret < 0) ret += bRval.getVal();
		return new IntegerLiteral(ret, this.span);
	}
}

export class Add extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "+", span);
	}

	override toString(): string {
		return `add(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.ANY:
				let temp: Add = new Add(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.MODULUS:
				let m1: ModulusLiteral = aRval as ModulusLiteral;
				let m2: ModulusLiteral = bRval as ModulusLiteral;
				return m1.add(m2, buffer);
			case TypeEnum.INTEGER:
				let v1: IntegerLiteral = aRval as IntegerLiteral;
				let v2: IntegerLiteral = bRval as IntegerLiteral;
				return v1.add(v2, buffer);
			case TypeEnum.NATURAL:
				let n1: NaturalLiteral = aRval as NaturalLiteral;
				let n2: NaturalLiteral = bRval as NaturalLiteral;
				return n1.add(n2, buffer);
			case TypeEnum.STRING:
				let s1: StringLiteral = aRval as StringLiteral;
				let s2: StringLiteral = bRval as StringLiteral;
				return new StringLiteral(s1.name + s2.name, this.span);
			case TypeEnum.TUPLE:
				let t1: Tuple = aRval as Tuple;
				let t2: Tuple = bRval as Tuple;
				let rs: Expr[] = [];
				for (let i = 0; i < t1.vals.length; i++) {
					let add: Add = new Add(t1.vals[i], t2.vals[i], this.span);
					add.applyType(buffer);
					rs.push(add.rval(buffer));
				}
				let ret: Tuple = new Tuple(rs, this.span);
				ret.applyType(buffer);
				return ret;
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new VoidObj();
		}
	}
}

export class Mul extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "*", span);
	}

	override toString(): string {
		return `mul(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.ANY:
				let temp: Mul = new Mul(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.MODULUS:
				let m1: ModulusLiteral = aRval as ModulusLiteral;
				let m2: ModulusLiteral = bRval as ModulusLiteral;
				return m1.mul(m2, buffer);
			case TypeEnum.INTEGER:
				let v1: IntegerLiteral = aRval as IntegerLiteral;
				let v2: IntegerLiteral = bRval as IntegerLiteral;
				return v1.mul(v2, buffer);
			case TypeEnum.NATURAL:
				let n1: NaturalLiteral = aRval as NaturalLiteral;
				let n2: NaturalLiteral = bRval as NaturalLiteral;
				return n1.mul(n2, buffer);
			case TypeEnum.STRING:
				buffer.throwError(
					new UnsupportedBinop(this.symbol, this.type, this.span)
				);
				return new VoidObj();
			case TypeEnum.TUPLE:
				let t1: Tuple = aRval as Tuple;
				let t2: Tuple = bRval as Tuple;
				let rs: Expr[] = [];
				for (let i = 0; i < t1.vals.length; i++) {
					let mul: Mul = new Mul(t1.vals[i], t2.vals[i], this.span);
					mul.applyType(buffer);
					rs.push(mul.rval(buffer));
				}
				let ret: Tuple = new Tuple(rs, this.span);
				ret.applyType(buffer);
				return ret;
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new VoidObj();
		}
	}
}

export class Sub extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "-", span);
	}

	override toString(): string {
		return `sub(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.ANY:
				let temp: Sub = new Sub(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.MODULUS:
				let m1: ModulusLiteral = aRval as ModulusLiteral;
				let m2: ModulusLiteral = bRval as ModulusLiteral;
				return m1.sub(m2, buffer);
			case TypeEnum.INTEGER:
				let v1: IntegerLiteral = aRval as IntegerLiteral;
				let v2: IntegerLiteral = bRval as IntegerLiteral;
				return v1.sub(v2, buffer);
			case TypeEnum.NATURAL:
				let n1: NaturalLiteral = aRval as NaturalLiteral;
				let n2: NaturalLiteral = bRval as NaturalLiteral;
				return n1.sub(n2, buffer);
			case TypeEnum.STRING:
				buffer.throwError(
					new UnsupportedBinop(this.symbol, this.type, this.span)
				);
				return new VoidObj();
			case TypeEnum.TUPLE:
				let t1: Tuple = aRval as Tuple;
				let t2: Tuple = bRval as Tuple;
				let rs: Expr[] = [];
				for (let i = 0; i < t1.vals.length; i++) {
					let sub: Sub = new Sub(t1.vals[i], t2.vals[i], this.span);
					sub.applyType(buffer);
					rs.push(sub.rval(buffer));
				}
				let ret: Tuple = new Tuple(rs, this.span);
				ret.applyType(buffer);
				return ret;
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new VoidObj();
		}
	}
}

export class Div extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "/", span);
	}

	override toString(): string {
		return `div(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.ANY:
				let temp: Div = new Div(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.MODULUS:
				let m1: ModulusLiteral = aRval as ModulusLiteral;
				let m2: ModulusLiteral = bRval as ModulusLiteral;
				return m1.div(m2, buffer);
			case TypeEnum.INTEGER:
				let v1: IntegerLiteral = aRval as IntegerLiteral;
				let v2: IntegerLiteral = bRval as IntegerLiteral;
				return v1.div(v2, buffer);
			case TypeEnum.NATURAL:
				let n1: NaturalLiteral = aRval as NaturalLiteral;
				let n2: NaturalLiteral = bRval as NaturalLiteral;
				return n1.div(n2, buffer);
			case TypeEnum.STRING:
				buffer.throwError(
					new UnsupportedBinop(this.symbol, this.type, this.span)
				);
				return new VoidObj();
			case TypeEnum.TUPLE:
				let t1: Tuple = aRval as Tuple;
				let t2: Tuple = bRval as Tuple;
				let rs: Expr[] = [];
				for (let i = 0; i < t1.vals.length; i++) {
					let div: Div = new Div(t1.vals[i], t2.vals[i], this.span);
					div.applyType(buffer);
					rs.push(div.rval(buffer));
				}
				let ret: Tuple = new Tuple(rs, this.span);
				ret.applyType(buffer);
				return ret;
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new VoidObj();
		}
	}
}

export class LogicalNot extends Expr {
	a: Expr;

	constructor(a: Expr, span: Span) {
		super(span);
		this.a = a;
	}

	override toString(): string {
		return `not(${this.a.toString()})`;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.a.applyBind(scope, buffer);
	}
	override applyType(buffer: IOBuffer): void {
		this.type = INT_TYPE;
		this.a = getTypeCast(this.a, INT_TYPE);
		this.a.applyType(buffer);
	}

	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);

		let v1: IntegerLiteral = aRval as IntegerLiteral;

		return new BooleanLiteral(v1.isZero(), this.span);
	}
}

export class LogicalOr extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "||", span);
	}

	override toString(): string {
		return `or(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): BooleanLiteral {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr;

		switch (this.type.type) {
			case TypeEnum.ANY:
				bRval = this.b.rval(buffer);
				let temp: LogicalOr = new LogicalOr(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.MODULUS:
				let type: ModulusType = this.type as ModulusType;
				if (type.mod == 2) {
					let n1: number = (aRval as ModulusLiteral).val;
					if (n1 == 1) return new BooleanLiteral(true, this.span);

					bRval = this.b.rval(buffer);
					let n2: number = (bRval as ModulusLiteral).val;
					return new BooleanLiteral(n2 == 1, this.span);
				}

			case TypeEnum.STRING:
				buffer.throwError(
					new IllegalTypeConversionError(
						this.type,
						new ModulusType(2, this.span),
						this.span
					)
				);
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new BooleanLiteral(false, this.span);
		}
	}
}
export class LogicalAnd extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "&&", span);
	}

	override toString(): string {
		return `and(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): BooleanLiteral {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr;

		switch (this.type.type) {
			case TypeEnum.ANY:
				bRval = this.b.rval(buffer);
				let temp: LogicalAnd = new LogicalAnd(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.MODULUS:
				let type: ModulusType = this.type as ModulusType;
				if (type.mod == 2) {
					let n1: number = (aRval as ModulusLiteral).val;
					if (n1 != 1) return new BooleanLiteral(false, this.span);

					bRval = this.b.rval(buffer);
					let n2: number = (bRval as ModulusLiteral).val;
					return new BooleanLiteral(n2 == 1, this.span);
				}

			case TypeEnum.STRING:
				buffer.throwError(
					new IllegalTypeConversionError(
						this.type,
						new ModulusType(2, this.span),
						this.span
					)
				);
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new BooleanLiteral(false, this.span);
		}
	}
}
export class LogicalEq extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "==", span);
	}

	override toString(): string {
		return `equals(${this.a},${this.b})`;
	}

	override rval(buffer: IOBuffer): BooleanLiteral {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.ANY:
				let temp: LogicalEq = new LogicalEq(aRval, bRval, this.span);
				temp.applyType(buffer);
				return temp.rval(buffer);
			case TypeEnum.INTEGER:
				let v1: number = (aRval as IntegerLiteral).getVal();
				let v2: number = (bRval as IntegerLiteral).getVal();
				return new BooleanLiteral(v1 == v2, this.span);
			case TypeEnum.NATURAL:
				let n1: number = (aRval as NaturalLiteral).getVal();
				let n2: number = (bRval as NaturalLiteral).getVal();
				return new BooleanLiteral(n1 == n2, this.span);
			case TypeEnum.MODULUS:
				let m1: number = (aRval as ModulusLiteral).val;
				let m2: number = (bRval as ModulusLiteral).val;
				return new BooleanLiteral(m1 == m2, this.span);
			case TypeEnum.STRING:
				let s1: StringLiteral = aRval as StringLiteral;
				let s2: StringLiteral = bRval as StringLiteral;
				return new BooleanLiteral(s1.name == s2.name, this.span);
			case TypeEnum.TUPLE:
				let t1: Tuple = aRval as Tuple;
				let t2: Tuple = bRval as Tuple;
				for (let i = 0; i < t1.vals.length; i++) {
					let eq: LogicalEq = new LogicalEq(
						t1.vals[i],
						t2.vals[i],
						this.span
					);
					eq.applyType(buffer);
					if (eq.rval(buffer).val == 0)
						return new BooleanLiteral(false, this.span);
				}
				return new BooleanLiteral(true, this.span);
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new BooleanLiteral(false, this.span);
		}
	}
}
