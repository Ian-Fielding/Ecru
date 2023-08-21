import { compile } from "../compile.js";
import { parseTests } from "./parseTests.js";
import { basicTests } from "./basicTests.js";
import { silentBuffer } from "../IOBuffer.js";
function printGood(str) {
    console.log('\x1b[42m\x1b[30m%s\x1b[0m', str);
}
function printBad(str) {
    console.log('\x1b[41m\x1b[37m%s\x1b[0m', str);
}
let parseCount = 0;
for (let test of parseTests) {
    let result = compile(test.input, silentBuffer);
    if (result.parseTree == test.expected)
        parseCount++;
    else {
        printBad(`Error on ${test.name}`);
        console.log(`---Exp: "${test.expected}"\n---Saw: "${result.parseTree}"`);
    }
}
let out = `Parse tree score: ${parseCount}/${parseTests.length}`;
if (parseCount != parseTests.length)
    printBad(out);
else
    printGood(out);
let basicCount = 0;
for (let test of basicTests) {
    let result = compile(test.input, silentBuffer);
    let out = result.buffer.getOut();
    let err = result.buffer.hasSeenError();
    if (out == test.out && err == test.err)
        basicCount++;
    else {
        printBad(`Error on ${test.name}`);
        let err1 = test.err ? "Error" : "No error";
        let err2 = err ? "Error" : "No error";
        console.log(`---Exp: "${test.out}"\n---${err1}\n---Saw: "${out}"\n---${err2}`);
    }
}
out = `Basic test score: ${basicCount}/${basicTests.length}`;
if (basicCount != basicTests.length)
    printBad(out);
else
    printGood(out);
