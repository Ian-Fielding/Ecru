import { IOBuffer } from "../IOBuffer.js";
import {
	CompilerError,
	IllegalTypeConversionError,
	UnsupportedBinop,
} from "../error.js";
import { Span } from "../parser/token.js";
import {
	Expr,
	NumberLiteral,
	StringLiteral,
	VoidObj,
	getTypeCast,
} from "./exprs.js";
import { Scope } from "./symbols.js";
import { TypeAST, TypeEnum } from "./type.js";

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

		let precedence: TypeEnum[] = [TypeEnum.STRING, TypeEnum.INTEGER];

		for (let type of precedence) {
			if (aType.type == type || bType.type == type) {
				this.type = new TypeAST(type);
				this.a = getTypeCast(this.a, this.type);
				this.a.applyType(buffer);
				this.b = getTypeCast(this.b, this.type);
				this.b.applyType(buffer);
				return;
			}
		}

		buffer.throwError(new UnsupportedBinop(this.symbol, aType, this.span));

		return;
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
				return new NumberLiteral("" + (v1.val + v2.val), this.span);
			case TypeEnum.STRING:
				let s1: StringLiteral = aRval as StringLiteral;
				let s2: StringLiteral = bRval as StringLiteral;
				return new StringLiteral(s1.name + s2.name, this.span);
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
				return new NumberLiteral("" + v1.val * v2.val, this.span);
			case TypeEnum.STRING:
				buffer.throwError(
					new UnsupportedBinop(this.symbol, this.type, this.span)
				);
				return new VoidObj();
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
				return new NumberLiteral("" + (v1.val - v2.val), this.span);
			case TypeEnum.STRING:
				buffer.throwError(
					new UnsupportedBinop(this.symbol, this.type, this.span)
				);
				return new VoidObj();
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
				return new NumberLiteral("" + v1.val / v2.val, this.span);
			case TypeEnum.STRING:
				buffer.throwError(
					new UnsupportedBinop(this.symbol, this.type, this.span)
				);
				return new VoidObj();
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
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}

	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `not(${ps.join(",")})`;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let param of this.params) param.applyBind(scope, buffer);
	}
	override applyType(buffer: IOBuffer): void {
		this.type = new TypeAST("Integer");

		this.params[0].applyType(buffer);
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [this.params[0].rval(buffer)];

		let v1: number = (childRVals[0] as NumberLiteral).val;

		if (v1 != 0) v1 = 1;

		return new NumberLiteral(v1 == 1 ? "0" : "1", this.span);
	}
}

export class LogicalOr extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let param of this.params) param.applyBind(scope, buffer);
	}
	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `or(${ps.join(",")})`;
	}

	override applyType(buffer: IOBuffer): void {
		this.type = new TypeAST("Integer");

		this.params[0].applyType(buffer);
		this.params[1].applyType(buffer);
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [
			this.params[0].rval(buffer),
			this.params[1].rval(buffer),
		];

		let v1: number = (childRVals[0] as NumberLiteral).val;
		let v2: number = (childRVals[1] as NumberLiteral).val;

		if (v1 != 0) v1 = 1;
		if (v2 != 0) v2 = 1;

		return new NumberLiteral("" + Math.max(v1, v2), this.span);
	}
}

export class LogicalAnd extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}

	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `and(${ps.join(",")})`;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let param of this.params) param.applyBind(scope, buffer);
	}
	override applyType(buffer: IOBuffer): void {
		this.type = new TypeAST("Integer");

		this.params[0].applyType(buffer);
		this.params[1].applyType(buffer);
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [
			this.params[0].rval(buffer),
			this.params[1].rval(buffer),
		];

		let v1: number = (childRVals[0] as NumberLiteral).val;
		let v2: number = (childRVals[1] as NumberLiteral).val;

		if (v1 != 0) v1 = 1;
		if (v2 != 0) v2 = 1;

		return new NumberLiteral("" + v1 * v2, this.span);
	}
}

export class LogicalEq extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let param of this.params) param.applyBind(scope, buffer);
	}
	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `equals(${ps.join(",")})`;
	}

	override applyType(buffer: IOBuffer): void {
		this.type = new TypeAST("Integer");

		this.params[0].applyType(buffer);
		this.params[1].applyType(buffer);

		if (!this.params[0].type.instanceOf(this.params[1].type)) {
			buffer.throwError(
				new IllegalTypeConversionError(
					this.params[0].type,
					this.params[1].type,
					this.span
				)
			);

			return;
		}

		if (!this.params[1].type.instanceOf(this.params[0].type)) {
			buffer.throwError(
				new IllegalTypeConversionError(
					this.params[1].type,
					this.params[0].type,
					this.span
				)
			);

			return;
		}
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [
			this.params[0].rval(buffer),
			this.params[1].rval(buffer),
		];

		let v1: string | number;
		let v2: string | number;

		if (childRVals[0].type.instanceOf(TypeEnum.STRING)) {
			v1 = (childRVals[0] as StringLiteral).name;
			v2 = (childRVals[1] as StringLiteral).name;
		} else {
			v1 = (childRVals[0] as NumberLiteral).val;
			v2 = (childRVals[1] as NumberLiteral).val;
		}

		return new NumberLiteral(v1 == v2 ? "1" : "0", this.span);
	}
}
