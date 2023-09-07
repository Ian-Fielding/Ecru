/**
 * Representation of a token from an input string
 */
export class Token {
	span: Span;
	kind: string;
	value: string;

	constructor(kind: string, value: string, span: Span) {
		this.span = span;
		this.kind = kind;
		this.value = value;
	}

	toString(): string {
		return `Token(${this.kind}, ${this.value},  ${this.span.toString()}  )`;
	}

	equals(other: Token): boolean {
		return (
			this.kind == other.kind &&
			this.value == other.value &&
			this.span.equals(other.span)
		);
	}
}

/**
 * The representation of a span of an input string
 */
export class Span {
	startLine: number;
	endLine: number;
	startCol: number;
	endCol: number;

	constructor(
		startLine: number,
		startCol: number,
		endLine: number,
		endCol: number
	) {
		this.startLine = startLine;
		this.startCol = startCol;
		this.endLine = endLine;
		this.endCol = endCol;
	}

	toString(): string {
		return `Span(${this.startLine}:${this.startCol}-${this.endLine}:${this.endCol})`;
	}

	equals(other: Span): boolean {
		return (
			this.startLine == other.startLine &&
			this.startCol == other.startCol &&
			this.endLine == other.endLine &&
			this.endCol == other.endCol
		);
	}
}
