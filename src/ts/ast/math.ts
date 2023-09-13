import { IOBuffer } from "../IOBuffer.js";
import {
	CompilerError,
	DimensionError,
	IllegalTypeConversionError,
	UnsupportedBinop,
} from "../error.js";
import { Span } from "../parser/token.js";
import {
	Expr,
	NumberLiteral,
	StringLiteral,
	Tuple,
	VoidObj,
	getTypeCast,
} from "./exprs.js";
import { Scope } from "./symbols.js";
import { ProductType, TypeAST, TypeEnum, gcdType } from "./type.js";

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
		let aType: TypeAST = this.a.type;
		let bType: TypeAST = this.b.type;

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
	}

	override toString(): string {
		return `negate(${this.expr})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
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
			case TypeEnum.INTEGER:
				let v1: NumberLiteral = aRval as NumberLiteral;
				let v2: NumberLiteral = bRval as NumberLiteral;
				return new NumberLiteral(v1.val + v2.val, this.span);
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
			case TypeEnum.INTEGER:
				let v1: NumberLiteral = aRval as NumberLiteral;
				let v2: NumberLiteral = bRval as NumberLiteral;
				return new NumberLiteral(v1.val * v2.val, this.span);
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
			case TypeEnum.INTEGER:
				let v1: NumberLiteral = aRval as NumberLiteral;
				let v2: NumberLiteral = bRval as NumberLiteral;
				return new NumberLiteral(v1.val - v2.val, this.span);
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
			case TypeEnum.INTEGER:
				let v1: NumberLiteral = aRval as NumberLiteral;
				let v2: NumberLiteral = bRval as NumberLiteral;
				return new NumberLiteral(v1.val / v2.val, this.span);
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
		this.type = new TypeAST("Integer");
		this.a = getTypeCast(this.a, this.type);
		this.a.applyType(buffer);
	}

	override rval(buffer: IOBuffer): Expr {
		let r: NumberLiteral = this.a.rval(buffer) as NumberLiteral;

		let v1: number = r.val;
		if (v1 != 0) v1 = 1;

		return new NumberLiteral(v1, this.span);
	}
}

export class LogicalOr extends Binop {
	constructor(a: Expr, b: Expr, span: Span) {
		super(a, b, "||", span);
	}

	override toString(): string {
		return `or(${this.a},${this.b})`;
	}
	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.INTEGER:
				let v1: number = (aRval as NumberLiteral).val;
				let v2: number = (bRval as NumberLiteral).val;
				if (v1 != 0) v1 = 1;
				if (v2 != 0) v2 = 1;

				return new NumberLiteral(Math.max(v1, v2), this.span);
			case TypeEnum.STRING:
				buffer.throwError(
					new IllegalTypeConversionError(
						this.type,
						new TypeAST("Int"),
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
				return new VoidObj();
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
	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.INTEGER:
				let v1: number = (aRval as NumberLiteral).val;
				let v2: number = (bRval as NumberLiteral).val;
				if (v1 != 0) v1 = 1;
				if (v2 != 0) v2 = 1;

				return new NumberLiteral(v1 * v2, this.span);
			case TypeEnum.STRING:
				buffer.throwError(
					new IllegalTypeConversionError(
						this.type,
						new TypeAST("Int"),
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
				return new VoidObj();
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
	override rval(buffer: IOBuffer): NumberLiteral {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.type.type) {
			case TypeEnum.INTEGER:
				let v1: number = (aRval as NumberLiteral).val;
				let v2: number = (bRval as NumberLiteral).val;
				return new NumberLiteral(v1 == v2 ? 1 : 0, this.span);
			case TypeEnum.STRING:
				let s1: StringLiteral = aRval as StringLiteral;
				let s2: StringLiteral = bRval as StringLiteral;
				return new NumberLiteral(s1.name == s2.name ? 1 : 0, this.span);
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
						return new NumberLiteral(0, this.span);
				}
				return new NumberLiteral(1, this.span);
			default:
				buffer.throwError(
					new CompilerError(
						this.symbol + " not assigned type?",
						this.span
					)
				);
				return new NumberLiteral(0, this.span);
		}
	}
}
