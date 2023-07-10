import * as AST from "/ecruHelpers/asts.js";
import { parse } from "/ecruHelpers/parser/parser.js";


fetch("/ecruHelpers/sample.txt")
	.then(response => response.text())
	.then(function(text){
		document.getElementById("editor").value=text;
	});



document.getElementById("but").onclick=function(){
	let input=document.getElementById("editor").value+"\n";

	let prog=parse(input,{ tracer: { trace: function(evt) {
		console.log(evt);
	}}});

	let scope=new AST.Scope();
	prog.run({currScope:scope,run:false});
	prog.run({run:true});
}

console.log("Ready!");

