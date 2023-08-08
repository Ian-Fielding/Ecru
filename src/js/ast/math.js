import { Expr, TypeAST, NumberLiteral, StringLiteral } from "./asts.js";
class BuiltinFunc extends Expr {
    constructor(name, args, type = new TypeAST("Dummy")) {
        super(name, args, type);
    }
}
export class Add extends BuiltinFunc {
    constructor(args) {
        super("add", args);
        this.params = args;
        //TODO better error
        if (args.length < 2)
            throw new Error("Need at least two arguments for 'add'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            for (let c of this.params)
                c.applyType(buffer, gcdType);
            return;
        }
        // handles string concat
        let containsString = false;
        for (let t of childTypes) {
            if (t.instanceOf(6 /* TypeEnum.STRING */)) {
                containsString = true;
                break;
            }
        }
        if (containsString) {
            for (let c of this.params)
                c.applyType(buffer, new TypeAST("String"));
            this.type = new TypeAST("String");
            return;
        }
        buffer.stderr("Unknown add type");
    }
    rval() {
        let childRVals = [];
        for (let child of this.params) {
            childRVals.push(child.rval());
        }
        if (this.type.isMathType()) {
            let out = new NumberLiteral("0");
            for (let i in childRVals) {
                let child = childRVals[i];
                out.val += child.val;
                out.name = "NumberLiteral_" + out.val;
            }
            return out;
        }
        let str = "";
        for (let r of childRVals) {
            str += r.builtinToString();
        }
        return new StringLiteral(str);
    }
}
export class Mul extends BuiltinFunc {
    constructor(args) {
        super("mul", args);
        this.params = args;
        //TODO better error
        if (args.length < 2)
            throw new Error("Need at least two arguments for 'mul'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            for (let c of this.params)
                c.applyType(buffer, gcdType);
            return;
        }
        // handles string multiplication
        let containsString = false;
        for (let t of childTypes) {
            if (t.instanceOf(6 /* TypeEnum.STRING */)) {
                containsString = true;
                break;
            }
        }
        if (containsString) {
            for (let c of this.params)
                c.applyType(buffer, new TypeAST("String"));
            this.type = new TypeAST("String");
            return;
        }
        buffer.stderr("Unknown mul type");
    }
    rval() {
        let childRVals = [];
        for (let child of this.params) {
            childRVals.push(child.rval());
        }
        if (this.type.isMathType()) {
            let out = new NumberLiteral("1");
            for (let i in childRVals) {
                let child = childRVals[i];
                out.val *= child.val;
                out.name = "NumberLiteral_" + out.val;
            }
            return out;
        }
        let str = "";
        let count = childRVals[1].val;
        let dup = childRVals[0].name;
        for (let i = 0; i < count; i++)
            str += dup;
        return new StringLiteral(str);
    }
}
export class Sub extends BuiltinFunc {
    constructor(args) {
        super("sub", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'sub'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            for (let c of this.params)
                c.applyType(buffer, gcdType);
            return;
        }
        buffer.stderr("Unknown sub type");
    }
    rval() {
        let childRVals = [this.params[0].rval(), this.params[1].rval()];
        let v1 = childRVals[0].val;
        let v2 = childRVals[1].val;
        return new NumberLiteral("" + (v1 - v2));
    }
}
export class Div extends BuiltinFunc {
    constructor(args) {
        super("div", args);
        this.params = args;
        //TODO better error
        if (args.length != 2)
            throw new Error("Need exactly two arguments for 'div'");
    }
    applyType(buffer, expectedType = new TypeAST("Dummy")) {
        let childTypes = this.params.map(function (c) {
            c.applyType(buffer);
            return c.type;
        });
        // updates types for all math ops
        let gcdType = childTypes.reduce((t1, t2) => t1.closestParent(t2));
        if (gcdType.isMathType()) {
            this.type = gcdType;
            for (let c of this.params)
                c.applyType(buffer, gcdType);
            return;
        }
        buffer.stderr("Unknown div type");
    }
    rval() {
        let childRVals = [this.params[0].rval(), this.params[1].rval()];
        let v1 = childRVals[0].val;
        let v2 = childRVals[1].val;
        return new NumberLiteral("" + (v1 / v2));
    }
}
