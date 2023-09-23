import { IOBuffer } from "../../../IOBuffer.js";
import { DivisionByZeroError } from "../../../error.js";
import { Span } from "../../../parser/token.js";
import { Shorthand } from "../../../util/shorthand.js";
import { unionSpan } from "../../../util/utils.js";
import { INT_TYPE } from "../../type.js";
import { NaturalLiteral } from "./natural.js";
import { NumberLiteral } from "./number.js";

export class IntegerLiteral extends NumberLiteral {
	isNegative: boolean;
	natural?: NaturalLiteral;

	constructor(val: number | Shorthand, span: Span) {
		super(span);

		if (typeof val == "number") {
			if (val == 0) {
				this.isNegative = false;
				this.natural = undefined;
			} else {
				this.isNegative = val < 0;
				this.natural = new NaturalLiteral(Math.abs(val), span);
			}
		} else {
			this.isNegative = false;
			this.natural = new NaturalLiteral(val, span);
		}

		this.type = INT_TYPE;
	}

	isZero(): boolean {
		return this.natural == undefined;
	}

	getVal(): number {
		if (!this.natural) return 0;
		return (this.isNegative ? -1 : 1) * this.natural.getVal();
	}

	override toString(): string {
		return this.getVal() + "";
	}

	override add(
		other: IntegerLiteral | NaturalLiteral,
		buffer: IOBuffer
	): IntegerLiteral {
		return new IntegerLiteral(
			this.getVal() + other.getVal(),
			unionSpan([this.span, other.span])
		);
	}
	override sub(
		other: IntegerLiteral | NaturalLiteral,
		buffer: IOBuffer
	): IntegerLiteral {
		return new IntegerLiteral(
			this.getVal() - other.getVal(),
			unionSpan([this.span, other.span])
		);
	}
	override mul(
		other: IntegerLiteral | NaturalLiteral,
		buffer: IOBuffer
	): IntegerLiteral {
		return new IntegerLiteral(
			this.getVal() * other.getVal(),
			unionSpan([this.span, other.span])
		);
	}
	override div(
		other: IntegerLiteral | NaturalLiteral,
		buffer: IOBuffer
	): IntegerLiteral {
		if (other.getVal() == 0)
			buffer.throwError(new DivisionByZeroError(other.span));

		return new IntegerLiteral(
			Math.floor(this.getVal() / other.getVal()),
			unionSpan([this.span, other.span])
		);
	}
}
