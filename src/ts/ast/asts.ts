import { IOBuffer } from "../IOBuffer";
import { Span } from "../parser/token";
import { Expr } from "./exprs";
import { Scope } from "./symbols";
import { TypeAST } from "./type";

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
export abstract class AST {
	/**
	 * Represents the simple name of this node
	 */
	_name: string;

	/**
	 * Represents all child nodes of the tree
	 */
	_args: AST[];

	/**
	 * Represents the span of this node
	 */
	span: Span;

	/**
	 *
	 * @param name the simple name
	 * @param args all child nodes
	 */
	constructor(name: string, span: Span, args: AST[] = []) {
		this._name = name;
		this._args = args;
		this.span = span;
	}

	/**
	 * Performs a deep copy
	 *
	 * @returns Deep copy of this node
	 */
	copy(): AST {
		let newObj: AST = this.constructor(this._name);
		for (const arg of this._args) newObj._args.push(arg.copy());
		return newObj;
	}

	/**
	 * Converts this node into human readable format, as in name(arg,arg,...,arg)
	 * @returns human readable string
	 */
	toString(): string {
		if (this._args.length == 0) return this._name + "()";
		let str: string = `${this._name}(${this._args[0]}`;
		for (let i: number = 1; i < this._args.length; i++)
			str += "," + this._args[i];
		return str + ")";
	}

	/**
	 * Applies variable binding to all children
	 * @param scope The current scope
	 * @param buffer for handling error messaging
	 */
	applyBind(scope: Scope, buffer: IOBuffer): void {
		for (let child of this._args) {
			child.applyBind(scope, buffer);
		}
	}

	/**
	 * Applies type assignment and consistency checking to all children
	 * @param buffer for handling error messaging
	 * @param expectedType optional parameter for specifying the type that the parent node is expecting this node to be
	 */
	abstract applyType(buffer: IOBuffer, expectedType?: TypeAST): void;

	/**
	 * Executes code at this node and its children
	 * @param buffer for handling error messaging
	 */
	execute(buffer: IOBuffer): ReturnObject {
		for (let child of this._args) {
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
		if (
			this._name != other._name ||
			this._args.length != other._args.length
		)
			return false;

		for (let i: number = 0; i < this._args.length; i++)
			if (!this._args[i].equals(other._args[i])) return false;

		return true;
	}
}
