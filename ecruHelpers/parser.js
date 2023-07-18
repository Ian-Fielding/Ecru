import * as AST from "/ecruHelpers/asts.js";
import { parse } from "/ecruHelpers/parser/parser.js";

let editor = ace.edit("editor");
editor.setTheme("ace/theme/crimson_editor");
editor.session.setUseSoftTabs(false);
document.getElementById('editor').style.fontSize='15px';


fetch("/ecruHelpers/debug.txt")
	.then(response => response.text())
	.then(function(text){
		editor.setValue(text);
	});


let canvas=document.getElementById("canvas");
let ctx=canvas.getContext("2d");
ctx.fillStyle="blue";
let H=canvas.height;
let W=canvas.width;
ctx.fillRect(0,0,W,H);


let dragpos,startwid,starthei;
let vbar=document.getElementById("vertical-bar");
let hbar=document.getElementById("horizontal-bar");
let top=document.getElementById("top");
let con=document.getElementById("console");
let ed=document.getElementById("editor");
let rest=document.getElementById("rest2");
vbar.addEventListener("dragstart",function(e){
	dragpos=e.x;
	startwid=ed.offsetWidth;
});
vbar.addEventListener("drag",function(e){
	if(e.x==0)
		return;


	let v=Math.min(window.innerWidth-200, Math.max(200, e.x));

	let dx=dragpos-v;
	ed.style.width=`calc(${startwid}px - ${dx}px)`;
	editor.resize();

	rest.style.width=`calc(100vw - var(--movable-bar-length) - ${ed.offsetWidth}px)`;
});
hbar.addEventListener("dragstart",function(e){
	dragpos=e.y;
	starthei=top.offsetHeight;
});
hbar.addEventListener("drag",function(e){
	if(e.y==0)
		return;

	let v=Math.min(window.innerHeight-200, Math.max(100+0.15*window.innerHeight, e.y));

	let dy=dragpos-v;
	top.style.height=`calc(${starthei}px - ${dy}px)`;

	console.log("BEFORE");
	console.log(con.offsetHeight);
	con.style.height=`calc(85vh - var(--movable-bar-length) - ${top.offsetHeight}px)`;
	console.log("AFTER");
	console.log(con.offsetHeight);

});

document.addEventListener("dragover", function(event) {

  // prevent default to allow drop
  event.preventDefault();

}, false);





document.getElementById("but").onclick=function(){
	let input=editor.getValue()+"\n";

	let prog=parse(input,{ tracer: { trace: function(evt) {
		console.log(evt);
	}}});

	let scope=new AST.Scope();
	prog.run({currScope:scope,run:false});

	console.log(prog)
	console.log(scope)

	prog.run({run:true});
}

console.log("Ready!");



document.getElementById("clear").onclick=function(){
	document.getElementById("console").innerHTML="";
}