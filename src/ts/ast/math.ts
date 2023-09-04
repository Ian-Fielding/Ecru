import { IOBuffer } from "../IOBuffer.js";
import { Span } from "../parser/token.js";
import { Expr, NumberLiteral, StringLiteral } from "./exprs.js";
import { TypeAST, TypeEnum } from "./type.js";

class BuiltinFunc extends Expr {
	constructor(
		name: string,
		span: Span,
		args: Expr[],
		type: TypeAST = new TypeAST("Dummy")
	) {
		super(name, span, args, type);
	}
}

export class Negate extends BuiltinFunc {
	constructor(expr: Expr, span: Span) {
		super("TODO", span, []);
	}
}

export class Factorial extends BuiltinFunc {
	constructor(expr: Expr, span: Span) {
		super("TODO", span, []);
	}
}

export class Exponent extends BuiltinFunc {
	constructor(expr1: Expr, expr2: Expr, span: Span) {
		super("TODO", span, []);
	}
}

export class Add extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("add", span, args);
		this.params = args;

		//TODO better error
		if (args.length < 2)
			throw new Error("Need at least two arguments for 'add'");
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

		// handles string concat
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

		buffer.stderr("Unknown add type");
	}

	override rval(buffer: IOBuffer): Expr {
		let childRVals: Expr[] = [];
		for (let child of this.params) {
			childRVals.push(child.rval(buffer));
		}

		if (this.type.isMathType()) {
			let out: NumberLiteral = new NumberLiteral("0", this.span);
			for (let i in childRVals) {
				let child: NumberLiteral = childRVals[i] as NumberLiteral;

				out.val += child.val;
				out.name = "NumberLiteral_" + out.val;
			}
			return out;
		}

		let str: string = "";
		for (let r of childRVals) {
			str += r.builtinToString();
		}

		return new StringLiteral(str, this.span);
	}
}

export class Mul extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("mul", span, args);
		this.params = args;

		//TODO better error
		if (args.length < 2)
			throw new Error("Need at least two arguments for 'mul'");
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

		buffer.stderr("Unknown mul type");
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
				out.name = "NumberLiteral_" + out.val;
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

export class Sub extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("sub", span, args);
		this.params = args;

		//TODO better error
		if (args.length != 2)
			throw new Error("Need exactly two arguments for 'sub'");
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

		buffer.stderr("Unknown sub type");
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

export class Div extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("div", span, args);
		this.params = args;

		//TODO better error
		if (args.length != 2)
			throw new Error("Need exactly two arguments for 'div'");
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

		buffer.stderr("Unknown div type");
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

export class LogicalNot extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("not", span, args);
		this.params = args;

		//TODO better error
		if (args.length != 1)
			throw new Error("Need exactly one arguments for 'not'");
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
			buffer.stderr(
				`Cannot treat "${this.name}" as type ${expectedType.type} in ~`
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

export class LogicalOr extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("or", span, args);
		this.params = args;

		//TODO better error
		if (args.length != 2)
			throw new Error("Need exactly two arguments for 'or'");
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
			buffer.stderr(
				`Cannot treat "${this.name}" as type ${expectedType.type} in ||`
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

export class LogicalAnd extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("and", span, args);
		this.params = args;

		//TODO better error
		if (args.length != 2)
			throw new Error("Need exactly two arguments for 'or'");
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
			buffer.stderr(
				`Cannot treat "${this.name}" as type ${expectedType.type} in &&`
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

export class LogicalEq extends BuiltinFunc {
	params: Expr[];

	constructor(args: Expr[], span: Span) {
		super("equals", span, args);
		this.params = args;

		//TODO better error
		if (args.length != 2)
			throw new Error("Need exactly two arguments for 'equals'");
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
			buffer.stderr(
				`Cannot treat "${this.name}" as type ${expectedType.type} in ==`
			);
			return;
		}

		this.params[0].applyType(buffer);
		this.params[1].applyType(buffer);

		if (!this.params[0].type.instanceOf(this.params[1].type)) {
			buffer.stderr(
				`Cannot treat "${this.params[0].toString()}" as type ${
					this.params[1].type
				} in ==`
			);
			return;
		}

		if (!this.params[1].type.instanceOf(this.params[0].type)) {
			buffer.stderr(
				`Cannot treat "${this.params[1].toString()}" as type ${
					this.params[0].type
				} in ==`
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
