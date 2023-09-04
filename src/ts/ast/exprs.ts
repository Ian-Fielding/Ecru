import { IOBuffer } from "../IOBuffer.js";
import {
	ArgumentLengthError,
	IllegalCallError,
	IllegalTypeConversionError,
	NonexistentReturnError,
	UndefinedIdentifierError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { AST, IdSymbol, ReturnObject, Scope } from "./asts.js";
import { DeclarationStatement, ReturnStatement, Statement } from "./stmts.js";
import { TypeAST, FunctionType, TypeEnum } from "./type.js";

export abstract class Expr extends AST {
	type: TypeAST;

	constructor(
		name: string,
		span: Span,
		args: AST[] = [],
		type: TypeAST = new TypeAST("Dummy")
	) {
		super(name, span, args);
		this.type = type;
	}

	rval(buffer: IOBuffer): Expr {
		return this;
	}

	getChildrenRVals(buffer: IOBuffer): Expr[] {
		let childRVals: Expr[] = [];
		for (let child of this.args) {
			childRVals.push((child as Expr).rval(buffer));
		}
		return childRVals;
	}

	abstract override applyType(buffer: IOBuffer, expectedType?: TypeAST): void;

	toLatex(): string {
		return `\\text{${this.name}}`;
	}

	builtinToString(): string {
		return this.toString();
	}
}

export class TypeCast extends Expr {
	constructor(
		name: string,
		span: Span,
		args: Expr[] = [],
		type: TypeAST = new TypeAST("Dummy")
	) {
		super(name, span, args);
		// TODO
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {}
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
		let other: AST[] = [];
		for (let child of params) other.push(child);
		for (let child of stmts) other.push(child);

		super("FuncDecl", span, other, type);
		this.params = params;
		this.stmts = stmts;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let aScope: Scope = new Scope(scope);
		let bScope: Scope = new Scope(aScope);

		for (let param of this.params) param.applyBind(aScope, buffer);

		for (let child of this.stmts) child.applyBind(bScope, buffer);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		for (let child of this.params) child.applyType(buffer, expectedType);
		for (let child of this.stmts)
			child.applyType(buffer, (this.type as FunctionType).codomain);
	}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	override execute(buffer: IOBuffer): ReturnObject {
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
				return { break: true };
			}
			/*if (index != this.stmts.length-1) {
				buffer.stderr("Function contains unreachable code!");
				return { break: true };
			}*/
		}
		return { break: false };
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
			backup.push(id.symbol!.val);
			id.symbol!.val = param;
		} else if (this.params.length > 1) {
			for (let i = 0; i < this.params.length; i++) {
				let decl: DeclarationStatement = this.params[i];
				let tup: Tuple = input as Tuple;
				let param: Expr = tup.vals[i];

				let id: Id = decl.id;
				backup.push(id.symbol!.val);
				id.symbol!.val = param;
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
			id.symbol!.val = backup[i];
		}

		return retVal;
	}
}

export class StringLiteral extends Expr {
	constructor(name: string, span: Span) {
		super(name, span, [], new TypeAST("String"));
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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

	override builtinToString(): string {
		return this.name;
	}

	override toString(): string {
		return `"${this.name}"`;
	}
}

export class VoidObj extends Expr {
	constructor() {
		super("Void", new Span(0, 0, 0, 0), [], new TypeAST("void"));
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		return;
	}
}

export class FuncCall extends Expr {
	funcName: Expr;
	input: Expr;
	params: Expr[];

	constructor(funcName: Expr, params: Expr[], span: Span) {
		let other: AST[] = [];
		other.push(funcName);
		for (let child of params) other.push(child);
		super("FuncCall", span, other);

		this.funcName = funcName;
		this.params = params;

		if (params.length == 0) this.input = new VoidObj();
		else if (params.length == 1) this.input = params[0];
		else this.input = new Tuple(params, span);
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

	override applyType(
		buffer: IOBuffer,
		parentType: TypeAST = new TypeAST("Dummy")
	): void {
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

export class Id extends Expr {
	symbol: IdSymbol | null;
	idName: string;

	constructor(idName: string, span: Span) {
		super("Id_" + idName, span, [], new TypeAST("Dummy"));
		this.symbol = null;
		this.idName = idName;
	}

	rval(buffer: IOBuffer): Expr {
		return this.symbol!.rval(buffer);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		this.type = this.symbol!.type;

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

	toString(): string {
		return this.idName;
	}

	override builtinToString(): string {
		return this.symbol!.builtinToString();
	}
}

export class ArrayAccess extends Expr {
	arr: Expr;
	ind: Expr;
	constructor(arr: Expr, ind: Expr, span: Span) {
		// TODO
		super("arr", span, [arr, ind]);
		this.arr = arr;
		this.ind = ind;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {}
}

export class NumberLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super("NumberLiteral_" + name, span, [], new TypeAST("Int"));
		this.val = Number(name);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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

	toString(): string {
		return this.val + "";
	}

	toLatex(): string {
		return this.val + "";
	}

	equals(other: NumberLiteral) {
		return this.val == other.val;
	}
}

export class IntegerLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super("IntegerLiteral_" + name, span, [], new TypeAST("Int"));
		this.val = Number(name);
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
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

	toString(): string {
		return this.val + "";
	}

	toLatex(): string {
		return this.val + "";
	}

	equals(other: NumberLiteral) {
		return this.val == other.val;
	}
}

export class Tuple extends Expr {
	vals: Expr[];
	constructor(vals: Expr[], span: Span) {
		super("Tuple", span, vals, new TypeAST("CartProd"));
		this.vals = vals;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		if (expectedType.instanceOf(TypeEnum.DUMMY)) return;

		// TODO
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
			return new StringLiteral("(" + this.vals + ")", this.span);

		return new Tuple(
			this.vals.map((v) => v.rval(buffer)),
			this.span
		);
	}

	toLongString() {
		return this.vals + "";
	}

	toString(): string {
		return this.vals + "";
	}

	toLatex(): string {
		return this.vals + "";
	}

	equals(other: Tuple) {
		//TODO
		return this.vals == other.vals;
	}
}
