import { IOBuffer } from "../../IOBuffer.js";
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
} from "../../error.js";
import { Span } from "../../parser/token.js";
import { AST, ReturnObject } from "../asts.js";
import { DeclarationStatement, ReturnStatement, Statement } from "../stmts.js";
import { Scope, IdSymbol } from "../symbols.js";
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
} from "../type.js";
import { PRIMES, intPow, unionSpan } from "../../util/utils.js";
import { getTypeCast } from "./typecast.js";
import { Expr } from "./expr.js";
import { NaturalType } from "../type.js";
import { Shorthand } from "../../util/shorthand.js";
import { NaturalLiteral } from "./terminals/natural.js";
import { IntegerLiteral } from "./terminals/integer.js";
import { ModulusLiteral } from "./terminals/modulus.js";
import { FuncDecl } from "./terminals/funcDecl.js";
import { Tuple } from "./terminals/tuple.js";

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
		let i: number = (this.ind.rval(buffer) as IntegerLiteral).getVal();

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
