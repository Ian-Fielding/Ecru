export abstract class Insn {
    comment?: string
    constructor(comment?: string) {
        this.comment = comment;
    }
}

export class Label extends Insn {
    label: string
    constructor(label: string, comment?: string) {
        super(comment);
        this.label = label;
    }
}

export class PushImmediate extends Insn {
    val: number
    constructor(val: number, comment?: string) {
        super(comment);
        this.val = val;
    }
}

export class Jump extends Insn {
    label: string
    constructor(label: string, comment?: string) {
        super(comment);
        this.label = label;
    }
}

export class JumpIfZero extends Insn {
    label: string
    constructor(label: string, comment?: string) {
        super(comment);
        this.label = label;
    }
}

export class JumpIfNonZero extends Insn {
    label: string
    constructor(label: string, comment?: string) {
        super(comment);
        this.label = label;
    }
}

export class JumpIndirect extends Insn {

}

export class PushLabel extends Insn {
    label: string
    constructor(label: string, comment?: string) {
        super(comment);
        this.label = label;
    }
}

export class Add extends Insn {

}

export class Sub extends Insn {

}

export class Mul extends Insn {

}

export class Div extends Insn {

}

export class Negate extends Insn {

}

export class LessThan extends Insn {

}

export class GreaterThan extends Insn {

}

export class LessThanEqual extends Insn {

}

export class GreaterThanEqual extends Insn {

}

export class Equals extends Insn {

}

export class NotEquals extends Insn {

}

export class Not extends Insn {

}

export class Load extends Insn {

}

export class Store extends Insn {

}

export class Print extends Insn {

}

export class PushFP extends Insn {
    offset: number
    constructor(offset: number, comment?: string) {
        super(comment);
        this.offset = offset;
    }
}

export class PushSP extends Insn {
    offset: number
    constructor(offset: number, comment?: string) {
        super(comment);
        this.offset = offset;
    }
}

export class PopFP extends Insn {

}

export class PopSP extends Insn {

}

export class Call extends Insn {

}

export class Halt extends Insn {

}

export class Swap extends Insn {

}

export class Pop extends Insn {

}

export class Noop extends Insn {

}
