export class IOBuffer {
    constructor(out, err) {
        this.out = out;
        this.err = err;
        this.outHistory = [];
        this.errHistory = [];
    }
    stdout(input) {
        this.outHistory.push(input);
        this.out(input);
    }
    stderr(input) {
        this.errHistory.push(input);
        this.err(input);
    }
    hasSeenError() {
        return this.errHistory.length > 0;
    }
}
function empty(input) { }
export let silentBuffer = new IOBuffer(empty, empty);
export let consoleBuffer = new IOBuffer(console.log, console.error);