import { Span, Token } from "./token.js";

const punctuation: string[] = [
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
	"~",
	":",
	";",
	",",
	"[",
	"]",
	"&&",
	"||",
	"%",
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
	return ("a" <= c && c <= "z") || ("A" <= c && c <= "Z") || ("0" <= c && c <= "9") || c == "$" || c == "_";
}

export class Scanner {
	tokens: Token[];
	input: string;

	constructor(input: string) {
		this.input = input + "\n";
		this.tokens = [];
		this.generateTokens();
	}

	generateTokens() {
		let start: number = 0, ind: number = 0;
		let section: string;

		let state: TokenState = TokenState.ANY;

		let c: string;
		let cc: string;
		let span: Span;

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
					if (isIdable(c)) {
						start = ind;
						ind++;
						state = TokenState.ID;
						break;
					}
					if (c == "\"") {
						start = ind;
						ind++;
						state = TokenState.STRING;
						break;
					}

					if (punctuation.includes(cc) && cc.length == 2) {
						this.addToken(cc, ind, ind + 2);
						ind += 2;
						break;
					}

					if (punctuation.includes(c)) {
						this.addToken(c, ind, ind + 1);
						ind++;
						break;
					}

					if (isWhitespace(c)) {
						ind++;
						break;
					}

					//TODO Error?

					console.log("Error? i see " + c);
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
					if (this.sub(ind, ind + 1) == "\"") {
						this.addToken("STR", start, ind);
						state = TokenState.ANY;
						ind++;
						break;
					}
					ind++;
					break;
				case TokenState.BLOCK_COMMENT:
					if (this.sub(ind, ind + 2) == "*/") {
						this.addToken("COM", start, ind);
						state = TokenState.ANY;
						ind++;
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

		let EOF: Token = new Token("EOF", "EOF", new Span(this.input, this.input.length, this.input.length));
		this.tokens.push(EOF);
	}


	addToken(label: string, start: number, end: number): void {
		let span: Span = new Span(this.input, start, end);
		this.tokens.push(new Token(label, this.sub(start, end), span));
	}


	sub(start: number, end: number): string {
		if (end > this.input.length)
			end = this.input.length;
		if (start < 0)
			start = 0;
		return this.input.substring(start, end);
	}

	toString(): string {
		let str: string = "";
		for (let c of this.tokens) {
			str += c.toString() + "\n";
		}
		return str;
	}
}

console.log(new Scanner("x:3;\n 24y z32").toString());