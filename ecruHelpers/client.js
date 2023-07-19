import * as AST from "./ast/asts.js";
import * as PARSE from "./parser/parser.js";
let vbar = document.getElementById("vertical-bar");
let hbar = document.getElementById("horizontal-bar");
let topElem = document.getElementById("top");
let con = document.getElementById("console");
let ed = document.getElementById("editor");
let rest = document.getElementById("rest2");
let canvas = document.getElementById("canvas");
let goBut = document.getElementById("go");
let clearbut = document.getElementById("clear");
let editor = ace.edit("editor");
editor.setTheme("ace/theme/crimson_editor");
editor.session.setUseSoftTabs(false);
editor.setShowPrintMargin(false);
//document.getElementById('editor').style.fontSize='15px';
fetch("/ecruHelpers/debug.txt")
    .then(response => response.text())
    .then(function (text) {
    editor.setValue(text, -1);
});
canvas.height = topElem.offsetHeight;
canvas.width = topElem.offsetWidth;
let ctx = canvas.getContext("2d");
let H = canvas.height;
let W = canvas.width;
ctx.fillStyle = "blue";
ctx.fillRect(0, 0, W, H);
let dragpos, startwid, starthei;
vbar.addEventListener("dragstart", function (e) {
    dragpos = e.x;
    startwid = ed.offsetWidth;
});
vbar.addEventListener("drag", function (e) {
    if (e.x == 0)
        return;
    let v = Math.min(window.innerWidth - 200, Math.max(200, e.x));
    let dx = dragpos - v;
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
    if (e.y == 0)
        return;
    let v = Math.min(window.innerHeight - 200, Math.max(100 + 0.15 * window.innerHeight, e.y));
    let dy = dragpos - v;
    topElem.style.height = `calc(${starthei}px - ${dy}px)`;
    con.style.height = `calc(85vh - var(--movable-bar-length) - ${topElem.offsetHeight}px)`;
    updateCanvasSize();
});
function updateCanvasSize() {
    canvas.width = topElem.offsetWidth;
    canvas.height = topElem.offsetHeight;
}
hbar.addEventListener("dragend", updateCanvasSize);
vbar.addEventListener("dragend", updateCanvasSize);
document.addEventListener("dragover", (event) => event.preventDefault());
goBut.onclick = function () {
    H = canvas.height;
    W = canvas.width;
    ctx.fillStyle = "pink";
    ctx.fillRect(0, 0, 10, 10);
    let input = editor.getValue() + "\n";
    let prog = PARSE.parse(input, { tracer: { trace: function (evt) {
                console.log(evt);
            } } });
    let options = {
        run: false,
        currScope: new AST.Scope()
    };
    prog.run(options);
    console.log(prog);
    prog.run({ run: true, currScope: null });
};
clearbut.onclick = function () {
    con.innerHTML = "";
};
console.log("Ready!");
