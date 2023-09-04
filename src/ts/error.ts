import { Span } from "./parser/token.js";

export abstract class EcruError {
	name: string;
	msg: string;
	span: Span;
	constructor(name: string, msg: string, span: Span) {
		this.name = name;
		this.msg = msg;
		this.span = span;
	}

	toString(): string {
		return `${this.name}:${this.span} -- ${this.msg}`;
	}
}

export class StackOverflowError extends EcruError {
	constructor() {
		super("StackOverflowError", "TODO", new Span(0, 0, 0, 0));
	}
}

export class ParserError extends EcruError {
	constructor(exp: string, saw: string, span: Span) {
		super("ParserError", `Expected ${exp} but saw ${saw}.`, span);
	}
}

export class UnknownCharacterError extends EcruError {
	constructor(c: string, span: Span) {
		super(
			"UnknownCharacterError",
			`Unknown string ${c} encountered.`,
			span
		);
	}
}
