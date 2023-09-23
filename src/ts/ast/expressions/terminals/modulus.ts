import { IOBuffer } from "../../../IOBuffer.js";
import { DivisionByZeroError } from "../../../error.js";
import { Span } from "../../../parser/token.js";
import { unionSpan } from "../../../util/utils.js";
import { ModulusType } from "../../type.js";
import { NumberLiteral } from "./number.js";

export class ModulusLiteral extends NumberLiteral {
	val: number;
	mod: number;
	constructor(val: number, mod: number, span: Span) {
		val %= mod;
		if (val < 0) val += mod;

		super(span);
		this.val = val;
		this.mod = mod;
		this.type = new ModulusType(mod, span);
	}

	override toString(): string {
		return this.val + "";
	}
	override add(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		return new ModulusLiteral(
			this.val + other.val,
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
	override sub(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		return new ModulusLiteral(
			this.val - other.val,
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
	override mul(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		return new ModulusLiteral(
			this.val * other.val,
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
	override div(other: ModulusLiteral, buffer: IOBuffer): ModulusLiteral {
		if (other.val == 0)
			buffer.throwError(new DivisionByZeroError(other.span));

		return new ModulusLiteral(
			Math.floor(this.val / other.val),
			this.mod,
			unionSpan([this.span, other.span])
		);
	}
}
