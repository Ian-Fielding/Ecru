import { IOBuffer } from "./IOBuffer";
import { Halt, Insn, PushImmediate, PushLabel } from "./insns";

export abstract class VVM {
    insns: Insn[] = [];
    buffer: IOBuffer;
    constructor(buffer: IOBuffer) {
        this.buffer = buffer;
    }

    abstract execute(): void;
    add(...marks: Insn[]): void {
        this.insns = this.insns.concat(marks);
    }
}


export class TestVM extends VVM {
    stack: number[] = [];
    PC: number = 0;
    FP: number = 0;
    SP: number = 0;

    constructor(buffer: IOBuffer) {
        super(buffer);
    }

    override execute(): void {
        if (this.insns.length == 0)
            return;

        let current: Insn = this.insns[0];
        while (!(current instanceof Halt)) {
            if (current instanceof PushLabel)
                this.PC++;

        }


    }
}

