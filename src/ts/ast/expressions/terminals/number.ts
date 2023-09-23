import { IOBuffer } from "../../../IOBuffer.js";
import { Span } from "../../../parser/token.js";
import { Scope } from "../../symbols.js";
import { Expr } from "../expr.js";

export abstract class NumberLiteral extends Expr {
	constructor(span: Span) {
		super(span);
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	abstract override toString(): string;

	abstract add(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract sub(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract mul(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract div(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
}
