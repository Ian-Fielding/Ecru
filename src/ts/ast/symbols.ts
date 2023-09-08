import { IOBuffer } from "../IOBuffer.js";
import { Expr } from "./exprs.js";
import { TypeAST } from "./type.js";

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
	type: TypeAST;

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
		this.type = new TypeAST("Dummy");
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
}

/**
 * Represents a program's scope for variables
 */
export class Scope {
	/**
	 * The parent scope. null iff this scope is the program scope
	 */
	parent: Scope | null;

	/**
	 * Mapping from the names of variables to the symbols
	 */
	symtab: Map<string, IdSymbol>;

	constructor(parent: Scope | null = null) {
		this.parent = parent;
		this.symtab = new Map();
	}

	/**
	 *
	 * @returns How many layers deep the scope is. For debug
	 */
	depth(): number {
		if (this.parent == null) return 0;

		return 1 + this.parent.depth();
	}

	/**
	 *
	 * @param name The name of the variable id
	 * @returns The symbol associated with name if it exists, null otherwise
	 */
	lookup(name: string): IdSymbol | null {
		let val: IdSymbol | undefined = this.symtab.get(name);

		if (val) return val;
		if (this.parent != null) return this.parent.lookup(name);
		return null;
	}

	/**
	 *
	 * @returns string representation of this object. For debug
	 */
	toString(): string {
		let str: string = parent == null ? "" : this.parent!.toString();
		for (let [k, v] of this.symtab) {
			str += `${k} --- ${v}\n`;
		}
		return str;
	}
}
