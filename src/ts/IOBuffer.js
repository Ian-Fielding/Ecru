"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.consoleBuffer = exports.silentBuffer = exports.IOBuffer = void 0;
var IOBuffer = /** @class */ (function () {
    function IOBuffer(out, err) {
        this.out = out;
        this.err = err;
        this.outHistory = [];
        this.errHistory = [];
    }
    IOBuffer.prototype.stdout = function (input) {
        this.outHistory.push(input);
        this.out(input);
    };
    IOBuffer.prototype.stderr = function (input) {
        this.errHistory.push(input);
        this.err(input);
    };
    IOBuffer.prototype.hasSeenError = function () {
        return this.errHistory.length > 0;
    };
    return IOBuffer;
}());
exports.IOBuffer = IOBuffer;
function empty(input) { }
exports.silentBuffer = new IOBuffer(empty, empty);
exports.consoleBuffer = new IOBuffer(console.log, console.error);
