import { IOBuffer } from "../IOBuffer.js";
import { AST, IdSymbol, Scope } from "./asts.js";
import { DeclarationStatement, ReturnStatement, Statement } from "./stmts.js";
import { TypeAST, FunctionType, TypeEnum } from "./type.js";

export class Expr extends AST {
	type: TypeAST;

	constructor(
		name: string,
		args: AST[] = [],
		type: TypeAST = new TypeAST("Dummy")
	) {
		super(name, args);
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

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		throw new Error("Must override this method!");
	}

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
		args: Expr[] = [],
		type: TypeAST = new TypeAST("Dummy")
	) {
		super(name, args);
		// TODO
	}
}

export class FuncDecl extends Expr {
	params: DeclarationStatement[];
	stmts: Statement[];

	constructor(
		params: DeclarationStatement[],
		stmts: Statement[],
		type: TypeAST
	) {
		let other: AST[] = [];
		for (let child of params) other.push(child);
		for (let child of stmts) other.push(child);

		super("FuncDecl", other, type);
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
		return this; //TODO
	}

	onCall(buffer: IOBuffer, inputs: Expr[]): Expr {
		let backup: (Expr | null)[] = [];
		let retVal: Expr = new VoidObj();

		for (let i = 0; i < this.params.length; i++) {
			let decl: DeclarationStatement = this.params[i];
			let param: Expr = inputs[i];

			let id: Id = decl.id;
			backup.push(id.symbol!.val);
			id.symbol!.val = param;
		}

		for (let stmt of this.stmts) {
			buffer.stdout(`Executing ${stmt}`);
			buffer.stdout(`backup is ${backup}`);

			if (stmt instanceof ReturnStatement) {
				retVal = stmt.expr.rval(buffer);
				break;
			} else stmt.execute(buffer);
		}

		if (
			!(this.type as FunctionType).codomain.instanceOf(TypeEnum.VOID) &&
			retVal instanceof VoidObj
		)
			buffer.stderr(`Function ${this} does not return!`);

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
	constructor(name: string) {
		super(name, [], new TypeAST("String"));
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		if (expectedType.instanceOf(TypeEnum.DUMMY)) return;

		if (!this.type.instanceOf(expectedType))
			buffer.stderr(
				`Cannot treat string "${this.name}" as type ${expectedType.type}`
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
		super("Void", [], new TypeAST("void"));
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
	params: Expr[];

	constructor(funcName: Expr, params: Expr[]) {
		let other: AST[] = [];
		other.push(funcName);
		for (let child of params) other.push(child);
		super("FuncCall", other);

		this.funcName = funcName;
		this.params = params;
	}

	override rval(buffer: IOBuffer): Expr {
		if (buffer.maxRecursionDepth <= 0) {
			buffer.stderr(`Max recursion depth reached!`);
			return new VoidObj();
		}
		buffer.maxRecursionDepth--;

		let func: FuncDecl = this.funcName.rval(buffer) as FuncDecl;

		if (func.params.length != this.params.length) {
			buffer.stderr(
				`Function call has ${this.params.length} parameters while definition has ${func.params.length}.`
			);
			return new VoidObj();
		}

		return func.onCall(
			buffer,
			this.params.map((param) => param.rval(buffer))
		);
	}

	override applyType(
		buffer: IOBuffer,
		parentType: TypeAST = new TypeAST("Dummy")
	): void {
		this.funcName.applyType(buffer, new TypeAST("Map"));

		if (!this.funcName.type.instanceOf(TypeEnum.MAP)) {
			buffer.stderr(`${this.funcName} is not a function`);
			return;
		}

		let funcType: FunctionType = this.funcName.type as FunctionType;

		this.params[0].applyType(buffer, funcType.domain);
		this.type = funcType.codomain;
	}
}

export class Id extends Expr {
	symbol: IdSymbol | null;
	idName: string;

	constructor(idName: string) {
		super("Id_" + idName, [], new TypeAST("Dummy"));
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
			buffer.stderr(
				`Cannot treat ${this.idName} as type ${expectedType}`
			);
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let name: string = this.idName;
		let sym: IdSymbol | null = scope.lookup(name);

		if (!sym) {
			buffer.stderr(`id ${name} has not been defined.`);
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
	constructor(arr: Expr, ind: Expr) {
		// TODO
		super("arr", [arr, ind]);
		this.arr = arr;
		this.ind = ind;
	}
}

export class NumberLiteral extends Expr {
	val: number;
	constructor(name: string) {
		super("NumberLiteral_" + name, [], new TypeAST("Int"));
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
			buffer.stderr(
				`Cannot treat number "${this.val}" as type ${expectedType.type}`
			);
	}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("" + this.val);

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
	constructor(name: string) {
		super("IntegerLiteral_" + name, [], new TypeAST("Int"));
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
			buffer.stderr(
				`Cannot treat number "${this.val}" as type ${expectedType.type}`
			);
	}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("" + this.val);

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
