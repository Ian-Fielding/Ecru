import { Parser } from "./parser/betterParser.js";
import { IOBuffer, consoleBuffer } from "./IOBuffer.js";
import { Program } from "./ast/stmts.js";
import { EcruError, ThrowableEcruError } from "./error.js";
import { Scope } from "./ast/symbols.js";
import { Type, VOID_TYPE } from "./ast/type.js";

export interface CompileObj {
	parseTree: string;
	buffer: IOBuffer;
	errorMsg: string;
	errorstack: string;
}

export function compile(
	input: string,
	buffer: IOBuffer = consoleBuffer
): CompileObj {
	buffer.clear();

	//input;
	let retVal: CompileObj = {
		parseTree: "",
		buffer: buffer,
		errorMsg: "",
		errorstack: "",
	};

	let parser: Parser;
	let prog: Program;

	try {
		parser = new Parser(input, buffer);
		prog = parser.root;
	} catch (e: any) {
		let error: ThrowableEcruError = e as ThrowableEcruError;
		retVal.parseTree = "Error";
		retVal.errorMsg = error.message;
		if (error.stack) retVal.errorstack = error.stack;
		return retVal;
	}

	retVal.parseTree = prog.toString();

	let scope = new Scope();

	try {
		prog.applyBind(scope, buffer);
		prog.applyType(buffer, VOID_TYPE);
		prog.execute(buffer);
	} catch (e: any) {
		let error: ThrowableEcruError = e as ThrowableEcruError;
		if (error.stack) retVal.errorstack = error.stack;
		retVal.errorMsg = error.message;
		return retVal;
	}

	return retVal;
}
