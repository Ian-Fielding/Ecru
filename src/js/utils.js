export function collapseArray(arr) {
    return arr.reduce((accumulator, currentValue) => accumulator + currentValue, "");
}
export function gcd(a, b) {
    return b == 0 ? a : gcd(b, a % b);
}
export function divides(a, b) {
    if (a == 0)
        return false;
    if (a < 0)
        return divides(-a, b);
    if (b < 0)
        return divides(a, -b);
    return b % a == 0;
}
