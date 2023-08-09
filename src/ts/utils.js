"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.divides = exports.gcd = exports.collapseArray = void 0;
function collapseArray(arr) {
    return arr.reduce(function (accumulator, currentValue) { return accumulator + currentValue; }, "");
}
exports.collapseArray = collapseArray;
function gcd(a, b) {
    return b == 0 ? a : gcd(b, a % b);
}
exports.gcd = gcd;
function divides(a, b) {
    if (a == 0)
        return false;
    if (a < 0)
        return divides(-a, b);
    if (b < 0)
        return divides(a, -b);
    return b % a == 0;
}
exports.divides = divides;
