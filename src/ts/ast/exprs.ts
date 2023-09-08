import { IOBuffer } from "../IOBuffer.js";
import {
	ArgumentLengthError,
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
}

export function getTypeCast(expr: Expr, type: TypeEnum): Expr {
	switch (type) {
		case TypeEnum.INTEGER:
			return new TypeCastToInt(expr);
		case TypeEnum.STRING:
			return new TypeCastToString(expr);
		default:
			//NOT IMPLMENETED
			return new VoidObj();
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.expr.applyType(buffer, new TypeAST("Dummy"));
		this.type.applyType(buffer, expectedType);
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
				return new NumberLiteral(s.name, r.span);
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
					new IllegalTypeConversionError(r.type, this.type, this.span)
				);
				return new NumberLiteral("0", this.span);
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.expr.applyType(buffer, new TypeAST("Dummy"));
		this.type.applyType(buffer, expectedType);
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
			case TypeEnum.RATIONAL:
			case TypeEnum.REAL:
			case TypeEnum.FORMULA:
			case TypeEnum.MAP:
			case TypeEnum.PROD:
			//TODO implement once types is good
			case TypeEnum.DUMMY:
			case TypeEnum.OBJECT:
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		for (let child of this.params) child.applyType(buffer, expectedType);
		for (let child of this.stmts)
			child.applyType(buffer, (this.type as FunctionType).codomain);

		let type: FunctionType = this.type as FunctionType;
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

		let inputLength: number;
		if (input instanceof VoidObj) inputLength = 0;
		else if (input instanceof Tuple)
			inputLength = (input as Tuple).vals.length;
		else inputLength = 1;

		/*if (this.params.length != inputLength) {
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
		let func: FuncDecl = this.funcName.rval(buffer) as FuncDecl;

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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.funcName.applyType(buffer, new TypeAST("Map"));

		if (!this.funcName.type.instanceOf(TypeEnum.MAP)) {
			buffer.throwError(
				new IllegalCallError(this.funcName.type, this.span)
			);
			return;
		}

		let funcType: FunctionType = this.funcName.type as FunctionType;

		this.input.applyType(buffer, funcType.domain);
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		if (expectedType.instanceOf(TypeEnum.DUMMY)) return;

		if (!this.type.instanceOf(expectedType))
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
	}

	override toString(): string {
		return `"${this.name}"`;
	}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class VoidObj extends Expr {
	constructor() {
		super(new Span(0, 0, 0, 0));
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		this.type = new TypeAST("void");
	}

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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		if (!this.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return;
		}
		this.type = this.symbol.type;

		if (expectedType.instanceOf(TypeEnum.DUMMY)) return;

		if (expectedType.instanceOf(TypeEnum.STRING)) {
			this.type = expectedType;
			return;
		}

		if (!this.type.instanceOf(expectedType))
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	override toString(): string {
		return `ArrayInd(${this.arr.toString()},${this.ind.toString()})`;
	}
}

export class NumberLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super(span);
		this.val = Number(name);
		this.type = new TypeAST("Int");
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		if (expectedType.instanceOf(TypeEnum.DUMMY)) return;

		if (expectedType.instanceOf(TypeEnum.STRING)) {
			this.type = expectedType;
			return;
		}

		if (!this.type.instanceOf(expectedType))
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
	}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("" + this.val, this.span);

		return this;
	}

	override toString(): string {
		return this.val + "";
	}
}

export class IntegerLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super(span);
		this.val = Number(name);
		this.type = new TypeAST("Int");
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		if (expectedType.instanceOf(TypeEnum.DUMMY)) return;

		if (expectedType.instanceOf(TypeEnum.STRING)) {
			this.type = expectedType;
			return;
		}

		if (!this.type.instanceOf(expectedType))
			buffer.throwError(
				new IllegalTypeConversionError(
					this.type,
					expectedType,
					this.span
				)
			);
	}

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
}

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

	override applyType(buffer: IOBuffer, expectedType: TypeAST): void {
		if (expectedType.type == TypeEnum.DUMMY) {
			for (let val of this.vals) val.applyType(buffer, expectedType);
		}

		if (!(expectedType instanceof ProductType)) {
			buffer.throwError(
				new IllegalTypeConversionError(
					new ProductType([]),
					expectedType,
					this.span
				)
			);
		}

		let t: ProductType = expectedType as ProductType;
		if (t.types.length != this.vals.length) {
			buffer.throwError(
				new DimensionError(t.types.length, this.vals.length, this.span)
			);
		}

		for (let i = 0; i < t.types.length; i++) {
			this.vals[i].applyType(buffer, t.types[i]);
		}
	}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("(" + this.vals + ")", this.span);

		return new Tuple(
			this.vals.map((v) => v.rval(buffer)),
			this.span
		);
	}

	toLongString() {
		return this.vals + "";
	}

	override toString(): string {
		let ps: string[] = this.vals.map((d) => d.toString());
		return `Tuple(${ps.join(",")})`;
	}
}
