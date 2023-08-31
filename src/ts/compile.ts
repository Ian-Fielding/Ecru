import * as AST from "./ast/asts.js";
// @ts-ignore
import * as PARSE from "../js/parser.js";
import { Parser } from "./parser/betterParser.js";
import { IOBuffer, consoleBuffer } from "./IOBuffer.js";

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

	input += "\n\n";
	let retVal: CompileObj = {
		parseTree: "",
		buffer: buffer,
		errorMsg: "",
	};

	let prog: AST.Program = new AST.Program();

	try {
		/*prog = PARSE.parse(input, {
			tracer: {
				trace: function (evt: any): void {
					console.log(evt);
				}
			}
		});*/
		prog = new Parser(input).root;
	} catch (e: any) {
		buffer.stderr(`Parse error! ${e.message}`);
		retVal.parseTree = "Error";
		retVal.errorMsg = " --- " + e.message + "\n --- " + e.stack;
		return retVal;
	}

	retVal.parseTree = prog.toString();
	let scope = new AST.Scope();

	prog.applyBind(scope, buffer);

	if (buffer.hasSeenError()) return retVal;
	prog.applyType(buffer);

	if (buffer.hasSeenError()) return retVal;
	prog.execute(buffer);

	/*
	let options: AST.Options = {
		run: false,
		currScope: new AST.Scope()
	}

	prog.run(options);


	prog.run({run:true,currScope:null});*/

	return retVal;
}
