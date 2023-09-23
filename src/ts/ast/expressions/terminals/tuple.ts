import { IOBuffer } from "../../../IOBuffer.js";
import { Span } from "../../../parser/token.js";
import { Scope } from "../../symbols.js";
import { ProductType } from "../../type.js";
import { Expr } from "../expr.js";

export class Tuple extends Expr {
	vals: Expr[];
	constructor(vals: Expr[], span: Span) {
		super(span);
		this.vals = vals;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let val of this.vals) val.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		for (let i = 0; i < this.vals.length; i++) {
			this.vals[i].applyType(buffer);
		}

		this.type = new ProductType(
			this.vals.map((v) => v.type),
			this.span
		);
	}

	override rval(buffer: IOBuffer): Expr {
		let ret: Tuple = new Tuple(
			this.vals.map((v) => v.rval(buffer)),
			this.span
		);
		ret.applyType(buffer);

		return ret;
	}

	override toString(): string {
		let ps: string[] = this.vals.map((d) => d.toString());
		return `Tuple(${ps.join(",")})`;
	}
}
