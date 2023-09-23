import { IOBuffer } from "../../../IOBuffer.js";
import { IllegalTypeConversionError } from "../../../error.js";
import { Span } from "../../../parser/token.js";
import { unionSpan } from "../../../util/utils.js";
import { NAT_TYPE, INT_TYPE } from "../../type.js";
import { Shorthand } from "../../../util/shorthand.js";
import { NumberLiteral } from "./number.js";

export class NaturalLiteral extends NumberLiteral {
	shorthand: Shorthand;
	constructor(val: number | Shorthand, span: Span) {
		super(span);

		if (typeof val == "number") {
			this.shorthand = new Shorthand(val);
		} else {
			this.shorthand = val;
		}

		this.type = NAT_TYPE;
	}

	getVal(): number {
		return this.shorthand.getVal();
	}

	override toString(): string {
		return this.getVal() + "";
	}

	override add(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		return new NaturalLiteral(
			this.getVal() + other.getVal(),
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		let n: number = this.getVal() - other.getVal();

		if (n <= 0)
			buffer.throwError(
				new IllegalTypeConversionError(INT_TYPE, this.type, this.span)
			);

		return new NaturalLiteral(n, unionSpan([this.span, other.span]));
	}
	override mul(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		return new NaturalLiteral(
			this.shorthand.mul(other.shorthand),
			unionSpan([this.span, other.span])
		);
	}
	override div(other: NaturalLiteral, buffer: IOBuffer): NaturalLiteral {
		let n: number = Math.floor(this.getVal() / other.getVal()); // TODO implement better

		return new NaturalLiteral(
			n == 0 ? 1 : n,
			unionSpan([this.span, other.span])
		);
	}
}
