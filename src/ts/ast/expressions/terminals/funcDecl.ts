import { IOBuffer } from "../../../IOBuffer.js";
import {
	NonexistentReturnError,
	UndefinedIdentifierError,
} from "../../../error.js";
import { Span } from "../../../parser/token.js";
import { ReturnObject } from "../../asts.js";
import {
	DeclarationStatement,
	ReturnStatement,
	Statement,
} from "../../stmts.js";
import { Scope } from "../../symbols.js";
import { FunctionType, ANY_TYPE, TypeEnum } from "../../type.js";
import { VoidObj, Id } from "../ast_exprs.js";
import { Expr } from "../expr.js";
import { Tuple } from "./tuple.js";

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
