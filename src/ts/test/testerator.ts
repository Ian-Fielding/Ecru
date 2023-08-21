import { compile, CompileObj } from "../compile.js";
import { ParseTest, parseTests } from "./parseTests.js";
import { silentBuffer } from "../IOBuffer.js";

let parseCount:number=0;
for(let test of parseTests){
	let result = compile(test.input,silentBuffer);

	if(result.parseTree == test.expected)
		parseCount++;
	else{
		console.log('\x1b[41m\x1b[37m%s\x1b[0m', `Error on ${test.name}`);
		console.log(`---Exp:${test.expected}\n---Saw:${result.parseTree}`);
	}
}


let out:string = `Parse tree score: ${parseCount}/${parseTests.length}`;
if(parseCount!=parseTests.length)
	console.log('\x1b[41m\x1b[37m%s\x1b[0m', out);
else
	console.log('\x1b[42m\x1b[30m%s\x1b[0m', out);