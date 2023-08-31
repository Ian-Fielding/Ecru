import { IOBuffer } from "../IOBuffer.js";
import { Expr } from "./exprs.js";
import * as TYPE from "./type.js";

// Should remove?
// declare let MathJax: any;

/**
 * Represents an abstract syntax tree (AST) node.
 */
export class AST {
	/**
	 * Represents the simple name of this node
	 */
	name: string;

	/**
	 * Represents all child nodes of the tree
	 */
	args: AST[];

	/**
	 *
	 * @param name the simple name
	 * @param args all child nodes
	 */
	constructor(name: string, args: AST[] = []) {
		this.name = name;
		this.args = args;
	}

	/**
	 * Performs a deep copy
	 *
	 * @returns Deep copy of this node
	 */
	copy(): AST {
		let newObj: AST = this.constructor(this.name);
		for (const arg of this.args) newObj.args.push(arg.copy());
		return newObj;
	}

	/**
	 * Converts this node into human readable format, as in name(arg,arg,...,arg)
	 * @returns human readable string
	 */
	toString(): string {
		if (this.args.length == 0) return this.name + "()";
		let str: string = `${this.name}(${this.args[0]}`;
		for (let i: number = 1; i < this.args.length; i++)
			str += "," + this.args[i];
		return str + ")";
	}

	/**
	 * Applies variable binding to all children
	 * @param scope
	 * @param buffer
	 */
	applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let child of this.args) {
			child.applyBind(scope, buffer);
		}
	}

	applyType(
		buffer: IOBuffer,
		expectedType: TYPE.TypeAST = new TYPE.TypeAST("Dummy")
	): void {
		for (let child of this.args) {
			child.applyType(buffer, expectedType);
		}
	}

	execute(buffer: IOBuffer): void {
		for (let child of this.args) {
			child.execute(buffer);
		}
	}

	equals(other: AST): boolean {
		if (this.name != other.name || this.args.length != other.args.length)
			return false;

		for (let i: number = 0; i < this.args.length; i++)
			if (!this.args[i].equals(other.args[i])) return false;

		return true;
	}
}

export class IdSymbol {
	val: Expr | null;
	scope: Scope | null;
	type: TYPE.TypeAST;
	name: string;

	constructor(name: string) {
		this.name = name;
		this.type = new TYPE.TypeAST("Dummy");
		this.val = null;
		this.scope = null;
	}

	rval(buffer: IOBuffer): Expr {
		return this.val!;
	}

	toLatex(): string {
		if (this.val == null) return "\\text{UNDEFINED}";

		return this.val.toLatex();
	}

	toString(): string {
		if (this.val == null) return `IdSymbol(${this.name})`;

		return this.val.toString();
	}

	builtinToString(): string {
		return this.val!.builtinToString();
	}
}

export class Scope {
	parent: Scope | null;
	symtab: Map<string, IdSymbol>;

	constructor(parent: Scope | null = null) {
		this.parent = parent;
		this.symtab = new Map();
	}

	depth(): number {
		if (this.parent == null) return 0;

		return 1 + this.parent.depth();
	}

	lookup(name: string): IdSymbol | null {
		let val: IdSymbol | undefined = this.symtab.get(name);

		if (val) return val;
		if (this.parent != null) return this.parent.lookup(name);
		return null;
	}

	toString(): string {
		let str: string = parent == null ? "" : this.parent!.toString();
		for (let [k, v] of this.symtab) {
			str += `${k} --- ${v}\n`;
		}
		return str;
	}
}
