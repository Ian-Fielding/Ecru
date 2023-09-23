import { Span } from "../../../parser/token.js";
import { ModulusLiteral } from "./modulus.js";

export class BooleanLiteral extends ModulusLiteral {
	name: boolean;
	constructor(name: boolean, span: Span) {
		super(name ? 1 : 0, 2, span);
		this.name = name;
	}
}
