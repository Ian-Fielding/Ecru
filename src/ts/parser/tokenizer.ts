import { IOBuffer } from "../IOBuffer.js";
import { UnknownCharacterError } from "../error.js";
import { Span, Token } from "./token.js";

/**
 * Reserved keywords
 */
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

/**
 * Represents the current "state" of the tokenizer
 */
const enum TokenState {
	INLINE_COMMENT,
	BLOCK_COMMENT,
	NUMBER,
	ID,
	STRING,
	ANY,
}

/**
 *
 * @param c single character
 * @returns true iff c is a whitespace character
 */
function isWhitespace(c: string): boolean {
	return /\s/.test(c);
}

/**
 *
 * @param c single character
 * @returns true iff c is a numeric (0-9 or .) character
 */
function isNumeric(c: string): boolean {
	return ("0" <= c && c <= "9") || c == ".";
}

/**
 *
 * @param c single character
 * @returns true iff c is a valid identifier character
 */
function isIdable(c: string): boolean {
	return (
		("a" <= c && c <= "z") ||
		("A" <= c && c <= "Z") ||
		("0" <= c && c <= "9") ||
		c == "$" ||
		c == "_"
	);
}

/**
 * A tokenizer/lexer. Generates tokens given input string
 */
export class Tokenizer {
	/**
	 * Array of tokens generated from input. Terminates with EOF token
	 */
	tokens: Token[];

	/**
	 * Input string
	 */
	input: string;

	/**
	 * Pointer to current token in array tokens
	 */
	pointer: number = 0;

	/**
	 * Error handling
	 */
	buffer: IOBuffer;

	constructor(input: string, buffer: IOBuffer) {
		this.input = `${input}\n`;
		this.tokens = [];
		this.buffer = buffer;
		this.generateTokens();
	}

	/**
	 * Populates array tokens from input string
	 */
	generateTokens() {
		// start is starting index of current token, ind the ending index
		let start: number = 0,
			ind: number = 0;

		// current state of tokenization
		let state: TokenState = TokenState.ANY;

		let c: string; //lookahead 1
		let cc: string; //lookahead 2

		while (ind < this.input.length) {
			switch (+state) {
				case TokenState.ANY:
					c = this.sub(ind, ind + 1);
					cc = this.sub(ind, ind + 2);

					// Case for // ... \n comments
					if (cc == "//") {
						start = ind;
						state = TokenState.INLINE_COMMENT;
						ind += 2;
						break;
					}

					// Case for /* ... */ comments
					if (cc == "/*") {
						start = ind;
						state = TokenState.BLOCK_COMMENT;
						ind += 2;
						break;
					}

					// case for numbers
					if ("0" <= c && c <= "9") {
						start = ind;
						ind++;
						state = TokenState.NUMBER;
						break;
					}

					// case for strings
					if (c == '"') {
						start = ind;
						ind++;
						state = TokenState.STRING;
						break;
					}

					// ignores whitespace
					if (isWhitespace(c)) {
						ind++;
						break;
					}

					let resLength: number = this.greedyGet(ind);

					// if the current token is a reserved symbol
					if (resLength != -1) {
						this.addToken(
							this.sub(ind, ind + resLength),
							ind,
							ind + resLength
						);
						ind += resLength;
						break;
					}

					// if the current token is a valid id
					if (isIdable(c)) {
						start = ind;
						ind++;
						state = TokenState.ID;
						break;
					}

					// unknown token
					this.buffer.throwError(
						new UnknownCharacterError(
							c,
							this.createSpan(ind, ind + 1)
						)
					);
					ind++;

					break;
				// in the case of a number, continue iterating until the token is not numerical
				case TokenState.NUMBER:
					c = this.input.charAt(ind);
					if (isNumeric(c)) {
						ind++;
						break;
					}
					this.addToken("NUM", start, ind);
					state = TokenState.ANY;
					break;
				// same for id
				case TokenState.ID:
					c = this.input.charAt(ind);
					if (isIdable(c)) {
						ind++;
						break;
					}
					this.addToken("ID", start, ind);
					state = TokenState.ANY;
					break;
				// same for string
				case TokenState.STRING:
					if (this.sub(ind, ind + 1) == '"') {
						this.addToken("STR", start, ind + 1);
						state = TokenState.ANY;
						ind++;
						break;
					}
					ind++;
					break;
				// same for block comments
				case TokenState.BLOCK_COMMENT:
					if (this.sub(ind, ind + 2) == "*/") {
						this.addToken("COM", start, ind + 2);
						state = TokenState.ANY;
						ind += 2;
						break;
					}
					ind++;
					break;
				// same for inline comments
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

	/**
	 * Adds a new token to tokens
	 * @param label the name of the new token
	 * @param start the start of the span
	 * @param end the end of the span
	 */
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

	/**
	 *
	 * @param start the start index
	 * @param end the end index
	 * @returns substring method for strings but won't throw an error for invalid indices
	 */
	sub(start: number, end: number): string {
		if (end > this.input.length) end = this.input.length;
		if (start < 0) start = 0;
		return this.input.substring(start, end);
	}

	/**
	 *
	 * @param start the start index
	 * @param end the end index
	 * @returns A new span that takes into account newlines
	 */
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

	/**
	 *
	 * @returns string representation of this tokenizer. For debug purposes
	 */
	toString(): string {
		let str: string = "";
		for (let c of this.tokens) {
			str += c.toString() + "\n";
		}
		return str;
	}

	/**
	 *
	 * @param n Optional parameter for how many lookaheads to perform, 1 if not given
	 * @returns the token at position n on the stack
	 */
	peek(n: number = 1): Token {
		if (this.pointer + n - 1 >= this.tokens.length)
			return this.tokens[this.tokens.length - 1];

		return this.tokens[this.pointer + n - 1];
	}

	/**
	 *
	 * @returns the token at the top of the stack, after removing it
	 */
	pop(): Token {
		let ret: Token = this.peek();
		this.pointer++;
		return ret;
	}
}
