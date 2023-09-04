import { IOBuffer } from "../IOBuffer.js";
import { UnknownCharacterError } from "../error.js";
import { Span, Token } from "./token.js";

const reserved: string[] = [
	"(",
	")",
	".",
	"{",
	"}",
	"+",
	"-",
	"*",
	"/",
	"^",
	"!",
	"<",
	">",
	"<=",
	">=",
	"==",
	"~=",
	"=",
	"+=",
	"-=",
	"*=",
	"/=",
	"%=",
	"~",
	":",
	"->",
	";",
	",",
	"[",
	"]",
	"&&",
	"and",
	"||",
	"or",
	"%",
	"mod",
	"if",
	"else",
	"for",
	"while",
	"break",
	"return",
	"println",
	"print",
	"pprintln",
	"pprint",
];

const enum TokenState {
	INLINE_COMMENT,
	BLOCK_COMMENT,
	NUMBER,
	ID,
	STRING,
	ANY,
}

function isWhitespace(c: string): boolean {
	return /\s/.test(c);
}

function isNumeric(c: string): boolean {
	return ("0" <= c && c <= "9") || c == ".";
}

function isIdable(c: string): boolean {
	return (
		("a" <= c && c <= "z") ||
		("A" <= c && c <= "Z") ||
		("0" <= c && c <= "9") ||
		c == "$" ||
		c == "_"
	);
}

export class Tokenizer {
	tokens: Token[];
	input: string;
	pointer: number = 0;
	buffer: IOBuffer;

	constructor(input: string, buffer: IOBuffer) {
		this.input = `${input}\n`;
		this.tokens = [];
		this.buffer = buffer;
		this.generateTokens();
	}

	generateTokens() {
		let start: number = 0,
			ind: number = 0;
		let section: string;

		let state: TokenState = TokenState.ANY;

		let c: string;
		let cc: string;

		while (ind < this.input.length) {
			switch (+state) {
				case TokenState.ANY:
					c = this.sub(ind, ind + 1);
					cc = this.sub(ind, ind + 2);

					if (cc == "//") {
						start = ind;
						state = TokenState.INLINE_COMMENT;
						ind += 2;
						break;
					}
					if (cc == "/*") {
						start = ind;
						state = TokenState.BLOCK_COMMENT;
						ind += 2;
						break;
					}

					if ("0" <= c && c <= "9") {
						start = ind;
						ind++;
						state = TokenState.NUMBER;
						break;
					}
					if (c == '"') {
						start = ind;
						ind++;
						state = TokenState.STRING;
						break;
					}

					if (isWhitespace(c)) {
						ind++;
						break;
					}

					let resLength: number = this.greedyGet(ind);

					if (resLength != -1) {
						this.addToken(
							this.sub(ind, ind + resLength),
							ind,
							ind + resLength
						);
						ind += resLength;
						break;
					}

					if (isIdable(c)) {
						start = ind;
						ind++;
						state = TokenState.ID;
						break;
					}

					this.buffer.throwError(
						new UnknownCharacterError(
							c,
							this.createSpan(ind, ind + 1)
						)
					);
					ind++;

					break;
				case TokenState.NUMBER:
					c = this.input.charAt(ind);
					if (isNumeric(c)) {
						ind++;
						break;
					}
					this.addToken("NUM", start, ind);
					state = TokenState.ANY;
					break;
				case TokenState.ID:
					c = this.input.charAt(ind);
					if (isIdable(c)) {
						ind++;
						break;
					}
					this.addToken("ID", start, ind);
					state = TokenState.ANY;
					break;
				case TokenState.STRING:
					if (this.sub(ind, ind + 1) == '"') {
						this.addToken("STR", start, ind + 1);
						state = TokenState.ANY;
						ind++;
						break;
					}
					ind++;
					break;
				case TokenState.BLOCK_COMMENT:
					if (this.sub(ind, ind + 2) == "*/") {
						this.addToken("COM", start, ind + 2);
						state = TokenState.ANY;
						ind += 2;
						break;
					}
					ind++;
					break;
				case TokenState.INLINE_COMMENT:
					if (this.sub(ind, ind + 1) == "\n") {
						this.addToken("COM", start, ind);
						state = TokenState.ANY;
						ind++;
						break;
					}
					ind++;
					break;
			}
		}

		let EOF: Token = new Token(
			"EOF",
			"EOF",
			this.createSpan(this.input.length - 1, this.input.length - 1)
		);
		this.tokens.push(EOF);
	}

	addToken(label: string, start: number, end: number): void {
		let span: Span = this.createSpan(start, end);
		this.tokens.push(new Token(label, this.sub(start, end), span));
	}

	/**
	 * Determines whether starting at ind, a substring of the input exists that is in reserved.
	 * Returns the largest such length of string, -1 if no string can be found.
	 * @param ind current index
	 * @returns length of substring [ind,ind+length] if substring is in reserved, otherwise -1
	 */
	greedyGet(ind: number): number {
		let maxLen: number = 0;
		for (let res of reserved) {
			if (maxLen < res.length) {
				maxLen = res.length;
			}
		}

		for (let count = maxLen; count >= 1; count--) {
			let section: string = this.sub(ind, ind + count);

			if (reserved.includes(section)) return count;
		}
		return -1;
	}

	sub(start: number, end: number): string {
		if (end > this.input.length) end = this.input.length;
		if (start < 0) start = 0;
		return this.input.substring(start, end);
	}

	createSpan(start: number, end: number): Span {
		let startLine = 1;
		let startCol = 1;
		for (let i = 0; i < start; i++) {
			if (this.input.charAt(i) == "\n") {
				startLine++;
				startCol = 1;
			} else {
				startCol++;
			}
		}

		let endLine = startLine;
		let endCol = startCol;

		for (let i = start; i < end; i++) {
			if (this.input.charAt(i) == "\n") {
				endLine++;
				endCol = 1;
			} else {
				endCol++;
			}
		}

		return new Span(startLine, startCol, endLine, endCol);
	}

	toString(): string {
		let str: string = "";
		for (let c of this.tokens) {
			str += c.toString() + "\n";
		}
		return str;
	}

	peek(n?: number): Token {
		if (!n) n = 1;

		if (this.pointer + n - 1 >= this.tokens.length)
			return this.tokens[this.tokens.length - 1];

		return this.tokens[this.pointer + n - 1];
	}

	pop(): Token {
		let ret: Token = this.peek();
		this.pointer++;
		return ret;
	}
}
