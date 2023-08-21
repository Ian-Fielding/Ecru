import * as AST from "./ast/asts.js";
import * as PARSE from "../js/parser/parser.js";
import { consoleBuffer } from "./IOBuffer.js";
export function compile(input, buffer = consoleBuffer) {
    buffer.clear();
    input += "\n";
    let retVal = {
        parseTree: "",
        buffer: buffer
    };
    let prog = new AST.Program();
    try {
        prog = PARSE.parse(input, { tracer: { trace: function (evt) {
                    console.log(evt);
                } } });
    }
    catch (e) {
        buffer.stderr("Parse error! " + e.message);
        retVal.parseTree = "Error";
        return retVal;
    }
    retVal.parseTree = prog.toString();
    let scope = new AST.Scope();
    prog.applyBind(scope, buffer);
    if (buffer.hasSeenError())
        return retVal;
    prog.applyType(buffer);
    if (buffer.hasSeenError())
        return retVal;
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
