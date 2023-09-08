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
	 * Represents the span of this node
	 */
	span: Span;

	/**
	 *
	 * @param span the span of the node
	 */
	constructor(span: Span) {
		this.span = span;
	}

	/**
	 * Converts this node into human readable format, as in name(arg,arg,...,arg)
	 * @returns human readable string
	 */
	abstract toString(): string;

	/**
	 * Applies variable binding to all children
	 * @param scope The current scope
	 * @param buffer for handling error messaging
	 */
	abstract applyBind(scope: Scope, buffer: IOBuffer): void;
}
