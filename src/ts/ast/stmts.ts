import { IOBuffer } from "../IOBuffer.js";
import {
	IllegalTypeConversionError,
	RedefinedIdentifierError,
	UndefinedIdentifierError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { AST, ReturnObject } from "./asts.js";
import { StringLiteral, Id } from "./expressions/ast_exprs.js";
import { Scope, IdSymbol } from "./symbols.js";
import { INT_TYPE, STR_TYPE, Type } from "./type.js";
import { getTypeCast } from "./expressions/typecast.js";
import { Expr } from "./expressions/expr.js";
import { IntegerLiteral } from "./expressions/terminals/integer.js";

export abstract class Statement extends AST {
	constructor(span: Span) {
		super(span);
	}

	abstract applyType(buffer: IOBuffer, expectedType: Type): void;

	/**
	 * Executes code at this node and its children
	 * @param buffer for handling error messaging
	 */
	abstract execute(buffer: IOBuffer): ReturnObject;
}

export class Program extends Statement {
	stmts: Statement[];
	constructor(stmts: Statement[] = [], span: Span) {
		super(span);
		this.stmts = stmts;
	}

	toLongString(): string {
		let str: string = "";
		for (let i: number = 0; i < this.stmts.length; i++) {
			str += `---\n${i}. ${this.stmts[i].toString()}\n`;
		}

		return str;
	}

	override toString(): string {
		let ss: string[] = this.stmts.map((d) => d.toString());
		return `Program(${ss.join(",")})`;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		for (let child of this.stmts) {
			child.applyType(buffer, expectedType);
		}
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let stmt of this.stmts) stmt.applyBind(scope, buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		for (let child of this.stmts) {
			let result: ReturnObject = child.execute(buffer);
			if (result.break) return result;
		}

		return { break: false };
	}
}

export class CommentStatement extends Statement {
	str: string;
	constructor(str: string, span: Span) {
		super(span);
		this.str = str.trim();
	}

	override toString(): string {
		return `CommentStmt("${this.str}")`;
	}
	override applyType(buffer: IOBuffer, expectedType: Type): void {
		return;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override execute(buffer: IOBuffer): ReturnObject {
		return { break: false };
	}
}

export class DeclarationStatement extends Statement {
	id: Id;
	type: Type;

	constructor(id: Id, type: Type, span: Span) {
		super(span);
		this.id = id;
		this.type = type;
	}

	override toString(): string {
		return `DeclStmt(${this.id},${this.type})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let name: string = this.id.idName;

		if (scope.lookup(name)) {
			buffer.throwError(new RedefinedIdentifierError(name, this.span));
			return;
		}

		let sym: IdSymbol = new IdSymbol(name, scope);
		scope.symtab.set(name, sym);
		this.id.symbol = sym;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		if (!this.id.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.id.idName, this.span)
			);
			return;
		}

		this.id.symbol.type = this.type;
		this.id.type = this.type;
	}

	override execute(buffer: IOBuffer): ReturnObject {
		return { break: false };
	}
}

export class AssignmentStatement extends Statement {
	id: Id;
	expr: Expr;

	constructor(id: Id, expr: Expr, span: Span) {
		super(span);
		this.id = id;
		this.expr = expr;
	}

	override toString(): string {
		return `AssignStmt(${this.id},${this.expr})`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);

		let name: string = this.id.idName;
		let sym: IdSymbol | null = scope.lookup(name);

		if (!sym) {
			buffer.throwError(new UndefinedIdentifierError(name, this.span));
			return;
		}

		this.id.symbol = sym;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		if (!this.id.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.id.idName, this.span)
			);
			return;
		}
		this.expr.applyType(buffer);

		this.expr = getTypeCast(this.expr, this.id.symbol.type);
		this.expr.applyType(buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		// TODO replace id with Expr, support lval

		if (!this.id.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.id.idName, this.span)
			);
			return { break: true };
		}
		let sym: IdSymbol = this.id.symbol;
		//let safetyCheck: ReturnObject = this.expr.execute(buffer);
		//if (safetyCheck.break) return safetyCheck;

		sym.val = this.expr.rval(buffer);
		return { break: false };
	}
}

export class DeclarationAndAssignmentStatement extends Statement {
	//id: Id;
	//type: Type;
	//expr: Expr;
	dec: DeclarationStatement;
	asg: AssignmentStatement;

	constructor(id: Id, type: Type, expr: Expr, span: Span) {
		let dec = new DeclarationStatement(id, type, span);
		let asg = new AssignmentStatement(id, expr, span);
		super(span);
		//this.id = id;
		//this.type = type;
		//this.expr = expr;
		this.dec = dec;
		this.asg = asg;
		//TODO?
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.dec.applyBind(scope, buffer);
		this.asg.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.dec.applyType(buffer, expectedType);
		this.asg.applyType(buffer, expectedType);
	}

	override toString(): string {
		return this.dec.toString() + "," + this.asg.toString();
	}

	override execute(buffer: IOBuffer): ReturnObject {
		let result: ReturnObject = this.asg.execute(buffer);
		if (result.break) return result;

		return { break: false };
	}
}

export class ExprAsStatement extends Statement {
	expr: Expr;

	constructor(expr: Expr, span: Span) {
		super(span);
		this.expr = expr;
	}

	override toString(): string {
		return this.expr.toString();
	}

	override execute(buffer: IOBuffer): ReturnObject {
		this.expr.rval(buffer);
		return { break: false };
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.expr.applyType(buffer);
	}
}

export class PrintStatement extends Statement {
	expr: Expr;
	isNewLine: boolean;
	isPretty: boolean;

	constructor(expr: Expr, span: Span, isNewLine: boolean, isPretty: boolean) {
		super(span);
		this.expr = expr;
		this.isNewLine = isNewLine;
		this.isPretty = isPretty;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override toString(): string {
		if (!this.isPretty) return `PrintStmt(${this.expr})`;
		return `PrettyPrintStmt(${this.expr})`;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.expr = getTypeCast(this.expr, STR_TYPE);
		this.expr.applyType(buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		let term: string = this.isNewLine ? "\n" : "";

		let str: Expr = this.expr.rval(buffer);
		if (str instanceof StringLiteral) {
			buffer.stdout(str.name + term);
		} else if (str instanceof IntegerLiteral) {
			buffer.stdout(str.getVal() + term);
		} else {
			// TODO better comparison to string.
			buffer.throwError(
				new IllegalTypeConversionError(str.type, STR_TYPE, this.span)
			);
			return { break: true };
		}
		return { break: false };
	}
}
export class WhileLoop extends Statement {
	test: Expr;
	stmts: Statement[];

	constructor(test: Expr, stmts: Statement[], span: Span) {
		super(span);
		this.test = test;
		this.stmts = stmts;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.test.applyBind(scope, buffer);

		let childScope: Scope = new Scope(scope);

		for (let child of this.stmts) {
			child.applyBind(childScope, buffer);
		}
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.test = getTypeCast(this.test, INT_TYPE);
		this.test.applyType(buffer);
		for (let stmt of this.stmts) stmt.applyType(buffer, expectedType);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		while (true) {
			let compVal: IntegerLiteral = this.test.rval(
				buffer
			) as IntegerLiteral;

			if (compVal.isZero()) break;

			for (let child of this.stmts) {
				let result: ReturnObject = child.execute(buffer);
				if (result.break) return result;
			}
		}
		return { break: false };
	}

	override toString(): string {
		let ss: string[] = this.stmts.map((s) => s.toString());
		return `WhileLoop(${this.test},[${ss.join(",")}])`;
	}
}

export class ForLoop extends Statement {
	asg: Statement;
	test: Expr;
	it: Statement;
	stmts: Statement[];

	constructor(
		asg: Statement,
		test: Expr,
		it: Statement,
		stmts: Statement[],
		span: Span
	) {
		super(span);
		this.asg = asg;
		this.test = test;
		this.it = it;
		this.stmts = stmts;
	}

	override toString(): string {
		let ss: string[] = this.stmts.map((s) => s.toString());
		return `ForLoop(${this.asg.toString()},${this.test.toString()},${this.it.toString()},[${ss.join(
			","
		)}])`;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.asg.applyType(buffer, expectedType);
		this.test = getTypeCast(this.test, INT_TYPE);
		this.test.applyType(buffer);
		this.it.applyType(buffer, expectedType);
		for (let stmt of this.stmts) stmt.applyType(buffer, expectedType);
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let mainScope: Scope = new Scope(scope);
		let childScope: Scope = new Scope(mainScope);

		this.asg.applyBind(mainScope, buffer);

		this.test.applyBind(mainScope, buffer);

		this.it.applyBind(mainScope, buffer);

		for (let child of this.stmts) child.applyBind(childScope, buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		let result: ReturnObject = this.asg.execute(buffer);
		if (result.break) return result;

		while (true) {
			let compVal: IntegerLiteral = this.test.rval(
				buffer
			) as IntegerLiteral;

			if (compVal.isZero()) break;

			for (let child of this.stmts) {
				result = child.execute(buffer);
				if (result.break) return result;
			}

			result = this.it.execute(buffer);
			if (result.break) return result;
		}
		return { break: false };
	}
}

export class IfStmt extends Statement {
	test: Expr;
	stmts: Statement[];
	elseStmts: Statement[];

	constructor(
		test: Expr,
		stmts: Statement[],
		elseStmts: Statement[],
		span: Span
	) {
		super(span);
		this.test = test;
		this.stmts = stmts;
		this.elseStmts = elseStmts;
	}

	override toString(): string {
		let as: string[] = this.stmts.map((s) => s.toString());
		let bs: string[] = this.elseStmts.map((s) => s.toString());

		return `IfStmt(${this.test},[${as.join(",")}],[${bs.join(",")}])`;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.test = getTypeCast(this.test, INT_TYPE);
		this.test.applyType(buffer);
		for (let stmt of this.stmts) stmt.applyType(buffer, expectedType);
		for (let stmt of this.elseStmts) stmt.applyType(buffer, expectedType);
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.test.applyBind(scope, buffer);

		let ifScope: Scope = new Scope(scope);
		let elseScope: Scope = new Scope(scope);

		for (let child of this.stmts) child.applyBind(ifScope, buffer);
		for (let child of this.elseStmts) child.applyBind(elseScope, buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		let compVal: IntegerLiteral = this.test.rval(buffer) as IntegerLiteral;

		if (!compVal.isZero())
			for (let child of this.stmts) {
				let result: ReturnObject = child.execute(buffer);
				if (result.break) return result;
			}
		else
			for (let child of this.elseStmts) {
				let result: ReturnObject = child.execute(buffer);
				if (result.break) return result;
			}
		return { break: false };
	}
}

export class ReturnStatement extends Statement {
	expr: Expr;

	constructor(expr: Expr, span: Span) {
		super(span);
		this.expr = expr;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.expr.applyBind(scope, buffer);
	}

	override toString(): string {
		return `ReturnStmt(${this.expr})`;
	}

	override applyType(buffer: IOBuffer, expectedType: Type): void {
		this.expr = getTypeCast(this.expr, expectedType);
		this.expr.applyType(buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		return {
			retVal: this.expr.rval(buffer),
			break: true,
		};
	}
}
