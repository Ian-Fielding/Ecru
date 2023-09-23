import { IOBuffer } from "../../IOBuffer.js";
import { Span } from "../../parser/token.js";
import { AST } from "../asts.js";
import { ANY_TYPE, Type } from "../type.js";

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
