import { IOBuffer } from "../IOBuffer.js";
import {
	IllegalTypeConversionError,
	RedefinedIdentifierError,
	UndefinedIdentifierError,
} from "../error.js";
import { Span } from "../parser/token.js";
import { AST, IdSymbol, ReturnObject, Scope } from "./asts.js";
import { StringLiteral, Id, Expr, NumberLiteral, VoidObj } from "./exprs.js";
import { TypeAST, TypeEnum } from "./type.js";

export class Program extends AST {
	constructor(stmts: Statement[] = [], span: Span) {
		super("Program", span, stmts);
	}

	toLongString(): string {
		let str: string = "";
		for (let i: number = 0; i < this.args.length; i++) {
			str += `---\n${i}. ${this.args[i].toString()}\n`;
		}

		return str;
	}
}

export class Statement extends AST {
	constructor(name: string, span: Span, args: AST[] = []) {
		super(name, span, args);
	}
}

export class CommentStatement extends Statement {
	str: StringLiteral;
	constructor(str: string, span: Span) {
		let strlit: StringLiteral = new StringLiteral(str.trim(), span);
		super("CommentStmt", span, [strlit]);
		this.str = strlit;
	}
}

/**
 * A sample
 */
export class DeclarationStatement extends Statement {
	id: Id;
	type: TypeAST;

	constructor(id: Id, type: TypeAST, span: Span) {
		super("DeclStmt", span, [id]);
		this.id = id;

		this.type = type;
	}

	override toString(): string {
		return `${this.name}(${this.id},${this.type})`;
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

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		this.id.symbol!.type = this.type;
		this.id.type = this.type;
	}
}

export class AssignmentStatement extends Statement {
	id: Id;
	expr: Expr;

	constructor(id: Id, expr: Expr, span: Span) {
		super("AssignStmt", span, [id, expr]);
		this.id = id;
		this.expr = expr;
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

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		this.expr.applyType(buffer, this.id.symbol!.type);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		// TODO replace id with Expr, support lval
		let sym: IdSymbol = this.id.symbol!;
		let safetyCheck: ReturnObject = this.expr.execute(buffer);
		if (safetyCheck.break) return safetyCheck;

		sym.val = this.expr.rval(buffer);
		return { break: false };
	}
}

export class DeclarationAndAssignmentStatement extends Statement {
	id: Id;
	type: TypeAST;
	expr: Expr;
	dec: DeclarationStatement;
	asg: AssignmentStatement;

	constructor(id: Id, type: TypeAST, expr: Expr, span: Span) {
		let dec = new DeclarationStatement(id, type, span);
		let asg = new AssignmentStatement(id, expr, span);
		super("DAA", span, [dec, asg]);
		this.id = id;
		this.type = type;
		this.expr = expr;
		this.dec = dec;
		this.asg = asg;
		//TODO?
	}

	override toString(): string {
		return this.dec.toString() + "," + this.asg.toString();
	}
}

export class ExprAsStatement extends Statement {
	expr: Expr;

	constructor(expr: Expr, span: Span) {
		super("", span, [expr]);
		this.expr = expr;
		//TODO
	}

	override toString(): string {
		return this.expr.toString();
	}

	override execute(buffer: IOBuffer): ReturnObject {
		this.expr.rval(buffer);
		return { break: false };
	}
}

export class PrintStatement extends Statement {
	expr: Expr;
	isNewLine: boolean;

	constructor(expr: Expr, span: Span, isNewLine: boolean = false) {
		super("PrintStmt", span, [expr]);
		this.expr = expr;
		this.isNewLine = isNewLine;
	}
	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		this.expr.applyType(buffer, new TypeAST(TypeEnum.STRING));
	}

	override execute(buffer: IOBuffer): ReturnObject {
		let term: string = this.isNewLine ? "\n" : "";

		let str: Expr = this.expr.rval(buffer);
		if (str instanceof StringLiteral) {
			buffer.stdout(str.name + term);
		} else if (str instanceof NumberLiteral) {
			buffer.stdout(str.val + term);
		} else {
			// TODO better comparison to string.
			buffer.throwError(
				new IllegalTypeConversionError(
					str.type,
					new TypeAST("String"),
					this.span
				)
			);
			return { break: true };
		}
		return { break: false };
	}
}

export class PrettyPrintStatement extends Statement {
	expr: Expr;
	isNewLine: boolean;

	constructor(expr: Expr, span: Span, isNewLine: boolean = false) {
		super("PrettyPrintStmt", span, [expr]);
		this.expr = expr;
		this.isNewLine = isNewLine;
	}

	override execute(buffer: IOBuffer): ReturnObject {
		// TODO handle latex
		let term: string = this.isNewLine ? "\n" : "";

		let str: Expr = this.expr.rval(buffer);
		if (str instanceof StringLiteral) {
			buffer.stdout(str.name + term);
		} else if (str instanceof NumberLiteral) {
			buffer.stdout(str.val + term);
		} else {
			// TODO better conversion to string.
			buffer.throwError(
				new IllegalTypeConversionError(
					str.type,
					new TypeAST("String"),
					this.span
				)
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
		let other: AST[] = [];
		other.push(test);
		for (let child of stmts) other.push(child);

		super("WhileLoop", span, other);
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

	override execute(buffer: IOBuffer): ReturnObject {
		while (true) {
			let compVal: NumberLiteral = this.test.rval(
				buffer
			) as NumberLiteral;

			if (compVal.val == 0) break;

			for (let child of this.stmts) {
				let result: ReturnObject = child.execute(buffer);
				if (result.break) return result;
			}
		}
		return { break: false };
	}
}

export class ForLoop extends Statement {
	asg: Statement[];
	test: Expr;
	it: Statement[];
	stmts: Statement[];

	constructor(
		asg: Statement[],
		test: Expr,
		it: Statement[],
		stmts: Statement[],
		span: Span
	) {
		let other: AST[] = [];
		for (let child of asg) other.push(child);
		other.push(test);
		for (let child of it) other.push(child);
		for (let child of stmts) other.push(child);

		super("ForLoop", span, other);
		this.asg = asg;
		this.test = test;
		this.it = it;
		this.stmts = stmts;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let mainScope: Scope = new Scope(scope);
		let childScope: Scope = new Scope(mainScope);

		for (let child of this.asg) child.applyBind(mainScope, buffer);

		this.test.applyBind(mainScope, buffer);

		for (let child of this.it) child.applyBind(mainScope, buffer);

		for (let child of this.stmts) child.applyBind(childScope, buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		for (let child of this.asg) {
			let result: ReturnObject = child.execute(buffer);
			if (result.break) return result;
		}

		while (true) {
			let compVal: NumberLiteral = this.test.rval(
				buffer
			) as NumberLiteral;

			if (compVal.val == 0) break;

			for (let child of this.stmts) {
				let result: ReturnObject = child.execute(buffer);
				if (result.break) return result;
			}

			for (let child of this.it) {
				let result: ReturnObject = child.execute(buffer);
				if (result.break) return result;
			}
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
		let other: AST[] = [];
		other.push(test);
		for (let child of stmts) other.push(child);
		for (let child of elseStmts) other.push(child);

		super("IfStmt", span, other);
		this.test = test;
		this.stmts = stmts;
		this.elseStmts = elseStmts;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.test.applyBind(scope, buffer);

		let ifScope: Scope = new Scope(scope);
		let elseScope: Scope = new Scope(scope);

		for (let child of this.stmts) child.applyBind(ifScope, buffer);
		for (let child of this.elseStmts) child.applyBind(elseScope, buffer);
	}

	override execute(buffer: IOBuffer): ReturnObject {
		let compVal: NumberLiteral = this.test.rval(buffer) as NumberLiteral;

		if (compVal.val != 0)
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
		super("ReturnStmt", span, [expr]);
		this.expr = expr;
	}

	override applyType(
		buffer: IOBuffer,
		expectedType: TypeAST = new TypeAST("Dummy")
	): void {
		if (!(this.expr instanceof VoidObj)) {
			this.expr.applyType(buffer, expectedType);

			if (!this.expr.type.instanceOf(expectedType)) {
				buffer.throwError(
					new IllegalTypeConversionError(
						this.expr.type,
						expectedType,
						this.span
					)
				);
				return;
			}

			//TODO Better error handling
		} else {
			if (!expectedType.instanceOf(TypeEnum.VOID)) {
				buffer.throwError(
					new IllegalTypeConversionError(
						this.expr.type,
						expectedType,
						this.span
					)
				);
				return;
			}
		}
	}

	override execute(buffer: IOBuffer): ReturnObject {
		return {
			retVal: this.expr.rval(buffer),
			break: true,
		};
	}
}
