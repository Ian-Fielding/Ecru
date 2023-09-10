import { IOBuffer } from "../IOBuffer.js";
import {
	ArgumentLengthError,
	CompilerError,
	DimensionError,
	IllegalCallError,
	IllegalTypeConversionError,
	NonexistentReturnError,
	UndefinedIdentifierError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { AST, ReturnObject } from "./asts.js";
import { DeclarationStatement, ReturnStatement, Statement } from "./stmts.js";
import { Scope, IdSymbol } from "./symbols.js";
import { TypeAST, FunctionType, TypeEnum, ProductType } from "./type.js";

export abstract class Expr extends AST {
	type: TypeAST;

	constructor(span: Span) {
		super(span);
		this.type = new TypeAST("Dummy");
	}

	abstract rval(buffer: IOBuffer): Expr;

	toLatex(): string {
		return `\\text{REPLACE ME}`;
	}

	abstract applyType(buffer: IOBuffer): void;
}

export function getTypeCast(expr: Expr, type: TypeAST): Expr {
	switch (type.type) {
		case TypeEnum.INTEGER:
			return new TypeCastToInt(expr);
		case TypeEnum.STRING:
			return new TypeCastToString(expr);
		case TypeEnum.PROD:
			return new TypeCastToTuple(expr, type as ProductType);
		case TypeEnum.MAP:
			return new TypeCastToMap(expr, type as FunctionType);
		case TypeEnum.VOID:
			return new TypeCastToVoid(expr);
		default:
			//NOT IMPLEMENTEd
			throw new Error("NOT IMPLEMENTED " + type);
	}
}

export class TypeCastToVoid extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;
		this.type = new TypeAST("void");
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
				new IllegalTypeConversionError(r.type, this.type, this.span, 7)
			);

		return new VoidObj();
	}
}

export class TypeCastToMap extends Expr {
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
					this.span,
					8
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
			new IllegalTypeConversionError(r.type, this.type, this.span, 9)
		);
		return new FuncDecl([], [], this.type as FunctionType, this.span);
	}
}

export class TypeCastToTuple extends Expr {
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
			new IllegalTypeConversionError(r.type, this.type, this.span, 11)
		);
		return new Tuple([], this.span);
	}
}

export class TypeCastToInt extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;

		this.type = new TypeAST("Int");
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

	override rval(buffer: IOBuffer): NumberLiteral {
		let r: Expr = this.expr.rval(buffer);
		switch (r.type.type) {
			case TypeEnum.INTEGER:
			case TypeEnum.BOOLEAN:
			case TypeEnum.NATURAL:
				return r as NumberLiteral;
			case TypeEnum.STRING:
				let s: StringLiteral = r as StringLiteral;
				if (isNaN(+s.name) || isNaN(parseFloat(s.name)))
					buffer.throwError(
						new IllegalTypeConversionError(
							s.type,
							this.type,
							this.span,
							12
						)
					);
				return new NumberLiteral(+s.name, r.span);
			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			//TODO implement once types is good
			case TypeEnum.PROD:
			case TypeEnum.DUMMY:
			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			case TypeEnum.OBJECT:
			case TypeEnum.VOID:
				buffer.throwError(
					new IllegalTypeConversionError(
						r.type,
						this.type,
						this.span,
						13
					)
				);
				return new NumberLiteral(0, this.span);
		}
	}
}

export class TypeCastToString extends Expr {
	expr: Expr;

	constructor(expr: Expr) {
		super(expr.span);
		this.expr = expr;
		this.type = new TypeAST("String");
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
			case TypeEnum.BOOLEAN:
			case TypeEnum.NATURAL:
				let s: NumberLiteral = r as NumberLiteral;
				return new StringLiteral(s.val + "", r.span);
			case TypeEnum.PROD:
				let t: Tuple = r as Tuple;
				let vs: string[] = t.vals.map((v) => v.toString());
				return new StringLiteral(`(${vs.join(",")})`, r.span);

			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			//TODO implement once types is good
			case TypeEnum.DUMMY:
			case TypeEnum.OBJECT:
			case TypeEnum.VOID:
				buffer.throwError(
					new IllegalTypeConversionError(
						r.type,
						this.type,
						this.span,
						14
					)
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

		for (let child of this.params)
			child.applyType(buffer, new TypeAST("Dummy"));
		for (let child of this.stmts) child.applyType(buffer, type.codomain);

		if (!type.codomain.instanceOf(TypeEnum.VOID)) {
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
		this.type = new TypeAST("String");
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
		this.type = new TypeAST("void");
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
		// TODO
		super(span);
		this.arr = arr;
		this.ind = ind;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	override toString(): string {
		return `ArrayInd(${this.arr.toString()},${this.ind.toString()})`;
	}
}

export class NumberLiteral extends Expr {
	val: number;
	constructor(val: number, span: Span) {
		super(span);
		this.type = new TypeAST("Int");
		this.val = val;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("" + this.val, this.span);

		return this;
	}

	override toString(): string {
		return this.val + "";
	}
}
/*
export class IntegerLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super(span);
		this.val = Number(name);
		this.type = new TypeAST("Int");
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
		this.type = new TypeAST("CartProd");
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
		return new Tuple(
			this.vals.map((v) => v.rval(buffer)),
			this.span
		);
	}

	override toString(): string {
		let ps: string[] = this.vals.map((d) => d.toString());
		return `Tuple(${ps.join(",")})`;
	}
}
