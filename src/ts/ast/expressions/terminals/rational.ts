import { IOBuffer } from "../../../IOBuffer.js";
import { DivisionByZeroError } from "../../../error.js";
import { Span } from "../../../parser/token.js";
import { unionSpan } from "../../../util/utils.js";
import { RAT_TYPE } from "../../type.js";
import { IntegerLiteral } from "./integer.js";
import { NaturalLiteral } from "./natural.js";
import { NumberLiteral } from "./number.js";

export class RationalLiteral extends NumberLiteral {
	num: IntegerLiteral;
	den: NaturalLiteral;
	constructor(num: IntegerLiteral, den: NaturalLiteral, span: Span) {
		super(span);
		this.num = num;
		this.den = den;

		this.type = RAT_TYPE;

		if (num.isZero()) {
			this.den = new NaturalLiteral(1, den.span);
			return;
		}
	}

	override toString(): string {
		return this.num.toString() + "/" + this.den.toString();
	}

	override add(other: RationalLiteral, buffer: IOBuffer): RationalLiteral {
		return new RationalLiteral(
			this.num
				.mul(other.den, buffer)
				.add(other.num.mul(this.den, buffer), buffer),
			this.den.mul(other.den, buffer),
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: RationalLiteral, buffer: IOBuffer): RationalLiteral {
		return new RationalLiteral(
			this.num
				.mul(other.den, buffer)
				.sub(other.num.mul(this.den, buffer), buffer),
			this.den.mul(other.den, buffer),
			unionSpan([this.span, other.span])
		);
	}
	override mul(other: RationalLiteral, buffer: IOBuffer): RationalLiteral {
		return new RationalLiteral(
			this.num.mul(other.num, buffer),
			this.den.mul(other.den, buffer),
			unionSpan([this.span, other.span])
		);
	}
	override div(other: RationalLiteral, buffer: IOBuffer): RationalLiteral {
		if (other.num.isZero())
			buffer.throwError(new DivisionByZeroError(other.span));

		let newNum: IntegerLiteral = this.num.mul(other.den, buffer);
		let newDenAsInt: IntegerLiteral = other.num.mul(this.den, buffer);

		if (newDenAsInt.isNegative) newNum.isNegative = !newNum.isNegative;

		return new RationalLiteral(
			newNum,
			newDenAsInt.natural!,
			unionSpan([this.span, other.span])
		);
	}
}
