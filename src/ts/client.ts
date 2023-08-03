import { compile } from "./compile.js";
import { IOBuffer } from "./IOBuffer.js";


let vbar: HTMLElement = document.getElementById("vertical-bar")!;
let hbar: HTMLElement = document.getElementById("horizontal-bar")!;
let topElem: HTMLElement = document.getElementById("top")!;
let con: HTMLElement = document.getElementById("console")!;
let ed: HTMLElement = document.getElementById("editor")!;
let rest: HTMLElement = document.getElementById("rest2")!;
let canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById("canvas")!;

let goBut: HTMLElement = document.getElementById("go")!;
let clearbut: HTMLElement = document.getElementById("clear")!;

declare let ace: any;
let editor: any = ace.edit("editor");
editor.setTheme("ace/theme/crimson_editor");
editor.session.setUseSoftTabs(false);
editor.setShowPrintMargin(false);


fetch("/projects/ecru/demo/debug.txt")
	.then(response => response.text())
	.then(function(text: string){
		editor.setValue(text,-1);
	});


canvas.height=topElem.offsetHeight;
canvas.width=topElem.offsetWidth;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
let H: number=canvas.height;
let W: number=canvas.width;
ctx.fillStyle="blue";
ctx.fillRect(0,0,W,H);


let dragpos:number,startwid:number,starthei:number;

vbar.addEventListener("dragstart",function(e){
	dragpos=e.x;
	startwid=ed.offsetWidth;
});
vbar.addEventListener("drag",function(e){
	if(e.x==0)
		return;


	let v: number=Math.min(window.innerWidth-200, Math.max(200, e.x));

	let dx: number=dragpos-v;
	ed.style.width=`calc(${startwid}px - ${dx}px)`;
	editor.resize();

	rest.style.width=`calc(100vw - var(--movable-bar-length) - ${ed.offsetWidth}px)`;

	updateCanvasSize();
	
});
hbar.addEventListener("dragstart",function(e){
	dragpos=e.y;
	starthei=topElem.offsetHeight;
});
hbar.addEventListener("drag",function(e){
	if(e.y==0)
		return;

	let v: number=Math.min(window.innerHeight-200, Math.max(100+0.15*window.innerHeight, e.y));

	let dy: number=dragpos-v;
	topElem.style.height=`calc(${starthei}px - ${dy}px)`;

	con.style.height=`calc(85vh - var(--movable-bar-length) - ${topElem.offsetHeight}px)`;

	updateCanvasSize();
});

function updateCanvasSize(): void{
	canvas.width=topElem.offsetWidth;
	canvas.height=topElem.offsetHeight;
}

hbar.addEventListener("dragend",updateCanvasSize);
vbar.addEventListener("dragend",updateCanvasSize);


document.addEventListener("dragover", (event: any) => event.preventDefault());



function addToConsole(input:string):void{
	con.innerHTML+=input+"<hr>";
}



goBut.onclick=function(): void{
	con.innerHTML="";

	H=canvas.height;
	W=canvas.width;
	ctx.fillStyle="pink";
	ctx.fillRect(0,0,10,10);

	let input: string=editor.getValue();

	compile(input,new IOBuffer(addToConsole,addToConsole));	
}




clearbut.onclick=function(): void{
	con.innerHTML="";
}


console.log("Ready!");