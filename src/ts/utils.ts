import { Span } from "./parser/token.js";

export function gcd(a: number, b: number): number {
	return b == 0 ? a : gcd(b, a % b);
}

export function divides(a: number, b: number): boolean {
	if (a == 0) return false;

	if (a < 0) return divides(-a, b);

	if (b < 0) return divides(a, -b);

	return b % a == 0;
}

export function unionSpan(spans: Span[]): Span {
	if (spans.length == 0) return new Span(0, 0, 0, 0);

	let minCol = spans[0].startCol;
	let maxCol = spans[0].endCol;
	let minLine = spans[0].startLine;
	let maxLine = spans[0].startLine;

	for (let span of spans) {
		if (minLine < span.startLine) {
			minLine = span.startLine;
			minCol = span.startCol;
		} else if (minLine == span.startLine && minCol < span.startCol) {
			minCol = span.startCol;
		}

		if (maxLine > span.endLine) {
			maxLine = span.endLine;
			maxCol = span.endCol;
		} else if (maxLine == span.endLine && maxCol > span.endCol) {
			maxCol = span.endCol;
		}
	}

	return new Span(minLine, minCol, maxLine, maxCol);
}
