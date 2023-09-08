import { IOBuffer } from "../IOBuffer.js";
import {
	CompilerError,
	IllegalTypeConversionError,
	UnsupportedBinop,
} from "../error.js";
import { Span } from "../parser/token.js";
import {
	Expr,
	IntToString,
	NumberLiteral,
	StringLiteral,
	VoidObj,
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {}

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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {}

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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

const enum AddOps {
	ADD_INTS,
	STRING_CONCAT,
	UNKNOWN,
}
export class Add extends Expr {
	a: Expr;
	b: Expr;
	op: AddOps;

	constructor(a: Expr, b: Expr, span: Span) {
		super(span);
		this.a = a;
		this.b = b;
		this.op = AddOps.UNKNOWN;
	}

	override toString(): string {
		return `add(${this.a},${this.b})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.a.applyBind(scope, buffer);
		this.b.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.a.applyType(buffer, new TypeAST("Dummy"));
		this.b.applyType(buffer, new TypeAST("Dummy"));
		let aType: TypeAST = this.a.type;
		let bType: TypeAST = this.b.type;

		if (
			aType.type == TypeEnum.VOID ||
			bType.type == TypeEnum.VOID ||
			expectedType.type == TypeEnum.VOID
		)
			buffer.throwError(
				new UnsupportedBinop("+", new TypeAST("void"), this.span)
			);

		if (aType.type == TypeEnum.INTEGER && bType.type == TypeEnum.INTEGER) {
			this.type = new TypeAST("Int");
			this.op = AddOps.ADD_INTS;
			return;
		}

		// str concat

		if (bType.type != TypeEnum.STRING) {
			this.b = new IntToString(this.b);
		}
		if (aType.type != TypeEnum.STRING) {
			this.a = new IntToString(this.a);
		}
		this.type = new TypeAST("Str");

		this.a.applyType(buffer, this.type);
		this.b.applyType(buffer, this.type);
		this.op = AddOps.STRING_CONCAT;

		return;
	}

	override rval(buffer: IOBuffer): Expr {
		let aRval: Expr = this.a.rval(buffer);
		let bRval: Expr = this.b.rval(buffer);

		switch (this.op) {
			case AddOps.ADD_INTS:
				let v1: NumberLiteral = aRval as NumberLiteral;
				let v2: NumberLiteral = bRval as NumberLiteral;
				return new NumberLiteral("" + (v1.val + v2.val), this.span);
			case AddOps.STRING_CONCAT:
				let s1: StringLiteral = aRval as StringLiteral;
				let s2: StringLiteral = bRval as StringLiteral;
				return new StringLiteral(s1.name + s2.name, this.span);
			case AddOps.UNKNOWN:
				buffer.throwError(
					new CompilerError("+ not assigned type?", this.span)
				);
				return new VoidObj();
		}
	}
}

export class Mul extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}

	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `mul(${ps.join(",")})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let p of this.params) p.applyBind(scope, buffer);
	}
	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		let childTypes: TypeAST[] = this.params.map(function (
			c: Expr
		): TypeAST {
			c.applyType(buffer, new TypeAST("Dummy"));
			return c.type;
		});

		// updates types for all math ops
		let gcdType: TypeAST = childTypes.reduce((t1, t2) =>
			t1.closestParent(t2)
		);
		if (gcdType.isMathType()) {
			this.type = gcdType;

			return;
		}

		// handles string multiplication
		let containsString: boolean = false;
		for (let t of childTypes) {
			if (t.instanceOf(TypeEnum.STRING)) {
				containsString = true;
				break;
			}
		}

		if (containsString) {
			this.type = new TypeAST("String");

			return;
		}
		buffer.throwError(
			new UnsupportedBinop("*", new TypeAST("Dummy"), this.span) //TODO
		);
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [];
		for (let child of this.params) {
			childRVals.push(child.rval(buffer));
		}

		if (this.type.isMathType()) {
			let out: NumberLiteral = new NumberLiteral("1", this.span);
			for (let i in childRVals) {
				let child: NumberLiteral = childRVals[i] as NumberLiteral;

				out.val *= child.val;
				//out._name = "NumberLiteral_" + out.val;
			}
			return out;
		}

		let str: string = "";
		let count: number = (childRVals[1] as NumberLiteral).val;
		let dup: string = (childRVals[0] as StringLiteral).name;
		for (let i = 0; i < count; i++) str += dup;

		return new StringLiteral(str, this.span);
	}
}

export class Sub extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}

	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `sub(${ps.join(",")})`;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let param of this.params) param.applyBind(scope, buffer);
	}
	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		let childTypes: TypeAST[] = this.params.map(function (
			c: Expr
		): TypeAST {
			c.applyType(buffer, new TypeAST("Dummy"));
			return c.type;
		});

		// updates types for all math ops
		let gcdType: TypeAST = childTypes.reduce((t1, t2) =>
			t1.closestParent(t2)
		);
		if (gcdType.isMathType()) {
			this.type = gcdType;

			return;
		}
		buffer.throwError(
			new UnsupportedBinop("-", new TypeAST("Dummy"), this.span) //TODO
		);
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [
			this.params[0].rval(buffer),
			this.params[1].rval(buffer),
		];

		let v1: number = (childRVals[0] as NumberLiteral).val;
		let v2: number = (childRVals[1] as NumberLiteral).val;
		return new NumberLiteral("" + (v1 - v2), this.span);
	}
}

export class Div extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super(span);
		this.params = args;
	}

	override toString(): string {
		let ps: string[] = this.params.map((e) => e.toString());
		return `div(${ps.join(",")})`;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let param of this.params) param.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		let childTypes: TypeAST[] = this.params.map(function (
			c: Expr
		): TypeAST {
			c.applyType(buffer, new TypeAST("Dummy"));
			return c.type;
		});

		// updates types for all math ops
		let gcdType: TypeAST = childTypes.reduce((t1, t2) =>
			t1.closestParent(t2)
		);
		if (gcdType.isMathType()) {
			this.type = gcdType;

			return;
		}
		buffer.throwError(
			new UnsupportedBinop("/", new TypeAST("Dummy"), this.span) //TODO
		);
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [
			this.params[0].rval(buffer),
			this.params[1].rval(buffer),
		];

		let v1: number = (childRVals[0] as NumberLiteral).val;
		let v2: number = (childRVals[1] as NumberLiteral).val;
		return new NumberLiteral("" + v1 / v2, this.span);
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
	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.type = new TypeAST("Integer");
		if (
			!expectedType.instanceOf(TypeEnum.DUMMY) &&
			!this.type.instanceOf(expectedType)
		) {
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
			return;
		}

		this.params[0].applyType(buffer, this.type);
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.type = new TypeAST("Integer");
		if (
			!expectedType.instanceOf(TypeEnum.DUMMY) &&
			!this.type.instanceOf(expectedType)
		) {
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
			return;
		}

		this.params[0].applyType(buffer, this.type);
		this.params[1].applyType(buffer, this.type);
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
	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.type = new TypeAST("Integer");
		if (
			!expectedType.instanceOf(TypeEnum.DUMMY) &&
			!this.type.instanceOf(expectedType)
		) {
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
			return;
		}

		this.params[0].applyType(buffer, this.type);
		this.params[1].applyType(buffer, this.type);
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.type = new TypeAST("Integer");

		if (
			!expectedType.instanceOf(TypeEnum.DUMMY) &&
			!this.type.instanceOf(expectedType)
		) {
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
			return;
		}

		this.params[0].applyType(buffer, expectedType);
		this.params[1].applyType(buffer, expectedType);

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
