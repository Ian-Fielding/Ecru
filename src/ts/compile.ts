import * as AST from "./ast/asts.js";
import { Parser } from "./parser/betterParser.js";
import { IOBuffer, consoleBuffer } from "./IOBuffer.js";
import { Program } from "./ast/stmts.js";
import { EcruError } from "./error.js";

export interface CompileObj {
	parseTree: string;
	buffer: IOBuffer;
	errorMsg: string;
}

export function compile(
	input: string,
	buffer: IOBuffer = consoleBuffer
): CompileObj {
	buffer.clear();

	input;
	let retVal: CompileObj = {
		parseTree: "",
		buffer: buffer,
		errorMsg: "",
	};

	let parser: Parser;
	let prog: Program;

	try {
		/*prog = PARSE.parse(input, {
			tracer: {
				trace: function (evt: any): void {
					console.log(evt);
				}
			}
		});*/
		parser = new Parser(input, buffer);
		prog = parser.root;
	} catch (e: any) {
		let error: EcruError = e as EcruError;
		retVal.parseTree = "Error";
		retVal.errorMsg = error.msg;
		return retVal;
	}

	retVal.parseTree = prog.toString();

	let scope = new AST.Scope();

	try {
		prog.applyBind(scope, buffer);
	} catch (e: any) {
		let error: EcruError = e as EcruError;
		retVal.errorMsg = error.msg;
		return retVal;
	}

	try {
		prog.applyType(buffer);
	} catch (e: any) {
		let error: EcruError = e as EcruError;
		retVal.errorMsg = error.msg;
		return retVal;
	}

	try {
		prog.execute(buffer);
	} catch (e: any) {
		let error: EcruError = e as EcruError;
		retVal.errorMsg = error.msg;
		return retVal;
	}

	return retVal;
}
