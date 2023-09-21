import { IOBuffer } from "../IOBuffer.js";
import {
	ArgumentLengthError,
	CompilerError,
	DimensionError,
	DivisionByZeroError,
	IllegalCallError,
	IllegalIndexError,
	IllegalTypeConversionError,
	NonexistentReturnError,
	OutOfBoundsError,
	UndefinedIdentifierError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { AST, ReturnObject } from "./asts.js";
import { DeclarationStatement, ReturnStatement, Statement } from "./stmts.js";
import { Scope, IdSymbol } from "./symbols.js";
import {
	Type,
	FunctionType,
	TypeEnum,
	ProductType,
	ModulusType,
	INT_TYPE,
	VOID_TYPE,
	STR_TYPE,
	ANY_TYPE,
	NAT_TYPE,
	RAT_TYPE,
} from "./type.js";
import { unionSpan } from "../utils.js";

export abstract class Expr extends AST {
	type: Type;

	constructor(span: Span) {
		super(span);
		this.type = ANY_TYPE;
	}

	abstract rval(buffer: IOBuffer): Expr;

	toLatex(): string {
		return `\\text{REPLACE ME}`;
	}

	abstract applyType(buffer: IOBuffer): void;
}

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
				return new ModulusLiteral(m.val, this.mod, this.span);
			case TypeEnum.INTEGER:
				let n: IntegerLiteral = r as IntegerLiteral;
				return new ModulusLiteral(n.val, this.mod, this.span);
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

				if (n.val <= 0)
					buffer.throwError(
						new IllegalTypeConversionError(
							n.type,
							this.type,
							this.span
						)
					);

				return new NaturalLiteral(n.val, this.span);
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
				return new IntegerLiteral(n.val, this.span);
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
				return new StringLiteral(i.val + "", r.span);

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
				return new StringLiteral(s.val + "", r.span);
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

export class FuncDecl extends Expr {
	params: DeclarationStatement[];
	stmts: Statement[];

	constructor(
		params: DeclarationStatement[],
		stmts: Statement[],
		type: FunctionType,
		span: Span
	) {
		super(span);
		this.params = params;
		this.stmts = stmts;
		this.type = type;
	}

	override toString(): string {
		let ps: string[] = this.params.map((d) => d.toString());
		let ss: string[] = this.params.map((d) => d.toString());

		return `FuncDecl([${ps.join(",")}],[${ss.join(",")}])`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let aScope: Scope = new Scope(scope);
		let bScope: Scope = new Scope(aScope);

		for (let param of this.params) param.applyBind(aScope, buffer);

		for (let child of this.stmts) child.applyBind(bScope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		let type: FunctionType = this.type as FunctionType;

		for (let child of this.params) child.applyType(buffer, ANY_TYPE);
		for (let child of this.stmts) child.applyType(buffer, type.codomain);

		if (type.codomain.type != TypeEnum.VOID) {
			let index: number = -1;
			for (let i = 0; i < this.stmts.length; i++) {
				if (this.stmts[i] instanceof ReturnStatement) {
					index = i;
					break;
				}
			}

			if (index == -1) {
				buffer.throwError(
					new NonexistentReturnError(type.codomain, this.span)
				);
				return;
			}
			/*if (index != this.stmts.length-1) {
				buffer.stderr("Function contains unreachable code!");
				return { break: true };
			}*/
		}
		return;
	}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	onCall(buffer: IOBuffer, input: Expr): Expr {
		let backup: (Expr | null)[] = [];
		let retVal: Expr = new VoidObj();

		/*let inputLength: number;
		if (input instanceof VoidObj) inputLength = 0;
		else if (input instanceof Tuple)
			inputLength = (input as Tuple).vals.length;
		else inputLength = 1;

		if (this.params.length != inputLength) {
			buffer.stderr("Invalid arg lenths!");
			return retVal;
		}*/

		if (this.params.length == 1) {
			let decl: DeclarationStatement = this.params[0];
			let param: Expr = input;

			let id: Id = decl.id;

			if (!id.symbol) {
				buffer.throwError(
					new UndefinedIdentifierError(id.idName, this.span)
				);
				return this;
			}

			backup.push(id.symbol.val);
			id.symbol.val = param;
		} else if (this.params.length > 1) {
			for (let i = 0; i < this.params.length; i++) {
				let decl: DeclarationStatement = this.params[i];
				let tup: Tuple = input as Tuple;
				let param: Expr = tup.vals[i];

				let id: Id = decl.id;

				if (!id.symbol) {
					buffer.throwError(
						new UndefinedIdentifierError(id.idName, this.span)
					);
					return this;
				}

				backup.push(id.symbol.val);
				id.symbol.val = param;
			}
		}

		for (let stmt of this.stmts) {
			let result: ReturnObject = stmt.execute(buffer);
			if (result.break && result.retVal) return result.retVal;
		}

		/*if (
			!(this.type as FunctionType).codomain.instanceOf(TypeEnum.VOID) &&
			retVal instanceof VoidObj
		)
			buffer.stderr(`Function ${this} does not return!`);
            */

		// restore params
		for (let i = 0; i < this.params.length; i++) {
			let decl: DeclarationStatement = this.params[i];
			let id: Id = decl.id;

			if (!id.symbol) {
				buffer.throwError(
					new UndefinedIdentifierError(id.idName, this.span)
				);
				return this;
			}
			id.symbol.val = backup[i];
		}

		return retVal;
	}
}

export class FuncCall extends Expr {
	funcName: Expr;
	input: Expr;
	params: Expr[];

	constructor(funcName: Expr, params: Expr[], span: Span) {
		super(span);

		this.funcName = funcName;
		this.params = params;

		if (params.length == 0) this.input = new VoidObj();
		else if (params.length == 1) this.input = params[0];
		else this.input = new Tuple(params, span);
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.funcName.applyBind(scope, buffer);
		this.input.applyBind(scope, buffer);
		for (let param of this.params) param.applyBind(scope, buffer);
	}

	override toString(): string {
		let ps: string[] = this.params.map((d) => d.toString());

		return `FuncCall(${this.funcName},${this.input},${ps.join(",")})`;
	}

	override rval(buffer: IOBuffer): Expr {
		let safetyCheck: Expr = this.funcName.rval(buffer);

		if (!(safetyCheck instanceof FuncDecl))
			buffer.throwError(
				new CompilerError(
					"Idk apparently the funcname is invalid? I see " +
						safetyCheck,
					this.span
				)
			);

		let func: FuncDecl = safetyCheck as FuncDecl;

		if (this.params.length != func.params.length) {
			buffer.throwError(
				new ArgumentLengthError(
					this.params.length,
					func.params.length,
					this.span
				)
			);
			return new VoidObj();
		}

		let changeme: Expr = func.onCall(buffer, this.input.rval(buffer)); //TODO sucks
		if (buffer.hasSeenError()) return new VoidObj();
		return changeme;
	}

	override applyType(buffer: IOBuffer): void {
		this.funcName.applyType(buffer);

		if (!(this.funcName.type instanceof FunctionType)) {
			buffer.throwError(
				new IllegalCallError(this.funcName.type, this.span)
			);
			return;
		}

		let funcType: FunctionType = this.funcName.type as FunctionType;

		this.input = getTypeCast(this.input, funcType.domain);
		this.input.applyType(buffer);
		this.type = funcType.codomain;
	}
}

export class StringLiteral extends Expr {
	name: string;
	constructor(name: string, span: Span) {
		super(span);
		this.name = name;
		this.type = STR_TYPE;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override toString(): string {
		return this.name;
	}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class VoidObj extends Expr {
	constructor() {
		super(new Span(0, 0, 0, 0));
		this.type = VOID_TYPE;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	override toString(): string {
		return "void";
	}
}

export class Id extends Expr {
	symbol: IdSymbol | null;
	idName: string;

	constructor(idName: string, span: Span) {
		super(span);
		this.symbol = null;
		this.idName = idName;
	}

	rval(buffer: IOBuffer): Expr {
		if (!this.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return this;
		}
		return this.symbol.rval(buffer);
	}

	override applyType(buffer: IOBuffer): void {
		if (!this.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return;
		}
		this.type = this.symbol.type;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let name: string = this.idName;
		let sym: IdSymbol | null = scope.lookup(name);

		if (!sym) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return;
		}

		this.symbol = sym;
	}

	override toLatex(): string {
		//TODO sucks

		return this.symbol!.toLatex();
	}

	override toString(): string {
		return this.idName;
	}
}

export class ArrayAccess extends Expr {
	arr: Expr;
	ind: Expr;
	constructor(arr: Expr, ind: Expr, span: Span) {
		super(span);
		this.arr = arr;
		this.ind = ind;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.arr.applyBind(scope, buffer);
		this.ind.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.arr.applyType(buffer);
		this.ind.applyType(buffer);
		this.ind = getTypeCast(this.ind, INT_TYPE);
		this.ind.applyType(buffer);

		if (this.arr.type.type == TypeEnum.STRING) {
			this.type = this.arr.type;
			return;
		}

		if (this.arr.type.type == TypeEnum.TUPLE) {
			this.type = ANY_TYPE;
			return;
		}

		buffer.throwError(new IllegalIndexError(this.arr.type, this.span));
	}

	override rval(buffer: IOBuffer): Expr {
		let i: number = (this.ind.rval(buffer) as IntegerLiteral).val;

		switch (this.arr.type.type) {
			case TypeEnum.TUPLE:
				let vals: Expr[] = (this.arr.rval(buffer) as Tuple).vals;
				if (0 <= i && i < vals.length) {
					this.type = (this.arr.type as ProductType).types[i];
					return vals[i].rval(buffer);
				}
				if (-vals.length <= i && i < 0) {
					this.type = (this.arr.type as ProductType).types[
						vals.length + i
					];
					return vals[vals.length + i].rval(buffer);
				}
				buffer.throwError(
					new OutOfBoundsError(i, vals.length, this.span)
				);
			case TypeEnum.STRING:
				let str: string = (this.arr.rval(buffer) as StringLiteral).name;
				if (0 <= i && i < str.length)
					return new StringLiteral(str.charAt(i), this.span);
				if (-str.length <= i && i < 0)
					return new StringLiteral(
						str.charAt(str.length + i),
						this.span
					);

				buffer.throwError(
					new OutOfBoundsError(i, str.length, this.span)
				);

			default:
				buffer.throwError(
					new CompilerError(
						this.arr.type + " not supported",
						this.span
					)
				);
				return new VoidObj();
		}
	}

	override toString(): string {
		return `Ind(${this.arr.toString()},${this.ind.toString()})`;
	}
}

abstract class NumberLiteral extends Expr {
	val: number;
	constructor(val: number, span: Span) {
		super(span);
		this.val = val;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	override toString(): string {
		return this.val + "";
	}

	abstract add(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract sub(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract mul(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract div(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
}

export class RationalLiteral extends NumberLiteral {
	num: IntegerLiteral;
	den: NaturalLiteral;
	constructor(num: IntegerLiteral, den: NaturalLiteral, span: Span) {
		super(0, span);
		this.num = num;
		this.den = den;
		this.type = RAT_TYPE;
	}
	override add(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		return new IntegerLiteral(
			this.val + other.val,
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		return new IntegerLiteral(
			this.val - other.val,
			unionSpan([this.span, other.span])
		);
	}
	override mul(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		return new IntegerLiteral(
			this.val * other.val,
			unionSpan([this.span, other.span])
		);
	}
	override div(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		if (other.val == 0)
			buffer.throwError(new DivisionByZeroError(other.span));

		return new IntegerLiteral(
			Math.floor(this.val / other.val),
			unionSpan([this.span, other.span])
		);
	}
}

export class IntegerLiteral extends NumberLiteral {
	constructor(val: number, span: Span) {
		super(val, span);
		this.type = INT_TYPE;
	}
	override add(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		return new IntegerLiteral(
			this.val + other.val,
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		return new IntegerLiteral(
			this.val - other.val,
			unionSpan([this.span, other.span])
		);
	}
	override mul(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		return new IntegerLiteral(
			this.val * other.val,
			unionSpan([this.span, other.span])
		);
	}
	override div(other: IntegerLiteral, buffer: IOBuffer): IntegerLiteral {
		if (other.val == 0)
			buffer.throwError(new DivisionByZeroError(other.span));

		return new IntegerLiteral(
			Math.floor(this.val / other.val),
			unionSpan([this.span, other.span])
		);
	}
}

export class NaturalLiteral extends NumberLiteral {
	constructor(val: number, span: Span) {
		super(val, span);
		this.type = NAT_TYPE;
	}

	override add(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		return new NaturalLiteral(
			this.val + other.val,
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		let n: number = this.val - other.val;

		if (n <= 0)
			buffer.throwError(
				new IllegalTypeConversionError(INT_TYPE, this.type, this.span)
			);

		return new NaturalLiteral(n, unionSpan([this.span, other.span]));
	}
	override mul(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		return new NaturalLiteral(
			this.val * other.val,
			unionSpan([this.span, other.span])
		);
	}
	override div(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		let n: number = Math.floor(this.val / other.val);

		return new NaturalLiteral(
			n == 0 ? 1 : n,
			unionSpan([this.span, other.span])
		);
	}
}

export class ModulusLiteral extends NumberLiteral {
	mod: number;
	constructor(val: number, mod: number, span: Span) {
		val %= mod;
		if (val < 0) val += mod;

		super(val, span);
		this.mod = mod;
		this.type = new ModulusType(mod, span);
	}
	override add(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		return new ModulusLiteral(
			this.val + other.val,
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		return new ModulusLiteral(
			this.val - other.val,
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
	override mul(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		return new ModulusLiteral(
			this.val * other.val,
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
	override div(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		if (other.val == 0)
			buffer.throwError(new DivisionByZeroError(other.span));

		return new ModulusLiteral(
			Math.floor(this.val / other.val),
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
}

export class BooleanLiteral extends ModulusLiteral {
	name: boolean;
	constructor(name: boolean, span: Span) {
		super(name ? 1 : 0, 2, span);
		this.name = name;
	}
}

/*
export class IntegerLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super(span);
		this.val = Number(name);
		this.type = INT_TYPE;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("" + this.val, this.span);

		return this;
	}

	toLongString() {
		return this.val + "";
	}

	override toString(): string {
		return this.val + "";
	}
}*/

export class Tuple extends Expr {
	vals: Expr[];
	constructor(vals: Expr[], span: Span) {
		super(span);
		this.vals = vals;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let val of this.vals) val.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		for (let i = 0; i < this.vals.length; i++) {
			this.vals[i].applyType(buffer);
		}

		this.type = new ProductType(
			this.vals.map((v) => v.type),
			this.span
		);
	}

	override rval(buffer: IOBuffer): Expr {
		let ret: Tuple = new Tuple(
			this.vals.map((v) => v.rval(buffer)),
			this.span
		);
		ret.applyType(buffer);

		return ret;
	}

	override toString(): string {
		let ps: string[] = this.vals.map((d) => d.toString());
		return `Tuple(${ps.join(",")})`;
	}
}
