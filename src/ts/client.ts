import { compile } from "./compile.js";
import { IOBuffer } from "./IOBuffer.js";

let vbar: HTMLElement = document.getElementById("vertical-bar")!;
let hbar: HTMLElement = document.getElementById("horizontal-bar")!;
let topElem: HTMLElement = document.getElementById("top")!;
let con: HTMLElement = document.getElementById("console")!;
let ed: HTMLElement = document.getElementById("editor")!;
let rest: HTMLElement = document.getElementById("rest2")!;
let canvas: HTMLCanvasElement = <HTMLCanvasElement>(
	document.getElementById("canvas")!
);

let goBut: HTMLElement = document.getElementById("go")!;
let clearbut: HTMLElement = document.getElementById("clear")!;
let drawbut: HTMLElement = document.getElementById("draw")!;

declare let ace: any;
let editor: any = ace.edit("editor");
editor.setTheme("ace/theme/crimson_editor");
editor.session.setUseSoftTabs(false);
editor.setShowPrintMargin(false);

fetch("/projects/ecru/demo/debug.txt")
	.then((response) => response.text())
	.then(function (text: string) {
		editor.setValue(text, -1);
	});

canvas.height = topElem.offsetHeight;
canvas.width = topElem.offsetWidth;
let ctx: CanvasRenderingContext2D = canvas.getContext("2d")!;
let H: number = canvas.height;
let W: number = canvas.width;
ctx.fillStyle = "blue";
ctx.fillRect(0, 0, W, H);

let dragpos: number, startwid: number, starthei: number;

vbar.addEventListener("dragstart", function (e) {
	dragpos = e.x;
	startwid = ed.offsetWidth;
});
vbar.addEventListener("drag", function (e) {
	if (e.x == 0) return;

	let v: number = Math.min(window.innerWidth - 200, Math.max(200, e.x));

	let dx: number = dragpos - v;
	ed.style.width = `calc(${startwid}px - ${dx}px)`;
	editor.resize();

	rest.style.width = `calc(100vw - var(--movable-bar-length) - ${ed.offsetWidth}px)`;

	updateCanvasSize();
});
hbar.addEventListener("dragstart", function (e) {
	dragpos = e.y;
	starthei = topElem.offsetHeight;
});
hbar.addEventListener("drag", function (e) {
	if (e.y == 0) return;

	let v: number = Math.min(
		window.innerHeight - 200,
		Math.max(100 + 0.15 * window.innerHeight, e.y)
	);

	let dy: number = dragpos - v;
	topElem.style.height = `calc(${starthei}px - ${dy}px)`;

	con.style.height = `calc(85vh - var(--movable-bar-length) - ${topElem.offsetHeight}px)`;

	updateCanvasSize();
});

function updateCanvasSize(): void {
	canvas.width = topElem.offsetWidth;
	canvas.height = topElem.offsetHeight;
	H = canvas.height;
	W = canvas.width;
}

function drawCoolDesign(): void {
	console.log("Starting drawing...");
	for (let x = 0; x < canvas.width; x++) {
		for (let y = 0; y < canvas.height; y++) {
			let dx = x / canvas.width;
			let dy = y / canvas.height;

			drawPixel(x, y, { r: dx, g: dy, b: (dx + dy) / 2 });
		}
	}
	console.log("Finished drawing!");
}

interface RGB {
	r: number;
	g: number;
	b: number;
}

function drawPixel(x: number, y: number, col: RGB): void {
	ctx.fillStyle = `rgb(${Math.floor(col.r * 255)},${Math.floor(
		col.g * 255
	)},${Math.floor(col.b * 255)})`;
	ctx.fillRect(x, y, 1, 1);
}

hbar.addEventListener("dragend", updateCanvasSize);
vbar.addEventListener("dragend", updateCanvasSize);

document.addEventListener("dragover", (event: any) => event.preventDefault());

function stdout(input: string): void {
	con.appendChild(createStdDiv(input, "stdout"));
}
function stderr(input: string): void {
	con.appendChild(createStdDiv(input, "stderr"));
}

function createStdDiv(input: string, cls: string): HTMLElement {
	let div: HTMLElement = document.createElement("div");
	div.setAttribute("class", cls);
	div.innerHTML = input;
	return div;
}

goBut.onclick = function (): void {
	con.innerHTML = "";

	let input: string = editor.getValue();

	console.log("Starting compilation...");
	compile(input, new IOBuffer(stdout, stderr));
	console.log("Finished compilation!");
};

clearbut.onclick = function (): void {
	con.innerHTML = "";
};

drawbut.onclick = function (): void {
	updateCanvasSize();
	drawCoolDesign();
};

console.log("Ready!");
