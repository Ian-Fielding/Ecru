import { IOBuffer } from "../IOBuffer.js";
import { Expr } from "./exprs.js";
import * as TYPE from "./type.js";

/**
 * Representation of the "return status" of a return or break after execution
 * @param retVal optional parameter representing return value (if returning void, should set to VoidObj)
 * @param break boolean representing whether to continue execution or to break
 */
export interface ReturnObject {
	retVal?: Expr;
	// error?: EcruError;
	break: boolean;
}

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
	 * @param scope The current scope
	 * @param buffer for handling error messaging
	 */
	applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let child of this.args) {
			child.applyBind(scope, buffer);
		}
	}

	/**
	 * Applies type assignment and consistency checking to all children
	 * @param buffer for handling error messaging
	 * @param expectedType optional parameter for specifying the type that the parent node is expecting this node to be
	 */
	applyType(
		buffer: IOBuffer,
		expectedType: TYPE.TypeAST = new TYPE.TypeAST("Dummy")
	): void {
		for (let child of this.args) {
			child.applyType(buffer, expectedType);
		}
	}

	/**
	 * Executes code at this node and its children
	 * @param buffer for handling error messaging
	 */
	execute(buffer: IOBuffer): ReturnObject {
		for (let child of this.args) {
			let result: ReturnObject = child.execute(buffer);
			if (result.break) return result;
		}

		return { break: false };
	}

	/**
	 * Determines if another node equals this one
	 * @param other node for checking
	 * @returns equality
	 */
	equals(other: AST): boolean {
		if (this.name != other.name || this.args.length != other.args.length)
			return false;

		for (let i: number = 0; i < this.args.length; i++)
			if (!this.args[i].equals(other.args[i])) return false;

		return true;
	}
}

/**
 * Represents symbol from symbol table
 */
export class IdSymbol {
	/**
	 * Represents symbol's value. Default value is null and stays null until execution. Will become obsolete once VM is functional
	 */
	val: Expr | null;

	/**
	 * The scope of this symbol
	 */
	scope: Scope;

	/**
	 * The type of this symbol. Default value is DummyType()
	 */
	type: TYPE.TypeAST;

	/**
	 * Name of this symbol (not necessarily unique)
	 */
	name: string;

	/**
	 *
	 * @param name name of this symbol (not necessarily unique)
	 * @param scope scope the symbol exists in
	 */
	constructor(name: string, scope: Scope) {
		this.name = name;
		this.type = new TYPE.TypeAST("Dummy");
		this.val = null;
		this.scope = scope;
	}

	/**
	 * Getter for this symbol's value
	 * @param buffer for handling error messaging
	 * @returns val
	 */
	rval(buffer: IOBuffer): Expr {
		return this.val!;
	}

	/**
	 * Converts symbol to LaTeX. TODO
	 */
	toLatex(): string {
		if (this.val == null) return "\\text{UNDEFINED}";

		return this.val.toLatex();
	}

	/**
	 *
	 * @returns Internal representation in string form
	 */
	toString(): string {
		if (this.val == null) return `IdSymbol(${this.name})`;

		return this.val.toString();
	}

	/**
	 *
	 * @returns Representation in Ecru after type conversion to string
	 */
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
