import { IOBuffer } from "../../IOBuffer.js";
import {
	ArgumentLengthError,
	CompilerError,
	DimensionError,
	DivisionByZeroError,
	IllegalCallError,
	IllegalIndexError,
	IllegalTypeConversionError,
	NonexistentReturnError,
	OutOfBoundsError,
	UndefinedIdentifierError,
} from "../../error.js";
import { Span } from "../../parser/token.js";
import { AST, ReturnObject } from "../asts.js";
import { DeclarationStatement, ReturnStatement, Statement } from "../stmts.js";
import { Scope, IdSymbol } from "../symbols.js";
import {
	Type,
	FunctionType,
	TypeEnum,
	ProductType,
	ModulusType,
	INT_TYPE,
	VOID_TYPE,
	STR_TYPE,
	ANY_TYPE,
	NAT_TYPE,
	RAT_TYPE,
} from "../type.js";
import { PRIMES, intPow, unionSpan } from "../../utils.js";
import { getTypeCast } from "./typecast.js";
import { Expr } from "./expr.js";
import { NaturalType } from "../type";

export class FuncDecl extends Expr {
	params: DeclarationStatement[];
	stmts: Statement[];

	constructor(
		params: DeclarationStatement[],
		stmts: Statement[],
		type: FunctionType,
		span: Span
	) {
		super(span);
		this.params = params;
		this.stmts = stmts;
		this.type = type;
	}

	override toString(): string {
		let ps: string[] = this.params.map((d) => d.toString());
		let ss: string[] = this.params.map((d) => d.toString());

		return `FuncDecl([${ps.join(",")}],[${ss.join(",")}])`;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let aScope: Scope = new Scope(scope);
		let bScope: Scope = new Scope(aScope);

		for (let param of this.params) param.applyBind(aScope, buffer);

		for (let child of this.stmts) child.applyBind(bScope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		let type: FunctionType = this.type as FunctionType;

		for (let child of this.params) child.applyType(buffer, ANY_TYPE);
		for (let child of this.stmts) child.applyType(buffer, type.codomain);

		if (type.codomain.type != TypeEnum.VOID) {
			let index: number = -1;
			for (let i = 0; i < this.stmts.length; i++) {
				if (this.stmts[i] instanceof ReturnStatement) {
					index = i;
					break;
				}
			}

			if (index == -1) {
				buffer.throwError(
					new NonexistentReturnError(type.codomain, this.span)
				);
				return;
			}
			/*if (index != this.stmts.length-1) {
				buffer.stderr("Function contains unreachable code!");
				return { break: true };
			}*/
		}
		return;
	}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	onCall(buffer: IOBuffer, input: Expr): Expr {
		let backup: (Expr | null)[] = [];
		let retVal: Expr = new VoidObj();

		/*let inputLength: number;
		if (input instanceof VoidObj) inputLength = 0;
		else if (input instanceof Tuple)
			inputLength = (input as Tuple).vals.length;
		else inputLength = 1;

		if (this.params.length != inputLength) {
			buffer.stderr("Invalid arg lenths!");
			return retVal;
		}*/

		if (this.params.length == 1) {
			let decl: DeclarationStatement = this.params[0];
			let param: Expr = input;

			let id: Id = decl.id;

			if (!id.symbol) {
				buffer.throwError(
					new UndefinedIdentifierError(id.idName, this.span)
				);
				return this;
			}

			backup.push(id.symbol.val);
			id.symbol.val = param;
		} else if (this.params.length > 1) {
			for (let i = 0; i < this.params.length; i++) {
				let decl: DeclarationStatement = this.params[i];
				let tup: Tuple = input as Tuple;
				let param: Expr = tup.vals[i];

				let id: Id = decl.id;

				if (!id.symbol) {
					buffer.throwError(
						new UndefinedIdentifierError(id.idName, this.span)
					);
					return this;
				}

				backup.push(id.symbol.val);
				id.symbol.val = param;
			}
		}

		for (let stmt of this.stmts) {
			let result: ReturnObject = stmt.execute(buffer);
			if (result.break && result.retVal) return result.retVal;
		}

		/*if (
			!(this.type as FunctionType).codomain.instanceOf(TypeEnum.VOID) &&
			retVal instanceof VoidObj
		)
			buffer.stderr(`Function ${this} does not return!`);
            */

		// restore params
		for (let i = 0; i < this.params.length; i++) {
			let decl: DeclarationStatement = this.params[i];
			let id: Id = decl.id;

			if (!id.symbol) {
				buffer.throwError(
					new UndefinedIdentifierError(id.idName, this.span)
				);
				return this;
			}
			id.symbol.val = backup[i];
		}

		return retVal;
	}
}

export class FuncCall extends Expr {
	funcName: Expr;
	input: Expr;
	params: Expr[];

	constructor(funcName: Expr, params: Expr[], span: Span) {
		super(span);

		this.funcName = funcName;
		this.params = params;

		if (params.length == 0) this.input = new VoidObj();
		else if (params.length == 1) this.input = params[0];
		else this.input = new Tuple(params, span);
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.funcName.applyBind(scope, buffer);
		this.input.applyBind(scope, buffer);
		for (let param of this.params) param.applyBind(scope, buffer);
	}

	override toString(): string {
		let ps: string[] = this.params.map((d) => d.toString());

		return `FuncCall(${this.funcName},${this.input},${ps.join(",")})`;
	}

	override rval(buffer: IOBuffer): Expr {
		let safetyCheck: Expr = this.funcName.rval(buffer);

		if (!(safetyCheck instanceof FuncDecl))
			buffer.throwError(
				new CompilerError(
					"Idk apparently the funcname is invalid? I see " +
						safetyCheck,
					this.span
				)
			);

		let func: FuncDecl = safetyCheck as FuncDecl;

		if (this.params.length != func.params.length) {
			buffer.throwError(
				new ArgumentLengthError(
					this.params.length,
					func.params.length,
					this.span
				)
			);
			return new VoidObj();
		}

		let changeme: Expr = func.onCall(buffer, this.input.rval(buffer)); //TODO sucks
		if (buffer.hasSeenError()) return new VoidObj();
		return changeme;
	}

	override applyType(buffer: IOBuffer): void {
		this.funcName.applyType(buffer);

		if (!(this.funcName.type instanceof FunctionType)) {
			buffer.throwError(
				new IllegalCallError(this.funcName.type, this.span)
			);
			return;
		}

		let funcType: FunctionType = this.funcName.type as FunctionType;

		this.input = getTypeCast(this.input, funcType.domain);
		this.input.applyType(buffer);
		this.type = funcType.codomain;
	}
}

export class StringLiteral extends Expr {
	name: string;
	constructor(name: string, span: Span) {
		super(span);
		this.name = name;
		this.type = STR_TYPE;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override toString(): string {
		return this.name;
	}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}
}

export class VoidObj extends Expr {
	constructor() {
		super(new Span(0, 0, 0, 0));
		this.type = VOID_TYPE;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	override toString(): string {
		return "void";
	}
}

export class Id extends Expr {
	symbol: IdSymbol | null;
	idName: string;

	constructor(idName: string, span: Span) {
		super(span);
		this.symbol = null;
		this.idName = idName;
	}

	rval(buffer: IOBuffer): Expr {
		if (!this.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return this;
		}
		return this.symbol.rval(buffer);
	}

	override applyType(buffer: IOBuffer): void {
		if (!this.symbol) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return;
		}
		this.type = this.symbol.type;
	}

	override applyBind(scope: Scope, buffer: IOBuffer): void {
		let name: string = this.idName;
		let sym: IdSymbol | null = scope.lookup(name);

		if (!sym) {
			buffer.throwError(
				new UndefinedIdentifierError(this.idName, this.span)
			);
			return;
		}

		this.symbol = sym;
	}

	override toLatex(): string {
		//TODO sucks

		return this.symbol!.toLatex();
	}

	override toString(): string {
		return this.idName;
	}
}

export class ArrayAccess extends Expr {
	arr: Expr;
	ind: Expr;
	constructor(arr: Expr, ind: Expr, span: Span) {
		super(span);
		this.arr = arr;
		this.ind = ind;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {
		this.arr.applyBind(scope, buffer);
		this.ind.applyBind(scope, buffer);
	}

	override applyType(buffer: IOBuffer): void {
		this.arr.applyType(buffer);
		this.ind.applyType(buffer);
		this.ind = getTypeCast(this.ind, INT_TYPE);
		this.ind.applyType(buffer);

		if (this.arr.type.type == TypeEnum.STRING) {
			this.type = this.arr.type;
			return;
		}

		if (this.arr.type.type == TypeEnum.TUPLE) {
			this.type = ANY_TYPE;
			return;
		}

		buffer.throwError(new IllegalIndexError(this.arr.type, this.span));
	}

	override rval(buffer: IOBuffer): Expr {
		let i: number = (this.ind.rval(buffer) as IntegerLiteral).getVal();

		switch (this.arr.type.type) {
			case TypeEnum.TUPLE:
				let vals: Expr[] = (this.arr.rval(buffer) as Tuple).vals;
				if (0 <= i && i < vals.length) {
					this.type = (this.arr.type as ProductType).types[i];
					return vals[i].rval(buffer);
				}
				if (-vals.length <= i && i < 0) {
					this.type = (this.arr.type as ProductType).types[
						vals.length + i
					];
					return vals[vals.length + i].rval(buffer);
				}
				buffer.throwError(
					new OutOfBoundsError(i, vals.length, this.span)
				);
			case TypeEnum.STRING:
				let str: string = (this.arr.rval(buffer) as StringLiteral).name;
				if (0 <= i && i < str.length)
					return new StringLiteral(str.charAt(i), this.span);
				if (-str.length <= i && i < 0)
					return new StringLiteral(
						str.charAt(str.length + i),
						this.span
					);

				buffer.throwError(
					new OutOfBoundsError(i, str.length, this.span)
				);

			default:
				buffer.throwError(
					new CompilerError(
						this.arr.type + " not supported",
						this.span
					)
				);
				return new VoidObj();
		}
	}

	override toString(): string {
		return `Ind(${this.arr.toString()},${this.ind.toString()})`;
	}
}

abstract class NumberLiteral extends Expr {
	constructor(span: Span) {
		super(span);
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		return this;
	}

	abstract override toString(): string;

	abstract add(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract sub(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract mul(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
	abstract div(other: NumberLiteral, buffer: IOBuffer): NumberLiteral;
}

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

export class Shorthand {
	static dict: Map<number, number[]> = new Map<number, number[]>();
	shorthand: number[];
	constructor(val: number | number[]) {
		if (typeof val == "number") {
			val = Math.floor(val);

			Shorthand.addToDict(val);

			this.shorthand = Shorthand.dict.get(val)!;
		} else {
			this.shorthand = val;
		}
	}

	equals(other: Shorthand): boolean {
		if (this.shorthand.length != other.shorthand.length) return false;

		for (let i = 0; i < this.shorthand.length; i++)
			if (this.shorthand[i] != other.shorthand[i]) return false;
		return true;
	}

	//gcd(other:Shorthand):Shorthand{

	//}

	static addToDict(val: number): void {
		if (val in this.dict) return;

		if (val == 1) {
			this.dict.set(1, []);
			return;
		}

		// check built-in list of primes
		for (let prime of PRIMES) {
			if (val % prime == 0) {
				this.addToDict_withPrime(val, prime);
				return;
			}
		}

		// check for all possible factors
		let upperBound: number = Math.ceil(Math.sqrt(val));
		for (
			let prime: number = PRIMES[PRIMES.length - 1];
			prime <= upperBound;
			prime++
		) {
			if (val % prime == 0) {
				this.addToDict_withPrime(val, prime);
				return;
			}
		}

		// otherwise, val must be prime
		this.dict.set(val, [val, 1]);
	}

	static addToDict_withPrime(val: number, prime: number): void {
		let count: number = 0;
		let exp: number = 1;
		while (val % prime == 0) {
			count++;
			exp *= prime;
			val /= prime;
		}
		this.addToDict(val);
		let partShorthand: number[] = this.dict.get(val)!;
		let short: number[] = [prime, 0].concat(partShorthand);
		for (let i: number = 0; i < count; i++) {
			short[1]++;
			val *= prime;
			this.dict.set(val, short.slice());
		}
	}

	copy(): number[] {
		let cpy: number[] = new Array(this.shorthand.length);
		for (let i = 0; i < this.shorthand.length; i++)
			cpy[i] = this.shorthand[i];
		return cpy;
	}

	getVal(index: number = 0): number {
		if (index >= this.shorthand.length) return 1;

		let val: number = 1;
		for (let i: number = 0; i < this.shorthand[index + 1]; i++)
			val *= this.shorthand[index];
		return val * this.getVal(index + 2);
	}
}

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
			this.getVal() * other.getVal(), //TODO implement better
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

export class BooleanLiteral extends ModulusLiteral {
	name: boolean;
	constructor(name: boolean, span: Span) {
		super(name ? 1 : 0, 2, span);
		this.name = name;
	}
}

/*
export class IntegerLiteral extends Expr {
	val: number;
	constructor(name: string, span: Span) {
		super(span);
		this.val = Number(name);
		this.type = INT_TYPE;
	}
	override applyBind(scope: Scope, buffer: IOBuffer): void {}

	override applyType(buffer: IOBuffer): void {}

	override rval(buffer: IOBuffer): Expr {
		if (this.type.instanceOf(TypeEnum.STRING))
			return new StringLiteral("" + this.val, this.span);

		return this;
	}

	toLongString() {
		return this.val + "";
	}

	override toString(): string {
		return this.val + "";
	}
}*/

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
