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
}

export class Span {
    startLine: number;
    endLine: number;
    startCol: number;
    endCol: number;

    constructor(input: string, start: number, end: number) {
        this.startLine = 1;
        this.startCol = 1;
        for (let i = 0; i < start; i++) {
            if (input.charAt(i) == "\n") {
                this.startLine++;
                this.startCol = 1;
            } else {
                this.startCol++;
            }
        }

        this.endLine = this.startLine;
        this.endCol = this.startCol;

        for (let i = start; i < end; i++) {
            if (input.charAt(i) == "\n") {
                this.endLine++;
                this.endCol = 1;
            } else {
                this.endCol++;
            }
        }
    }

    toString(): string {
        return `Span(${this.startLine}:${this.startCol}-${this.endLine}:${this.endCol})`;
    }
}
