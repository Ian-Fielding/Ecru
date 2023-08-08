import { compile, CompileObj } from "../compile.js";
import { ParseTest, parseTests } from "./parseTests.js";
import { silentBuffer } from "../IOBuffer.js";

let parseCount:number=0;
for(let test of parseTests){
	let result = compile(test.input,silentBuffer);

	if(result.parseTree == test.expected)
		parseCount++;
	else{
		console.log(`Error on ${test.name}\n   Exp:${test.expected}\n   Saw:${result.parseTree}`);
	}
}

console.log(`Parse tree score: ${parseCount}/${parseTests.length}`)