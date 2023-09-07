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
import { TypeAST, TypeEnum } from "./type.js";

export class Negate extends Expr {
	constructor(expr: Expr, span: Span) {
		super("TODO", span, []);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType?: TypeAST | undefined
	): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class Factorial extends Expr {
	constructor(expr: Expr, span: Span) {
		super("TODO", span, []);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType?: TypeAST | undefined
	): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class Exponent extends Expr {
	constructor(expr1: Expr, expr2: Expr, span: Span) {
		super("TODO", span, []);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType?: TypeAST | undefined
	): void {}

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
		super("add", span, [a, b]);
		this.a = a;
		this.b = b;
		this.op = AddOps.UNKNOWN;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		this.a.applyType(buffer);
		this.b.applyType(buffer);
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
				return new StringLiteral(s1._name + s2._name, this.span);
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
		super("mul", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		let childTypes: TypeAST[] = this.params.map(function (
			c: Expr
		): TypeAST {
			c.applyType(buffer);
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
				out._name = "NumberLiteral_" + out.val;
			}
			return out;
		}

		let str: string = "";
		let count: number = (childRVals[1] as NumberLiteral).val;
		let dup: string = (childRVals[0] as StringLiteral)._name;
		for (let i = 0; i < count; i++) str += dup;

		return new StringLiteral(str, this.span);
	}
}

export class Sub extends Expr {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("sub", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		let childTypes: TypeAST[] = this.params.map(function (
			c: Expr
		): TypeAST {
			c.applyType(buffer);
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
		super("div", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		let childTypes: TypeAST[] = this.params.map(function (
			c: Expr
		): TypeAST {
			c.applyType(buffer);
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
		super("not", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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
		super("or", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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
		super("and", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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
		super("equals", span, args);
		this.params = args;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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
			v1 = (childRVals[0] as StringLiteral)._name;
			v2 = (childRVals[1] as StringLiteral)._name;
		} else {
			v1 = (childRVals[0] as NumberLiteral).val;
			v2 = (childRVals[1] as NumberLiteral).val;
		}

		return new NumberLiteral(v1 == v2 ? "1" : "0", this.span);
	}
}
